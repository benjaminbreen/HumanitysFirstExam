"""Run the DEPENDENCE trial on Qwen3.5 9B (instruct) locally with MLX.

Thinking mode is off. Writes one JSON line per draw to runs/, appending,
so a crash loses nothing and a rerun skips finished draws.
"""
import json
import sys
from datetime import date
from pathlib import Path

from mlx_lm import generate, load
from mlx_lm.sample_utils import make_sampler

from prompts import DRAWS_PER_ORDER, SETS, chat_prompt

MODEL = "mlx-community/Qwen3.5-9B-8bit"
TEMP, TOP_P, MAX_TOKENS = 0.7, 1.0, 400
OUT = Path(__file__).parent / "runs" / "qwen3.5-9b.jsonl"


def main():
    OUT.parent.mkdir(exist_ok=True)
    done = set()
    if OUT.exists():
        done = {json.loads(l)["id"] for l in OUT.read_text().splitlines() if l.strip()}
    model, tok = load(MODEL)
    sampler = make_sampler(temp=TEMP, top_p=TOP_P)
    with OUT.open("a") as f:
        for set_id in SETS:
            for order in (1, 2):
                messages = [{"role": "user", "content": chat_prompt(set_id, order)}]
                prompt = tok.apply_chat_template(
                    messages, add_generation_prompt=True, tokenize=False,
                    enable_thinking=False,
                )
                for i in range(DRAWS_PER_ORDER):
                    did = f"qwen-{set_id}-o{order}-{i + 1:02d}"
                    if did in done:
                        continue
                    text = generate(model, tok, prompt, max_tokens=MAX_TOKENS, sampler=sampler)
                    rec = {
                        "id": did, "model": "qwen3.5-9b-instruct", "weights": MODEL,
                        "date": date.today().isoformat(), "set": set_id, "order": order,
                        "temperature": TEMP, "top_p": TOP_P, "text": text,
                    }
                    f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                    f.flush()
                    print(did, len(text), file=sys.stderr)


if __name__ == "__main__":
    main()
