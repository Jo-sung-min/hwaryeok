import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);

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
  const config = compileConfig({ VERCEL: "1" });
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
  const config = compileConfig({ VERCEL: "1" });
  const headers = await config.headers();

  assert.deepEqual(Array.from(headers, ({ source, headers: values }) => ({
    source,
    cacheControl: values.find(({ key }) => key === "Cache-Control")?.value,
  })), [
    { source: "/api/v1/:path*", cacheControl: "private, no-store, max-age=0" },
    { source: "/oauth2/authorization/kakao", cacheControl: "private, no-store, max-age=0" },
    { source: "/login/oauth2/code/kakao", cacheControl: "private, no-store, max-age=0" },
  ]);
});

test("local development keeps proxy traffic on port 8081", async () => {
  const config = compileConfig({});
  const rewrites = await config.rewrites();

  assert.equal(rewrites[0].destination, "http://localhost:8081/api/v1/:path*");
});

test("a configured backend origin overrides the deployment default", async () => {
  const config = compileConfig({ VERCEL: "1", BACKEND_ORIGIN: "https://api.example.com///" });
  const rewrites = await config.rewrites();

  assert.equal(rewrites[0].destination, "https://api.example.com/api/v1/:path*");
});

test("Kakao OAuth starts through the current frontend origin", () => {
  const source = readFileSync(new URL("../src/app/api/auth/oauth/[provider]/route.ts", import.meta.url), "utf8");

  assert.match(source, /new URL\(`\/oauth2\/authorization\/\$\{provider\}`, requestUrl\.origin\)/);
  assert.doesNotMatch(source, /OAUTH_BACKEND_URL/);
});
