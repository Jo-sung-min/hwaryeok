// 얼굴 고민 찾기(/skin-check/face)의 확대컷을 만든다.
//
//   node scripts/generate-face-concern-images.mjs                  빠진 이미지만 생성
//   node scripts/generate-face-concern-images.mjs --only=cheek-redness,nose-pore
//   node scripts/generate-face-concern-images.mjs --force          전부 다시 생성
//   node scripts/generate-face-concern-images.mjs --zones-only     부위 원본컷만 (API 호출 없음)
//   node scripts/generate-face-concern-images.mjs --views          다각도 모델 컷(옆·턱 들기·정수리)만 생성
//   node scripts/generate-face-concern-images.mjs --views --only=up
//
// 다각도 컷은 정면 모델 사진을 참고 이미지로 보내 같은 사람의 다른 각도를 받는다(반대쪽 옆얼굴은 좌우 반전).
// 모델 얼굴에서 부위를 잘라 OpenAI 이미지 편집 API에 보내고, 같은 피부톤·조명에 증상만 입힌 컷을 받는다.
// OPENAI_API_KEY는 환경변수 또는 backend/.env에서 읽으며 출력하지 않는다.
// Node 24 이상에서 실행한다(카탈로그 .ts 파일을 타입 제거로 직접 불러온다).

import { mkdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FACE_MODEL, FACE_SYMPTOMS, FACE_VIEWS, FACE_ZONES } from "../src/lib/face-concerns.ts";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(frontendDir, "public");
const modelPath = path.join(publicDir, FACE_MODEL.src);
const zonesDir = path.join(publicDir, "face-check", "zones");
const symptomsDir = path.join(publicDir, "face-check", "symptoms");
const viewsDir = path.join(publicDir, "face-check", "views");

// 정면 사진에서 만들어 내는 다른 각도. turn-left는 turn-right를 좌우 반전해 만든다.
const VIEW_COMMON = [
  "Use the reference photo. Create a new photo of the exact same woman: the same face and identity, the same skin tone and natural skin texture, the same black hair tied back with a few loose strands, bare shoulders, no makeup, neutral expression.",
  "Same studio, same soft even lighting, same plain light-grey background, same vertical portrait framing with the head centred and the tops of the shoulders visible. Photorealistic. No text, no borders.",
].join(" ");
const viewPrompts = {
  "turn-right": "Only the head pose changes: she has turned her head about 60 degrees so that her face points toward the right edge of the picture. The camera now sees the side of her face clearly: the whole cheek, the jawline from the chin back to the ear, the ear, the temple and the outer corner of the eye.",
  up: "Only the head pose changes: she has tilted her head far back with her chin lifted high, and the camera looks up at her from below chest height. The picture clearly shows the underside of her chin and jaw, the skin under the chin and the whole front of her neck; the rest of her face is foreshortened above the chin.",
  top: "Only the head pose changes: she has bowed her head forward and down so that the top of her head faces the camera. The picture clearly shows the hair parting, the crown of the head and the scalp along the parting; her forehead and the tip of her nose are foreshortened at the bottom of the head.",
};

const MODEL = process.env.FACE_CONCERN_IMAGE_MODEL || "gpt-image-2.6-sunburst";
const QUALITY = process.env.FACE_CONCERN_IMAGE_QUALITY || "medium";
const INPUT_SIZE = 1024;
const OUTPUT_SIZE = 640;
const CONCURRENCY = 3;

const zoneSubjects = {
  forehead: "the forehead, with the tops of the eyebrows at the bottom edge",
  eyes: "the area around one eye: the lower eyelid, the under-eye skin and the outer corner",
  nose: "the nose seen from the front, with a little cheek on both sides",
  cheek: "one cheek, next to the nose",
  chin: "the lips, the skin around the mouth and the chin",
  jawline: "the side of the face: the lower cheek and the jawline, with a little neck below it",
  neck: "the underside of the chin and the front of the neck, seen from below",
  crown: "the top of the head seen from above: the hair parting and the hair around it",
};

