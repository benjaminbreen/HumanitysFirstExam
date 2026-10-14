import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { QuestionList } from "@/components/QuestionList";
import { Status } from "@/components/Status";
import { ThemeCards, ThemeControls, type View } from "@/components/ThemeIndex";
import { isThemeSort, themeSorts, themes } from "@/lib/data";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const view: View = params.view === "cards" ? "cards" : "list";
  const sort = view === "cards" && isThemeSort(params.sort) ? params.sort : "order";
  const sorted = [...themes].sort(themeSorts[sort].compare);

  return (
    <>
      <div className="mb-10 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start [&>header]:mb-0">
        <PageTitle title="Themes">
          <p>
            Positions on machines and human autonomy from 1600–1950.{" "}
            <Link href="/about" className="text-modern hover:underline hover:underline-offset-4">
              Why this project →
            </Link>
          </p>
          <p className="mt-4 text-[1rem] text-ink">
            When you ask a language model questions about human autonomy, how
            many of the positions that actual humans have historically taken do
            its answers cover? In part because of the incentivization of the
            &ldquo;helpful chatbot&rdquo; persona (and due to the pervasive
            influence of late 20th and early 21st century patterns of thought in
            training data) language models tend to be significantly more
            &ldquo;epistemologically narrow&rdquo; than the human historical
            record. This site collects the perspectives of humans who lived
            between the years 1600 and 1950 on a set of questions relating to
            humans and machines, then uses them to test contemporary language
            models.
          </p>
          <p className="mt-3 text-[13px]">
            This is a prototype created by{" "}
            <a href="https://benjaminpbreen.com" className="underline underline-offset-4">
              Benjamin Breen
            </a>{" "}
            and{" "}
            <a href="https://www.linkedin.com/in/nathan-cl-davies" className="underline underline-offset-4">
              Nathan Davies
            </a>
            . It was funded by a 2026{" "}
            <a
              href="https://blog.cosmos-institute.org/p/announcing-80-new-cosmos-grantees"
              className="underline underline-offset-4"
            >
              Cosmos Institute grant
            </a>{" "}
            for AI research.
          </p>
        </PageTitle>
        <Status />
      </div>

      <div className="mb-6">
        <ThemeControls view={view} sort={sort} />
      </div>

      {view === "list" ? (
        <QuestionList themes={sorted} />
      ) : (
        <ThemeCards themes={sorted} />
      )}
    </>
  );
}
