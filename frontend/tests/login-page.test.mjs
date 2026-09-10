import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");

function compile(path, mocks) {
  const filename = new URL(path, import.meta.url).pathname;
  const { code } = transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      require("next/dist/compiled/babel/preset-typescript").default,
      [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }],
    ],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name in mocks) return mocks[name];
      if (["react", "react/jsx-runtime", "lucide-react"].includes(name)) return require(name);
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return module.exports;
}

const Link = ({ children, ...props }) => React.createElement("a", props, children);
const providers = [
  { id: "google", name: "구글", configured: true, authorizationPath: "/oauth2/authorization/google" },
  { id: "kakao", name: "카카오", configured: true, authorizationPath: "/oauth2/authorization/kakao" },
  { id: "naver", name: "네이버", configured: true, authorizationPath: "/oauth2/authorization/naver" },
];

test("login exposes exactly Kakao OAuth and site email as the two login paths", async () => {
  const { SocialLoginButtons } = compile("../src/components/social-login-buttons.tsx", {
    "next/link": Link,
  });
  const { default: LoginPage } = compile("../src/app/login/page.tsx", {
    "next/link": Link,
    "@/components/social-login-buttons": { SocialLoginButtons },
    "@/lib/api": { getOAuthProviders: async () => providers },
    "@/lib/auth-session": { sanitizeReturnTo: (value) => value || "/" },
    "./login-form": {
      LoginForm: ({ returnTo }) => React.createElement("form", { "data-email-login": true },
        React.createElement("input", { type: "hidden", name: "returnTo", value: returnTo }),
        React.createElement("button", { type: "submit" }, "이메일로 로그인")),
    },
  });

  const tree = await LoginPage({ searchParams: Promise.resolve({ returnTo: "/my" }) });
  const html = renderToStaticMarkup(tree);

  assert.match(html, /카카오 또는 사이트 이메일/);
  assert.match(html, /카카오 로그인/);
  assert.match(html, /사이트 이메일 로그인/);
  assert.match(html, /href="\/api\/auth\/oauth\/kakao\?returnTo=%2Fmy"/);
  assert.match(html, /카카오로 시작/);
  assert.match(html, /data-email-login="true"/);
  assert.doesNotMatch(html, /oauth\/google|Google로 시작/);
  assert.doesNotMatch(html, /oauth\/naver|네이버로 시작/);
});

test("shared OAuth UI keeps signup and login limited to Kakao", () => {
  const { SocialLoginButtons } = compile("../src/components/social-login-buttons.tsx", {
    "next/link": Link,
  });
  const html = renderToStaticMarkup(React.createElement(SocialLoginButtons, { providers }));

  assert.match(html, /oauth\/kakao|카카오로 시작/);
  assert.doesNotMatch(html, /oauth\/google|Google로 시작/);
  assert.doesNotMatch(html, /oauth\/naver|네이버로 시작/);
});