// 증상별로 "무엇이 보여야 하는지"만 적는다. 공통 지시는 buildPrompt가 붙인다.
const symptomPrompts = {
  "forehead-oily": "excess sebum: an oily, shiny, greasy forehead with a clear specular oil sheen and slightly visible pores",
  "forehead-acne": "many small skin-coloured closed comedones (tiny bumps) across the forehead, mixed with a few small red pimples",
  "forehead-wrinkle": "several fine horizontal forehead lines that stay visible on a relaxed face",
  "forehead-flaky": "dry, rough skin with fine white flaking and peeling patches and a dull matte texture",
  "eyes-wrinkle": "fine crow's-feet lines radiating from the outer corner of the eye and a few fine lines under the eye",
  "eyes-dry": "dehydrated under-eye skin: crepey, papery texture with many tiny dry lines and slight flaking",
  "eyes-dark": "an ordinary tired-looking dark circle: a soft, diffuse brownish-grey shadow in the under-eye hollow that is somewhat darker than the surrounding skin. It must not look like a bruise or an injury: no purple or black colour, no swelling",
  "nose-blackhead": "blackheads: many small dark clogged pores dotted over the nose tip and the sides of the nostrils",
  "nose-pore": "visibly enlarged, round, open pores on the nose and on the skin right beside the nostrils",
  "nose-oily": "an oily, shiny nose bridge and nose tip with a strong sebum sheen",
  "nose-redflake": "redness along the creases beside the nostrils with fine white flaking skin there",
  "cheek-redness": "diffuse redness and flushing spread across the cheek, with a few faint thread-like capillaries, looking sensitive",
  "cheek-dry": "clearly dehydrated cheek skin: dull and matte, with a visible network of fine dry lines, a slightly rough ashy texture and a few small patches of light flaking",
  "cheek-acne": "several inflamed red pimples of different sizes on the cheek and a few flat reddish-brown marks left by healed ones",
  "cheek-pore": "enlarged pores on the inner cheek that are stretched into vertical teardrop shapes, giving an orange-peel texture",
  "cheek-spot": "brown pigmentation on the cheek: a soft melasma-like patch, a few sun spots and freckles, uneven dull tone",
  "chin-acne": "several firm, inflamed red pimples and bumps on the chin and along the jawline below the lips",
  "chin-flaky": "dry, white, flaking and slightly cracked skin at the corners of the mouth and around the lips and chin",
  "chin-wrinkle": "a visible crease running down from beside the mouth corner and fine lines around the mouth, with slightly less firm skin",
  "jawline-acne": "several firm, inflamed red pimples and bumps lined up along the jawline and the lower cheek",
  "jawline-mark": "flat reddish-brown post-acne marks and small dark spots scattered along the jawline and lower cheek, with no active pimples",
  "jawline-sagging": "a softer, less defined jawline: the lower cheek has slackened into a slight jowl that blurs the jaw edge, with mild loss of firmness",
  "neck-wrinkle": "two or three clear horizontal neck lines (creases) running across the front of the neck",
  "neck-sagging": "a soft fold of loose, slack skin under the chin (a mild double chin) with a crease where it meets the neck",
  "neck-acne": "several inflamed red pimples and small bumps under the chin and on the upper neck",
  "neck-dry": "dry, rough neck skin with fine crepey lines, slight flaking and a dull ashy look",
  "crown-thinning": "a noticeably wider hair parting with thinner, sparser hair around the crown, so that more pale scalp shows through",
  "crown-oily": "greasy hair roots: the hair along the parting looks slick and clumped into wet-looking strands lying flat on a shiny scalp",
  "crown-flaky": "white dandruff flakes and dry scaling scattered along the parting and on the hair near the roots",
};

