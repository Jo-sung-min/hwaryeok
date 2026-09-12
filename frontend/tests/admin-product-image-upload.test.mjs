import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const apiSource = read("../src/lib/api.ts");
const actionsSource = read("../src/app/admin/products/actions.ts");
const formSource = read("../src/app/admin/products/product-image-form.tsx");

function declaration(source, startPattern, endPattern) {
  const start = source.search(startPattern);
  assert.notEqual(start, -1, `Expected declaration matching ${startPattern}`);
  const remainder = source.slice(start);
  const end = remainder.search(endPattern);
  assert.notEqual(end, -1, `Expected declaration to end before ${endPattern}`);
  return remainder.slice(0, end);
}

function loadUploadHelpers() {
  const filename = fileURLToPath(new URL("../src/lib/product-image-upload.ts", import.meta.url));
  const { code } = require("next/dist/compiled/babel/core").transformSync(readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require("next/dist/compiled/babel/preset-typescript").default],
    plugins: [require("next/dist/compiled/babel/plugin-transform-modules-commonjs").default],
  });
  const localModule = { exports: {} };
  vm.runInNewContext(code, { module: localModule, exports: localModule.exports }, { filename });
  return localModule.exports;
}

test("product image validation keeps the supported formats and 5MB limit", () => {
  const { PRODUCT_IMAGE_MAX_BYTES, productImageFileError, productImageUploadMetadata } = loadUploadHelpers();

  assert.equal(productImageFileError(null), "이미지 파일을 선택해 주세요.");
  assert.equal(productImageFileError({ name: "empty.png", type: "image/png", size: 0 }), "이미지 파일을 선택해 주세요.");
  assert.equal(productImageFileError({ name: "large.jpg", type: "image/jpeg", size: PRODUCT_IMAGE_MAX_BYTES + 1 }), "이미지는 5MB 이하만 등록할 수 있어요.");
  assert.equal(productImageFileError({ name: "vector.svg", type: "image/svg+xml", size: 100 }), "PNG, JPG, WEBP 이미지만 등록할 수 있어요.");

  const file = { name: "new-product.webp", type: "image/webp", size: 4321 };
  assert.equal(productImageFileError(file), null);
  assert.deepEqual({ ...productImageUploadMetadata(file) }, {
    fileName: "new-product.webp",
    contentType: "image/webp",
    size: 4321,
  });
});

test("browser upload PUTs the original file with only the signed headers", async () => {
  const { putProductImageToPresignedUrl } = loadUploadHelpers();
  const file = { name: "new-product.png", type: "image/png", size: 512 };
  const ticket = {
    uploadUrl: "https://signed-upload.example/products/new-product.png?signature=secret",
    objectKey: "hwaryeok/products/new-product.png",
    imageUrl: "https://cdn.example/products/new-product.png",
    headers: { "Content-Type": "image/png", "x-amz-server-side-encryption": "AES256" },
    expiresAt: "2026-09-11T12:00:00Z",
  };
  let call;

  await putProductImageToPresignedUrl(file, ticket, async (input, init) => {
    call = { input, init };
    return { ok: true, status: 200 };
  });

  assert.equal(call.input, ticket.uploadUrl);
  assert.equal(call.init.method, "PUT");
  assert.equal(call.init.body, file);
  assert.equal(call.init.headers, ticket.headers);
  assert.equal("credentials" in call.init, false);

  await assert.rejects(
    () => putProductImageToPresignedUrl(file, ticket, async () => ({ ok: false, status: 403 })),
    /이미지 전송에 실패했어요.*403/,
  );
});

test("admin API requests a signed URL and confirms only its object key", () => {
  const prepareApi = declaration(apiSource, /export function createAdminProductImageUploadUrl\s*\(/, /\nexport function completeAdminProductImageUpload/);
  const completeApi = declaration(apiSource, /export function completeAdminProductImageUpload\s*\(/, /\n\}/);

  assert.match(prepareApi, /\/image-upload-url/);
  assert.match(prepareApi, /method:\s*"POST"/);
  assert.match(prepareApi, /JSON\.stringify\(metadata\)/);
  assert.match(prepareApi, /Authorization:\s*`Bearer \$\{accessToken\}`/);
  assert.doesNotMatch(prepareApi, /\bFile\b|FormData/);

  assert.match(completeApi, /\/image-upload-complete/);
  assert.match(completeApi, /method:\s*"POST"/);
  assert.match(completeApi, /JSON\.stringify\(\{ objectKey \}\)/);
  assert.match(completeApi, /Authorization:\s*`Bearer \$\{accessToken\}`/);
});

test("server actions authorize metadata and completion without receiving file bytes", () => {
  const prepareAction = declaration(actionsSource, /export async function createProductImageUploadUrlAction\s*\(/, /\nexport async function completeProductImageUploadAction/);
  const completeAction = declaration(actionsSource, /export async function completeProductImageUploadAction\s*\(/, /\nexport async function saveProductIngredientsAction/);

  assert.match(prepareAction, /authorizeAdmin\(\)/);
  assert.match(prepareAction, /productImageUploadMetadataError\(metadata\)/);
  assert.match(prepareAction, /createAdminProductImageUploadUrl\([^,]+,\s*productId,\s*metadata\)/);
  assert.doesNotMatch(prepareAction, /\bFile\b|FormData|revalidateProductPages/);

  assert.match(completeAction, /authorizeAdmin\(\)/);
  assert.match(completeAction, /completeAdminProductImageUpload\([^,]+,\s*productId,\s*objectKey\)/);
  assert.match(completeAction, /revalidateProductPages\(productId\)/);
  assert.doesNotMatch(completeAction, /\bFile\b|FormData/);
});

test("admin form performs direct upload in stages, resets, and refreshes after completion", () => {
  assert.match(formSource, /onSubmit=\{submit\}/);
  assert.match(formSource, /productImageFileError\(file\)/);
  assert.match(formSource, /createProductImageUploadUrlAction\(productId,\s*productImageUploadMetadata\(file\)\)/);
  assert.match(formSource, /putProductImageToPresignedUrl\(file,\s*preparation\.upload\)/);
  assert.match(formSource, /completeProductImageUploadAction\(productId,\s*preparation\.upload\.objectKey\)/);
  assert.match(formSource, /formRef\.current\?\.reset\(\)/);
  assert.match(formSource, /router\.refresh\(\)/);
  assert.match(formSource, /업로드 준비 중/);
  assert.match(formSource, /이미지 전송 중/);
  assert.match(formSource, /등록 반영 중/);
  assert.doesNotMatch(formSource, /FormData|uploadProductImageAction/);
});
