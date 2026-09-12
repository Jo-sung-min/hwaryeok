import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);

function compile(relativePath, env = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
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
  return localModule.exports;
}

test("product object paths resolve against the normalized CDN base", () => {
  const { resolveProductImageUrl } = compile("../src/lib/media.ts", {
    NEXT_PUBLIC_API_URL: "http://localhost:8081/api/v1",
    S3_PUBLIC_BASE_URL: "  https://cdn.hwaryeok.co.kr/hwaryeok///  ",
  });

  assert.equal(
    resolveProductImageUrl("/products/serum/main.webp"),
    "https://cdn.hwaryeok.co.kr/hwaryeok/products/serum/main.webp",
  );
  assert.equal(resolveProductImageUrl("/products/%2e%2e/private.webp"), null);
});

test("absolute, API-relative, local, and legacy image URLs keep their prior behavior", () => {
  const { resolveProductImageUrl } = compile("../src/lib/media.ts", {
    NEXT_PUBLIC_API_URL: "http://localhost:8081/api/v1",
    S3_PUBLIC_BASE_URL: "https://cdn.hwaryeok.co.kr",
  });

  assert.equal(resolveProductImageUrl("https://images.example.com/item.webp"), "https://images.example.com/item.webp");
  assert.equal(resolveProductImageUrl("/api/v1/media/products/toner"), "http://localhost:8081/api/v1/media/products/toner");
  assert.equal(resolveProductImageUrl("/hero-watercolor.png"), "/hero-watercolor.png");
  assert.equal(resolveProductImageUrl("legacy.webp"), "http://localhost:8081/legacy.webp");
  assert.equal(resolveProductImageUrl(null), null);
});

test("product object paths remain local when no CDN base is configured", () => {
  const { resolveProductImageUrl } = compile("../src/lib/media.ts", {
    NEXT_PUBLIC_API_URL: "http://localhost:8081/api/v1",
  });

  assert.equal(resolveProductImageUrl("/products/serum/main.webp"), "/products/serum/main.webp");
});

test("Next image config retains API media and adds the normalized CDN path", () => {
  const { default: config } = compile("../next.config.ts", {
    NEXT_PUBLIC_API_URL: "http://localhost:8081/api/v1",
    S3_PUBLIC_BASE_URL: "https://cdn.hwaryeok.co.kr/hwaryeok/",
  });

  assert.equal(config.env.S3_PUBLIC_BASE_URL, "https://cdn.hwaryeok.co.kr/hwaryeok");
  assert.deepEqual(
    Array.from(config.images.remotePatterns, (pattern) => pattern.toString()),
    [
      "http://localhost:8081/api/v1/media/products/**",
      "https://cdn.hwaryeok.co.kr/hwaryeok/products/**",
    ],
  );
});
