import { jsonOk } from "../../../src/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({ ok: true });
}
