import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIpfsAdapter } from "@/lib/storage/ipfs";

/**
 * Server-only upload proxy — keeps the real Pinata JWT (Phase 9) off the
 * client. Requires an authenticated caller; false-case evidence submission
 * is the only flow using this today.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (15MB max)" }, { status: 413 });
  }

  const adapter = getIpfsAdapter();
  const result = await adapter.upload(file, {
    filename: file instanceof File ? file.name : undefined,
  });

  return NextResponse.json(result);
}
