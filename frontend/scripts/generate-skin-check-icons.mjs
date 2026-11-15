// 나의 성분찾기 선택지 그림 아이콘을 만들어 한 장의 시트로 합치고 S3에 올린다.
//
//   node scripts/generate-skin-check-icons.mjs                 빠진 아이콘 생성 → 시트 합치기 → S3 등록
//   node scripts/generate-skin-check-icons.mjs --no-upload     생성과 시트 합치기까지만 (검수용)
//   node scripts/generate-skin-check-icons.mjs --only="concerns:속건조·당김,poreLevel:HIGH"   지정한 아이콘만 다시 생성
//   node scripts/generate-skin-check-icons.mjs --force         전부 다시 생성
//
// 아이콘 순서와 시트 버전은 src/lib/skin-check-icons.ts가 정한다. 아이콘을 바꿨으면 그 파일의 version을 올리고 실행한다.
// 낱장 아이콘과 시트는 .asset-cache(깃 제외)에만 두고, 화면은 S3(CDN)의 시트를 쓴다.
// Node 24 이상에서 실행한다.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { SKIN_CHECK_ICON_KEYS, SKIN_CHECK_ICON_ROWS, SKIN_CHECK_ICON_SHEET, skinCheckIconSheetPath } from "../src/lib/skin-check-icons.ts";
import { IMAGE_MODEL, IMAGE_QUALITY, exists, frontendDir, publicDir, readApiKey, requestImageEdit } from "./lib/openai-image.mjs";
import { checkPublicAsset, uploadPublicAsset } from "./lib/s3-upload.mjs";

const referencePath = path.join(publicDir, "brand", "hwaryeok-flower-mark.png");
const cacheDir = path.join(frontendDir, ".asset-cache", "skin-check-icons");
const CONCURRENCY = 5;
const ICON_PADDING = 8;

const FACE = "a simple round cartoon face with small closed smiling eyes and no other features";
const MAGNIFIER = "a round magnifying glass held over a patch of skin";

