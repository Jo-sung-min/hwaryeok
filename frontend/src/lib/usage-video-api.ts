import "server-only";

import { ApiRequestError } from "@/lib/api";
import type { UsageVideo, UsageVideoInput, UsageVideoModerationInput, UsageVideoPage, UsageVideoStatus } from "@/lib/usage-video-types";

const API_BASE_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

async function request<T>(path: string, accessToken?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; code?: string; fieldErrors?: Record<string, string> } | null;
    throw new ApiRequestError(body?.message ?? "사용법 영상 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.", response.status, body?.code, body?.fieldErrors);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export function getProductUsageVideos(productId: string, page = 0, size = 6): Promise<UsageVideoPage> {
  return request(`/products/${encodeURIComponent(productId)}/usage-videos?page=${page}&size=${size}`);
}

export function createUsageVideo(accessToken: string, productId: string, input: UsageVideoInput): Promise<UsageVideo> {
  return request(`/products/${encodeURIComponent(productId)}/usage-videos`, accessToken, { method: "POST", body: JSON.stringify(input) });
}

export function getMyUsageVideos(accessToken: string, page = 0, size = 10): Promise<UsageVideoPage> {
  return request(`/me/usage-videos?page=${page}&size=${size}`, accessToken);
}

export function updateMyUsageVideo(accessToken: string, id: string, input: UsageVideoInput): Promise<UsageVideo> {
  return request(`/me/usage-videos/${encodeURIComponent(id)}`, accessToken, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteMyUsageVideo(accessToken: string, id: string): Promise<void> {
  return request(`/me/usage-videos/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

export function getAdminUsageVideos(accessToken: string, status?: UsageVideoStatus, page = 0, size = 10): Promise<UsageVideoPage> {
  const search = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) search.set("status", status);
  return request(`/admin/usage-videos?${search}`, accessToken);
}

export function moderateUsageVideo(accessToken: string, id: string, input: UsageVideoModerationInput): Promise<UsageVideo> {
  return request(`/admin/usage-videos/${encodeURIComponent(id)}`, accessToken, { method: "PATCH", body: JSON.stringify(input) });
}
