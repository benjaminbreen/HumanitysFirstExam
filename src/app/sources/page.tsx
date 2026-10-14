import type { Metadata } from "next";
import Link from "next/link";
import { countBy, Facets, type Facet } from "@/components/Facets";
import { PageTitle } from "@/components/PageTitle";
import { HeldBack } from "@/components/HeldBack";
import { Chevron, summaryClass, TextFlag } from "@/components/Row";
import {
  centuryOf,
  formatYear,
  getQuestion,
  isWorkSort,
  kindLabel,
  isHeldBack,
  stancesForWork,
  textLabel,
  translationLabel,
  workSorts,
  works,
  type Work,
  type WorkSort,
} from "@/lib/data";

export const metadata: Metadata = { title: "Sources" };

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const filters = {
  lang: (w: Work) => w.language,
  form: (w: Work) => kindLabel(w.kind),
  text: (w: Work) => textLabel[w.text],
  century: (w: Work) => centuryOf(w),
} as const;
type FilterKey = keyof typeof filters;

const cols =
  "grid grid-cols-[5rem_1fr_1rem] items-baseline gap-x-4 sm:grid-cols-[5rem_8rem_1fr_2.5rem_1rem] lg:grid-cols-[5rem_9rem_1fr_6.5rem_6rem_2.5rem_5.5rem_1rem]";

export default async function SourcesPage({
  searchParams,
}: PageProps<"/sources">) {
  const p = await searchParams;
  const active = Object.fromEntries(
    (Object.keys(filters) as FilterKey[]).map((k) => [k, str(p[k])]),
  ) as Record<FilterKey, string | undefined>;
  const sort: WorkSort = isWorkSort(str(p.sort))
    ? (str(p.sort) as WorkSort)
    : "year";

  // Each facet counts the works that pass every other active filter.
  const passes = (w: Work, except?: FilterKey) =>
    (Object.keys(filters) as FilterKey[]).every(
      (k) => k === except || !active[k] || filters[k](w) === active[k],
    );
  const shown = works.filter((w) => passes(w)).sort(workSorts[sort]);

  const centuries = [...new Set(works.map(centuryOf))].sort((a, b) =>
    a === "Before 1600" ? -1 : b === "Before 1600" ? 1 : a.localeCompare(b),
  );
  const facets: Facet[] = [
    {
      key: "lang",
      label: "Language",
      options: countBy(
        works.filter((w) => passes(w, "lang")),
        filters.lang,
      ),
    },
    {
      key: "form",
      label: "Form",
      options: countBy(
        works.filter((w) => passes(w, "form")),
        filters.form,
      ),
    },
    {
      key: "century",
      label: "Date",
      options: countBy(
        works.filter((w) => passes(w, "century")),
        filters.century,
        centuries,
      ),
    },
    {
      key: "text",
      label: "Text",
      options: countBy(
        works.filter((w) => passes(w, "text")),
        filters.text,
        Object.values(textLabel),
      ),
    },
  ];
  const params = { ...active, sort: sort === "year" ? undefined : sort };

  const sortHref = (key: WorkSort) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries(active)) if (v) s.set(k, v);
    if (key !== "year") s.set("sort", key);
    const q = s.toString();
    return q ? `/sources?${q}` : "/sources";
  };
  return (
    <>
      <PageTitle title="Sources">
        <p>
          {works.length} works selected for the{" "}
          {new Set(works.flatMap((w) => w.questions)).size} candidate questions.
          Selections approved by Ben Breen, 29 September 2026. Arguments are
          unverified. Quotations were chosen by machine and are unchecked.
        </p>
      </PageTitle>

      <div className="mb-8">
        <Facets facets={facets} params={params} base="/sources" />
      </div>

      <p className="num label mb-3">
        {shown.length === works.length
          ? `${works.length} works`
          : `${shown.length} of ${works.length} works`}
      </p>
      <div className={`${cols} border-b border-rule pb-2.5`}>
        <SortHead href={sortHref("year")} active={sort === "year"}>
          Year
        </SortHead>
        <SortHead
          href={sortHref("author")}
          active={sort === "author"}
          className="hidden sm:block"
        >
          Author
        </SortHead>
        <SortHead href={sortHref("title")} active={sort === "title"}>
          Title
        </SortHead>
        <SortHead
          href={sortHref("language")}
          active={sort === "language"}
          className="hidden lg:block"
        >
          Language
        </SortHead>
        <span className="label hidden lg:block">Form</span>
        <SortHead
          href={sortHref("questions")}
          active={sort === "questions"}
          className="hidden text-right sm:block"
        >
          Qs
        </SortHead>
        <span className="label hidden lg:block">Text</span>
        <span />
      </div>
      <ol>
        {shown.map((w) => (
          <SourceRow key={w.id} w={w} />
        ))}
      </ol>
    </>
  );
}

