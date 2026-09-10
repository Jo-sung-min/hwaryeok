import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeeklyRankingSlides, homeCatalogHref, homeDisplayMode, homeProductListHref, readHomeCatalogFilters } from '../src/lib/home-catalog.ts';

const product = (id, extra = {}) => ({ id, name: `제품${id}`, brand: '테스트', category: '앰플', publicationStatus: 'PUBLISHED', imageUrl: '/test.png', ...extra });
test('guest and unconfigured users never get personalized mode', () => {
  assert.equal(homeDisplayMode(false, false), 'guest');
  assert.equal(homeDisplayMode(false, true), 'guest');
  assert.equal(homeDisplayMode(true, false), 'needs-profile');
  assert.equal(homeDisplayMode(true, true), 'personalized');
});
test('category href retains home and safely encodes user input', () => {
  assert.equal(homeCatalogHref(), '/');
  assert.equal(homeCatalogHref({ category: '앰플' }, 'home-products'), '/?category=%EC%95%B0%ED%94%8C#home-products');
  assert.equal(homeCatalogHref({ category: 'a&b' }), '/?category=a%26b');
});
test('home filter parser accepts only supported thresholds and bounds identifiers', () => {
  assert.deepEqual(readHomeCatalogFilters({ category: ['토너', '크림'], ingredientId: 'niacinamide', minReviewScore: '80', minFirepowerScore: '65' }), {
    category: '토너', ingredientId: 'niacinamide', minReviewScore: 80, minFirepowerScore: 65,
  });
  const invalid = readHomeCatalogFilters({ ingredientId: 'x'.repeat(100), minReviewScore: '75', minFirepowerScore: '101' });
  assert.equal(invalid.ingredientId.length, 64);
  assert.equal(invalid.minReviewScore, null);
  assert.equal(invalid.minFirepowerScore, null);
});
test('home and product-list links retain every active filter without default noise', () => {
  const filters = { category: '토너', ingredientId: 'niacinamide', minReviewScore: 80, minFirepowerScore: 65 };
  assert.equal(homeCatalogHref(filters, 'home-products'), '/?category=%ED%86%A0%EB%84%88&ingredientId=niacinamide&minReviewScore=80&minFirepowerScore=65#home-products');
  assert.equal(homeProductListHref(filters, true), '/products?category=%ED%86%A0%EB%84%88&ingredientId=niacinamide&minReviewScore=80&minFirepowerScore=65');
  assert.match(homeProductListHref(filters, false), /&order=name-asc$/);
});
test('weekly banner uses ranked products and their review metrics', () => {
  const content = Array.from({length: 12}, (_, index) => ({
    product: product(String(index)), rank: index + 1, reviewCount: 20 - index, reviewScore: 90 - index,
  }));
  content[1].product.publicationStatus = 'HIDDEN';
  content[2].product.imageUrl = null;
  const slides = buildWeeklyRankingSlides({
    weekStart: '2026-09-07', nextRefreshOn: '2026-09-14', mode: 'AUTO', scoreBasis: '평가 개수, 평가점수 순', content,
  }, []);
  assert.equal(slides.length, 10);
  assert.equal(slides[0].id, '2026-09-07-0');
  assert.match(slides[0].label, /이주의 화력 랭킹 · 평가 20개/);
  assert.match(slides[0].description, /평가점수 90\.0 \/ 100/);
  assert.ok(slides.every(s => s.product.imageUrl && s.product.publicationStatus === 'PUBLISHED'));
});
test('weekly banner falls back safely while ranking data is unavailable', () => {
  assert.deepEqual(buildWeeklyRankingSlides(null, []), []);
  const slides = buildWeeklyRankingSlides(null, [product('a'), product('hidden', { publicationStatus: 'HIDDEN' }), product('noimage', { imageUrl: null }), product('b')]);
  assert.deepEqual(slides.map(s => s.product.id), ['a', 'b']);
  assert.ok(slides.every(s => s.label.includes('집계 준비 중')));
});
