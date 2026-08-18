import "server-only";

import type { Analysis, Expert, ExpertAnswer, ExpertApplication, ExpertDetail, ExpertEngagement, ExpertQuestionDetail, ExpertQuestionListItem, ExpertRanking, FavoriteList, FavoriteProduct, Ingredient, IngredientDetail, IngredientFirepower, IngredientPage, IngredientStatus, PreferredIngredients, Product, ProductIngredients, ProductPage, RecentProduct, RecentProductList } from "@/lib/types";

const API_BASE_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ProductQuery = {
  query?: string;
  category?: string;
  grade?: number;
  page?: number;
  size?: number;
  sort?: "score" | "price" | "name" | "brand";
  direction?: "asc" | "desc";
};

export type AnalysisInput = {
  productId: string;
  skinType: string;
  concerns: string[];
  hydrationLevel?: SkinProfile["hydrationLevel"];
  oilinessLevel?: SkinProfile["oilinessLevel"];
  sensitivityLevel?: SkinProfile["sensitivityLevel"];
  breakoutFrequency?: SkinProfile["breakoutFrequency"];
  cleansingTightness?: SkinProfile["cleansingTightness"];
  rednessFrequency?: SkinProfile["rednessFrequency"];
  poreLevel?: SkinProfile["poreLevel"];
  texturePreference?: SkinProfile["texturePreference"];
  routineComplexity?: SkinProfile["routineComplexity"];
  sunscreenUsage?: SkinProfile["sunscreenUsage"];
  reactionTriggers?: string[];
  environments?: string[];
};

export type IngredientQuery = {
  query?: string;
  status?: IngredientStatus;
  tag?: string;
  page?: number;
  size?: number;
  sort?: "name" | "englishName" | "role" | "status";
  direction?: "asc" | "desc";
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { code?: string; message?: string; fieldErrors?: Record<string, string> } | null;
    throw new ApiRequestError(
      body?.message ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      response.status,
      body?.code,
      body?.fieldErrors ?? {},
    );
  }

  return response.json() as Promise<T>;
}

export type SignupInput = {
  nickname: string;
  email: string;
  password: string;
  passwordConfirm: string;
  termsAccepted: boolean;
};

export type SignupResult = {
  userId: string;
  email: string;
  nickname: string;
  nextStep: "SKIN_PROFILE";
  createdAt: string;
};

export type OAuthProviderStatus = {
  id: "google" | "kakao" | "naver";
  name: string;
  configured: boolean;
  authorizationPath: string;
};

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  role: string;
  authMethod: string;
};

export type AuthTokenResult = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  user: AuthUser;
};

