import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const componentSource = read("../src/components/ranking-tabs.tsx");
const componentCss = read("../src/components/ranking-tabs.module.css");
const globalCss = read("../src/app/globals.css");

const expectedTabs = [
  { key: "personal", href: "/ranking/personal", label: "내 피부 랭킹" },
  { key: "products", href: "/ranking", label: "성분별 랭킹" },
  { key: "rising", href: "/ranking/rising", label: "급상승 랭킹" },
  { key: "reviewers", href: "/reviewers", label: "리뷰어 랭킹" },
];

function loadRankingTabs(pathname, pendingByIndex = [], capturedLinks = []) {
  const filename = fileURLToPath(new URL("../src/components/ranking-tabs.tsx", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      require("next/dist/compiled/babel/preset-typescript").default,
      [require("next/dist/compiled/babel/preset-react").default, { runtime: "automatic" }],
    ],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });

  let pendingCall = 0;
  const Link = React.forwardRef(function TestLink({ children, ...props }, ref) {
    capturedLinks.push(props);
    return React.createElement("a", { ...props, ref }, children);
  });
  const localModule = { exports: {} };
  vm.runInNewContext(code, {
    module: localModule,
    exports: localModule.exports,
    require: (specifier) => {
      if (specifier === "react" || specifier === "react/jsx-runtime") return require(specifier);
      if (specifier === "next/link") return {
        __esModule: true,
        default: Link,
        useLinkStatus: () => ({ pending: Boolean(pendingByIndex[pendingCall++]) }),
      };
      if (specifier === "next/navigation") return { usePathname: () => pathname };
      if (specifier === "lucide-react") return new Proxy({ __esModule: true }, {
        get: (target, name) => name in target
          ? target[name]
          : (props) => React.createElement("svg", { ...props, "data-icon": String(name) }),
      });
      if (specifier.endsWith(".module.css")) return {
        __esModule: true,
        default: new Proxy({}, { get: (_, name) => String(name) }),
      };
      throw new Error(`Unexpected ranking-tabs dependency: ${specifier}`);
    },
    window: {
      matchMedia: () => ({ matches: false }),
    },
  }, { filename });

  return localModule.exports.RankingTabs;
}

function renderTabs(pathname, pendingByIndex = []) {
  const RankingTabs = loadRankingTabs(pathname, pendingByIndex);
  return renderToStaticMarkup(React.createElement(RankingTabs));
}

function captureLinkProps(pathname) {
  const capturedLinks = [];
  const RankingTabs = loadRankingTabs(pathname, [], capturedLinks);
  renderToStaticMarkup(React.createElement(RankingTabs));
  return capturedLinks;
}

function renderedLinks(html) {
  return html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? [];
}

