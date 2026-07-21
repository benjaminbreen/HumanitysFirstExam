import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const manifestPath = join(repoRoot, "research", "historical-source-manifest.json");
const outputDir = join(repoRoot, "data-local", "historical-sources");
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const tierArg = [...args].find((arg) => arg.startsWith("--tier="));
const tier = tierArg?.slice("--tier=".length);
const idArg = [...args].find((arg) => arg.startsWith("--id="));
const sourceId = idArg?.slice("--id=".length);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const selected = manifest.filter((source) =>
  (!tier || source.tier === tier) && (!sourceId || source.id === sourceId)
);

mkdirSync(outputDir, { recursive: true });

function decodeEntities(value) {
  const namedEntities = {
    aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
    Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
    agrave: "à", egrave: "è", igrave: "ì", ograve: "ò", ugrave: "ù",
    Agrave: "À", Egrave: "È", Igrave: "Ì", Ograve: "Ò", Ugrave: "Ù",
    acirc: "â", ecirc: "ê", icirc: "î", ocirc: "ô", ucirc: "û",
    Acirc: "Â", Ecirc: "Ê", Icirc: "Î", Ocirc: "Ô", Ucirc: "Û",
    auml: "ä", euml: "ë", iuml: "ï", ouml: "ö", uuml: "ü",
    Auml: "Ä", Euml: "Ë", Iuml: "Ï", Ouml: "Ö", Uuml: "Ü",
    atilde: "ã", ntilde: "ñ", otilde: "õ",
    Atilde: "Ã", Ntilde: "Ñ", Otilde: "Õ",
    aring: "å", Aring: "Å", ccedil: "ç", Ccedil: "Ç",
    laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
    ndash: "–", mdash: "—", hellip: "…", middot: "·", copy: "©", reg: "®"
  };
  return value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&([A-Za-z]+);/g, (entity, name) => namedEntities[name] ?? entity)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html) {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<sup\b[^>]*class=["'][^"']*(?:reference|mw-ref)[^"']*["'][^>]*>[\s\S]*?<\/sup>/gi, "");

  return decodeEntities(
    withoutNoise
      .replace(/<(?:br|hr)\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|div|h[1-6]|li|tr|table|section|article|blockquote|dd|dt)>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wikitextToText(wikitext) {
  let text = wikitext
    .replace(/<noinclude\b[^>]*>[\s\S]*?<\/noinclude>/gi, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref\b[^>]*\/?\s*>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/?(?:onlyinclude|includeonly|poem|div|span|p|section)\b[^>]*>/gi, "")
    .replace(/\[\[File:[^\]]+\]\]/gi, "")
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1")
    .replace(/\[(?:https?:\/\/[^\]]+)\]/g, "")
    .replace(/^\s*\{\|[\s\S]*?^\s*\|\}\s*$/gm, "");

  // Most proofread-page templates are typographic wrappers. Keeping their
  // final positional value preserves the prose while dropping layout syntax.
  for (let pass = 0; pass < 6 && /\{\{[^{}]*\}\}/.test(text); pass += 1) {
    text = text.replace(/\{\{([^{}]*)\}\}/g, (_, body) => {
      const values = body.split("|").slice(1).filter((value) => value && !value.includes("="));
      return values.at(-1) ?? "";
    });
  }

  return decodeEntities(text)
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s*=+\s*(.*?)\s*=+\s*$/gm, "$1")
    .replace(/'{2,5}/g, "")
    .replace(/__\w+__/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchBuffer(url) {
  const response = await fetchWithRetry(url, { redirect: "follow" });
  return Buffer.from(await response.arrayBuffer());
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url);
  return response.json();
}

function wait(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function fetchWithRetry(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "User-Agent": "HumanitysFirstExam/0.1 (public-domain research corpus; contact via repository)"
        }
      });
      if (response.ok) return response;
      if (![429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30000)
        : Math.min(1500 * (attempt + 1), 30000);
      lastError = new Error(`${response.status} ${response.statusText}: ${url}`);
      await wait(delay);
    } catch (error) {
      lastError = error;
      await wait(Math.min(1500 * (attempt + 1), 30000));
    }
  }
  throw lastError;
}

