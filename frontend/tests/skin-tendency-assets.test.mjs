import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import {
  SKIN_TENDENCY_ASSET_BOARD_SRC,
  skinTendencyAssetKey,
} from "../src/lib/skin-tendency-assets.ts";

test("skin tendencies map to stable asset-board keys", () => {
  const expected = new Map([
    ["건성", "dry"],
    ["지성", "oily"],
    ["복합성", "combination"],
    ["수부지", "dehydrated-oily"],
    ["중성", "balanced"],
    ["민감", "sensitive"],
  ]);

  for (const [skinType, assetKey] of expected) {
    assert.equal(skinTendencyAssetKey(skinType), assetKey);
    assert.equal(skinTendencyAssetKey(`  ${skinType}  `), assetKey);
  }
});

test("sensitive alias and unknown values use safe keys", () => {
  assert.equal(skinTendencyAssetKey("민감성"), "sensitive");
  assert.equal(skinTendencyAssetKey("  민감성  "), "sensitive");
  assert.equal(skinTendencyAssetKey("알 수 없는 경향"), "default");
  assert.equal(skinTendencyAssetKey(""), "default");
  assert.equal(skinTendencyAssetKey("   "), "default");
  assert.equal(skinTendencyAssetKey(null), "default");
  assert.equal(skinTendencyAssetKey(undefined), "default");
});

test("skin tendency asset board is the supplied 1536 by 1024 RGBA PNG", async () => {
  assert.equal(SKIN_TENDENCY_ASSET_BOARD_SRC, "/skin/skin-tendency-board.png");
  const boardUrl = new URL(`../public${SKIN_TENDENCY_ASSET_BOARD_SRC}`, import.meta.url);
  const [bytes, metadata] = await Promise.all([readFile(boardUrl), stat(boardUrl)]);

  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
  assert.equal(bytes.readUInt32BE(16), 1536);
  assert.equal(bytes.readUInt32BE(20), 1024);
  assert.equal(bytes[24], 8, "asset board should use 8-bit channels");
  assert.equal(bytes[25], 6, "asset board should use RGBA color type 6");
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "f61b9f0b57e7d9b8656365f7071bc5ac7621185137bb475c8af0c3a7cc48ddb5",
    "skin tendency board should be the supplied replacement asset",
  );
  assert.ok(metadata.size >= 20_000, "asset board is unexpectedly small");
  assert.ok(metadata.size <= 2_000_000, "asset board should stay below 2 MB");
});
