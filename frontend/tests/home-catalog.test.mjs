import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHomeBannerSlides, homeCatalogHref, homeDisplayMode } from '../src/lib/home-catalog.ts';

const product = (id, extra = {}) => ({ id, name: `제품${id}`, brand: '테스트', category: '앰플', publicationStatus: 'PUBLISHED', imageUrl: '/test.png', ...extra });
test('guest and unconfigured users never get personalized mode', () => {
  assert.equal(homeDisplayMode(false, false), 'guest');
  assert.equal(homeDisplayMode(false, true), 'guest');
  assert.equal(homeDisplayMode(true, false), 'needs-profile');
  assert.equal(homeDisplayMode(true, true), 'personalized');
});
test('category href retains home and safely encodes user input', () => {
  assert.equal(homeCatalogHref(), '/');
  assert.equal(homeCatalogHref('앰플', 'home-products'), '/?category=%EC%95%B0%ED%94%8C#home-products');
  assert.equal(homeCatalogHref('a&b'), '/?category=a%26b');
});
test('banner cap, image/publication checks and product deduplication', () => {
  const first = { id: 'guide', label: '성분', title: '가이드', description: '', href: '/ranking', product: product('same') };
  const products = [product('same'), product('hidden', { publicationStatus: 'HIDDEN' }), product('noimage', { imageUrl: null }), ...Array.from({length: 16}, (_, i) => product(String(i)))];
  const slides = buildHomeBannerSlides([first, first], products);
  assert.equal(slides.length, 10);
  assert.equal(slides[0].id, 'guide');
  assert.equal(new Set(slides.map(s => s.product.id)).size, 10);
  assert.ok(slides.every(s => s.product.imageUrl && s.product.publicationStatus === 'PUBLISHED'));
});
test('banner uses only available images without padding and prioritizes category variety', () => {
  assert.deepEqual(buildHomeBannerSlides([], []), []);
  const slides = buildHomeBannerSlides([], [product('a'), product('b'), product('c', { category: '크림' })]);
  assert.deepEqual(slides.map(s => s.product.id), ['a', 'c', 'b']);
});