// 선택지마다 그릴 대상. 같은 문항의 선택지는 정도 차이가 한눈에 보이게 같은 소재를 쓴다.
const subjects = {
  "oilinessLevel:LOW": `${FACE}, with completely matte skin and a soft powder puff beside its forehead`,
  "oilinessLevel:BALANCED": `${FACE}, with one small soft shine mark on the forehead`,
  "oilinessLevel:HIGH": `${FACE}, with a very shiny forehead and nose: three bright shine marks and two golden oil droplets`,
  "cheekOiliness:LOW": `${FACE}, whose two cheeks show small dry crack lines`,
  "cheekOiliness:BALANCED": `${FACE}, with two soft round pink cheeks, calm and comfortable`,
  "cheekOiliness:HIGH": `${FACE}, whose two cheeks have bright shine marks and a golden oil droplet`,
  "hydrationLevel:LOW": "a single water droplet with a jagged crack running through it, looking dried out",
  "hydrationLevel:BALANCED": "a single plump water droplet",
  "hydrationLevel:HIGH": "three plump water droplets together with a small sparkle",
  "cleansingTightness:NONE": "a fluffy mound of cleansing foam bubbles with a tiny happy face",
  "cleansingTightness:SHORT": "a fluffy mound of cleansing foam bubbles with a small round clock beside it",
  "cleansingTightness:LONG": `${FACE}, with two small arrows on the cheeks pointing outward to show tight, pulled skin`,
  "sensitivityLevel:LOW": "a sturdy round shield with a small check mark on it",
  "sensitivityLevel:MEDIUM": "a round shield with one small crack in it",
  "sensitivityLevel:HIGH": "a round shield with a bright lightning-shaped spark striking it",
  "rednessFrequency:RARE": `${FACE}, with pale, even-toned cheeks and no blush at all`,
  "rednessFrequency:OCCASIONAL": `${FACE}, with two clearly visible round rosy-pink blush patches on the cheeks`,
  "rednessFrequency:FREQUENT": `${FACE}, with strongly flushed deep red cheeks and small heat lines above them`,
  "breakoutFrequency:RARE": `${FACE}, with clear smooth skin and one tiny sparkle beside it`,
  "breakoutFrequency:OCCASIONAL": `${FACE}, with exactly one small red pimple on one cheek`,
  "breakoutFrequency:FREQUENT": `${FACE}, with five small red pimples scattered over it`,
  "breakoutZones:이마": `${FACE}, pale all over except the forehead, which is marked with a deep rose band`,
  "breakoutZones:코": `${FACE}, pale all over except the nose in the centre, which is marked with a deep rose dot`,
  "breakoutZones:볼": `${FACE}, pale all over except both cheeks, which are marked with deep rose circles`,
  "breakoutZones:턱·입가": `${FACE}, pale all over except the chin and mouth area at the bottom, which is marked with a deep rose band`,
  "breakoutZones:얼굴 전체": `${FACE}, tinted deep rose all over with tiny dots across the whole face`,
  "poreLevel:LOW": `${MAGNIFIER} that is perfectly smooth with no dots`,
  "poreLevel:MEDIUM": `${MAGNIFIER} showing a few small pore dots`,
  "poreLevel:HIGH": `${MAGNIFIER} showing many large open pore dots`,
  "concerns:속건조·당김": "a patch of dry cracked skin, like parched earth, with one small water droplet hovering above it",
  "concerns:유분·번들거림": "one large glossy golden oil droplet with bright shine highlights",
  "concerns:트러블·여드름": "a round patch of skin with three red pimples of different sizes",
  "concerns:블랙헤드·모공": "a nose seen from the front, dotted with many small dark blackheads",
  "concerns:붉은기·민감": "a round cheek glowing red with three small wavy heat lines rising from it",
  "concerns:장벽·각질": "a small wall of rounded bricks, representing the skin barrier, with a few thin flakes peeling off it",
  "concerns:잡티·칙칙함": "a round patch of skin with brown freckles and dark spots, under a small sun",
  "concerns:탄력·잔주름": "a bouncy coiled spring beside three fine wavy wrinkle lines",
  "texturePreference:LIGHT": "a light feather floating above a small clear drop of gel",
  "texturePreference:BALANCED": "a pump bottle of milky lotion with one soft droplet",
  "texturePreference:RICH": "an open jar of thick whipped cream with a tall swirl on top",
  "routineComplexity:MINIMAL": "exactly two skincare bottles standing side by side",
  "routineComplexity:STANDARD": "exactly four skincare bottles of different shapes standing in a row",
  "routineComplexity:LAYERED": "a crowded pyramid of seven skincare bottles and jars stacked together",
  "sunscreenUsage:RARE": "a sun mostly hidden behind a cloud",
  "sunscreenUsage:SOMETIMES": "a small sunscreen tube beside a small sun",
  "sunscreenUsage:DAILY": "a sunscreen tube with a big bright sun behind it and a small check mark",
  "reactionTriggers:향료": "a perfume bottle with a round atomizer bulb and a tiny flower",
  "reactionTriggers:에탄올": "a laboratory flask of clear liquid with wavy vapour lines rising from it",
  "reactionTriggers:에센셜 오일": "a small amber dropper bottle with a green leaf",
  "reactionTriggers:각질 케어 성분": "a round cotton exfoliating pad with tiny flakes lifting off it",
  "reactionTriggers:레티노이드": "a golden soft-gel capsule beside a crescent moon",
  "reactionTriggers:고함량 비타민C": "half an orange slice with one bright droplet",
  "reactionTriggers:아직 모름": "a single blossom petal curled into the shape of a question mark",
  "routineContexts:면도 자주": "a classic safety razor",
  "routineContexts:면도 후 붉어짐": "a classic safety razor beside a red, irritated patch of skin",
  "routineContexts:메이크업 자주": "an open makeup compact with a soft brush",
  "routineContexts:메이크업 밀림": "a smear of foundation that has rolled up into small crumbs",
  "routineContexts:이중 세안": "a pump bottle of cleansing oil and a tube of foam cleanser side by side",
  "routineContexts:고기능성 성분 사용": "a small sealed glass ampoule vial with one small four-point star beside it, with no glow or haze around it",
  "environments:냉난방 건조": "a wall air conditioner blowing three wavy lines of dry air",
  "environments:마스크 장시간": "a face mask with ear loops",
  "environments:야외 활동": "a wide-brim sun hat under a small sun",
  "environments:미세먼지": "a soft grey dust cloud with tiny particles around it",
  "environments:계절 변화": "an autumn leaf and a snowflake side by side",
  "environments:수면 부족": "a crescent moon with a sleepy closed eye and two tiny stars",
};

