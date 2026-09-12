import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { createOAuthAttempt, isOAuthAttemptVerifier } from "../src/lib/oauth-attempt.ts";

test("OAuth handoff attempts use a fresh 256-bit verifier and SHA-256 challenge", () => {
  const first = createOAuthAttempt();
  const second = createOAuthAttempt();

  assert.match(first.verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.match(first.challenge, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first.verifier, second.verifier);
  assert.equal(
    first.challenge,
    createHash("sha256").update(first.verifier, "ascii").digest("base64url"),
  );
  assert.equal(isOAuthAttemptVerifier(first.verifier), true);
  assert.equal(isOAuthAttemptVerifier(`${first.verifier}=`), false);
});

test("OAuth start and callback bind the exchange to the HttpOnly attempt cookie", () => {
  const startSource = readFileSync(new URL("../src/app/api/auth/oauth/[provider]/route.ts", import.meta.url), "utf8");
  const callbackSource = readFileSync(new URL("../src/app/api/auth/oauth/callback/route.ts", import.meta.url), "utf8");
  const sessionSource = readFileSync(new URL("../src/lib/auth-session.ts", import.meta.url), "utf8");

  assert.match(startSource, /attempt_challenge/);
  assert.match(startSource, /beginOAuthAttempt/);
  assert.match(callbackSource, /takeOAuthAttempt/);
  assert.match(callbackSource, /exchangeOAuthCode\(code, verifier\)/);
  assert.match(sessionSource, /httpOnly:\s*true/);
  assert.match(sessionSource, /hwaryeok_oauth_attempt/);
});
