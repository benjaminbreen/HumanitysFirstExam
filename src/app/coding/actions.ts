"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SIDES, checkPasscode, cookieValue, currentCoder, getItem, isCoder, saveEntry, type Side } from "@/lib/coding";

export async function signIn(formData: FormData) {
  const coder = formData.get("coder");
  if (!isCoder(coder) || !checkPasscode(coder, String(formData.get("passcode") ?? ""))) {
    redirect("/coding?error=1");
  }
  (await cookies()).set("coder", cookieValue(coder), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
  redirect("/coding");
}

export async function signOut() {
  (await cookies()).delete("coder");
  redirect("/coding");
}

async function target(formData: FormData) {
  const coder = await currentCoder();
  if (!coder) redirect("/coding");
  const item = String(formData.get("item") ?? "");
  if (!getItem(item)) throw new Error("Unknown item");
  return { coder, item };
}

export async function mark(formData: FormData) {
  const { coder, item } = await target(formData);
  const side = formData.get("side");
  if (!(SIDES as readonly unknown[]).includes(side)) throw new Error("Unknown side");
  await saveEntry(coder, item, { side: side as Side });
  refresh();
}

export async function saveNote(formData: FormData) {
  const { coder, item } = await target(formData);
  await saveEntry(coder, item, { note: String(formData.get("note") ?? "").trim() });
  refresh();
}
