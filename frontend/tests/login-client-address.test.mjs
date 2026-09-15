import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("email login forwards Vercel's client address only with the server-side shared secret", () => {
  const actionSource = readFileSync(new URL("../src/app/login/actions.ts", import.meta.url), "utf8");
  const apiSource = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");

  assert.match(actionSource, /headers\(\)/);
  assert.match(actionSource, /x-vercel-forwarded-for/);
  assert.match(actionSource, /normalizeClientAddress/);
  assert.match(apiSource, /process\.env\.BFF_PROXY_SECRET/);
  assert.match(apiSource, /"X-Hwaryeok-Proxy-Secret"/);
  assert.match(apiSource, /"X-Hwaryeok-Client-Address"/);
  assert.match(apiSource, /proxySecret && clientAddress/);
});