function buildPrompt(subject) {
  return [
    "Use the reference image only as the style guide: soft hand-painted watercolor in the same warm coral-pink palette, gentle paper texture, a few golden-ochre accents, no ink outlines.",
    `Paint one simple icon in that style: ${subject}.`,
    "Front view, centred, filling most of the square with a small even margin. Keep the shapes bold and simple so the meaning reads at 36 pixels.",
    "Fully transparent background. No text, no letters, no numbers, no ground shadow, no frame, no extra flowers around it.",
  ].join(" ");
}

const cacheFile = (key) => path.join(cacheDir, `${key.replace(/[^A-Za-z0-9가-힣]+/g, "-")}.png`);

function parseArgs(argv) {
  const only = argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length).split(",").map((key) => key.trim()).filter(Boolean) ?? null;
  return { only, force: argv.includes("--force"), upload: !argv.includes("--no-upload") };
}

async function generateIcon(key, reference, apiKey) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { image } = await requestImageEdit(apiKey, {
        image: reference,
        filename: "hwaryeok-flower-mark.png",
        prompt: buildPrompt(subjects[key]),
        size: "1024x1024",
        options: { background: "transparent", output_format: "png" },
      });
      await sharp(image).trim().png({ compressionLevel: 9 }).toFile(cacheFile(key));
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function buildSheet() {
  const { columns, cell } = SKIN_CHECK_ICON_SHEET;
  const inner = cell - ICON_PADDING * 2;
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const composites = [];
  for (const [index, key] of SKIN_CHECK_ICON_KEYS.entries()) {
    composites.push({
      input: await sharp(cacheFile(key)).resize(inner, inner, { fit: "contain", background: transparent }).png().toBuffer(),
      left: (index % columns) * cell + ICON_PADDING,
      top: Math.floor(index / columns) * cell + ICON_PADDING,
    });
  }
  return sharp({ create: { width: columns * cell, height: SKIN_CHECK_ICON_ROWS * cell, channels: 4, background: transparent } })
    .composite(composites)
    .webp({ quality: 88, alphaQuality: 92, effort: 5 })
    .toBuffer();
}

async function main() {
  const { only, force, upload } = parseArgs(process.argv.slice(2));
  const missingSubjects = SKIN_CHECK_ICON_KEYS.filter((key) => !subjects[key]);
  if (missingSubjects.length) throw new Error(`그릴 대상이 없는 아이콘: ${missingSubjects.join(", ")}`);
  const unknown = (only ?? []).filter((key) => !SKIN_CHECK_ICON_KEYS.includes(key));
  if (unknown.length) throw new Error(`목록에 없는 아이콘: ${unknown.join(", ")}`);

  await mkdir(cacheDir, { recursive: true });
  const targets = [];
  for (const key of SKIN_CHECK_ICON_KEYS) {
    if (only ? only.includes(key) : force || !(await exists(cacheFile(key)))) targets.push(key);
  }

  if (targets.length) {
    const apiKey = await readApiKey();
    const reference = await sharp(referencePath).resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    console.log(`아이콘 ${targets.length}개 생성 시작 · 모델 ${IMAGE_MODEL} · 품질 ${IMAGE_QUALITY}`);
    const failed = [];
    let cursor = 0;
    let done = 0;
    async function worker() {
      while (cursor < targets.length) {
        const key = targets[cursor++];
        try {
          await generateIcon(key, reference, apiKey);
          done += 1;
          if (done % 10 === 0 || done === targets.length) console.log(`  ${done}/${targets.length}`);
        } catch (error) {
          failed.push(key);
          console.error(`  ✗ ${key}: ${error.message}`);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
    if (failed.length) {
      throw new Error(`생성 실패 ${failed.length}개 — --only="${failed.join(",")}" 로 다시 실행해 주세요.`);
    }
  } else {
    console.log("새로 만들 아이콘이 없어요. 캐시의 아이콘으로 시트를 합칩니다.");
  }

  const sheet = await buildSheet();
  const sheetFile = path.join(cacheDir, `sheet-v${SKIN_CHECK_ICON_SHEET.version}.webp`);
  await writeFile(sheetFile, sheet);
  console.log(`시트 저장: ${SKIN_CHECK_ICON_KEYS.length}개 아이콘 · ${Math.round(sheet.length / 1024)}KB · ${sheetFile}`);
  if (!upload) return;

  const { url } = await uploadPublicAsset(skinCheckIconSheetPath(), await readFile(sheetFile), "image/webp");
  const check = await checkPublicAsset(url);
  console.log(`S3 등록 완료: ${url} → CDN 응답 ${check.status} (${check.contentType})`);
  if (check.status !== 200) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
