-- SQL skript pro optimalizaci tabulky Orp_SLDB
-- Pro použití v GEO PLACES QUIZ aplikaci

-- ============================================
-- 1. PŘIDÁNÍ SLOUPCE S WGS84 GEOMETRIÍ
-- ============================================
-- Leaflet používá WGS84 (EPSG:4326), původní data jsou v S-JTSK (EPSG:5514)
-- Přidáme nový sloupec pro transformovanou geometrii

ALTER TABLE "Orp_SLDB" 
ADD COLUMN IF NOT EXISTS geom_wgs84 geometry(MultiPolygon, 4326);

-- ============================================
-- 2. TRANSFORMACE GEOMETRIE 5514 → 4326
-- ============================================
-- Převedeme všechny geometrie do WGS84

UPDATE "Orp_SLDB" 
SET geom_wgs84 = ST_Transform(geom, 4326);

-- ============================================
-- 3. VYTVOŘENÍ PROSTOROVÉHO INDEXU
-- ============================================
-- Pro rychlé vyhledávání a prostorové dotazy

CREATE INDEX IF NOT EXISTS idx_orp_geom_wgs84 
ON "Orp_SLDB" USING GIST(geom_wgs84);

-- ============================================
-- 4. VYTVOŘENÍ INDEXŮ NA ČASTO POUŽÍVANÉ SLOUPCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orp_kod 
ON "Orp_SLDB"(kod);

CREATE INDEX IF NOT EXISTS idx_orp_nazev 
ON "Orp_SLDB"(nazev);

-- ============================================
-- 5. VALIDACE A STATISTIKY
-- ============================================

-- Kontrola počtu ORP
SELECT COUNT(*) as "Počet ORP" FROM "Orp_SLDB";

-- Kontrola SRID
SELECT DISTINCT 
  ST_SRID(geom) as "Původní SRID",
  ST_SRID(geom_wgs84) as "Nový SRID (WGS84)"
FROM "Orp_SLDB" 
LIMIT 1;

-- Kontrola NULL hodnot v geometrii
SELECT 
  COUNT(*) FILTER (WHERE geom IS NULL) as "NULL v geom",
  COUNT(*) FILTER (WHERE geom_wgs84 IS NULL) as "NULL v geom_wgs84"
FROM "Orp_SLDB";

-- Ukázka transformované geometrie
SELECT 
  kod,
  nazev,
  ST_GeometryType(geom) as "Typ původní",
  ST_GeometryType(geom_wgs84) as "Typ WGS84",
  ST_NPoints(geom) as "Počet bodů"
FROM "Orp_SLDB"
LIMIT 5;

-- ============================================
-- 6. VOLITELNÉ: ZJEDNODUŠENÍ GEOMETRIE
-- ============================================
-- Pokud jsou geometrie příliš detailní, můžeme je zjednodušit
-- POZOR: Spustit pouze pokud je velikost dat problém!

-- Přidání sloupce pro zjednodušenou geometrii
-- ALTER TABLE "Orp_SLDB" 
-- ADD COLUMN IF NOT EXISTS geom_simplified geometry(MultiPolygon, 4326);

-- Zjednodušení s tolerancí 0.001 stupně (~100m)
-- UPDATE "Orp_SLDB" 
-- SET geom_simplified = ST_SimplifyPreserveTopology(geom_wgs84, 0.001);

-- Index pro zjednodušenou geometrii
-- CREATE INDEX IF NOT EXISTS idx_orp_geom_simplified 
-- ON "Orp_SLDB" USING GIST(geom_simplified);

-- ============================================
-- HOTOVO
-- ============================================

VACUUM ANALYZE "Orp_SLDB";

SELECT 'SQL optimalizace dokončena!' as status;
