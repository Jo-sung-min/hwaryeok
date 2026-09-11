import { ApiRequestError, getProductPage } from "@/lib/api";
import { getOptionalSkinProfile } from "@/lib/auth-session";
import { PRODUCT_PAGE_SIZE, productCatalogBackendFilters, readProductCatalogState } from "@/lib/product-catalog";

const privateNoStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const rawCursor = searchParams.get("cursor") ?? "";
  const cursor = Number(rawCursor);

  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > 1_000) {
    return Response.json({ message: "불러올 상품 위치가 올바르지 않아요." }, { status: 400, headers: privateNoStoreHeaders });
  }

  const { filters } = readProductCatalogState(Object.fromEntries(searchParams.entries()));

  try {
    const profile = await getOptionalSkinProfile();
    const page = await getProductPage({
      ...productCatalogBackendFilters(filters),
      profile: profile ?? undefined,
      page: cursor,
      size: PRODUCT_PAGE_SIZE,
    }, { signal: request.signal });
    return Response.json(page, { headers: privateNoStoreHeaders });
  } catch (error) {
    const status = error instanceof ApiRequestError && error.status >= 400 && error.status < 500 ? error.status : 502;
    return Response.json(
      { message: error instanceof ApiRequestError ? error.message : "상품을 더 불러오지 못했어요." },
      { status, headers: privateNoStoreHeaders },
    );
  }
}
