// 에셋을 S3에 올리고 CDN 주소를 돌려준다. AWS CLI 없이 SigV4로 직접 서명한다.
// 설정은 환경변수 또는 backend/.env에서 읽는다: S3_BUCKET, S3_KEY_PREFIX, S3_PUBLIC_BASE_URL,
// AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY(, AWS_SESSION_TOKEN). 값은 출력하지 않는다.

import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { exists, frontendDir } from "./openai-image.mjs";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();

async function readSettings() {
  const dotenv = {};
  const envFile = path.resolve(frontendDir, "..", "backend", ".env");
  if (await exists(envFile)) {
    for (const line of (await readFile(envFile, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) dotenv[match[1]] = match[2].trim();
    }
  }
  const get = (name) => (process.env[name] ?? dotenv[name] ?? "").trim();
  const settings = {
    bucket: get("S3_BUCKET"),
    keyPrefix: get("S3_KEY_PREFIX").replace(/^\/+|\/+$/g, ""),
    publicBaseUrl: get("S3_PUBLIC_BASE_URL").replace(/\/+$/, ""),
    region: get("AWS_REGION"),
    accessKeyId: get("AWS_ACCESS_KEY_ID"),
    secretAccessKey: get("AWS_SECRET_ACCESS_KEY"),
    sessionToken: get("AWS_SESSION_TOKEN"),
  };
  const missing = ["bucket", "keyPrefix", "publicBaseUrl", "region", "accessKeyId", "secretAccessKey"].filter((name) => !settings[name]);
  if (missing.length) throw new Error(`S3 설정이 빠졌어요: ${missing.join(", ")} (backend/.env 확인)`);
  if (settings.keyPrefix.includes("..") || settings.keyPrefix.includes("\\")) throw new Error("S3_KEY_PREFIX 값이 올바르지 않아요.");
  return settings;
}

/**
 * 공개 에셋을 올린다. assetPath는 CDN 주소 뒤에 붙는 경로다(예: "/assets/skin-check/sheet-v1.webp").
 * 파일 이름에 버전을 넣는 것을 전제로 오래 캐시되게 올린다. 같은 경로에 덮어쓰지 말고 버전을 올린다.
 */
export async function uploadPublicAsset(assetPath, body, contentType) {
  if (!/^\/assets\/[A-Za-z0-9/_.-]+$/.test(assetPath) || assetPath.includes("..")) throw new Error(`올릴 수 없는 경로예요: ${assetPath}`);
  const settings = await readSettings();
  const key = `${settings.keyPrefix}${assetPath}`;
  const host = `${settings.bucket}.s3.${settings.region}.amazonaws.com`;
  const uri = `/${key.split("/").map(encodeURIComponent).join("/")}`;
  const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256(body);

  const headers = {
    "cache-control": CACHE_CONTROL,
    "content-type": contentType,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (settings.sessionToken) headers["x-amz-security-token"] = settings.sessionToken;

  const signedNames = Object.keys(headers).sort();
  const canonicalRequest = [
    "PUT", uri, "",
    signedNames.map((name) => `${name}:${headers[name]}\n`).join(""),
    signedNames.join(";"),
    payloadHash,
  ].join("\n");
  const scope = `${date}/${settings.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signingKey = ["s3", "aws4_request"].reduce(hmac, hmac(hmac(`AWS4${settings.secretAccessKey}`, date), settings.region));
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const { host: _host, ...requestHeaders } = headers;
  const response = await fetch(`https://${host}${uri}`, {
    method: "PUT",
    headers: {
      ...requestHeaders,
      Authorization: `AWS4-HMAC-SHA256 Credential=${settings.accessKeyId}/${scope}, SignedHeaders=${signedNames.join(";")}, Signature=${signature}`,
    },
    body,
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).match(/<Code>([^<]+)<\/Code>\s*<Message>([^<]+)<\/Message>/);
    throw new Error(`S3 업로드 실패 (${response.status}${detail ? ` ${detail[1]}: ${detail[2]}` : ""})`);
  }
  return { key, url: `${settings.publicBaseUrl}${assetPath}` };
}

/** CDN 주소로 실제 응답이 오는지 확인한다. */
export async function checkPublicAsset(url) {
  const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30_000) });
  await response.arrayBuffer();
  return { status: response.status, contentType: response.headers.get("content-type") };
}
