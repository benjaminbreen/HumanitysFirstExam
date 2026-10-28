import { timingSafeEqual } from "node:crypto";
import { importAgentRun } from "@/lib/keys";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.KEYS_IMPORT_TOKEN;
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || Buffer.byteLength(token) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Independent runs are ingested without rendering their contents to a historian.
  const text = await request.text();
  if (text.length > 700000) return Response.json({ error: "Run is too large" }, { status: 413 });
  try {
    await importAgentRun(JSON.parse(text));
    return Response.json({ recorded: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Invalid run" }, { status: 400 });
  }
}
