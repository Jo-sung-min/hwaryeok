UPDATE products
SET tag = REPLACE(tag, '화해 급상승', '화력 급상승')
WHERE tag LIKE '화해 급상승%';
