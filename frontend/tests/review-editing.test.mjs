import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const apiSource = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");

function loadActions({ token = "access-token", updateReview, createReview } = {}) {
  const filename = fileURLToPath(new URL("../src/app/products/[id]/review-actions.ts", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const revalidated = [];
  const ApiRequestError = class extends Error {
    constructor(message, fieldErrors = {}) {
      super(message);
      this.fieldErrors = fieldErrors;
    }
  };
  const localModule = { exports: {} };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    FormData,
    Number,
    Object,
    Set,
    encodeURIComponent,
    require: (specifier) => {
      if (specifier === "next/cache") return { revalidatePath: (path) => revalidated.push(path) };
      if (specifier === "@/lib/auth-session") return { getActionAccessToken: async () => token };
      if (specifier === "@/lib/api") return {
        ApiRequestError,
        createProductReview: createReview ?? (async () => { throw new Error("unexpected create"); }),
        updateProductReview: updateReview ?? (async () => { throw new Error("unexpected update"); }),
      };
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
  }, { filename });
  return { actions: localModule.exports, revalidated };
}

function validForm() {
  const form = new FormData();
  form.set("content", "두 달 사용 후 보습감이 오래 유지됐어요.");
  form.set("skinType", "건성");
  form.set("usagePeriod", "TWO_WEEKS");
  form.set("repurchaseYn", "false");
  form.set("score_hydration", "5");
  return form;
}

test("review API exposes one shared payload and the authenticated update endpoint", () => {
  assert.match(apiSource, /export type ReviewInput\s*=\s*\{/);
  assert.match(apiSource, /createProductReview\([^)]*input:\s*ReviewInput/);
  assert.match(apiSource, /export function updateProductReview\([^)]*input:\s*ReviewInput/);
  assert.match(apiSource, /`\/products\/\$\{encodeURIComponent\(productId\)\}\/reviews\/me`/);
  assert.match(apiSource, /method:\s*"PUT"/);
  assert.match(apiSource, /Authorization:\s*`Bearer \$\{accessToken\}`/);
});

test("update action validates with the shared review rules and refreshes every affected journey", async () => {
  const calls = [];
  const { actions, revalidated } = loadActions({
    updateReview: async (token, productId, input) => {
      calls.push({ token, productId, input });
      return { authorId: "member/1" };
    },
  });
  const result = await actions.updateReviewAction(
    "toner-1",
    ["hydration"],
    { success: false, message: "" },
    validForm(),
  );

  assert.equal(result.success, true);
  assert.match(result.message, /수정/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].token, "access-token");
  assert.equal(calls[0].productId, "toner-1");
  assert.equal(JSON.stringify(calls[0].input), JSON.stringify({
    content: "두 달 사용 후 보습감이 오래 유지됐어요.",
    skinType: "건성",
    usagePeriod: "TWO_WEEKS",
    repurchaseYn: false,
    scores: [{ criteriaId: "hydration", score: 5 }],
  }));
  assert.deepEqual(Array.from(revalidated), ["/products/toner-1", "/my", "/reviewers/member%2F1"]);
});

test("invalid or expired update requests never reach the review API", async () => {
  let calls = 0;
  const invalidHarness = loadActions({ updateReview: async () => { calls += 1; } });
  const invalid = validForm();
  invalid.set("content", "짧음");
  invalid.set("score_hydration", "8");
  const invalidResult = await invalidHarness.actions.updateReviewAction(
    "toner-1",
    ["hydration"],
    { success: false, message: "" },
    invalid,
  );
  assert.equal(invalidResult.success, false);
  assert.match(invalidResult.fieldErrors.content, /10자 이상/);
  assert.match(invalidResult.fieldErrors.scores, /모든 평가 항목/);

  const expiredHarness = loadActions({ token: null, updateReview: async () => { calls += 1; } });
  const expiredResult = await expiredHarness.actions.updateReviewAction(
    "toner-1",
    ["hydration"],
    { success: false, message: "" },
    validForm(),
  );
  assert.equal(expiredResult.success, false);
  assert.match(expiredResult.message, /로그인/);
  assert.equal(calls, 0);
});
