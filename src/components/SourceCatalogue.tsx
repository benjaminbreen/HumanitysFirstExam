"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { schemaTone } from "@/lib/schema-tone";
import type {
  HistoricalPassage,
  PrototypePassage,
  SourcePassage,
} from "@/lib/types";

type ViewMode = "list" | "cards";
type SortColumn =
  | "year"
  | "title"
  | "author"
  | "theme"
  | "argument"
  | "effect"
  | "form";

export interface CatalogueArgument {
  claimId: string;
  relation?: string;
}

export interface CatalogueSource {
  id: string;
  readerId?: string;
  year: number;
  title: string;
  author: string;
  language: string;
  genre: string;
  subjects: string[];
  themes: string[];
  arguments: CatalogueArgument[];
  autonomyEffect: string;
  description?: string;
  url: string;
  passage?: HistoricalPassage;
  /** Independently selected and coded evidence units from this work. */
  workingPassages: PrototypePassage[];
  citedPassages: SourcePassage[];
}

interface SourceCatalogueProps {
  sources: CatalogueSource[];
  codeLabels: Record<string, string>;
  argumentLabels: Record<string, string>;
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function SchemaPill({
  value,
  label,
  isCode = false,
  compact = false,
}: {
  value: string;
  label: string;
  isCode?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/codebook#${isCode ? value : "themes"}`}
      data-schema-tone={schemaTone(value)}
      title={`View “${label}” in the coding schema`}
      onClick={(event) => event.stopPropagation()}
      className={
        "schema-tint pointer-events-auto max-w-full shrink truncate rounded-md border border-ink-faint/45 font-mono text-ink-soft transition-colors duration-200 hover:border-ink-soft hover:text-ink " +
        (compact
          ? "px-2 py-1 text-[10px] xl:text-[11px]"
          : "px-2 py-1 text-[11px]")
      }
    >
      {label}
    </Link>
  );
}

function argumentText(
  argument: CatalogueArgument,
  argumentLabels: Record<string, string>,
) {
  const proposition =
    argumentLabels[argument.claimId] ?? argument.claimId.replace(/-/g, " ");
  if (argument.relation === "rejects") return `Rejects: ${proposition}`;
  if (argument.relation === "considers") return `Considers: ${proposition}`;
  if (argument.relation === "reports") return `Reports: ${proposition}`;
  return proposition;
}

function effectLabel(value: string) {
  const labels: Record<string, string> = {
    enlarges: "Enlarges",
    diminishes: "Diminishes",
    conditional: "Mixed",
    "no-judgment": "No judgment",
  };
  return labels[value] ?? "—";
}

function verificationLabel(passage: HistoricalPassage) {
  if (passage.source.verificationLevel === "scan-checked") {
    return "scan and page checked";
  }
  if (passage.source.verificationLevel === "repository-text-checked") {
    return "repository text checked";
  }
  if (passage.source.verificationLevel === "transcription-checked") {
    return "transcription and date checked";
  }
  return "transcription checked; issue scan pending";
}

function SourceBody({
  source,
  codeLabels,
  argumentLabels,
}: {
  source: CatalogueSource;
  codeLabels: Record<string, string>;
  argumentLabels: Record<string, string>;
}) {
  const passage = source.passage;
  const workingPassages = source.workingPassages;

  return (
    <div className="pb-6 pt-4">
      {workingPassages.length > 0 ? (
        <>
          <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            {workingPassages.length} selected {workingPassages.length === 1 ? "passage" : "passages"} · each coded separately
          </p>
          {workingPassages.map((item, index) => (
            <article key={item.id} className={index === 0 ? "mt-3" : "mt-7 border-t border-line pt-6"}>
              <div className={item.englishText ? "grid gap-5 lg:grid-cols-2" : ""}>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                    Passage {index + 1} · {item.language}
                  </p>
                  <blockquote className="mt-2 leading-relaxed">{item.originalText}</blockquote>
                </div>
                {item.englishText && (
                  <div className="mt-5 border-t border-line pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Working English translation</p>
                    <blockquote className="mt-2 leading-relaxed text-ink-soft">{item.englishText}</blockquote>
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                <span>{item.locator}</span>
                <span>passage classification</span>
                {item.sourceCheckRequired && <span>source wording still to be checked</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.classification.themes.map((theme) => (
                  <SchemaPill key={theme} value={theme} label={codeLabels[theme] ?? theme} isCode compact />
                ))}
                {item.classification.claims.map((claim) => (
                  <SchemaPill key={`${claim.claimId}-${claim.relation}`} value={claim.claimId} label={argumentText(claim, argumentLabels)} isCode compact />
                ))}
                {item.classification.grounds.map((ground) => (
                  <SchemaPill key={ground} value={ground} label={codeLabels[ground] ?? ground} isCode compact />
                ))}
                <SchemaPill value={item.classification.autonomyEffect} label={codeLabels[item.classification.autonomyEffect] ?? effectLabel(item.classification.autonomyEffect)} isCode compact />
                {(item.classification.loci ?? []).map((locus) => (
                  <SchemaPill key={locus} value={locus} label={codeLabels[locus] ?? locus} isCode compact />
                ))}
                {(item.classification.objects ?? []).map((object) => (
                  <SchemaPill key={object} value={object} label={codeLabels[object] ?? object} isCode compact />
                ))}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">{item.classification.rationale}</p>
            </article>
          ))}
        </>
      ) : passage ? (
        <>
          <div className={passage.englishText ? "grid gap-5 lg:grid-cols-2" : ""}>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Original · {passage.language}
              </p>
              <blockquote className="mt-2 leading-relaxed">{passage.originalText}</blockquote>
            </div>
            {passage.englishText && (
              <div className="mt-5 border-t border-line pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                  Working English translation
                </p>
                <blockquote className="mt-2 leading-relaxed text-ink-soft">
                  {passage.englishText}
                </blockquote>
              </div>
            )}
          </div>
          <p className="mt-5 max-w-3xl border-l-2 border-period/50 pl-4 text-sm leading-relaxed">
            {passage.questionSeed}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span>{passage.locator}</span>
            <span>{verificationLabel(passage)}</span>
            <span>
              {passage.translation.reviewStatus === "required"
                ? "translation review pending"
                : "source is in English"}
            </span>
          </div>
        </>
      ) : source.citedPassages.length > 0 ? (
        <div className="space-y-5">
          {source.citedPassages.map((excerpt) => (
            <figure key={excerpt.id}>
              <blockquote className="border-l-2 border-period/50 pl-4 leading-relaxed">
                {excerpt.text}
              </blockquote>
              <figcaption className="mt-2 text-sm text-ink-soft">
                {excerpt.citation}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : source.description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
          {source.description}
        </p>
      ) : (
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          This source is in the working corpus. No passage has yet been selected
          from it for the historical reference set.
        </p>
      )}

      {workingPassages.length === 0 && (source.themes.length > 0 || source.arguments.length > 0) ? (
        <dl className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
              Themes
            </dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {source.themes.map((theme) => (
                <SchemaPill
                  key={theme}
                  value={theme}
                  label={codeLabels[theme] ?? theme}
                  isCode
                />
              ))}
              {source.themes.length === 0 && (
                <span className="font-mono text-[10px] text-ink-faint">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
              Arguments
            </dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {source.arguments.map((argument) => (
                <SchemaPill
                  key={argument.claimId}
                  value={argument.claimId}
                  label={argumentText(argument, argumentLabels)}
                  isCode
                />
              ))}
              {source.arguments.length === 0 && (
                <span className="font-mono text-[10px] text-ink-faint">—</span>
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          Not yet classified in the current schema
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
        {source.readerId && (
          <Link
            href={"/sources/" + source.readerId}
            className="underline decoration-line underline-offset-4 hover:decoration-ink-soft"
          >
            Read text →
          </Link>
        )}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
        >
          View source edition ↗
        </a>
      </div>
    </div>
  );
}

function sortValue(
  source: CatalogueSource,
  column: SortColumn,
  argumentLabels: Record<string, string>,
) {
  if (column === "year") return source.year;
  if (column === "title") return source.title;
  if (column === "author") return source.author;
  if (column === "theme") return source.themes[0] ?? "";
  if (column === "argument") {
    return source.arguments[0]
      ? argumentText(source.arguments[0], argumentLabels)
      : "";
  }
  if (column === "effect") return source.autonomyEffect;
  return `${source.genre} ${source.language}`;
}

function SortHeader({
  column,
  label,
  active,
  direction,
  onSort,
}: {
  column: SortColumn;
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onSort: (column: SortColumn) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={
        "flex items-center gap-1 text-left hover:text-ink " +
        (active ? "text-ink" : "text-ink-faint")
      }
    >
      <span>{label}</span>
      <span aria-hidden="true">
        {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

export default function SourceCatalogue({
  sources,
  codeLabels,
  argumentLabels,
}: SourceCatalogueProps) {
  const [query, setQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("year");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [language, setLanguage] = useState("");
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [argument, setArgument] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  const languages = useMemo(
    () => unique(sources.map((source) => source.language)),
    [sources],
  );
  const genres = useMemo(
    () => unique(sources.map((source) => source.genre).filter(Boolean)),
    [sources],
  );
  const themes = useMemo(
    () => unique(sources.flatMap((source) => source.themes)),
    [sources],
  );
  const argumentsList = useMemo(
    () => unique(sources.flatMap((source) => source.arguments.map((item) => item.claimId))),
    [sources],
  );

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = sources.filter((source) => {
      if (language && source.language !== language) return false;
      if (genre === "__untagged" && source.genre) return false;
      if (genre && genre !== "__untagged" && source.genre !== genre) return false;
      if (theme && !source.themes.includes(theme)) return false;
      if (
        argument &&
        !source.arguments.some((item) => item.claimId === argument)
      ) {
        return false;
      }
      if (!normalizedQuery) return true;

      return [
        source.author,
        source.title,
        source.year,
        source.language,
        source.genre,
        ...source.themes.map((value) => codeLabels[value] ?? value),
        ...source.arguments.map((item) => argumentText(item, argumentLabels)),
        effectLabel(source.autonomyEffect),
        ...source.subjects.map((value) => codeLabels[value] ?? value),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });

    return [...filtered].sort((a, b) => {
      const aValue = sortValue(a, sortColumn, argumentLabels);
      const bValue = sortValue(b, sortColumn, argumentLabels);
      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
      const directed = sortDirection === "asc" ? comparison : -comparison;
      return directed || a.year - b.year || a.title.localeCompare(b.title);
    });
  }, [
    argument,
    argumentLabels,
    codeLabels,
    genre,
    language,
    query,
    sortColumn,
    sortDirection,
    sources,
    theme,
  ]);

  function chooseSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const activeFilters = [language, genre, theme, argument].filter(Boolean).length;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label>
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Author, title, language, theme, or argument"
            className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm placeholder:text-ink-faint"
          />
        </label>

        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            View
          </span>
          <div className="mt-1 flex border border-line">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={
                "px-3 py-2 font-mono text-xs " +
                (view === "list" ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
              }
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
              className={
                "border-l border-line px-3 py-2 font-mono text-xs " +
                (view === "cards" ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
              }
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2 border-y border-line">
        <details className="min-w-[16rem] flex-1">
          <summary className="cursor-pointer py-2.5 font-mono text-[11px] text-ink-soft hover:text-ink">
            Filter by language, form, theme, or argument
            {activeFilters > 0 ? " · " + activeFilters + " active" : ""}
          </summary>
          <div className="grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Language
              </span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="">All languages</option>
                {languages.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Form
              </span>
              <select
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="">All forms</option>
                {genres.map((value) => (
                  <option key={value}>{value}</option>
                ))}
                <option value="__untagged">Not yet tagged</option>
              </select>
            </label>
            <label>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Theme
              </span>
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="">All themes</option>
                {themes.map((value) => (
                  <option key={value} value={value}>
                    {codeLabels[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                Argument
              </span>
              <select
                value={argument}
                onChange={(event) => setArgument(event.target.value)}
                className="mt-1 block w-full border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="">All arguments</option>
                {argumentsList.map((value) => (
                  <option key={value} value={value}>
                    {argumentLabels[value] ?? codeLabels[value] ?? value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>

        <label className="py-2 lg:hidden">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            Sort on small screens
          </span>
          <select
            value={sortColumn}
            onChange={(event) => {
              setSortColumn(event.target.value as SortColumn);
              setSortDirection("asc");
            }}
            className="mt-1 block w-full border border-line bg-paper px-3 py-1.5 text-sm"
          >
            <option value="year">Year</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="theme">Theme</option>
            <option value="argument">Argument</option>
            <option value="effect">Effect</option>
            <option value="form">Form</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-ink-faint">
          {visible.length} of {sources.length} sources
        </p>
        <button
          type="button"
          onClick={() => setSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
          className="font-mono text-[10px] text-ink-soft hover:text-ink lg:hidden"
        >
          {sortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}
        </button>
      </div>

      {view === "list" ? (
        <div className="mt-2 border border-line">
          <div className="hidden grid-cols-[5rem_1.05fr_1.75fr_1.2fr_1.45fr_6.5rem_9rem] gap-4 border-b border-line bg-paper-deep/50 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider lg:grid">
            <SortHeader column="year" label="Year" active={sortColumn === "year"} direction={sortDirection} onSort={chooseSort} />
            <SortHeader column="author" label="Author" active={sortColumn === "author"} direction={sortDirection} onSort={chooseSort} />
            <SortHeader column="title" label="Title" active={sortColumn === "title"} direction={sortDirection} onSort={chooseSort} />
            <SortHeader column="theme" label="Theme" active={sortColumn === "theme"} direction={sortDirection} onSort={chooseSort} />
            <SortHeader column="argument" label="Argument" active={sortColumn === "argument"} direction={sortDirection} onSort={chooseSort} />
            <SortHeader column="effect" label="Effect" active={sortColumn === "effect"} direction={sortDirection} onSort={chooseSort} />
            <SortHeader column="form" label="Form" active={sortColumn === "form"} direction={sortDirection} onSort={chooseSort} />
          </div>
          <div className="divide-y divide-line">
            {visible.map((sourceItem) => (
              <details
                key={sourceItem.id}
                className="catalogue-row catalogue-details group px-4"
              >
                <summary className="catalogue-summary cursor-pointer py-3.5">
                  <div className="hidden min-w-0 items-center gap-x-4 lg:grid lg:grid-cols-[5rem_1.05fr_1.75fr_1.2fr_1.45fr_6.5rem_9rem]">
                    <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-period">
                      <span
                        aria-hidden="true"
                        className="inline-block text-[11px] text-ink-faint transition-transform duration-300 group-open:rotate-90"
                      >
                        ▸
                      </span>
                      {sourceItem.year}
                    </span>
                    <span className="truncate text-base text-ink-soft" title={sourceItem.author}>
                      {sourceItem.author}
                    </span>
                    <span className="truncate font-serif text-[1.05rem]" title={sourceItem.title}>
                      {sourceItem.title}
                    </span>
                    <span className="flex min-w-0 items-center gap-1 overflow-hidden">
                      {sourceItem.themes.slice(0, 1).map((value) => (
                        <SchemaPill
                          key={value}
                          value={value}
                          label={codeLabels[value] ?? value}
                          isCode={Boolean(codeLabels[value])}
                          compact
                        />
                      ))}
                      {sourceItem.themes.length > 1 && (
                        <span className="font-mono text-[9px] text-ink-faint">
                          +{sourceItem.themes.length - 1}
                        </span>
                      )}
                      {sourceItem.themes.length === 0 && (
                        <span className="font-mono text-[9px] text-ink-faint">—</span>
                      )}
                    </span>
                    <span className="flex min-w-0 items-center gap-1 overflow-hidden">
                      {sourceItem.arguments[0] ? (
                        <SchemaPill
                          value={sourceItem.arguments[0].claimId}
                          label={argumentText(sourceItem.arguments[0], argumentLabels)}
                          isCode={Boolean(codeLabels[sourceItem.arguments[0].claimId])}
                          compact
                        />
                      ) : (
                        <span className="font-mono text-[9px] text-ink-faint">—</span>
                      )}
                      {sourceItem.arguments.length > 1 && (
                        <span className="font-mono text-[9px] text-ink-faint">
                          +{sourceItem.arguments.length - 1}
                        </span>
                      )}
                    </span>
                    <span className="truncate font-mono text-[9px] text-ink-soft">
                      {effectLabel(sourceItem.autonomyEffect)}
                    </span>
                    <span
                      className="truncate font-mono text-[9px] leading-relaxed text-ink-faint"
                      title={[sourceItem.genre, sourceItem.language].filter(Boolean).join(" · ")}
                    >
                      {sourceItem.genre ? `${sourceItem.genre} · ` : ""}
                      {sourceItem.language}
                    </span>
                  </div>

                  <div className="lg:hidden">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-2 font-mono text-xs tabular-nums text-period">
                        <span
                          aria-hidden="true"
                          className="inline-block text-[10px] text-ink-faint transition-transform duration-300 group-open:rotate-90"
                        >
                          ▸
                        </span>
                        {sourceItem.year}
                      </span>
                      <span className="font-mono text-[9px] text-ink-faint">
                        {[sourceItem.genre, sourceItem.language].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <p className="mt-1 font-serif leading-snug">{sourceItem.title}</p>
                    <p className="mt-1 text-base text-ink-soft">{sourceItem.author}</p>
                    <span className="mt-2 flex flex-wrap gap-1">
                      {sourceItem.themes.slice(0, 1).map((value) => (
                        <SchemaPill
                          key={value}
                          value={value}
                          label={codeLabels[value] ?? value}
                          isCode={Boolean(codeLabels[value])}
                          compact
                        />
                      ))}
                      {sourceItem.arguments[0] && (
                        <SchemaPill
                          value={sourceItem.arguments[0].claimId}
                          label={argumentText(sourceItem.arguments[0], argumentLabels)}
                          isCode={Boolean(codeLabels[sourceItem.arguments[0].claimId])}
                          compact
                        />
                      )}
                      {sourceItem.autonomyEffect && (
                        <SchemaPill
                          value={sourceItem.autonomyEffect}
                          label={effectLabel(sourceItem.autonomyEffect)}
                          isCode
                          compact
                        />
                      )}
                      {sourceItem.themes.length === 0 &&
                        sourceItem.arguments.length === 0 && (
                          <span className="font-mono text-[9px] text-ink-faint">
                            Not yet classified
                          </span>
                        )}
                    </span>
                  </div>
                </summary>
                <div className="catalogue-details-body overflow-hidden">
                  <SourceBody
                    source={sourceItem}
                    codeLabels={codeLabels}
                    argumentLabels={argumentLabels}
                  />
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {visible.map((sourceItem) => (
            <article
              key={sourceItem.id}
              className="border border-line border-l-2 border-l-period bg-paper-deep/25 p-5"
            >
              <p className="font-mono text-xs text-period">
                {sourceItem.year} · {sourceItem.language}
              </p>
              <h2 className="mt-1 font-display text-xl font-medium tracking-tight">
                {sourceItem.title}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {sourceItem.author}
                {sourceItem.genre ? " · " + sourceItem.genre : ""}
              </p>
              <SourceBody
                source={sourceItem}
                codeLabels={codeLabels}
                argumentLabels={argumentLabels}
              />
            </article>
          ))}
        </div>
      )}

      {visible.length === 0 && (
        <p className="mt-8 text-sm text-ink-soft">
          No sources match those filters.
        </p>
      )}
    </div>
  );
}
