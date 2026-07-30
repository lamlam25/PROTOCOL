import "server-only";
import { z } from "zod";

const responseSchema = z.object({
  status: z.enum(["likely_ai", "likely_real", "inconclusive"]),
  ai_probability: z.number().min(0).max(1),
  real_probability: z.number().min(0).max(1),
  model_id: z.string().min(1).max(300),
  review_required: z.boolean(),
});

export class AiCheckerUnavailableError extends Error {
  constructor() {
    super("AI image screening is temporarily unavailable");
    this.name = "AiCheckerUnavailableError";
  }
}

export async function checkImageWithPython(file: Blob, filename: string) {
  const serviceUrl =
    process.env.AI_CHECKER_URL ?? "http://127.0.0.1:8001";
  const sharedSecret =
    process.env.AI_CHECKER_SHARED_SECRET ??
    "protocol36-local-ai-checker";
  const formData = new FormData();
  formData.append("file", file, filename);

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "x-ai-checker-key": sharedSecret },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new AiCheckerUnavailableError();
    return responseSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof AiCheckerUnavailableError) throw error;
    throw new AiCheckerUnavailableError();
  }
}
