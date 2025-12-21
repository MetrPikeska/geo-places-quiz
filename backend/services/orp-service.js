const pool = require('../config/database');

class ORPService {
  
  /**
   * Načte všechny ORP jako GeoJSON
   * Transformuje SRID 5514 (S-JTSK) → 4326 (WGS84) pro Leaflet
   */
  async getAllORP() {
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
            'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::jsonb
          )
        )
      ) AS geojson
      FROM "Orp_SLDB";
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows[0].geojson;
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
        ST_AsGeoJSON(ST_Transform(geom, 4326))::jsonb AS geometry
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
        ST_AsGeoJSON(ST_Transform(geom, 4326))::jsonb AS geometry
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
