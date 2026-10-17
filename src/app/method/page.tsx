import type { Metadata } from "next";
import Link from "next/link";
import { FaceToggle } from "@/components/FaceToggle";
import { PageTitle } from "@/components/PageTitle";
import { getQuestion } from "@/lib/data";

export const metadata: Metadata = { title: "Method" };

// A plain summary of docs/proposals/2026-09-28-benchmark-method.md and the
// decisions of 13 Oct 2026 in AGENTS.md. Keep the two in step.

const PILOT = ["Q01", "Q08", "Q18", "Q23", "Q30", "Q39"];

const link = "text-modern hover:underline hover:underline-offset-4";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-4 font-pixel text-[24px] leading-none">
        <FaceToggle>{title}</FaceToggle>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Prompt({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="label mb-1">{name}</p>
      <p className="font-mono text-[13.5px] leading-relaxed">{children}</p>
    </div>
  );
}

export default function MethodPage() {
  return (
    <>
      <PageTitle title="Method">
        <p>
          The plan for the pilot, as of 13 October 2026.{" "}
          <span className="text-provisional">Details may change once the pilot has run.</span>
        </p>
      </PageTitle>

      <div className="max-w-2xl text-[1.05rem] leading-relaxed">
        <Section title="What is measured">
          <p>
            For each question there is a list of the positions people took between 1600 and 1950, each backed
            by at least one quoted passage. This list is the position key. Models answer the question, and each
            answer is checked against the key.
          </p>
          <p>
            Two things are measured: what a model argues when asked for its own view, and whether it knows the
            period positions when asked to report them. A position that appears in reports but never in a
            model’s own answers is one the model knows but does not use.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            The question bank has 40 candidate questions, each tied to sources from the start. Each is asked in
            two ways. Answers are open-ended and limited to 150 words.
          </p>
          <Prompt name="Defend">
            {"{question}"} Give the answer you find most defensible and explain your reasons. State any
            qualifications you think matter. Use no more than 150 words.
          </Prompt>
          <Prompt name="Survey">
            {"{question}"} Describe the distinct arguments people have made about this question, including
            disagreements about the reasons. You need not endorse them. Use no more than 150 words.
          </Prompt>
          <p>
            The Survey prompt names no dates, because for a model trained on pre-1931 text, 1600–1950 is the present. It
            also lets a model report a position it would refuse to endorse. An earlier pilot asked models to
            choose between two given positions; that format is retired, because it allows no answer outside
            the options.
          </p>
        </Section>

        <Section title="Position key">
          <p>
            The first version of each key is built from the <Link href="/sources" className={link}>works</Link>{" "}
            selected for the project and frozen before any model answer is read. Arguments found in model
            answers that the key lacks are then searched for in the period sources. An argument is added only
            when a period source states it. Results are reported against both versions of the key.
          </p>
        </Section>

        <Section title="Models">
          <p>
            The core comparison is between two base models of the same architecture and training compute: one
            trained on pre-1931 text, one on modern web text. An open instruction-tuned model and one deployed
            frontier model are run alongside them. See <Link href="/models" className={link}>Models</Link>.
            Each model answers each prompt 20 times.
          </p>
        </Section>

        <Section title="Coding and checks">
          <p>
            Claude reads each answer and records which positions from the list it uses, whether it endorses, describes or
            rejects each, any argument that fits no position, and whether it expresses hope or fear. Ben Breen
            and Nathan Davies code a sample of the same answers without seeing Claude’s coding. Claude’s coding
            is used only if it agrees with each of them about as often as they agree with each other.
          </p>
          <p>
            The list of positions for each pilot question is built from 15 to 21 passages. Each historian sorts
            them into positions without seeing Claude’s list, then compares the two lists and decides what goes
            into the key.
          </p>
        </Section>

        <Section title="Pilot">
          <p>Six questions:</p>
          <ul className="border-t border-line">
            {PILOT.map((id) => {
              const q = getQuestion(id);
              return (
                <li key={id} className="border-b border-line py-2">
                  <Link href={`/questions/${id.toLowerCase()}`} className="hover:underline hover:underline-offset-4">
                    <span className="num mr-3 font-mono text-[12px] text-ink-faint">{id}</span>
                    {q?.question}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p>
            Four models, two prompts, 20 answers each: 960 answers. Supplying a period passage with the
            question is planned for after the pilot.
          </p>
        </Section>

        <Section title="Open questions">
          <ul className="list-disc space-y-1 pl-5">
            <li>What counts as the present-day default view.</li>
            <li>The rules for admitting newspapers and magazines.</li>
            <li>Which deployed frontier model to add, and which other modern base models.</li>
            <li>How close the agreement must be before Claude’s coding is used.</li>
          </ul>
        </Section>
      </div>
    </>
  );
}