function SortHead({
  href,
  active,
  children,
  className = "",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`label whitespace-nowrap ${active ? "text-ink" : "hover:text-ink"} ${className}`}
    >
      {children}
      {active && <span aria-hidden> ↓</span>}
    </Link>
  );
}

function SourceRow({ w }: { w: Work }) {
  return (
    <li className="border-b border-line">
      <details className="group">
        <summary className={`${cols} ${summaryClass}`}>
          <span className="num font-mono text-[12px] whitespace-nowrap text-ink-soft">
            {formatYear(w.year)}
          </span>
          <span className="hidden truncate text-[15px] sm:block">
            {w.authorShort}
          </span>
          <span className="text-[15px] leading-snug">
            <span className="mr-2 sm:hidden">{w.authorShort},</span>
            <span className="font-serif text-[1.08rem] italic">{w.title}</span>
          </span>
          <span className="hidden text-[14px] text-ink-soft lg:block">
            {w.language}
          </span>
          <span className="hidden text-[14px] text-ink-soft lg:block">
            {kindLabel(w.kind)}
          </span>
          <span className="num hidden text-right font-mono text-[13px] sm:block">
            {w.questions.length}
          </span>
          <span className="hidden lg:block">
            <TextFlag w={w} />
          </span>
          <Chevron />
        </summary>
        <div className="grid gap-x-10 gap-y-4 pt-1 pb-6 sm:ml-[calc(5rem+1rem)] lg:grid-cols-[1fr_2fr]">
          <div className="space-y-1 text-[14px] text-ink-soft">
            <p className="text-ink">{w.author}</p>
            {w.originalTitle && w.originalTitle !== w.title && (
              <p className="font-serif text-[15px] italic">{w.originalTitle}</p>
            )}
            <p>
              {w.language} · {kindLabel(w.kind)}
            </p>
            <p>
              <TextFlag w={w} /> · {translationLabel[w.translation.kind]}
            </p>
            <Link
              href={`/sources/${w.id}`}
              className="inline-block pt-2 text-modern hover:underline hover:underline-offset-4"
            >
              Open source →
            </Link>
          </div>
          <ul>
            {stancesForWork(w.id).map((s) => {
              const q = getQuestion(s.question);
              return (
                <li
                  key={s.id}
                  className="border-t border-line py-2 first:border-t-0 first:pt-0"
                >
                  <Link
                    href={`/questions/${s.question.toLowerCase()}`}
                    className="text-[14.5px] leading-snug font-medium hover:underline hover:underline-offset-4"
                  >
                    <span className="num mr-2 font-mono text-[11.5px] font-normal text-ink-faint">
                      {s.question}
                    </span>
                    {q?.question}
                  </Link>
                  {isHeldBack(s) ? (
                    <div className="mt-0.5"><HeldBack /></div>
                  ) : (
                    <p className="mt-0.5 text-[14px] leading-snug text-ink-soft">
                      <span className="font-semibold text-ink">{s.sideLabel}.</span> {s.argument}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </details>
    </li>
  );
}
