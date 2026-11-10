-- User-created image supplied on 2026-10-15. Preserve separately uploaded admin images.
UPDATE products
SET image_url = '/products/hwahae-1984011-generated-20261015.jpg'
WHERE id = 'hwahae-1984011'
  AND (image_url IS NULL OR image_url = '/products/hwahae-1984011.png');
