import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 1000;

async function listAllAuthUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < PAGE_SIZE) break;
  }
  return users;
}

async function listCitizenProfiles() {
  const admin = createAdminClient();
  const profiles: {
    id: string;
    full_name: string | null;
    created_at: string;
  }[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, created_at")
      .eq("role", "citizen")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    profiles.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return profiles;
}

async function listSubmissionOwners() {
  const admin = createAdminClient();
  const ownerIds: (string | null)[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from("false_case_evidence")
      .select("submitted_by")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    ownerIds.push(...data.map((row) => row.submitted_by));
    if (data.length < PAGE_SIZE) break;
  }
  return ownerIds;
}

export async function getCitizenAuthOverview() {
  const [authUsers, profiles, submissionOwners] = await Promise.all([
    listAllAuthUsers(),
    listCitizenProfiles(),
    listSubmissionOwners(),
  ]);
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const evidenceCounts = new Map<string, number>();
  for (const ownerId of submissionOwners) {
    if (!ownerId) continue;
    evidenceCounts.set(ownerId, (evidenceCounts.get(ownerId) ?? 0) + 1);
  }

  const users = profiles
    .map((profile) => {
      const authUser = authById.get(profile.id);
      return {
        id: profile.id,
        email: authUser?.email ?? null,
        fullName: profile.full_name,
        joinedAt: profile.created_at,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        evidenceCount: evidenceCounts.get(profile.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastSignInAt ? new Date(a.lastSignInAt).valueOf() : 0;
      const bTime = b.lastSignInAt ? new Date(b.lastSignInAt).valueOf() : 0;
      return bTime - aTime;
    });

  const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
  return {
    users,
    registeredCount: users.length,
    signedInCount: users.filter((user) => user.lastSignInAt).length,
    recentSignInCount: users.filter(
      (user) =>
        user.lastSignInAt &&
        new Date(user.lastSignInAt).valueOf() >= last24Hours
    ).length,
  };
}
