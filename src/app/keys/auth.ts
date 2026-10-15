"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPasscode, cookieValue, isCoder } from "@/lib/coding";

export async function signIn(formData: FormData) {
  const coder = formData.get("coder");
  const next = String(formData.get("next") ?? "");
  const back = next.startsWith("/keys") ? next : "/keys";
  if (!isCoder(coder) || !checkPasscode(coder, String(formData.get("passcode") ?? ""))) {
    redirect(`${back}?error=1`);
  }
  (await cookies()).set("coder", cookieValue(coder), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
  redirect(back);
}

export async function signOut() {
  (await cookies()).delete("coder");
  redirect("/keys");
}
