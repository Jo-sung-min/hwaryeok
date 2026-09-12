import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/compiled/babel/core");

function loadHeaderAuth(session) {
  const sourceUrl = new URL("../src/components/header-auth.tsx", import.meta.url);
  const { code } = transformSync(readFileSync(sourceUrl, "utf8"), {
    filename: sourceUrl.pathname,
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
      if (name === "next/link") return ({ children, ...props }) => React.createElement("a", props, children);
      if (name === "@/lib/auth-session") return { getCurrentSession: async () => session };
      if (name === "./navigation.module.css") return {
        authLink: "authLink",
        kakaoAuthLink: "kakaoAuthLink",
        kakaoBadge: "kakaoBadge",
        kakaoLabel: "kakaoLabel",
      };
      if (["react", "react/jsx-runtime", "lucide-react"].includes(name)) return require(name);
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return module.exports.HeaderAuth;
}

test("Kakao users see a branded Kakao ingredient-finder link instead of a truncated nickname", async () => {
  const HeaderAuth = loadHeaderAuth({
    id: "kakao-user",
    email: null,
    nickname: "카카오 사용자 123456",
    role: "USER",
    authMethod: "kakao",
  });
  const html = renderToStaticMarkup(await HeaderAuth());

  assert.match(html, /href="\/skin-check"/);
  assert.match(html, /aria-label="카카오 계정 나의 성분찾기"/);
  assert.match(html, /class="kakaoBadge"[^>]*><svg/);
  assert.match(html, /class="kakaoLabel">카카오<\/span>/);
  assert.doesNotMatch(html, /카카오 사용자 123456|\.\.\.|…/);
});

test("site email users keep their nickname in the ingredient-finder link", async () => {
  const HeaderAuth = loadHeaderAuth({
    id: "local-user",
    email: "local@example.invalid",
    nickname: "화력 사용자",
    role: "USER",
    authMethod: "local",
  });
  const html = renderToStaticMarkup(await HeaderAuth());

  assert.match(html, /href="\/skin-check"/);
  assert.match(html, /화력 사용자/);
  assert.doesNotMatch(html, /kakaoBadge|카카오 계정 나의 성분찾기/);
});

test("administrators keep the management link even when they signed in with Kakao", async () => {
  const HeaderAuth = loadHeaderAuth({
    id: "admin-user",
    email: "admin@example.invalid",
    nickname: "카카오 관리자",
    role: "ADMIN",
    authMethod: "kakao",
  });
  const html = renderToStaticMarkup(await HeaderAuth());

  assert.match(html, /href="\/admin"/);
  assert.match(html, />관리<\/span>/);
  assert.doesNotMatch(html, /kakaoBadge|카카오 계정 나의 성분찾기/);
});

test("guests keep the login link", async () => {
  const HeaderAuth = loadHeaderAuth(null);
  const html = renderToStaticMarkup(await HeaderAuth());

  assert.match(html, /href="\/login"/);
  assert.match(html, /로그인/);
  assert.doesNotMatch(html, /kakaoBadge|카카오 계정 나의 성분찾기/);
});
