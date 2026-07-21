import type { Metadata } from "next";
import {
  classificationSchema,
  codebook,
  data,
  responseDiagnostics,
} from "@/lib/data";
import { schemaTone } from "@/lib/schema-tone";
import type { SchemaOption } from "@/lib/types";

export const metadata: Metadata = {
  title: `Classification schema · ${data.meta.title}`,
  description:
    "The themes, claims, grounds, and source forms used to organize historical passages and model responses.",
};

function OptionList({ options }: { options: SchemaOption[] }) {
  return (
    <ul className="divide-y divide-line/70 border-y border-line/70">
      {options.map((option) => (
        <li
          key={option.id}
          id={option.id}
          data-schema-tone={schemaTone(option.id)}
          className="schema-tint scroll-mt-8 grid gap-x-6 gap-y-1 px-2 py-3 transition-colors duration-200 target:bg-paper-deep/70 md:grid-cols-[13rem_1fr]"
        >
          <span className="font-mono text-sm text-ink">{option.label}</span>
          <span className="text-sm leading-relaxed text-ink-soft">
            {option.definition}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function CodebookPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="max-w-3xl border-b border-line pb-7">
        <p className="font-mono text-[10px] uppercase tracking-wider text-period">
          Version {classificationSchema.version}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Classification schema
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          Each passage is described from several angles. This lets the same
          source appear in more than one historical pathway without forcing it
          into a single box.
        </p>
      </header>

      <nav className="grid border-b border-line py-6 font-mono text-xs sm:grid-cols-5" aria-label="Schema facets">
        {[
          ["01", "Theme", "#themes"],
          ["02", "Claim", "#claims"],
          ["03", "Relation", "#relations"],
          ["04", "Grounds", "#grounds"],
          ["05", "Form", "#form"],
        ].map(([number, label, href]) => (
          <a key={href} href={href} className="flex gap-2 py-1 text-ink-soft hover:text-ink">
            <span className="text-period">{number}</span>
            {label}
          </a>
        ))}
      </nav>

      <section id="themes" className="scroll-mt-8 py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          1. Theme
        </h2>
        <p className="mt-2 text-sm text-ink-soft">What is the passage about?</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {classificationSchema.themes.map((theme) => (
            <section key={theme.id} id={theme.id} className="scroll-mt-8 border border-line p-5">
              <h3 className="font-display text-xl font-semibold">{theme.label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {theme.definition}
              </p>
              <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
                {theme.children.map((child) => (
                  <li
                    key={child.id}
                    id={child.id}
                    data-schema-tone={schemaTone(child.id)}
                    className="schema-tint scroll-mt-8 px-2 py-3 transition-colors duration-200 target:bg-paper-deep/70"
                  >
                    <p className="font-mono text-xs text-ink">{child.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {child.definition}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section id="claims" className="scroll-mt-8 border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          2. Claim
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          What does the passage say? A passage may make several claims.
        </p>
        <div className="mt-7 space-y-9">
          {codebook.map((branch) => (
            <section key={branch.id} id={branch.id} className="scroll-mt-8">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {branch.label}
              </h3>
              <p className="mt-1 text-sm italic text-ink-soft">{branch.question}</p>
              <div className="mt-4">
                <OptionList options={branch.leaves} />
              </div>
            </section>
          ))}
        </div>
      </section>

      <section id="relations" className="scroll-mt-8 border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          3. Relation to the claim
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Mentioning a claim is not the same as endorsing it. Every claim tag
          therefore records the passage&apos;s relation to that claim.
        </p>
        <div className="mt-5">
          <OptionList options={classificationSchema.relations} />
        </div>
      </section>

      <section id="grounds" className="scroll-mt-8 border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          4. Grounds and effect on autonomy
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Why does the author think this, and what effect do they believe it has
          on meaningful human choice?
        </p>
        <div className="mt-7 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-xl font-semibold">Grounds</h3>
            <div className="mt-4">
              <OptionList options={classificationSchema.grounds} />
            </div>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">Effect on autonomy</h3>
            <div className="mt-4">
              <OptionList options={classificationSchema.autonomyEffects} />
            </div>
          </div>
        </div>
      </section>

      <section id="form" className="scroll-mt-8 border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          5. Form and context
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Genre and form describe how the argument is made. Date, language,
          place, and author remain ordinary source metadata.
        </p>
        <div className="mt-7 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-xl font-semibold">Genre</h3>
            <div className="mt-4"><OptionList options={classificationSchema.genres} /></div>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">Mode</h3>
            <div className="mt-4"><OptionList options={classificationSchema.modes} /></div>
          </div>
        </div>
      </section>

      <section id="connections" className="scroll-mt-8 border-t border-line py-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Connections across time
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          These links connect particular passages. “Influenced by” is used only
          when documentary evidence establishes a path of influence.
        </p>
        <div className="mt-5"><OptionList options={classificationSchema.linkTypes} /></div>
      </section>

      <section id="diagnostics" className="scroll-mt-8 border-t border-line py-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Model-response diagnostics
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          These labels describe failures or refusals in model output. They are
          not part of the historical taxonomy.
        </p>
        <div className="mt-5 space-y-6">
          {responseDiagnostics.map((branch) => (
            <OptionList key={branch.id} options={branch.leaves} />
          ))}
        </div>
      </section>
    </main>
  );
}
