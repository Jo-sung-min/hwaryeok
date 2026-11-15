// 이미지 생성 스크립트들이 함께 쓰는 OpenAI 이미지 편집 호출.
// OPENAI_API_KEY는 환경변수 또는 backend/.env에서 읽으며 출력하지 않는다.

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const publicDir = path.join(frontendDir, "public");

export const IMAGE_MODEL = process.env.FACE_CONCERN_IMAGE_MODEL || "gpt-image-2.6-sunburst";
export const IMAGE_QUALITY = process.env.FACE_CONCERN_IMAGE_QUALITY || "medium";

export async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

export async function readApiKey() {
  let key = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!key) {
    const envFile = path.resolve(frontendDir, "..", "backend", ".env");
    if (await exists(envFile)) {
      const line = (await readFile(envFile, "utf8")).split(/\r?\n/).find((entry) => entry.startsWith("OPENAI_API_KEY="));
      key = line ? line.slice("OPENAI_API_KEY=".length).trim() : "";
    }
  }
  if (!key) throw new Error("OPENAI_API_KEY가 없어요. 환경변수나 backend/.env에 설정해 주세요.");
  return key;
}

/** 참고 이미지 한 장과 프롬프트로 이미지를 만든다. options에는 background, output_format 같은 추가 항목을 넣는다. */
export async function requestImageEdit(apiKey, { image, filename, prompt, size, options = {} }) {
  const form = new FormData();
  form.set("model", IMAGE_MODEL);
  form.set("prompt", prompt);
  form.set("size", size);
  form.set("quality", IMAGE_QUALITY);
  for (const [name, value] of Object.entries(options)) form.set(name, value);
  form.append("image[]", new Blob([image], { type: "image/png" }), filename);

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(300_000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${text.slice(0, 600)}`);
  const body = JSON.parse(text);
  const encoded = body.data?.[0]?.b64_json;
  if (!encoded) throw new Error(`OpenAI 응답에 이미지가 없어요: ${text.slice(0, 300)}`);
  return { image: Buffer.from(encoded, "base64"), usage: body.usage ?? null };
}
