export type UsageVideoStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

export type UsageVideo = {
  id: string;
  productId: string;
  productName: string;
  productBrand: string;
  authorId: string;
  authorNickname: string;
  title: string;
  description: string | null;
  videoUrl: string;
  videoId: string;
  channelName: string;
  channelUrl: string;
  status: UsageVideoStatus;
  featured: boolean;
  displayOrder: number;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

export type UsageVideoPage = {
  content: UsageVideo[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type UsageVideoInput = Pick<UsageVideo, "title" | "videoUrl" | "channelName" | "channelUrl"> & { description: string };
export type UsageVideoModerationInput = {
  status: Exclude<UsageVideoStatus, "PENDING">;
  featured: boolean;
  displayOrder: number;
  moderationNote: string;
};

export const usageVideoStatusLabels: Record<UsageVideoStatus, string> = {
  PENDING: "검토 대기",
  APPROVED: "노출 승인",
  REJECTED: "반려",
  HIDDEN: "노출 숨김",
};

export function readUsageVideoPage(value: string | string[] | undefined): number {
  const number = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number - 1, 100000) : 0;
}
