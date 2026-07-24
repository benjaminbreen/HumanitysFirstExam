import type { Metadata } from "next";
import Link from "next/link";
import SourceCatalogue, {
  type CatalogueSource,
} from "@/components/SourceCatalogue";
import {
  classificationSchema,
  codebook,
  corpusCoding,
  data,
  historicalPassages,
  historicalSourceTexts,
  prototypePassages,
  works,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Sources · " + data.meta.title,
  description:
    "A sortable catalogue of primary sources on machines and human autonomy.",
};

function labelTopic(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function labelAxis(value: string) {
  const labels: Record<string, string> = {
    WILL: "will",
    "MIND-MACHINE": "mind and machine",
    "SELF-GOVT": "self-government",
    HEREDITY: "heredity",
    LABOUR: "labour",
    MASS: "crowds and opinion",
    FATE: "progress and fate",
    BODY: "body and self",
    KNOWLEDGE: "knowledge",
    RESPONSIBILITY: "responsibility",
  };
  return labels[value] ?? labelTopic(value);
}

function normalizeLanguage(value: string) {
  return value.toLocaleLowerCase() === "eng" ? "English" : value;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalizedWords(value: string) {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[electronic resource\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function sourceIdentity(source: CatalogueSource) {
  const rawAuthor = source.author.replace(/\([^)]*\)/g, " ");
  const authorWords = normalizedWords(
    rawAuthor.includes(",") ? rawAuthor.split(",")[0] : rawAuthor,
  ).filter((word) => !/^\d+$/.test(word));
  const author = rawAuthor.includes(",")
    ? authorWords[0]
    : authorWords.at(-1);

  let titleWords = normalizedWords(source.title);
  if (/^(\d+|[ivxlcdm]+)$/.test(titleWords.at(-1) ?? "")) {
    const previous = titleWords.at(-2);
    if (previous && /^(vol|volume|part|book)$/.test(previous)) {
      titleWords = titleWords.slice(0, -2);
    }
  }
  const byline = titleWords.findIndex(
    (word, index) => index >= 3 && (word === "par" || word === "by"),
  );
  if (byline >= 0) titleWords = titleWords.slice(0, byline);

  // Six words are enough to join scan and edition variants while preserving
  // distinct short titles. Author identity prevents unrelated collisions.
  const title = titleWords.slice(0, 6).join(" ");
  return `${author ?? "unknown"}|${title}`;
}

function sourceEvidenceScore(source: CatalogueSource) {
  return (
    (source.workingPassages.length > 0 ? 8 : 0) +
    (source.passage ? 8 : 0) +
    (source.citedPassages.length > 0 ? 6 : 0) +
    (source.readerId ? 3 : 0)
  );
}

function hasSelectedPassage(source: CatalogueSource) {
  return Boolean(
    source.passage || source.workingPassages.length || source.citedPassages.length,
  );
}

function deduplicateSources(sources: CatalogueSource[]) {
  const byWork = new Map<string, CatalogueSource>();

  for (const source of sources) {
    const key = sourceIdentity(source);
    const existing = byWork.get(key);
    if (!existing) {
      byWork.set(key, source);
      continue;
    }

    const preferIncoming =
      sourceEvidenceScore(source) > sourceEvidenceScore(existing);
    existing.year = Math.min(existing.year, source.year);
    existing.subjects = unique([...existing.subjects, ...source.subjects]);
    existing.themes = unique([...existing.themes, ...source.themes]);
    const argumentKeys = new Set(
      existing.arguments.map(
        (argument) => `${argument.claimId}|${argument.relation ?? ""}`,
      ),
    );
    for (const argument of source.arguments) {
      const argumentKey = `${argument.claimId}|${argument.relation ?? ""}`;
      if (!argumentKeys.has(argumentKey)) {
        existing.arguments.push(argument);
        argumentKeys.add(argumentKey);
      }
    }
    existing.citedPassages = [
      ...existing.citedPassages,
      ...source.citedPassages.filter(
        (passage) =>
          !existing.citedPassages.some((existingPassage) => existingPassage.id === passage.id),
      ),
    ];
    existing.readerId ??= source.readerId;
    existing.description ??= source.description;
    existing.passage ??= source.passage;
    existing.workingPassages = [
      ...existing.workingPassages,
      ...source.workingPassages.filter(
        (passage) => !existing.workingPassages.some((item) => item.id === passage.id),
      ),
    ];
    existing.genre ||= source.genre;
    existing.autonomyEffect ||= source.autonomyEffect;

    if (preferIncoming) {
      existing.url = source.url;
      existing.author = source.author;
      existing.title = source.title;
      existing.language = source.language;
    }
  }

  return [...byWork.values()];
}

const argumentLabels: Record<string, string> = {
  succession: "Machines may succeed humanity",
  instrument: "Machines remain tools",
  "emergent-mind": "Machine minds may emerge",
  "bounded-servant": "Machines cannot originate purposes",
  "made-persons": "Made beings may deserve moral standing",
  misalignment: "Machine purposes may conflict with ours",
  "social-arrangement": "Human institutions create the danger",
  dependence: "Dependence weakens human capacities",
  "no-threat": "Machines pose no inherent danger",
  automatism: "Choice accompanies mechanical causes",
  voluntarism: "The will can direct action",
  vitalism: "Life cannot be reduced to mechanism",
  compatibilism: "Freedom can exist within causation",
  pragmatism: "We must act as though choosing matters",
  restrict: "Technology should be limited or refused",
  govern: "Technology should remain under human control",
  accept: "People should adapt to machine advance",
};

export default function SourcesPage() {
  const themeIds = new Set(
    classificationSchema.themes.flatMap((theme) =>
      theme.children.map((child) => child.id),
    ),
  );
  const claimIds = new Set(
    codebook.flatMap((branch) => branch.leaves.map((leaf) => leaf.id)),
  );
  const codeLabels = Object.fromEntries(
    [
      ...classificationSchema.themes.flatMap((theme) => theme.children),
      ...codebook.flatMap((branch) => branch.leaves),
      ...classificationSchema.grounds,
      ...classificationSchema.autonomyEffects,
      ...classificationSchema.loci,
      ...classificationSchema.objects,
      ...classificationSchema.genres,
      ...classificationSchema.modes,
      ...classificationSchema.relations,
    ].map((option) => [option.id, option.label]),
  );

  const sources: CatalogueSource[] = works.map((work, index) => ({
    id: "holding-" + String(index + 1).padStart(3, "0"),
    year: work.year,
    title: work.title,
    author: work.creator || "Unknown",
    language: normalizeLanguage(work.language),
    genre: "",
    subjects: [labelTopic(work.topic)],
    themes: [],
    arguments: [],
    autonomyEffect: "",
    url: work.url,
    workingPassages: [],
    citedPassages: [],
  }));
  const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
  const sourceByReaderId = new Map<string, CatalogueSource>();

  for (const text of historicalSourceTexts.sources) {
    const existing = sourceByUrl.get(text.sourceUrl);
    if (existing) {
      existing.readerId = text.sourceId;
      existing.description = text.relevance;
      existing.subjects = unique([
        ...existing.subjects,
        ...text.subjects.map(labelAxis),
      ]);
      sourceByReaderId.set(text.sourceId, existing);
      continue;
    }

    const source: CatalogueSource = {
      id: text.sourceId,
      readerId: text.sourceId,
      year: text.year,
      title: text.title,
      author: text.author,
      language: normalizeLanguage(text.language),
      genre: "",
      subjects: text.subjects.map(labelAxis),
      themes: [],
      arguments: [],
      autonomyEffect: "",
      description: text.relevance,
      url: text.sourceUrl,
      workingPassages: [],
      citedPassages: [],
    };
    sources.push(source);
    sourceByUrl.set(source.url, source);
    sourceByReaderId.set(text.sourceId, source);
  }

  for (const passage of historicalPassages.passages) {
    const existing =
      sourceByReaderId.get(passage.sourceId) ??
      sourceByUrl.get(passage.source.url);
    if (existing) {
      existing.year = passage.year;
      existing.title = passage.title;
      existing.author = passage.author;
      existing.language = passage.language;
      existing.genre = codeLabels[passage.genre] ?? passage.genre;
      existing.subjects = unique([...existing.subjects, ...passage.codes]);
      existing.arguments = passage.codes
        .filter((claimId) => claimIds.has(claimId))
        .map((claimId) => ({ claimId }));
      existing.passage = passage;
      existing.readerId = passage.sourceId;
      sourceByReaderId.set(passage.sourceId, existing);
    } else {
      const source: CatalogueSource = {
        id: passage.sourceId,
        readerId: passage.sourceId,
        year: passage.year,
        title: passage.title,
        author: passage.author,
        language: passage.language,
        genre: codeLabels[passage.genre] ?? passage.genre,
        subjects: passage.codes,
        themes: [],
        arguments: passage.codes
          .filter((claimId) => claimIds.has(claimId))
          .map((claimId) => ({ claimId })),
        autonomyEffect: "",
        url: passage.source.url,
        passage,
        workingPassages: [],
        citedPassages: [],
      };
      sources.push(source);
      sourceByUrl.set(source.url, source);
      sourceByReaderId.set(passage.sourceId, source);
    }
  }

  for (const passage of prototypePassages.passages) {
    const existing =
      sourceByReaderId.get(passage.sourceId) ??
      sourceByUrl.get(passage.sourceUrl);
    const classification = passage.classification;
    const subjects = unique([
      ...classification.themes,
      ...classification.claims.map((claim) => claim.claimId),
      classification.autonomyEffect,
      ...classification.grounds,
      ...classification.modes,
    ]);
    const genre = codeLabels[classification.genre] ?? classification.genre;

    if (existing) {
      existing.year = passage.year;
      existing.title = passage.title;
      existing.author = passage.author;
      existing.language = normalizeLanguage(passage.language);
      existing.genre = genre;
      existing.subjects = unique([...subjects, ...existing.subjects]);
      existing.themes = unique([
        ...existing.themes,
        ...classification.themes.filter((theme) => themeIds.has(theme)),
      ]);
      existing.arguments = [
        ...existing.arguments,
        ...classification.claims.filter(
          (claim) =>
            claimIds.has(claim.claimId) &&
            !existing.arguments.some(
              (item) => item.claimId === claim.claimId && item.relation === claim.relation,
            ),
        ),
      ];
      existing.autonomyEffect ||= classification.autonomyEffect;
      existing.workingPassages.push(passage);
      existing.readerId = passage.sourceId;
      sourceByReaderId.set(passage.sourceId, existing);
    } else {
      const source: CatalogueSource = {
        id: passage.sourceId,
        readerId: passage.sourceId,
        year: passage.year,
        title: passage.title,
        author: passage.author,
        language: normalizeLanguage(passage.language),
        genre,
        subjects,
        themes: classification.themes.filter((theme) => themeIds.has(theme)),
        arguments: classification.claims.filter((claim) =>
          claimIds.has(claim.claimId),
        ),
        autonomyEffect: classification.autonomyEffect,
        url: passage.sourceUrl,
        workingPassages: [passage],
        citedPassages: [],
      };
      sources.push(source);
      sourceByUrl.set(source.url, source);
      sourceByReaderId.set(passage.sourceId, source);
    }
  }

  // The full corpus is coded passage by passage in versioned batches. These
  // records retain their own classifications; the work row only aggregates
  // them for sorting and filtering.
  for (const [index, record] of corpusCoding.entries()) {
    if (!record.originalText || !record.locator || !record.themes || !record.claims || !record.grounds || !record.autonomyEffect || !record.genre || !record.modes) {
      continue;
    }
    const text = historicalSourceTexts.sources.find(
      (item) => item.sourceId === record.sourceId,
    );
    if (!text) continue;
    const existing = sourceByReaderId.get(record.sourceId);
    if (!existing) continue;
    if (existing.workingPassages.some((item) => item.originalText === record.originalText)) {
      continue;
    }

    const passage = {
      id: `corpus-${String(index + 1).padStart(3, "0")}`,
      sourceId: record.sourceId,
      author: text.author,
      title: text.title,
      year: text.year,
      language: normalizeLanguage(text.language),
      locator: record.locator,
      relatedQuestionNumbers: record.relatedQuestions,
      sourceUrl: text.sourceUrl,
      originalText: record.originalText,
      englishText: null,
      sourceCheckRequired: false,
      sourceMatchLevel: "corpus-coding-passage-selected-in-local-text",
      classification: {
        status: "working-prototype-classification" as const,
        themes: record.themes,
        claims: record.claims,
        grounds: record.grounds,
        autonomyEffect: record.autonomyEffect,
        loci: record.loci ?? [],
        objects: record.objects ?? [],
        genre: record.genre,
        modes: record.modes,
        rationale: record.rationale ?? "Passage selected in the corpus coding pass.",
      },
    };

    existing.genre ||= codeLabels[record.genre] ?? record.genre;
    existing.themes = unique([...existing.themes, ...record.themes]);
    existing.arguments = [
      ...existing.arguments,
      ...record.claims.filter(
        (claim) =>
          !existing.arguments.some(
            (item) => item.claimId === claim.claimId && item.relation === claim.relation,
          ),
      ),
    ];
    existing.autonomyEffect ||= record.autonomyEffect;
    existing.workingPassages.push(passage);
  }

  for (const topic of data.topics) {
    for (const passage of topic.passages) {
      const existing = passage.url ? sourceByUrl.get(passage.url) : undefined;
      if (existing) {
        existing.citedPassages.push(passage);
        existing.subjects = unique([
          ...existing.subjects,
          ...passage.codes,
          topic.title,
        ]);
        const knownClaims = passage.codes.filter((claimId) =>
          claimIds.has(claimId),
        );
        if (existing.arguments.length === 0 && knownClaims.length > 0) {
          existing.arguments = knownClaims.map((claimId) => ({ claimId }));
        }
      } else if (passage.url) {
        const source: CatalogueSource = {
          id: "citation-" + passage.id,
          year: passage.year,
          title: passage.title,
          author: passage.author,
          language: "English",
          genre: "",
          subjects: unique([...passage.codes, topic.title]),
          themes: [],
          arguments: passage.codes
            .filter((claimId) => claimIds.has(claimId))
            .map((claimId) => ({ claimId })),
          autonomyEffect: "",
          url: passage.url,
          workingPassages: [],
          citedPassages: [passage],
        };
        sources.push(source);
        sourceByUrl.set(source.url, source);
      }
    }
  }

  // `/sources` is the public evidence catalogue, not the harvest manifest.
  // Records without a selected passage remain in the versioned source files
  // until passage selection admits them here.
  const cleanedSources = deduplicateSources(sources).filter(hasSelectedPassage);
  const languageCount = new Set(
    cleanedSources.map((source) => source.language),
  ).size;
  const readableTextCount = cleanedSources.filter(
    (source) => source.readerId,
  ).length;

  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl border-b border-line pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Sources
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Primary sources with passages selected for the project. Sort the
          columns, filter the catalogue, or open a row to read the evidence.
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          {cleanedSources.length} sources with passages · {readableTextCount} full texts ·{" "}
          {languageCount} languages
        </p>
      </header>

      <section className="py-5">
        <SourceCatalogue
          sources={cleanedSources}
          codeLabels={codeLabels}
          argumentLabels={argumentLabels}
        />
      </section>

      <footer className="border-t border-line py-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            Every listed source has a selected passage and a link to its
            repository edition or scan.
          </p>
          <Link
            href="/answer-key/q33"
            className="font-mono text-xs underline decoration-line underline-offset-4 hover:text-period"
          >
            How passages are selected →
          </Link>
        </div>
      </footer>
    </main>
  );
}
