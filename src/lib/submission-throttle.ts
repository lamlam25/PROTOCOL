import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null
  );
}

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export async function enforceSubmissionThrottle(
  request: Request,
  route: string,
  limit: number
) {
  const ip = getClientIp(request) ?? "unknown";
  const ipHash = sha256Hex(ip);
  const day = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("submission_throttle")
    .select("id, count")
    .eq("ip_hash", ipHash)
    .eq("route", route)
    .eq("day", day)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if ((data?.count ?? 0) >= limit) {
    return false;
  }

  if (data) {
    const { error: updateError } = await admin
      .from("submission_throttle")
      .update({ count: data.count + 1 })
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await admin.from("submission_throttle").insert({
      ip_hash: ipHash,
      route,
      day,
      count: 1,
    });
    if (insertError) throw new Error(insertError.message);
  }

  return true;
}
