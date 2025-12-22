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
   */
  async getRandomORP() {
    try {
      const response = await fetch(`${this.baseURL}/orp/random`);
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
