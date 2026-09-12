// Read-only QA server, synthetic data only. Not a production route or auth bypass.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dashboard, photoForm } from "./my-render-fixtures.mjs";
const css = ["../src/app/my/my.module.css", "../src/app/my/photo-analysis/skin-photo.module.css"].map(path => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
createServer(async (req, res) => {
  if (req.method !== "GET") { res.writeHead(405); res.end(); return; }
  const photo = req.url?.includes("photo");
  const content = photo ? `<div class="page"><header class="header"><div class="identity"><p class="eyebrow">MY SKIN PHOTO</p><h1>사진 피부 분석</h1><p>가상 피부기록님의 피부를 조금 더 자세히.</p></div></header><nav class="tabs"><a href="/">내 기록</a><a href="/photo" aria-current="page">사진 피부 분석</a></nav>${photoForm({ enabled: false, dailyLimit: 3, remaining: 3 })}</div>` : await dashboard();
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width, initial-scale=1"><title>마이화력 · 가상 데이터 UI 확인</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f5f7;font-family:Arial,'Malgun Gothic',sans-serif}main{max-width:594px;margin:auto;background:white}h1,h2,h3,p,ul,dl,dd{margin:0}ul{padding:0;list-style:none}a{color:inherit;text-decoration:none}button,input{font:inherit}button{border:0;background:transparent} .qa{font-size:11px;text-align:center;padding:6px;color:#80717e;background:#fff1f6}${css}</style><main><p class="qa">가상 데이터 · 화면 검증 전용</p>${content}</main></html>`);
}).listen(18082, "127.0.0.1", () => console.log("Synthetic my-page UI fixture: http://127.0.0.1:18082"));
