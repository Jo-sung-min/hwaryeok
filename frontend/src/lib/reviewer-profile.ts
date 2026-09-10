import type { ReviewerBioBlock } from "@/lib/types";

const MAX_BIO_JSON_LENGTH = 50_000;
const MAX_TOP_LEVEL_BIO_BLOCKS = 200;
const MAX_TOTAL_BIO_NODES = 4_000;
const MAX_BIO_DEPTH = 20;
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const INLINE_BLOCK_TYPES = new Set(["paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "quote", "toggleListItem"]);
const REVIEWER_BLOCK_TYPES = new Set([...INLINE_BLOCK_TYPES, "codeBlock", "divider"]);
const COMMON_PROP_KEYS = ["backgroundColor", "textColor", "textAlignment"];
const BLOCK_PROP_KEYS: Record<string, Set<string>> = {
  paragraph: new Set(COMMON_PROP_KEYS),
  heading: new Set([...COMMON_PROP_KEYS, "level", "isToggleable"]),
  bulletListItem: new Set(COMMON_PROP_KEYS),
  numberedListItem: new Set([...COMMON_PROP_KEYS, "start"]),
  checkListItem: new Set([...COMMON_PROP_KEYS, "checked"]),
  quote: new Set(["backgroundColor", "textColor"]),
  toggleListItem: new Set(COMMON_PROP_KEYS),
  codeBlock: new Set(["language"]),
  divider: new Set(),
};
const STYLE_KEYS = new Set(["bold", "italic", "underline", "strike", "code", "textColor", "backgroundColor"]);
const BOOLEAN_STYLE_KEYS = new Set(["bold", "italic", "underline", "strike", "code"]);
const BLOCK_KEYS = new Set(["id", "type", "props", "content", "children"]);
const TEXT_KEYS = new Set(["type", "text", "styles"]);
const DEFAULT_COLORS = new Set(["default", "gray", "brown", "red", "orange", "yellow", "green", "blue", "purple", "pink"]);
const SAFE_CSS_COLOR = /^(?:#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|(?:rgb|rgba|hsl|hsla)\([0-9\s,.%+\-]+\))$/i;

export function parseReviewerBioBlocks(value: FormDataEntryValue | null): ReviewerBioBlock[] {
  if (typeof value !== "string" || value.length > MAX_BIO_JSON_LENGTH) {
    throw new Error("소개 내용은 50,000자 이내로 작성해 주세요.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("소개 내용을 읽지 못했어요. 새로고침 후 다시 작성해 주세요.");
  }

  if (!isSafeReviewerBioBlocks(parsed)) {
    throw new Error("소개 내용의 블록 형식을 다시 확인해 주세요.");
  }
  return parsed;
}

export function normalizeReviewerBioBlocks(value: unknown): ReviewerBioBlock[] {
  return isSafeReviewerBioBlocks(value) ? value : [];
}

export function normalizeReviewerUrl(value: FormDataEntryValue | null, kind: "blog" | "instagram"): string | null {
  const label = kind === "blog" ? "블로그" : "Instagram";
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return null;
  if (normalized.length > 2048 || normalized.includes("\0")) {
    throw new Error(`${label} 주소는 2,048자 이내로 입력해 주세요.`);
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${label} 주소 형식을 다시 확인해 주세요.`);
  }
  if (!(["http:", "https:"] as string[]).includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error(`${label} 주소는 http 또는 https로 시작하는 웹 주소여야 해요.`);
  }
  if (kind === "instagram" && !INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Instagram 주소는 instagram.com 프로필 링크를 입력해 주세요.");
  }
  return normalized;
}

export function hasMeaningfulReviewerBio(blocks: ReviewerBioBlock[]): boolean {
  return blocks.some((block) => hasContent(block.content) || hasContent(block.children));
}

function isSafeReviewerBioBlocks(value: unknown): value is ReviewerBioBlock[] {
  if (!Array.isArray(value) || value.length > MAX_TOP_LEVEL_BIO_BLOCKS) return false;
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_BIO_JSON_LENGTH) return false;
  } catch {
    return false;
  }

  if (!hasSafeDocumentComplexity(value, 0, { count: 0 })) return false;
  const state = { count: 0, ids: new Set<string>() };
  return value.every((block) => isSafeReviewerBlock(block, 0, state));
}

function isSafeReviewerBlock(value: unknown, depth: number, state: { count: number; ids: Set<string> }): value is ReviewerBioBlock {
  if (!isRecord(value) || !hasOnlyKeys(value, BLOCK_KEYS) || depth > MAX_BIO_DEPTH || ++state.count > MAX_TOTAL_BIO_NODES) return false;
  if (typeof value.type !== "string" || !REVIEWER_BLOCK_TYPES.has(value.type)) return false;
  if (value.id !== undefined) {
    if (typeof value.id !== "string" || !value.id.trim() || value.id.length > 128 || value.id.includes("\0") || state.ids.has(value.id)) return false;
    state.ids.add(value.id);
  }
  if (!hasSafeProps(value.type, value.props)) return false;

  if (value.children !== undefined) {
    if (!Array.isArray(value.children) || !value.children.every((child) => isSafeReviewerBlock(child, depth + 1, state))) return false;
  }

  if (INLINE_BLOCK_TYPES.has(value.type)) {
    return isSafeTextBlockContent(value.content);
  }
  if (value.type === "codeBlock") return isSafeCodeBlockContent(value.content);
  return value.content === undefined || value.content === null;
}

function hasSafeProps(type: string, value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  const allowed = BLOCK_PROP_KEYS[type];
  if (!allowed) return false;
  for (const [key, prop] of Object.entries(value)) {
    if (!allowed.has(key)) return false;
    if (["backgroundColor", "textColor"].includes(key) && !isSafeColor(prop)) return false;
    if (key === "language" && !isSafeText(prop, 80)) return false;
    if (key === "textAlignment" && (typeof prop !== "string" || !["left", "center", "right", "justify"].includes(prop))) return false;
    if (key === "level" && (typeof prop !== "number" || !Number.isInteger(prop) || prop < 1 || prop > 6)) return false;
    if (key === "start" && (typeof prop !== "number" || !Number.isSafeInteger(prop) || prop < 1 || prop > 1_000_000)) return false;
    if (["checked", "isToggleable"].includes(key) && typeof prop !== "boolean") return false;
  }
  return true;
}

function isSafeTextBlockContent(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return isSafeText(value, MAX_BIO_JSON_LENGTH);
  return Array.isArray(value) && value.every((item) => typeof item === "string" ? isSafeText(item, MAX_BIO_JSON_LENGTH) : isSafeInlineContent(item));
}

function isSafeCodeBlockContent(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return isSafeText(value, MAX_BIO_JSON_LENGTH);
  return Array.isArray(value) && value.every((item) => {
    if (!isRecord(item) || !hasOnlyKeys(item, TEXT_KEYS) || item.type !== "text" || !isSafeText(item.text, MAX_BIO_JSON_LENGTH)) return false;
    return isRecord(item.styles) && Object.keys(item.styles).length === 0;
  });
}

function isSafeInlineContent(value: unknown): boolean {
  return isRecord(value)
    && hasOnlyKeys(value, TEXT_KEYS)
    && value.type === "text"
    && isSafeText(value.text, MAX_BIO_JSON_LENGTH)
    && hasSafeStyles(value.styles);
}

function hasSafeStyles(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([key, style]) => {
    if (!STYLE_KEYS.has(key)) return false;
    return BOOLEAN_STYLE_KEYS.has(key) ? typeof style === "boolean" : isSafeColor(style);
  });
}

function isSafeColor(value: unknown): value is string {
  return typeof value === "string" && (DEFAULT_COLORS.has(value) || SAFE_CSS_COLOR.test(value));
}

function isSafeText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength && !value.includes("\0");
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function hasSafeDocumentComplexity(value: unknown, depth: number, state: { count: number }): boolean {
  if (depth > MAX_BIO_DEPTH || ++state.count > MAX_TOTAL_BIO_NODES) return false;
  if (Array.isArray(value)) return value.every((item) => hasSafeDocumentComplexity(item, depth + 1, state));
  if (isRecord(value)) return Object.values(value).every((item) => hasSafeDocumentComplexity(item, depth + 1, state));
  return true;
}

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasContent);
  if (!isRecord(value)) return false;
  if (typeof value.text === "string" && value.text.trim()) return true;
  return hasContent(value.content) || hasContent(value.children);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
