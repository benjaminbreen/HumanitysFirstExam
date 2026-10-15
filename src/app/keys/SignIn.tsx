import { coders, needsPasscode, type Coder } from "@/lib/coding";
import { signIn } from "./auth";

export function SignIn({ next, error }: { next: string; error?: boolean }) {
  return (
    <form action={signIn} className="max-w-sm space-y-4">
      <input type="hidden" name="next" value={next} />
      <fieldset className="flex gap-6 text-[15px]">
        <legend className="label mb-2">Reader</legend>
        {(Object.keys(coders) as Coder[]).map((c) => (
          <label key={c} className="inline-flex items-center gap-2">
            <input type="radio" name="coder" value={c} required /> {coders[c]}
          </label>
        ))}
      </fieldset>
      {needsPasscode && (
        <input
          name="passcode"
          type="password"
          placeholder="Passcode"
          className="w-full border border-line bg-bg px-3 py-2 font-mono text-[14px] outline-none focus:border-ink"
        />
      )}
      {error && <p className="font-mono text-[12px] text-period">Wrong reader or passcode.</p>}
      <button className="border border-rule px-4 py-2 font-mono text-[13px] hover:bg-surface">Sign in</button>
    </form>
  );
}
