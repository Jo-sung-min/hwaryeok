import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");
const typescript = require("next/dist/compiled/babel/preset-typescript").default;
const commonjs = require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default;

class ApiRequestError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

function loadActions({ getToken = async () => "access-token", change = async () => tokens, setCookies = async () => {} } = {}) {
  const filename = fileURLToPath(new URL("../src/app/my/account-actions.ts", import.meta.url));
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [typescript],
    plugins: [commonjs],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    FormData,
    require: (specifier) => {
      if (specifier === "@/lib/api") return { ApiRequestError, changePassword: change };
      if (specifier === "@/lib/auth-session") return { getActionAccessToken: getToken, setAuthCookies: setCookies };
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
  });
  return module.exports;
}

const tokens = {
  accessToken: "new-access",
  refreshToken: "new-refresh",
  tokenType: "Bearer",
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 1209600,
  user: {
    id: "qa-user",
    email: "qa@example.invalid",
    nickname: "가상 피부기록",
    role: "USER",
    authMethod: "password",
    passwordChangeAvailable: true,
  },
};
const initialState = { success: false, message: "", fieldErrors: {}, resetKey: 0 };

function passwordForm(currentPassword = "Flower!123", newPassword = "Fresh!456", newPasswordConfirm = newPassword) {
  const form = new FormData();
  form.set("currentPassword", currentPassword);
  form.set("newPassword", newPassword);
  form.set("newPasswordConfirm", newPasswordConfirm);
  return form;
}

test("password action validates before authentication and never returns password values", async () => {
  let authCalls = 0;
  let apiCalls = 0;
  const { changePasswordAction } = loadActions({
    getToken: async () => { authCalls++; return "access-token"; },
    change: async () => { apiCalls++; return tokens; },
  });

  const result = await changePasswordAction(initialState, passwordForm("", "short", "different"));
  assert.equal(result.success, false);
  assert.match(result.fieldErrors.currentPassword, /현재 비밀번호/);
  assert.match(result.fieldErrors.newPassword, /8~64자/);
  assert.match(result.fieldErrors.newPasswordConfirm, /일치하지 않/);
  assert.equal(authCalls, 0);
  assert.equal(apiCalls, 0);
  assert.doesNotMatch(JSON.stringify(result), /short|different|currentPasswordValue|newPasswordValue/);
});

test("password action sends the authenticated request and stores rotated tokens", async () => {
  const calls = [];
  const cookies = [];
  const { changePasswordAction } = loadActions({
    change: async (accessToken, input) => { calls.push({ accessToken, input }); return tokens; },
    setCookies: async (value) => { cookies.push(value); },
  });

  const result = await changePasswordAction(initialState, passwordForm());
  assert.equal(result.success, true);
  assert.equal(result.resetKey, 1);
  assert.equal(result.message, "비밀번호를 변경했어요.");
  assert.equal(JSON.stringify(calls), JSON.stringify([{
    accessToken: "access-token",
    input: { currentPassword: "Flower!123", newPassword: "Fresh!456", newPasswordConfirm: "Fresh!456" },
  }]));
  assert.equal(JSON.stringify(cookies), JSON.stringify([tokens]));
  assert.doesNotMatch(JSON.stringify(result), /Flower|Fresh/);
});

test("password action handles an expired session and API field errors", async () => {
  const expired = loadActions({ getToken: async () => null });
  const expiredResult = await expired.changePasswordAction(initialState, passwordForm());
  assert.equal(expiredResult.success, false);
  assert.match(expiredResult.message, /로그인이 만료/);

  const rejected = loadActions({
    change: async () => { throw new ApiRequestError("현재 비밀번호가 맞지 않아요.", { currentPassword: "현재 비밀번호를 확인해 주세요." }); },
  });
  const rejectedResult = await rejected.changePasswordAction(initialState, passwordForm());
  assert.equal(rejectedResult.success, false);
  assert.match(rejectedResult.message, /맞지 않아요/);
  assert.match(rejectedResult.fieldErrors.currentPassword, /확인해 주세요/);
});

test("password UI uses password-manager metadata and accessible feedback without preserving secrets", () => {
  const form = readFileSync(new URL("../src/app/my/password-change-form.tsx", import.meta.url), "utf8");
  const action = readFileSync(new URL("../src/app/my/account-actions.ts", import.meta.url), "utf8");
  const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");

  assert.match(form, /name="currentPassword"[\s\S]*autoComplete="current-password"/);
  assert.match(form, /name="newPassword"[\s\S]*autoComplete="new-password"/);
  assert.match(form, /name="newPasswordConfirm"[\s\S]*autoComplete="new-password"/);
  assert.match(form, /aria-invalid=\{Boolean\(error\)\}/);
  assert.match(form, /aria-describedby=\{error \? errorId : undefined\}/);
  assert.match(form, /aria-live="polite"/);
  assert.match(form, /disabled=\{pending\}/);
  assert.doesNotMatch(action, /values\s*:/);
  assert.match(api, /requestJson<AuthTokenResult>\("\/users\/me\/password", \{[\s\S]*method: "PUT"[\s\S]*Authorization: `Bearer \$\{accessToken\}`/);
});
