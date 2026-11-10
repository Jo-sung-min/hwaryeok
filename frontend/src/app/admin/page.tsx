import { notFound } from "next/navigation";
import { DatabaseZap, Megaphone, MessageSquareText, Package, SearchCheck, Stethoscope, Trophy, Video } from "lucide-react";
import { AdminCard, AdminHeader } from "@/app/admin/admin-ui";
import { getAdminExpertApplications, getAdminProducts, getAdminPromotions, getAdminReviews } from "@/lib/api";
import { readAuthTokens, recoverAdminPageSession, requireSession } from "@/lib/auth-session";

export default async function AdminPage() {
  const user = await requireSession("/admin");
  if (user.role !== "ADMIN") notFound();
  const { accessToken } = await readAuthTokens();
  if (!accessToken) notFound();

  const [products, applications, promotions, reviews] = await Promise.all([
    getAdminProducts(accessToken),
    getAdminExpertApplications(accessToken),
    getAdminPromotions(accessToken),
    getAdminReviews(accessToken, { page: 0, size: 1 }),
  ]).catch((error) => recoverAdminPageSession(error, "/admin"));
  const pendingApplications = applications.filter((application) => application.status === "PENDING").length;
  const publishedProducts = products.filter((product) => product.publicationStatus === "PUBLISHED").length;
  const draftProducts = products.filter((product) => product.publicationStatus === "DRAFT").length;
  const hiddenProducts = products.filter((product) => product.publicationStatus === "HIDDEN").length;
  const missingSources = products.filter((product) => !product.sourceUrl || !product.sourceCheckedAt).length;
  const visiblePromotions = promotions.filter((item) => item.currentlyVisible).length;
  const productDetail = [
    `공개 ${publishedProducts}`,
    draftProducts > 0 ? `초안 ${draftProducts}` : null,
    hiddenProducts > 0 ? `숨김 ${hiddenProducts}` : null,
    missingSources > 0 ? `출처 보완 ${missingSources}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <>
      <AdminHeader back={false} title="관리자" meta={user.email} />
      <main className="container-page">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <AdminCard href="/admin/products" icon={Package} title="상품" value={products.length} unit="개" detail={productDetail} attention={draftProducts > 0 || missingSources > 0} />
          <AdminCard href="/admin/reviews" icon={MessageSquareText} title="리뷰" value={reviews.totalElements} unit="개" />
          <AdminCard href="/admin/weekly-ranking" icon={Trophy} title="주간 랭킹" />
          <AdminCard href="/admin/usage-videos" icon={Video} title="사용법 영상" />
          <AdminCard href="/admin/promotions" icon={Megaphone} title="광고" value={visiblePromotions} unit="개" detail="노출 중" />
          <AdminCard href="/admin/experts" icon={Stethoscope} title="전문가 인증" value={pendingApplications} unit="건" detail="검토 대기" attention={pendingApplications > 0} />
          <AdminCard href="/admin/data-sources" icon={DatabaseZap} title="원천 데이터" />
          <AdminCard href="/admin/seo" icon={SearchCheck} title="SEO" />
        </div>
      </main>
    </>
  );
}
