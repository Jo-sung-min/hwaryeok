// 화력 그림 아이콘을 만든다. 매화 마크(public/brand/hwaryeok-flower-mark.png)를 화풍 참고 이미지로 쓴다.
//
//   node scripts/generate-brand-icons.mjs               빠진 아이콘만 생성
//   node scripts/generate-brand-icons.mjs --only=skin   지정한 아이콘만 다시 생성
//   node scripts/generate-brand-icons.mjs --force       전부 다시 생성
//
// 결과는 투명 배경 PNG로 public/icons/<이름>.png 에 저장한다.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { IMAGE_MODEL, IMAGE_QUALITY, exists, publicDir, readApiKey, requestImageEdit } from "./lib/openai-image.mjs";

const referencePath = path.join(publicDir, "brand", "hwaryeok-flower-mark.png");
const iconsDir = path.join(publicDir, "icons");
const OUTPUT_SIZE = 192;

// 이름은 화면에서 쓰는 뜻, 값은 그릴 대상.
const icons = {
  skin: "a round hand mirror with a slim handle; one blossom petal rests on the glass and a tiny four-point sparkle floats beside it",
  ingredient: "a small glass dropper bottle of cosmetic serum with a single droplet falling from the dropper tip",
  rising: "three blossom petals drifting upward along a gentle rising curve, each one higher and a little larger than the last, like a growth chart",
  reviewer: "a rounded speech bubble with one small heart-shaped petal inside it",
  empty: "an open, empty round cosmetic cream jar with its lid resting beside it",
};

function buildPrompt(subject) {
  return [
    "Use the reference image only as the style guide: soft hand-painted watercolor in the same warm coral-pink palette, gentle paper texture, a few golden-ochre accents, no ink outlines.",
    `Paint one simple icon in that style: ${subject}.`,
    "Front view, centred, with generous empty margin around it. Keep the shapes simple and bold enough to read at 40 pixels.",
    "Fully transparent background. No text, no ground shadow, no frame, no extra flowers around it.",
  ].join(" ");
}

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const only = argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length).split(",").map((name) => name.trim()).filter(Boolean) ?? null;
  const unknown = (only ?? []).filter((name) => !icons[name]);
  if (unknown.length) throw new Error(`없는 아이콘: ${unknown.join(", ")} (가능: ${Object.keys(icons).join(", ")})`);

  await mkdir(iconsDir, { recursive: true });
  const targets = [];
  for (const name of Object.keys(icons)) {
    if (only && !only.includes(name)) continue;
    if (!force && !only && await exists(path.join(iconsDir, `${name}.png`))) continue;
    targets.push(name);
  }
  if (!targets.length) { console.log("새로 만들 아이콘이 없어요."); return; }

  const apiKey = await readApiKey();
  const reference = await sharp(referencePath).resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  console.log(`아이콘 ${targets.length}개 생성 시작 · 모델 ${IMAGE_MODEL} · 품질 ${IMAGE_QUALITY}`);

  const failed = [];
  await Promise.all(targets.map(async (name) => {
    try {
      const { image, usage } = await requestImageEdit(apiKey, {
        image: reference,
        filename: "hwaryeok-flower-mark.png",
        prompt: buildPrompt(icons[name]),
        size: "1024x1024",
        options: { background: "transparent", output_format: "png" },
      });
      await sharp(image)
        .trim()
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(path.join(iconsDir, `${name}.png`));
      console.log(`  ✓ ${name}${usage ? ` (출력 ${usage.output_tokens} 토큰)` : ""}`);
    } catch (error) {
      failed.push(name);
      console.error(`  ✗ ${name}: ${error.message}`);
    }
  }));
  if (failed.length) {
    console.error(`실패: ${failed.join(", ")} — --only=${failed.join(",")} 로 다시 실행할 수 있어요.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
