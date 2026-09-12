export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ProductImageContentType = (typeof PRODUCT_IMAGE_CONTENT_TYPES)[number];

export type ProductImageUploadMetadata = {
  fileName: string;
  contentType: ProductImageContentType;
  size: number;
};

export type ProductImageUploadTicket = {
  uploadUrl: string;
  objectKey: string;
  imageUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export const PROFILE_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png"] as const;

export type ProfileImageContentType = (typeof PROFILE_IMAGE_CONTENT_TYPES)[number];

export type ProfileImageUploadMetadata = {
  fileName: string;
  contentType: ProfileImageContentType;
  size: number;
};

type ProductImageFile = Pick<File, "name" | "size" | "type">;

export function productImageFileError(file: ProductImageFile | null | undefined): string | null {
  if (!file || file.size === 0 || !file.name.trim()) return "이미지 파일을 선택해 주세요.";
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return "이미지는 5MB 이하만 등록할 수 있어요.";
  if (!isProductImageContentType(file.type)) return "PNG, JPG, WEBP 이미지만 등록할 수 있어요.";
  return null;
}

export function productImageUploadMetadata(file: ProductImageFile): ProductImageUploadMetadata {
  return {
    fileName: file.name,
    contentType: file.type as ProductImageContentType,
    size: file.size,
  };
}

export function productImageUploadMetadataError(input: unknown): string | null {
  if (!input || typeof input !== "object") return "이미지 정보를 다시 확인해 주세요.";
  const metadata = input as Partial<ProductImageUploadMetadata>;
  if (typeof metadata.fileName !== "string" || !metadata.fileName.trim()) return "이미지 파일명을 다시 확인해 주세요.";
  if (typeof metadata.size !== "number" || !Number.isInteger(metadata.size) || metadata.size <= 0) return "이미지 크기를 다시 확인해 주세요.";
  if (metadata.size > PRODUCT_IMAGE_MAX_BYTES) return "이미지는 5MB 이하만 등록할 수 있어요.";
  if (!isProductImageContentType(metadata.contentType)) return "PNG, JPG, WEBP 이미지만 등록할 수 있어요.";
  return null;
}

export function profileImageFileError(file: ProductImageFile | null | undefined): string | null {
  if (!file || file.size === 0 || !file.name.trim()) return "프로필 사진을 선택해 주세요.";
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return "프로필 사진은 5MB 이하만 등록할 수 있어요.";
  if (!isProfileImageContentType(file.type)) return "프로필 사진은 PNG 또는 JPG 이미지만 등록할 수 있어요.";
  return null;
}

export function profileImageUploadMetadata(file: ProductImageFile): ProfileImageUploadMetadata {
  return {
    fileName: file.name,
    contentType: file.type as ProfileImageContentType,
    size: file.size,
  };
}

export function profileImageUploadMetadataError(input: unknown): string | null {
  if (!input || typeof input !== "object") return "프로필 사진 정보를 다시 확인해 주세요.";
  const metadata = input as Partial<ProfileImageUploadMetadata>;
  if (typeof metadata.fileName !== "string" || !metadata.fileName.trim()) return "프로필 사진 파일명을 다시 확인해 주세요.";
  if (typeof metadata.size !== "number" || !Number.isInteger(metadata.size) || metadata.size <= 0) return "프로필 사진 크기를 다시 확인해 주세요.";
  if (metadata.size > PRODUCT_IMAGE_MAX_BYTES) return "프로필 사진은 5MB 이하만 등록할 수 있어요.";
  if (!isProfileImageContentType(metadata.contentType)) return "프로필 사진은 PNG 또는 JPG 이미지만 등록할 수 있어요.";
  return null;
}

export async function putProductImageToPresignedUrl(
  file: File,
  ticket: ProductImageUploadTicket,
  request: typeof fetch = fetch,
): Promise<void> {
  const response = await request(ticket.uploadUrl, {
    method: "PUT",
    headers: ticket.headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`이미지 전송에 실패했어요. 잠시 후 다시 시도해 주세요. (${response.status})`);
  }
}

function isProductImageContentType(value: unknown): value is ProductImageContentType {
  return typeof value === "string" && PRODUCT_IMAGE_CONTENT_TYPES.some((contentType) => contentType === value);
}

function isProfileImageContentType(value: unknown): value is ProfileImageContentType {
  return typeof value === "string" && PROFILE_IMAGE_CONTENT_TYPES.some((contentType) => contentType === value);
}