export type SkinProfile = {
  configured: boolean;
  skinType: string | null;
  hydrationLevel: "LOW" | "BALANCED" | "HIGH" | null;
  oilinessLevel: "LOW" | "BALANCED" | "HIGH" | null;
  sensitivityLevel: "LOW" | "MEDIUM" | "HIGH" | null;
  breakoutFrequency: "RARE" | "OCCASIONAL" | "FREQUENT" | null;
  profileVersion: number;
  cleansingTightness: "NONE" | "SHORT" | "LONG" | null;
  rednessFrequency: "RARE" | "OCCASIONAL" | "FREQUENT" | null;
  poreLevel: "LOW" | "MEDIUM" | "HIGH" | null;
  texturePreference: "LIGHT" | "BALANCED" | "RICH" | null;
  routineComplexity: "MINIMAL" | "STANDARD" | "LAYERED" | null;
  sunscreenUsage: "RARE" | "SOMETIMES" | "DAILY" | null;
  reactionTriggers: string[];
  breakoutZones: string[];
  environments: string[];
  concerns: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

const oauthProviderFallback: OAuthProviderStatus[] = [
  { id: "kakao", name: "카카오", configured: false, authorizationPath: "/oauth2/authorization/kakao" },
  { id: "naver", name: "네이버", configured: false, authorizationPath: "/oauth2/authorization/naver" },
  { id: "google", name: "구글", configured: false, authorizationPath: "/oauth2/authorization/google" },
];

export function signupUser(input: SignupInput): Promise<SignupResult> {
  return requestJson<SignupResult>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(input: { email: string; password: string }): Promise<AuthTokenResult> {
  return requestJson<AuthTokenResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refreshAuthTokens(refreshToken: string): Promise<AuthTokenResult> {
  return requestJson<AuthTokenResult>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function exchangeOAuthCode(code: string): Promise<AuthTokenResult> {
  return requestJson<AuthTokenResult>("/auth/oauth/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function logoutSession(refreshToken: string): Promise<{ loggedOut: boolean }> {
  return requestJson<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return requestJson<AuthUser>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getUserSkinProfile(accessToken: string): Promise<SkinProfile> {
  return requestJson<SkinProfile>("/users/me/skin-profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function saveUserSkinProfile(
  accessToken: string,
  input: {
    skinType: string;
    hydrationLevel: "LOW" | "BALANCED" | "HIGH";
    oilinessLevel: "LOW" | "BALANCED" | "HIGH";
    sensitivityLevel: "LOW" | "MEDIUM" | "HIGH";
    breakoutFrequency: "RARE" | "OCCASIONAL" | "FREQUENT";
    cleansingTightness: "NONE" | "SHORT" | "LONG";
    rednessFrequency: "RARE" | "OCCASIONAL" | "FREQUENT";
    poreLevel: "LOW" | "MEDIUM" | "HIGH";
    texturePreference: "LIGHT" | "BALANCED" | "RICH";
    routineComplexity: "MINIMAL" | "STANDARD" | "LAYERED";
    sunscreenUsage: "RARE" | "SOMETIMES" | "DAILY";
    reactionTriggers: string[];
    breakoutZones: string[];
    environments: string[];
    concerns: string[];
  },
): Promise<SkinProfile> {
  return requestJson<SkinProfile>("/users/me/skin-profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function getUserFavorites(accessToken: string): Promise<FavoriteList> {
  return requestJson<FavoriteList>("/users/me/favorites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function addUserFavorite(accessToken: string, productId: string): Promise<FavoriteProduct> {
  return requestJson<FavoriteProduct>(`/users/me/favorites/${encodeURIComponent(productId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function removeUserFavorite(accessToken: string, productId: string): Promise<void> {
  await requestEmpty(`/users/me/favorites/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getUserRecentProducts(accessToken: string): Promise<RecentProductList> {
  return requestJson<RecentProductList>("/users/me/recent-products", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function recordUserRecentProduct(accessToken: string, productId: string): Promise<RecentProduct> {
  return requestJson<RecentProduct>(`/users/me/recent-products/${encodeURIComponent(productId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getOAuthProviders(): Promise<OAuthProviderStatus[]> {
  try {
    const providers = await requestJson<OAuthProviderStatus[]>("/auth/oauth/providers");
    return oauthProviderFallback.map((fallback) => providers.find((provider) => provider.id === fallback.id) ?? fallback);
  } catch {
    return oauthProviderFallback;
  }
}

export function getProductPage(query: ProductQuery = {}): Promise<ProductPage> {
  const search = new URLSearchParams();
  if (query.query) search.set("query", query.query);
  if (query.category && query.category !== "전체") search.set("category", query.category);
  if (query.grade) search.set("grade", String(query.grade));
  search.set("page", String(query.page ?? 0));
  search.set("size", String(query.size ?? 12));
  search.set("sort", query.sort ?? "score");
  search.set("direction", query.direction ?? "desc");

  return requestJson<ProductPage>(`/products?${search}`);
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const result = await getProductPage({ ...query, page: 0, size: 50 });
  return result.content;
}

export function getProduct(id: string): Promise<Product> {
  return requestJson<Product>(`/products/${encodeURIComponent(id)}`);
}

export function getRanking(profile: string | SkinProfile, limit = 6): Promise<Product[]> {
  const skinType = typeof profile === "string" ? profile : profile.skinType ?? "수부지";
  const search = new URLSearchParams({ skinType, limit: String(limit) });
  if (typeof profile !== "string") {
    if (profile.hydrationLevel) search.set("hydrationLevel", profile.hydrationLevel);
    if (profile.oilinessLevel) search.set("oilinessLevel", profile.oilinessLevel);
    if (profile.sensitivityLevel) search.set("sensitivityLevel", profile.sensitivityLevel);
    if (profile.texturePreference) search.set("texturePreference", profile.texturePreference);
    profile.concerns.forEach((concern) => search.append("concerns", concern));
  }
  return requestJson<Product[]>(`/products/ranking?${search}`);
}

export function getAnalysis(input: AnalysisInput): Promise<Analysis> {
  return requestJson<Analysis>("/analyses/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getIngredients(query: IngredientQuery = {}): Promise<IngredientPage> {
  const search = new URLSearchParams();
  if (query.query) search.set("query", query.query);
  if (query.status) search.set("status", query.status);
  if (query.tag) search.set("tag", query.tag);
  search.set("page", String(query.page ?? 0));
  search.set("size", String(query.size ?? 12));
  search.set("sort", query.sort ?? "name");
  search.set("direction", query.direction ?? "asc");
  return requestJson<IngredientPage>(`/ingredients?${search}`);
}

export function getIngredient(id: string): Promise<IngredientDetail> {
  return requestJson<IngredientDetail>(`/ingredients/${encodeURIComponent(id)}`);
}

export function getFeaturedIngredients(limit = 10): Promise<Ingredient[]> {
  return requestJson<Ingredient[]>(`/ingredients/featured?limit=${limit}`);
}

export function getIngredientFirepower(id: string, limit = 20): Promise<IngredientFirepower> {
  return requestJson<IngredientFirepower>(`/ingredients/${encodeURIComponent(id)}/firepower?limit=${limit}`);
}

export function getUserPreferredIngredients(accessToken: string): Promise<PreferredIngredients> {
  return requestJson<PreferredIngredients>("/users/me/preferred-ingredients", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function saveUserPreferredIngredients(accessToken: string, ingredientIds: string[]): Promise<PreferredIngredients> {
  return requestJson<PreferredIngredients>("/users/me/preferred-ingredients", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ ingredientIds }),
  });
}

export async function uploadAdminProductImage(accessToken: string, productId: string, file: File): Promise<Product> {
  const formData = new FormData();
  formData.set("file", file);
  const response = await fetch(`${API_BASE_URL}/admin/products/${encodeURIComponent(productId)}/image`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { code?: string; message?: string; fieldErrors?: Record<string, string> } | null;
    throw new ApiRequestError(
      body?.message ?? "제품 이미지를 등록하지 못했어요.",
      response.status,
      body?.code,
      body?.fieldErrors ?? {},
    );
  }
  return response.json() as Promise<Product>;
}

export function getProductIngredients(productId: string): Promise<ProductIngredients> {
  return requestJson<ProductIngredients>(`/products/${encodeURIComponent(productId)}/ingredients`);
}

export function getExperts(topic?: string): Promise<Expert[]> {
  const search = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return requestJson<Expert[]>(`/experts${search}`);
}

export function getExpert(slug: string): Promise<ExpertDetail> {
  return requestJson<ExpertDetail>(`/experts/${encodeURIComponent(slug)}`);
}

export function getExpertRanking(period = "MONTH", topic?: string): Promise<ExpertRanking> {
  const search = new URLSearchParams({ period });
  if (topic) search.set("topic", topic);
  return requestJson<ExpertRanking>(`/experts/rankings?${search}`);
}

export function getExpertQuestions(status?: string): Promise<ExpertQuestionListItem[]> {
  const search = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson<ExpertQuestionListItem[]>(`/questions${search}`);
}

export function getExpertQuestion(questionId: string, accessToken?: string): Promise<ExpertQuestionDetail> {
  return requestJson<ExpertQuestionDetail>(`/questions/${encodeURIComponent(questionId)}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export function createExpertQuestion(
  accessToken: string,
  input: { title: string; content: string; skinType?: string; ingredientId?: string },
): Promise<ExpertQuestionDetail> {
  return requestJson<ExpertQuestionDetail>("/users/me/questions", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function createExpertAnswer(accessToken: string, questionId: string, content: string): Promise<ExpertAnswer> {
  return requestJson<ExpertAnswer>(`/expert/questions/${encodeURIComponent(questionId)}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ content }),
  });
}

export function setExpertAnswerReaction(
  accessToken: string,
  answerId: string,
  type: "helpful" | "save",
  selected: boolean,
): Promise<ExpertEngagement> {
  return requestJson<ExpertEngagement>(`/users/me/expert-answers/${encodeURIComponent(answerId)}/${type}`, {
    method: selected ? "PUT" : "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function adoptExpertAnswer(accessToken: string, questionId: string, answerId: string): Promise<ExpertEngagement> {
  return requestJson<ExpertEngagement>(`/users/me/questions/${encodeURIComponent(questionId)}/adopt/${encodeURIComponent(answerId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export type ExpertApplicationInput = {
  realName: string;
  licenseNumber: string;
  specialistRequested: boolean;
  specialty?: string;
  topics: string[];
  bio: string;
  workplace: { hospitalName: string; region: string; address: string; phone?: string; homepageUrl?: string };
};

export function getMyExpertApplication(accessToken: string): Promise<ExpertApplication> {
  return requestJson<ExpertApplication>("/experts/me/application", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function submitExpertApplication(accessToken: string, input: ExpertApplicationInput): Promise<ExpertApplication> {
  return requestJson<ExpertApplication>("/experts/me/application", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

export function getAdminExpertApplications(accessToken: string): Promise<ExpertApplication[]> {
  return requestJson<ExpertApplication[]>("/admin/experts/applications", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function verifyExpertApplication(
  accessToken: string,
  expertId: string,
  input: { status: "VERIFIED" | "REJECTED"; doctorVerified: boolean; specialistVerified: boolean; workplaceVerified: boolean },
): Promise<ExpertApplication> {
  return requestJson<ExpertApplication>(`/admin/experts/${encodeURIComponent(expertId)}/verification`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
}

async function requestEmpty(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { code?: string; message?: string; fieldErrors?: Record<string, string> } | null;
    throw new ApiRequestError(
      body?.message ?? "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
      response.status,
      body?.code,
      body?.fieldErrors ?? {},
    );
  }
}
