const pool = require('../config/database');

class ORPService {
  constructor() {
    // Cache pro všechny ORP - načte se jednou a drží se v paměti
    this.orpCache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 hodina
  }
  
  /**
   * Načte všechny ORP jako GeoJSON
   * Používá předpočítaný sloupec geom_wgs84 místo transformace
   * Cachuje výsledek pro rychlejší opakované požadavky
   */
  async getAllORP() {
    // Zkontroluj cache
    const now = Date.now();
    if (this.orpCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      console.log('✅ Vráceno z cache');
      return this.orpCache;
    }
    
    const query = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'id', kod,
            'properties', jsonb_build_object(
              'id', id,
              'kod', kod,
              'nazev', nazev,
              'okres', okres,
              'pocet_obyvatel', "poc_obyv_SLDB_2021"
            ),
            'geometry', ST_AsGeoJSON(geom_wgs84)::jsonb
          )
        )
      ) AS geojson
      FROM "Orp_SLDB";
    `;
    
    try {
      const startTime = Date.now();
      const result = await pool.query(query);
      const data = result.rows[0].geojson;
      
      // Ulož do cache
      this.orpCache = data;
      this.cacheTimestamp = Date.now();
      
      const duration = Date.now() - startTime;
      console.log(`📊 ORP načteno z DB za ${duration}ms`);
      
      return data;
    } catch (error) {
      console.error('Chyba při načítání všech ORP:', error);
      throw error;
    }
  }
  
  /**
   * Načte náhodnou ORP pro hru
   */
  async getRandomORP() {
    const query = `
      SELECT 
        id,
        kod,
        nazev,
        okres,
        "poc_obyv_SLDB_2021" as pocet_obyvatel,
        ST_AsGeoJSON(geom_wgs84)::jsonb AS geometry
      FROM "Orp_SLDB"
      ORDER BY RANDOM()
      LIMIT 1;
    `;
    
    try {
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        throw new Error('Žádné ORP v databázi');
      }
      
      const row = result.rows[0];
      
      return {
        type: 'Feature',
        id: row.kod,
        properties: {
          id: row.id,
          kod: row.kod,
          nazev: row.nazev,
          okres: row.okres,
          pocet_obyvatel: row.pocet_obyvatel
        },
        geometry: row.geometry
      };
    } catch (error) {
      console.error('Chyba při načítání náhodné ORP:', error);
      throw error;
    }
  }
  
  /**
   * Načte ORP podle kódu
   */
  async getORPByKod(kod) {
    const query = `
      SELECT 
        id,
        kod,
        nazev,
        okres,
        "poc_obyv_SLDB_2021" as pocet_obyvatel,
        ST_AsGeoJSON(geom_wgs84)::jsonb AS geometry
      FROM "Orp_SLDB"
      WHERE kod = $1;
    `;
    
    try {
      const result = await pool.query(query, [kod]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      return {
        type: 'Feature',
        id: row.kod,
        properties: {
          id: row.id,
          kod: row.kod,
          nazev: row.nazev,
          okres: row.okres,
          pocet_obyvatel: row.pocet_obyvatel
        },
        geometry: row.geometry
      };
    } catch (error) {
      console.error('Chyba při načítání ORP podle kódu:', error);
      throw error;
    }
  }
  
  /**
   * Získá statistiky databáze
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as pocet_orp,
        SUM("poc_obyv_SLDB_2021") as celkovy_pocet_obyvatel,
        AVG("poc_obyv_SLDB_2021") as prumerny_pocet_obyvatel,
        ST_SRID(geom) as original_srid
      FROM "Orp_SLDB"
      LIMIT 1;
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Chyba při načítání statistik:', error);
      throw error;
    }
  }
}

module.exports = new ORPService();