function buildPrompt(symptom) {
  const scalp = symptom.zone === "crown";
  return [
    `This photo is a tight close-up crop of a woman showing ${zoneSubjects[symptom.zone]}.`,
    `Edit it so it clearly shows this everyday ${scalp ? "scalp and hair" : "cosmetic skin"} concern: ${symptomPrompts[symptom.id]}.`,
    `Keep the exact same person, skin tone, hair colour, lighting, camera angle and framing. Change only the ${scalp ? "scalp and hair" : "skin"} condition.`,
    `Photorealistic macro photograph with natural texture. The concern must be easy to recognise at a glance so a viewer can compare it with their own ${scalp ? "scalp" : "skin"}, but stay realistic and everyday, not extreme or medical-looking.`,
    "No makeup, no text, no labels, no arrows, no borders, no split screen.",
  ].join(" ");
}

function parseArgs(argv) {
  const only = argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length).split(",").map((id) => id.trim()).filter(Boolean) ?? null;
  return { only, force: argv.includes("--force"), zonesOnly: argv.includes("--zones-only"), views: argv.includes("--views") };
}

async function requestEdit(apiKey, { image, filename, prompt, size }) {
  const form = new FormData();
  form.set("model", MODEL);
  form.set("prompt", prompt);
  form.set("size", size);
  form.set("quality", QUALITY);
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

async function generateViews({ only, force }, apiKey) {
  await mkdir(viewsDir, { recursive: true });
  const unknown = (only ?? []).filter((id) => !viewPrompts[id]);
  if (unknown.length) throw new Error(`만들 수 없는 각도: ${unknown.join(", ")} (가능: ${Object.keys(viewPrompts).join(", ")})`);
  const reference = await sharp(modelPath).png().toBuffer();
  const targets = [];
  for (const id of Object.keys(viewPrompts)) {
    if (only && !only.includes(id)) continue;
    if (!force && !only && await exists(path.join(viewsDir, `${id}.jpg`))) continue;
    targets.push(id);
  }
  console.log(`다각도 컷 ${targets.length}장 생성 시작 · 모델 ${MODEL} · 품질 ${QUALITY}`);
  const failed = [];
  await Promise.all(targets.map(async (id) => {
    const startedAt = Date.now();
    try {
      const { image, usage } = await requestEdit(apiKey, {
        image: reference, filename: "model-face.png", prompt: `${VIEW_COMMON} ${viewPrompts[id]}`, size: "1024x1536",
      });
      await sharp(image).resize(FACE_MODEL.width, FACE_MODEL.height, { fit: "cover" }).jpeg({ quality: 88 }).toFile(path.join(viewsDir, `${id}.jpg`));
      console.log(`  ✓ ${id} (${((Date.now() - startedAt) / 1000).toFixed(0)}s${usage ? `, 출력 ${usage.output_tokens} 토큰` : ""})`);
    } catch (error) {
      failed.push(id);
      console.error(`  ✗ ${id}: ${error.message}`);
    }
  }));
  if (await exists(path.join(viewsDir, "turn-right.jpg"))) {
    await sharp(path.join(viewsDir, "turn-right.jpg")).flop().jpeg({ quality: 88 }).toFile(path.join(viewsDir, "turn-left.jpg"));
    console.log("  ✓ turn-left (turn-right 좌우 반전)");
  }
  if (failed.length) {
    console.error(`실패: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function readApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  const envFile = path.resolve(frontendDir, "..", "backend", ".env");
  if (!(await exists(envFile))) return "";
  const line = (await readFile(envFile, "utf8")).split(/\r?\n/).find((entry) => entry.startsWith("OPENAI_API_KEY="));
  return line ? line.slice("OPENAI_API_KEY=".length).trim() : "";
}

function cropInput(zone) {
  const { x, y, size } = zone.crop;
  const view = FACE_VIEWS.find((entry) => entry.id === zone.cropView);
  return sharp(path.join(publicDir, view.src))
    .extract({ left: x, top: y, width: size, height: size })
    .resize(INPUT_SIZE, INPUT_SIZE, { kernel: "lanczos3" });
}

async function writeZoneImage(zone, force) {
  const target = path.join(zonesDir, `${zone.id}.webp`);
  if (!force && await exists(target)) return false;
  await cropInput(zone).resize(OUTPUT_SIZE, OUTPUT_SIZE).webp({ quality: 84 }).toFile(target);
  return true;
}

async function generateSymptomImage(symptom, apiKey) {
  const zone = FACE_ZONES.find((entry) => entry.id === symptom.zone);
  const input = await cropInput(zone).png().toBuffer();
  const { image, usage } = await requestEdit(apiKey, {
    image: input, filename: `${zone.id}.png`, prompt: buildPrompt(symptom), size: `${INPUT_SIZE}x${INPUT_SIZE}`,
  });
  await sharp(image)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE)
    .webp({ quality: 84 })
    .toFile(path.join(symptomsDir, `${symptom.id}.webp`));
  return usage;
}

async function main() {
  const { only, force, zonesOnly, views } = parseArgs(process.argv.slice(2));
  if (!(await exists(modelPath))) throw new Error(`모델 얼굴 이미지가 없어요: ${modelPath}`);
  if (views) {
    const apiKey = await readApiKey();
    if (!apiKey) throw new Error("OPENAI_API_KEY가 없어요. 환경변수나 backend/.env에 설정해 주세요.");
    await generateViews({ only, force }, apiKey);
    return;
  }
  const missingPrompts = FACE_SYMPTOMS.filter((symptom) => !symptomPrompts[symptom.id]).map((symptom) => symptom.id);
  if (missingPrompts.length) throw new Error(`프롬프트가 없는 증상: ${missingPrompts.join(", ")}`);
  const unknown = (only ?? []).filter((id) => !FACE_SYMPTOMS.some((symptom) => symptom.id === id));
  if (unknown.length) throw new Error(`카탈로그에 없는 증상: ${unknown.join(", ")}`);
  const missingViews = [];
  for (const view of FACE_VIEWS) if (!(await exists(path.join(publicDir, view.src)))) missingViews.push(view.id);
  if (missingViews.length) throw new Error(`각도 이미지가 없어요: ${missingViews.join(", ")} — 먼저 --views로 만들어 주세요.`);

  await mkdir(zonesDir, { recursive: true });
  await mkdir(symptomsDir, { recursive: true });

  let zoneCount = 0;
  for (const zone of FACE_ZONES) if (await writeZoneImage(zone, force)) zoneCount += 1;
  console.log(`부위 원본컷 ${zoneCount}장 저장 (${FACE_ZONES.length}개 부위)`);
  if (zonesOnly) return;

  const targets = [];
  for (const symptom of FACE_SYMPTOMS) {
    if (only && !only.includes(symptom.id)) continue;
    if (!force && !only && await exists(path.join(symptomsDir, `${symptom.id}.webp`))) continue;
    targets.push(symptom);
  }
  if (!targets.length) { console.log("새로 만들 증상컷이 없어요."); return; }

  const apiKey = await readApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY가 없어요. 환경변수나 backend/.env에 설정해 주세요.");
  console.log(`증상컷 ${targets.length}장 생성 시작 · 모델 ${MODEL} · 품질 ${QUALITY}`);

  const totals = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
  const failed = [];
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const symptom = targets[cursor++];
      const startedAt = Date.now();
      try {
        const usage = await generateSymptomImage(symptom, apiKey);
        for (const key of Object.keys(totals)) totals[key] += usage?.[key] ?? 0;
        console.log(`  ✓ ${symptom.id} (${((Date.now() - startedAt) / 1000).toFixed(0)}s${usage ? `, 출력 ${usage.output_tokens} 토큰` : ""})`);
      } catch (error) {
        failed.push(symptom.id);
        console.error(`  ✗ ${symptom.id}: ${error.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

  console.log(`완료 ${targets.length - failed.length}/${targets.length} · 토큰 입력 ${totals.input_tokens} / 출력 ${totals.output_tokens}`);
  if (failed.length) {
    console.error(`실패: ${failed.join(", ")} — --only=${failed.join(",")} 로 다시 실행할 수 있어요.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
