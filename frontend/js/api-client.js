/**
 * API Client for backend communication
 * Handles HTTP requests to PostGIS database
 */

class APIClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }
  
  /**
   * Load all ORP as GeoJSON
   */
  async getAllORP() {
    try {
      const response = await fetch(`${this.baseURL}/orp`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading ORP:', error);
      throw new Error('Failed to load ORP data from database');
    }
  }
  
  /**
   * Load random ORP for game round
   * @param {string} okres - Optional region filter
   */
  async getRandomORP(okres = null) {
    try {
      const url = okres 
        ? `${this.baseURL}/orp/random?okres=${encodeURIComponent(okres)}`
        : `${this.baseURL}/orp/random`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading random ORP:', error);
      throw new Error('Failed to load random ORP');
    }
  }
  
  /**
   * Get list of all regions
   */
  async getRegions() {
    try {
      const response = await fetch(`${this.baseURL}/orp/regions/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading regions:', error);
      throw new Error('Failed to load regions');
    }
  }
  
  /**
   * Load ORP filtered by region
   * @param {string} okres - Region name
   */
  async getORPByRegion(okres) {
    try {
      const response = await fetch(`${this.baseURL}/orp/region/${encodeURIComponent(okres)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading ORP by region:', error);
      throw new Error('Failed to load ORP by region');
    }
  }
  
  /**
   * Load database statistics
   */
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/orp/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading statistics:', error);
      throw error;
    }
  }
  
  /**
   * Backend health check
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Backend not available:', error);
      throw new Error('Backend server is not running');
    }
  }
}

export default APIClient;
