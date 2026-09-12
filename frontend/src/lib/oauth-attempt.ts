import { createHash, randomBytes } from "node:crypto";

const OAUTH_ATTEMPT_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isOAuthAttemptVerifier(value: string | null | undefined): value is string {
  return typeof value === "string" && OAUTH_ATTEMPT_PATTERN.test(value);
}

export function createOAuthAttempt() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier, "ascii").digest("base64url");
  return { verifier, challenge };
}