async function fetchMediaWikiPage(api, page) {
  const params = new URLSearchParams({
    action: "parse",
    page,
    prop: "text",
    format: "json",
    formatversion: "2"
  });
  const payload = await fetchJson(`${api}?${params}`);
  if (payload.error) throw new Error(`${payload.error.code}: ${payload.error.info}`);
  await wait(350);
  return htmlToText(payload.parse.text);
}

async function fetchMediaWikiPages(api, pages) {
  const textByTitle = new Map();
  for (let offset = 0; offset < pages.length; offset += 10) {
    const batch = pages.slice(offset, offset + 10);
    const params = new URLSearchParams({
      action: "query",
      prop: "extracts",
      explaintext: "1",
      exsectionformat: "plain",
      titles: batch.join("|"),
      format: "json",
      formatversion: "2"
    });
    const payload = await fetchJson(`${api}?${params}`);
    for (const entry of payload.query?.pages ?? []) {
      if (!entry.missing && entry.extract) textByTitle.set(entry.title, entry.extract.trim());
    }
    await wait(750);
  }

  for (const page of pages) {
    if (!textByTitle.has(page)) textByTitle.set(page, await fetchMediaWikiPage(api, page));
  }
  return textByTitle;
}

async function fetchMediaWikiRawPages(api, pages) {
  const textByTitle = new Map();
  for (let offset = 0; offset < pages.length; offset += 20) {
    const batch = pages.slice(offset, offset + 20);
    const params = new URLSearchParams({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      titles: batch.join("|"),
      format: "json",
      formatversion: "2"
    });
    const payload = await fetchJson(`${api}?${params}`);
    for (const entry of payload.query?.pages ?? []) {
      const content = entry.revisions?.[0]?.slots?.main?.content;
      if (!entry.missing && typeof content === "string") textByTitle.set(entry.title, content);
    }
    await wait(1600);
  }
  return textByTitle;
}

function proofreadPageRanges(wikitext) {
  const ranges = [];
  for (const match of wikitext.matchAll(/<pages\b([^>]+)\/?\s*>/gi)) {
    const attributes = new Map(
      [...match[1].matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g)]
        .map((attribute) => [attribute[1].toLowerCase(), attribute[2] ?? attribute[3] ?? attribute[4]])
    );
    const index = attributes.get("index");
    const from = Number(attributes.get("from"));
    const to = Number(attributes.get("to"));
    if (index && Number.isInteger(from) && Number.isInteger(to) && to >= from) {
      ranges.push({ index, from, to });
    }
  }
  return ranges;
}

async function fetchMediaWikiBook(api, page, subpagePrefix) {
  const pages = [page, ...(await listMediaWikiSubpages(api, subpagePrefix))];
  const rawByTitle = await fetchMediaWikiRawPages(api, pages);
  const rangesByTitle = new Map();
  const proofreadTitles = [];

  for (const title of pages) {
    const ranges = proofreadPageRanges(rawByTitle.get(title) ?? "");
    rangesByTitle.set(title, ranges);
    for (const { index, from, to } of ranges) {
      for (let number = from; number <= to; number += 1) {
        proofreadTitles.push(`Page:${index}/${number}`);
      }
    }
  }

  const uniqueProofreadTitles = [...new Set(proofreadTitles)];
  const proofreadByTitle = uniqueProofreadTitles.length
    ? await fetchMediaWikiRawPages(api, uniqueProofreadTitles)
    : new Map();
  const sections = [];

  for (const title of pages) {
    const ranges = rangesByTitle.get(title) ?? [];
    let text;
    if (ranges.length) {
      text = ranges.flatMap(({ index, from, to }) => {
        const pageTexts = [];
        for (let number = from; number <= to; number += 1) {
          const proofreadTitle = `Page:${index}/${number}`;
          const pageText = wikitextToText(proofreadByTitle.get(proofreadTitle) ?? "");
          if (pageText) pageTexts.push(`\n[scan page ${number}]\n${pageText}`);
        }
        return pageTexts;
      }).join("\n");
    } else {
      text = wikitextToText(rawByTitle.get(title) ?? "");
    }
    if (text) sections.push(`===== ${title} =====\n\n${text}`);
  }

  return sections.join("\n\n");
}

