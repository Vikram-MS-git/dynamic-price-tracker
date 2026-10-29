-- Sample SQL for DBMS / Results chapter (RQ1)

-- Price history for a product
SELECT scraped_at, price, currency
FROM price_history
WHERE product_id = 1
ORDER BY scraped_at ASC;

-- Average price per platform for a product group
SELECT p.platform,
       ROUND(AVG(ph.price)::numeric, 2) AS avg_price,
       ROUND(MIN(ph.price)::numeric, 2) AS min_price,
       ROUND(MAX(ph.price)::numeric, 2) AS max_price,
       COUNT(*) AS observations
FROM products p
JOIN price_history ph ON ph.product_id = p.id
WHERE p.group_id = 1
GROUP BY p.platform;

-- Standard deviation (volatility proxy) per platform
SELECT p.platform,
       ROUND(STDDEV(ph.price)::numeric, 2) AS price_stddev
FROM products p
JOIN price_history ph ON ph.product_id = p.id
WHERE p.group_id = 1
GROUP BY p.platform;

-- Percent change: first vs last observation per platform
WITH ranked AS (
  SELECT p.platform,
         ph.price,
         ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY ph.scraped_at ASC) AS rn_asc,
         ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY ph.scraped_at DESC) AS rn_desc
  FROM products p
  JOIN price_history ph ON ph.product_id = p.id
  WHERE p.group_id = 1
)
SELECT platform,
       MAX(CASE WHEN rn_asc = 1 THEN price END) AS first_price,
       MAX(CASE WHEN rn_desc = 1 THEN price END) AS last_price,
       ROUND(
         (
           (MAX(CASE WHEN rn_desc = 1 THEN price END) -
            MAX(CASE WHEN rn_asc = 1 THEN price END))
           / NULLIF(MAX(CASE WHEN rn_asc = 1 THEN price END), 0)
         ) * 100,
         2
       ) AS pct_change
FROM ranked
GROUP BY platform;
