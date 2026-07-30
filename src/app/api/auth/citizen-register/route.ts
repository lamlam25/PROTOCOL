import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSubmissionThrottle } from "@/lib/submission-throttle";

const ROUTE_NAME = "auth.citizen-register";
const DAILY_LIMIT = 5;

const registrationSchema = z.object({
  email: z.email().max(254),
  password: z
    .string()
    .min(10)
    .max(72)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const allowed = await enforceSubmissionThrottle(
    request,
    ROUTE_NAME,
    DAILY_LIMIT
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Registration limit reached" },
      { status: 429 }
    );
  }

  const parsed = registrationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Password does not meet the requirements" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: "citizen" },
  });

  if (error) {
    const alreadyExists =
      error.code === "email_exists" ||
      error.message.toLowerCase().includes("already");
    return NextResponse.json(
      { error: alreadyExists ? "Account already exists" : "Registration failed" },
      { status: alreadyExists ? 409 : 400 }
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, role: "citizen" }, { onConflict: "id" });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