async function listMediaWikiSubpages(api, page) {
  const titles = [];
  let continueFrom;
  do {
    const params = new URLSearchParams({
      action: "query",
      list: "allpages",
      apprefix: `${page}/`,
      aplimit: "max",
      format: "json",
      formatversion: "2"
    });
    if (continueFrom) params.set("apcontinue", continueFrom);
    const payload = await fetchJson(`${api}?${params}`);
    titles.push(...payload.query.allpages.map((entry) => entry.title));
    continueFrom = payload.continue?.apcontinue;
    await wait(350);
  } while (continueFrom);

  return titles.sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
  );
}

async function downloadSource(source) {
  const extension = source.download.kind === "direct_pdf" ? ".pdf" : ".txt";
  const destination = join(outputDir, `${source.id}${extension}`);
  if (!force && existsSync(destination)) {
    return { source, destination, skipped: true };
  }

  let content;
  if (source.download.kind === "mediawiki_book") {
    const subpagePrefix = source.download.subpagePrefix ?? source.download.page;
    content = Buffer.from(
      await fetchMediaWikiBook(source.download.api, source.download.page, subpagePrefix),
      "utf8"
    );
  } else {
    const downloaded = await fetchBuffer(source.download.url);
    content = source.download.kind === "direct_html"
      ? Buffer.from(
          htmlToText(new TextDecoder(source.download.encoding ?? "utf-8").decode(downloaded)),
          "utf8"
        )
      : downloaded;
  }

  const temporary = `${destination}.partial`;
  writeFileSync(temporary, content);
  renameSync(temporary, destination);

  if (source.download.kind === "direct_pdf") {
    const textDestination = destination.replace(/\.pdf$/, ".txt");
    try {
      execFileSync("pdftotext", ["-layout", destination, textDestination], { stdio: "pipe" });
    } catch (error) {
      console.warn(`PDF text extraction failed for ${source.id}: ${error.message}`);
    }
  }

  return { source, destination, skipped: false };
}

const records = [];
for (const source of selected) {
  try {
    const result = await downloadSource(source);
    const bytes = readFileSync(result.destination);
    const textPath = result.destination.endsWith(".pdf")
      ? result.destination.replace(/\.pdf$/, ".txt")
      : result.destination;
    const textBytes = existsSync(textPath) ? readFileSync(textPath) : null;
    const incomplete = source.download.minimumTextBytes
      && (textBytes?.byteLength ?? 0) < source.download.minimumTextBytes;
    records.push({
      id: source.id,
      tier: source.tier,
      file: basename(result.destination),
      bytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      extractedTextFile: textBytes ? basename(textPath) : null,
      extractedTextBytes: textBytes?.byteLength ?? null,
      status: incomplete ? "incomplete" : result.skipped ? "already-present" : "downloaded",
      ...(incomplete ? {
        error: `text is below minimum expected size (${textBytes?.byteLength ?? 0} < ${source.download.minimumTextBytes} bytes)`
      } : {})
    });
    console.log(`${incomplete ? "incomplete" : result.skipped ? "kept" : "downloaded"} ${source.id} (${bytes.byteLength} bytes)`);
  } catch (error) {
    records.push({ id: source.id, tier: source.tier, status: "failed", error: error.message });
    console.error(`failed ${source.id}: ${error.message}`);
  }
}

const indexPath = join(outputDir, tier ? `download-index-${tier}.json` : "download-index.json");
writeFileSync(
  indexPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), tier: tier ?? "all", records }, null, 2)}\n`
);

const unavailable = records.filter((record) => ["failed", "incomplete"].includes(record.status));
console.log(`\n${records.length - unavailable.length}/${records.length} sources available; index: ${indexPath}`);
if (unavailable.length) process.exitCode = 1;
