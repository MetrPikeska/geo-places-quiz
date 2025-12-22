const pool = require('../config/database');

class ORPService {
  constructor() {
    // Cache for all ORP - loaded once and kept in memory
    this.orpCache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  }
  
  /**
   * Load all ORP as GeoJSON
   * Uses precomputed geom_wgs84 column instead of transformation
   * Caches result for faster repeated requests
   */
  async getAllORP() {
    // Check cache
    const now = Date.now();
    if (this.orpCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      console.log('✅ Returned from cache');
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
      
      // Save to cache
      this.orpCache = data;
      this.cacheTimestamp = Date.now();
      
      const duration = Date.now() - startTime;
      console.log(`📊 ORP loaded from DB in ${duration}ms`);
      
      return data;
    } catch (error) {
      console.error('Error loading all ORP:', error);
      throw error;
    }
  }
  
  /**
   * Load random ORP for game
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
        throw new Error('No ORP in database');
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
      console.error('Error loading random ORP:', error);
      throw error;
    }
  }
  
  /**
   * Load ORP by code
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
      console.error('Error loading ORP by code:', error);
      throw error;
    }
  }
  
  /**
   * Get database statistics
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
      console.error('Error loading statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get list of all unique regions (okresy)
   */
  async getRegions() {
    const query = `
      SELECT DISTINCT okres
      FROM "Orp_SLDB"
      WHERE okres IS NOT NULL
      ORDER BY okres;
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.okres);
    } catch (error) {
      console.error('Error loading regions:', error);
      throw error;
    }
  }
  
  /**
   * Get list of all unique kraje (regions)
   */
  async getKraje() {
    const query = `
      SELECT DISTINCT kraj
      FROM "Orp_SLDB"
      WHERE kraj IS NOT NULL
      ORDER BY kraj;
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.kraj);
    } catch (error) {
      console.error('Error loading kraje:', error);
      throw error;
    }
  }
  
  /**
   * Load ORP filtered by region (okres)
   * @param {string} okres - Name of the okres to filter by
   */
  async getORPByRegion(okres) {
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
              'kraj', kraj,
              'pocet_obyvatel', "poc_obyv_SLDB_2021"
            ),
            'geometry', ST_AsGeoJSON(geom_wgs84)::jsonb
          )
        )
      ) AS geojson
      FROM "Orp_SLDB"
      WHERE okres = $1;
    `;
    
    try {
      const result = await pool.query(query, [okres]);
      return result.rows[0].geojson;
    } catch (error) {
      console.error('Error loading ORP by region:', error);
      throw error;
    }
  }
  
  /**
   * Load ORP filtered by kraj (region)
   * @param {string} kraj - Name of the kraj to filter by
   */
  async getORPByKraj(kraj) {
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
              'kraj', kraj,
              'pocet_obyvatel', "poc_obyv_SLDB_2021"
            ),
            'geometry', ST_AsGeoJSON(geom_wgs84)::jsonb
          )
        )
      ) AS geojson
      FROM "Orp_SLDB"
      WHERE kraj = $1;
    `;
    
    try {
      const result = await pool.query(query, [kraj]);
      return result.rows[0].geojson;
    } catch (error) {
      console.error('Error loading ORP by kraj:', error);
      throw error;
    }
  }
  
  /**
   * Get random ORP from specific region
   * @param {string} okres - Name of the okres (optional)
   * @param {string} kraj - Name of the kraj (optional)
   */
  async getRandomORPFromRegion(okres = null, kraj = null) {
    let query;
    let params = [];
    
    if (okres) {
      query = `
        SELECT 
          id,
          kod,
          nazev,
          okres,
          kraj,
          "poc_obyv_SLDB_2021" as pocet_obyvatel,
          ST_AsGeoJSON(geom_wgs84)::jsonb AS geometry
        FROM "Orp_SLDB"
        WHERE okres = $1
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      params = [okres];
    } else if (kraj) {
      query = `
        SELECT 
          id,
          kod,
          nazev,
          okres,
          kraj,
          "poc_obyv_SLDB_2021" as pocet_obyvatel,
          ST_AsGeoJSON(geom_wgs84)::jsonb AS geometry
        FROM "Orp_SLDB"
        WHERE kraj = $1
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      params = [kraj];
    } else {
      query = `
        SELECT 
          id,
          kod,
          nazev,
          okres,
          kraj,
          "poc_obyv_SLDB_2021" as pocet_obyvatel,
          ST_AsGeoJSON(geom_wgs84)::jsonb AS geometry
        FROM "Orp_SLDB"
        ORDER BY RANDOM()
        LIMIT 1;
      `;
    }
    
    try {
      const result = params.length > 0
        ? await pool.query(query, params)
        : await pool.query(query);
      
      if (result.rows.length === 0) {
        throw new Error('No ORP in database');
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
          kraj: row.kraj,
          pocet_obyvatel: row.pocet_obyvatel
        },
        geometry: row.geometry
      };
    } catch (error) {
      console.error('Error loading random ORP from region:', error);
      throw error;
    }
  }
}

module.exports = new ORPService();
