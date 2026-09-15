import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const VERCEL_ENV = {
  VERCEL: "1",
  NEXT_PUBLIC_API_URL: "/api/v1",
  NEXT_PUBLIC_SITE_URL: "https://hwaryeok.example",
};

function compileConfig(env) {
  const filename = fileURLToPath(new URL("../next.config.ts", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    process: { env },
    URL,
    require: (specifier) => {
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
  }, { filename });
  return localModule.exports.default;
}

test("Vercel proxies API and Kakao OAuth paths to Elastic Beanstalk", async () => {
  const config = compileConfig({
    ...VERCEL_ENV,
    BACKEND_ORIGIN: "http://hwaryeok-prd.ap-northeast-2.elasticbeanstalk.com",
  });
  const rewrites = await config.rewrites();

  assert.deepEqual(Array.from(rewrites, (rewrite) => ({ ...rewrite })), [
    {
      source: "/api/v1/:path*",
      destination: "http://hwaryeok-prd.ap-northeast-2.elasticbeanstalk.com/api/v1/:path*",
    },
    {
      source: "/oauth2/authorization/kakao",
      destination: "http://hwaryeok-prd.ap-northeast-2.elasticbeanstalk.com/oauth2/authorization/kakao",
    },
    {
      source: "/login/oauth2/code/kakao",
      destination: "http://hwaryeok-prd.ap-northeast-2.elasticbeanstalk.com/login/oauth2/code/kakao",
    },
  ]);
  assert.equal(rewrites.some(({ source }) => source === "/api/:path*"), false);
});

test("proxied API and OAuth responses are not cached", async () => {
  const config = compileConfig({
    ...VERCEL_ENV,
    BACKEND_ORIGIN: "http://hwaryeok-prd.ap-northeast-2.elasticbeanstalk.com",
  });
  const headers = await config.headers();

  assert.deepEqual(Array.from(headers, ({ source, headers: values }) => ({
    source,
    cacheControl: values.find(({ key }) => key === "Cache-Control")?.value,
    rewriteCaching: values.find(({ key }) => key === "x-vercel-enable-rewrite-caching")?.value,
  })), [
    { source: "/api/v1/:path*", cacheControl: "private, no-store, max-age=0", rewriteCaching: "0" },
    { source: "/oauth2/authorization/kakao", cacheControl: "private, no-store, max-age=0", rewriteCaching: "0" },
    { source: "/login/oauth2/code/kakao", cacheControl: "private, no-store, max-age=0", rewriteCaching: "0" },
  ]);
});

test("local development keeps proxy traffic on port 8081", async () => {
  const config = compileConfig({});
  const rewrites = await config.rewrites();

  assert.equal(rewrites[0].destination, "http://localhost:8081/api/v1/:path*");
});

test("a configured backend origin is normalized before proxying", async () => {
  const config = compileConfig({ ...VERCEL_ENV, BACKEND_ORIGIN: "https://api.example.com///" });
  const rewrites = await config.rewrites();

  assert.equal(rewrites[0].destination, "https://api.example.com/api/v1/:path*");
});

test("API_URL can supply the proxy origin for an existing Vercel setup", async () => {
  const config = compileConfig({ ...VERCEL_ENV, API_URL: "https://api.example.com/api/v1" });
  const rewrites = await config.rewrites();

  assert.equal(rewrites[0].destination, "https://api.example.com/api/v1/:path*");
});

test("Vercel builds reject split API and OAuth origins", () => {
  assert.throws(
    () => compileConfig({
      ...VERCEL_ENV,
      BACKEND_ORIGIN: "https://oauth-api.example.com",
      API_URL: "https://data-api.example.com/api/v1",
    }),
    /BACKEND_ORIGIN and API_URL must use the same origin/,
  );
});

test("Vercel builds reject an API_URL outside the canonical API prefix", () => {
  assert.throws(
    () => compileConfig({ ...VERCEL_ENV, API_URL: "https://api.example.com/internal" }),
    /API_URL must end with \/api\/v1/,
  );
});

test("Vercel builds fail clearly instead of proxying previews to an implicit backend", () => {
  assert.throws(
    () => compileConfig(VERCEL_ENV),
    /Set BACKEND_ORIGIN or API_URL for this Vercel environment/,
  );
});

test("Vercel requires one canonical HTTPS site origin for OAuth cookies", () => {
  assert.throws(
    () => compileConfig({ ...VERCEL_ENV, BACKEND_ORIGIN: "https://api.example.com", NEXT_PUBLIC_SITE_URL: "" }),
    /Set NEXT_PUBLIC_SITE_URL/,
  );
  assert.throws(
    () => compileConfig({
      ...VERCEL_ENV,
      BACKEND_ORIGIN: "https://api.example.com",
      NEXT_PUBLIC_SITE_URL: "http://hwaryeok.example",
    }),
    /canonical HTTPS origin/,
  );
});

test("Vercel rejects a public API URL that bypasses the same-origin proxy", () => {
  assert.throws(
    () => compileConfig({
      ...VERCEL_ENV,
      BACKEND_ORIGIN: "http://api.example.com",
      NEXT_PUBLIC_API_URL: "http://api.example.com/api/v1",
    }),
    /NEXT_PUBLIC_API_URL must be \/api\/v1 on Vercel/,
  );
});

test("Kakao OAuth starts through the canonical same-origin proxy", () => {
  const source = readFileSync(new URL("../src/app/api/auth/oauth/[provider]/route.ts", import.meta.url), "utf8");

  assert.match(source, /resolvePublicSiteOrigin\(requestUrl\.origin\)/);
  assert.match(source, /requestUrl\.origin !== siteOrigin/);
  assert.match(source, /NextResponse\.redirect\(canonicalStartUrl\)/);
  assert.match(source, /new URL\(`\/oauth2\/authorization\/\$\{provider\}`, siteOrigin\)/);
  assert.doesNotMatch(source, /OAUTH_BACKEND_URL/);
});