function cssDeclarations(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected a CSS rule for ${selector}`);
  return match[1];
}

test("ranking navigation renders four canonical links in the intended order", () => {
  const html = renderTabs("/ranking/personal");
  const links = renderedLinks(html);

  assert.match(html, /<nav[^>]*aria-label="랭킹 종류"/);
  assert.equal(links.length, expectedTabs.length);
  assert.doesNotMatch(html, /role="tab(?:list)?"/);

  expectedTabs.forEach((tab, index) => {
    assert.match(links[index], new RegExp(`href="${tab.href.replaceAll("/", "\\/")}"`));
    assert.ok(links[index].includes(tab.label));
    const href = links[index].match(/\shref="([^"]+)"/)?.[1];
    assert.equal(href, tab.href, `${tab.label} should not leak filters from another ranking route`);
  });
});

test("the URL pathname marks exactly one native link as the current page", () => {
  const pathnameCases = [
    ["/ranking/personal", "personal"],
    ["/ranking/personal/details", "personal"],
    ["/ranking", "products"],
    ["/ranking/rising", "rising"],
    ["/ranking/rising/archive", "rising"],
    ["/reviewers", "reviewers"],
    ["/reviewers/member-id", "reviewers"],
    ["/ranking/personalized", "products"],
    ["/reviewership", "products"],
  ];

  for (const [pathname, active] of pathnameCases) {
    const html = renderTabs(pathname);
    const links = renderedLinks(html);

    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
    expectedTabs.forEach((tab, index) => {
      assert.equal(links[index].includes('aria-current="page"'), tab.key === active);
      assert.doesNotMatch(links[index], /tabindex="-1"/i);
    });
  }
});

test("route owners delegate current state to the URL-aware shared navigation", () => {
  const routes = [
    "../src/app/ranking/page.tsx",
    "../src/app/ranking/personal/page.tsx",
    "../src/app/ranking/rising/page.tsx",
    "../src/app/reviewers/page.tsx",
  ];

  for (const path of routes) {
    const source = read(path);
    const usages = source.match(/<RankingTabs\s*\/>/g) ?? [];
    assert.ok(usages.length > 0, `${path} should render the shared ranking navigation`);
    assert.doesNotMatch(source, /<RankingTabs\b[^>]*\bactive=/);
  }

  assert.match(componentSource, /const\s+pathname\s*=\s*usePathname\(\)/);
  assert.match(componentSource, /currentRankingTab\(pathname\)/);
});

test("loading fallbacks keep the shared URL-aware ranking navigation visible", () => {
  for (const path of ["../src/app/ranking/loading.tsx", "../src/app/reviewers/loading.tsx"]) {
    const source = read(path);
    assert.match(source, /import\s*\{\s*RankingTabs\s*\}\s*from\s*["']@\/components\/ranking-tabs["']/);
    assert.match(source, /<RankingTabs\s*\/>/);
    assert.doesNotMatch(source, /<RankingTabs\b[^>]*\bactive=/);
    assert.ok(source.indexOf("<RankingTabs") < source.indexOf('role="status"'), `${path} should show navigation before its loading status`);
  }
});

test("clicking the current tab keeps its query while modified clicks retain browser behavior", () => {
  const links = captureLinkProps("/ranking/personal");
  assert.equal(links.length, expectedTabs.length);
  assert.equal(typeof links[0].onClick, "function");
  for (const link of links.slice(1)) assert.equal(link.onClick, undefined);

  let prevented = 0;
  links[0].onClick({
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: () => { prevented += 1; },
  });
  assert.equal(prevented, 1, "an ordinary current-tab click must leave the filtered URL unchanged");

  for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
    prevented = 0;
    links[0].onClick({
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      [modifier]: true,
      preventDefault: () => { prevented += 1; },
    });
    assert.equal(prevented, 0, `${modifier} click should keep the native link behavior`);
  }
});

test("pending feedback stays decorative and is scoped to the link reporting navigation", () => {
  const html = renderTabs("/ranking", [false, true, false, false]);
  const links = renderedLinks(html);

  assert.equal((html.match(/class="pending"/g) ?? []).length, expectedTabs.length);
  assert.equal((html.match(/data-pending="true"/g) ?? []).length, 1);
  assert.match(links[1], /data-pending="true"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(links[0] + links[2] + links[3], /data-pending="true"/);
  assert.match(componentSource, /useLinkStatus\(\)/);
});

test("overflowing rails center the active item and respect reduced motion", () => {
  assert.match(componentSource, /rail\.scrollWidth\s*<=\s*rail\.clientWidth/);
  assert.match(componentSource, /tab\.offsetLeft\s*-\s*\(rail\.clientWidth\s*-\s*tab\.clientWidth\)\s*\/\s*2/);
  assert.match(componentSource, /window\.matchMedia\(["']\(prefers-reduced-motion:\s*reduce\)["']\)\.matches/);
  assert.match(componentSource, /rail\.scrollTo\(\{\s*left:\s*Math\.max\(0,\s*left\),\s*behavior\s*\}\)/);
  assert.match(componentSource, /\},\s*\[active\]\)/);

  const rail = cssDeclarations(componentCss, ".rail");
  const tab = cssDeclarations(componentCss, ".tab");
  assert.match(rail, /display:\s*flex/);
  assert.match(rail, /max-width:\s*100%/);
  assert.match(rail, /overflow-x:\s*auto/);
  assert.match(rail, /overscroll-behavior-inline:\s*contain/);
  assert.match(rail, /scroll-snap-type:\s*x\s+proximity/);
  assert.match(tab, /flex:\s*0\s+0\s+auto/);
  const hitTarget = tab.match(/min-height:\s*([\d.]+)px/);
  assert.ok(hitTarget, "ranking tabs need an explicit minimum hit-target height");
  assert.ok(Number(hitTarget[1]) >= 44, "ranking tabs need at least a 44px hit target");
  assert.match(tab, /white-space:\s*nowrap/);
  assert.match(tab, /scroll-snap-align:\s*center/);
});

test("mobile overflow, active pill, focus visibility, and reduced motion remain styled", () => {
  assert.match(componentCss, /\.tab\[aria-current=["']page["']\]\s*\{[^}]*background:\s*#fff/s);
  assert.match(componentCss, /@media\s*\(max-width:\s*430px\)\s*\{[\s\S]*?\.nav\s*\{[^}]*justify-content:\s*flex-start[^}]*\}[\s\S]*?\.rail\s*\{[^}]*width:\s*100%[^}]*\}/);
  assert.match(globalCss, /:where\([^)]*\ba\b[^)]*\):focus-visible\s*\{[^}]*outline:\s*2px\s+solid/s);
  assert.match(componentCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.rail\s*\{[^}]*scroll-behavior:\s*auto[^}]*\}[\s\S]*?\.tab\s*\{[^}]*transition:\s*none[^}]*\}[\s\S]*?\.pending\[data-pending=["']true["']\]\s*\{[^}]*animation:\s*none[^}]*\}/);
});
