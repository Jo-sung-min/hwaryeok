import type { Metadata } from "next";
import { getFavoriteViewState } from "@/lib/auth-session";
import { findFaceSymptom, findFaceZone } from "@/lib/face-concerns";
import { getFaceConcernRecommendations } from "./actions";
import { FaceConcernFinder } from "./face-concern-finder";

export const metadata: Metadata = {
  title: "얼굴에서 고민 찾기",
  description: "얼굴에서 신경 쓰이는 부위를 누르고 증상 확대컷으로 내 고민을 확인한 뒤, 맞는 성분과 화장품을 바로 찾아보세요.",
};

export default async function FaceConcernPage({ searchParams }: PageProps<"/skin-check/face">) {
  const search = await searchParams;
  const initialSymptom = findFaceSymptom(typeof search.symptom === "string" ? search.symptom : null);
  const initialZone = initialSymptom ? findFaceZone(initialSymptom.zone) : findFaceZone(typeof search.zone === "string" ? search.zone : null);
  const [favorites, initialResult] = await Promise.all([
    getFavoriteViewState(),
    initialSymptom ? getFaceConcernRecommendations(initialSymptom.id) : null,
  ]);

  return <FaceConcernFinder
    initialZoneId={initialZone?.id ?? null}
    initialSymptomId={initialSymptom?.id ?? null}
    initialResult={initialResult}
    isAuthenticated={favorites.isAuthenticated}
    favoriteIds={favorites.favoriteIds}
  />;
}
