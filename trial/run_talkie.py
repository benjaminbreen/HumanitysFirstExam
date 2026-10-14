"""Run the DEPENDENCE trial on talkie-1930-13b-base locally (Apple GPU).

Uses the official checkpoint and Talkie's own layers. Two changes from the
reference library, neither of which changes the model's outputs:
  - the fp32 checkpoint is memory-mapped and cast to bf16 tensor by tensor,
    so a 53 GB file loads in 48 GB of RAM;
  - generation uses a KV cache (the reference re-runs the full sequence for
    every token). `--check` compares cached and reference logits.
Draws stop at the first blank line or end-of-text. Appends to runs/.
"""
import json
import sys
from datetime import date
from pathlib import Path

import torch
import torch.nn.functional as F
from huggingface_hub import hf_hub_download

sys.path.insert(0, str(Path(__file__).parent / "vendor" / "talkie" / "src"))
from talkie.model import GPTConfig, TalkieModel, apply_rotary_emb  # noqa: E402
from talkie.tokenizer import build_tokenizer  # noqa: E402

from prompts import DRAWS_PER_ORDER, SETS, completion_prompt  # noqa: E402

REPO = "talkie-lm/talkie-1930-13b-base"
TEMP, MAX_TOKENS = 0.7, 220
DEV = torch.device("mps")
OUT = Path(__file__).parent / "runs" / "talkie-1930-13b-base.jsonl"


def load_model():
    ckpt = hf_hub_download(REPO, "final.ckpt")
    vocab = hf_hub_download(REPO, "vocab.txt")
    raw = torch.load(ckpt, map_location="cpu", mmap=True, weights_only=False)
    sd = raw.get("model_state_dict") or raw.get("model") or raw
    sd = {k.replace("_orig_mod.", ""): v for k, v in sd.items()}
    config = GPTConfig(vocab_size=sd["embed.weight"].shape[0])
    with torch.device("meta"):
        model = TalkieModel(config, torch.device("meta"))
    sd = {k: v.to(torch.bfloat16).to(DEV) for k, v in sd.items()}
    model.load_state_dict(sd, strict=True, assign=True)
    del raw, sd
    cos, sin = model._precompute_rotary_embeddings(4096, config.head_dim)
    model.cos, model.sin = cos.to(DEV), sin.to(DEV)
    model.device = DEV
    model.eval()
    return model, build_tokenizer(vocab, style="base")


@torch.no_grad()
def forward_cached(model, ids, cache, pos):
    """Same computation as TalkieModel.forward, with per-layer K/V cache."""
    B, L = ids.shape
    cos, sin = model.cos[:, pos:pos + L], model.sin[:, pos:pos + L]
    x = model.embed(ids)
    x = F.rms_norm(x, (x.shape[-1],))
    e_x = x
    for i, blk in enumerate(model.blocks):
        a = blk.attn
        h = F.rms_norm(x, (x.shape[-1],))
        q = a.attn_query(h).view(B, L, a.n_head, a.head_dim)
        k = a.attn_key(h).view(B, L, a.n_head, a.head_dim)
        v = a.attn_value(h).view(B, L, a.n_head, a.head_dim)
        q, k = apply_rotary_emb(q, cos, sin), apply_rotary_emb(k, cos, sin)
        q, k = F.rms_norm(q, (q.size(-1),)), F.rms_norm(k, (k.size(-1),))
        q = a.head_gain(q)
        q, k, v = q.transpose(1, 2), k.transpose(1, 2), v.transpose(1, 2)
        if cache[i] is not None:
            k = torch.cat([cache[i][0], k], dim=2)
            v = torch.cat([cache[i][1], v], dim=2)
        cache[i] = (k, v)
        y = F.scaled_dot_product_attention(q, k, v, is_causal=L > 1)
        y = y.transpose(1, 2).contiguous().view(B, L, -1)
        x = x + blk.attn_gain(a.attn_resid(y))
        x = x + blk.mlp_gain(blk.mlp(F.rms_norm(x, (x.shape[-1],))))
        x = x + blk.embed_skip(e_x)
    x = F.rms_norm(x, (x.shape[-1],))
    return F.linear(x[:, -1, :], model.lm_head_gain(model.lm_head)).float()


@torch.no_grad()
def sample(model, tok, prompt, n):
    ids = tok.encode(prompt, allowed_special="all")
    eos = tok.encode_single_token("<|endoftext|>")
    cache = [None] * len(model.blocks)
    logits = forward_cached(model, torch.tensor([ids], device=DEV), cache, 0)
    cache = [(k.expand(n, -1, -1, -1).contiguous(), v.expand(n, -1, -1, -1).contiguous()) for k, v in cache]
    logits = logits.expand(n, -1)
    out = [[] for _ in range(n)]
    done = [False] * n
    pos = len(ids)
    for _ in range(MAX_TOKENS):
        probs = torch.softmax(logits / TEMP, dim=-1)
        nxt = torch.multinomial(probs, 1)
        for j in range(n):
            if done[j]:
                continue
            t = int(nxt[j, 0])
            if t == eos:
                done[j] = True
                continue
            out[j].append(t)
            if "\n\n" in tok.decode(out[j][-3:]):
                done[j] = True
        if all(done):
            break
        logits = forward_cached(model, nxt, cache, pos)
        pos += 1
    texts = []
    for toks in out:
        t = tok.decode(toks)
        texts.append(t.split("\n\n")[0].strip())
    return texts


def check(model, tok):
    ids = torch.tensor([tok.encode(completion_prompt("plato-phaedrus", 1))], device=DEV)
    ref = model.forward(ids)
    cache = [None] * len(model.blocks)
    got = forward_cached(model, ids[:, :-5], cache, 0)
    for j in range(5, 0, -1):
        got = forward_cached(model, ids[:, -j:-j + 1 if j > 1 else None], cache, ids.shape[1] - j)
    print("max |logit diff| cached vs reference:", (ref - got).abs().max().item())
    print("same argmax:", bool((ref.argmax(-1) == got.argmax(-1)).all()))


def main():
    model, tok = load_model()
    if "--check" in sys.argv:
        check(model, tok)
        return
    OUT.parent.mkdir(exist_ok=True)
    done = set()
    if OUT.exists():
        done = {json.loads(l)["id"] for l in OUT.read_text().splitlines() if l.strip()}
    with OUT.open("a") as f:
        for set_id in SETS:
            for order in (1, 2):
                ids = [f"talkie-{set_id}-o{order}-{i + 1:02d}" for i in range(DRAWS_PER_ORDER)]
                if all(i in done for i in ids):
                    continue
                texts = sample(model, tok, completion_prompt(set_id, order), DRAWS_PER_ORDER)
                for did, text in zip(ids, texts):
                    rec = {
                        "id": did, "model": "talkie-1930-13b-base", "weights": REPO,
                        "date": date.today().isoformat(), "set": set_id, "order": order,
                        "temperature": TEMP, "text": text,
                    }
                    f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                f.flush()
                print(set_id, order, "done", file=sys.stderr)


if __name__ == "__main__":
    main()
