import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = { title: "About" };

const link = "underline decoration-line underline-offset-4 hover:decoration-ink-soft";

export default function AboutPage() {
  return (
    <>
      <PageTitle title="About" />
      <div className="max-w-2xl space-y-5 text-[1.15rem] leading-relaxed">
        <p>
          AI systems now supply much of the vocabulary people use to think about humans and technology. That
          vocabulary comes mostly from twentieth-century science fiction about machines becoming agents.
        </p>
        <p>
          Between 1600 and 1950 the debate was wider. Many writers located the threat to human autonomy
          elsewhere: in people becoming machine-like through habit, industrial discipline, mechanism or
          dependence. Others argued that machines extend human powers, that mechanism explains life, or that
          invention carries out a divine purpose.
        </p>
        <p>
          This project collects those positions as a dataset of quoted passages from the period, and builds a
          benchmark that tests whether language models can still reach them. Some models are trained only on
          older text, so the benchmark also compares models by when their training text was written.
        </p>
        <p>
          The project is at the pilot stage. No passage has yet been verified by a historian; the{" "}
          <Link className={link} href="/">index</Link> shows the current state, and the{" "}
          <Link className={link} href="/method">method</Link> page describes the plan.
        </p>
        <p>
          Humanity’s First Exam is a project by{" "}
          <a className={link} href="https://benjaminpbreen.com">Benjamin Breen</a>{" "}
          (UC Santa Cruz) and{" "}
          <a className={link} href="https://www.linkedin.com/in/nathan-cl-davies">Nathan Davies</a>.
          It is funded by the Cosmos Institute’s grants on AI and human
          autonomy.
        </p>
        <p>
          The corpus and results will be released as an open dataset. Code and
          data are on{" "}
          <a className={link} href="https://github.com/benjaminbreen/HumanitysFirstExam">GitHub</a>.
        </p>
      </div>
    </>
  );
}
