/**
 * API Client pro komunikaci s backendem
 * Zpracovává HTTP požadavky na PostGIS databázi
 */

class APIClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }
  
  /**
   * Načte všechny ORP jako GeoJSON
   */
  async getAllORP() {
    try {
      const response = await fetch(`${this.baseURL}/orp`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání ORP:', error);
      throw new Error('Nepodařilo se načíst data ORP z databáze');
    }
  }
  
  /**
   * Načte náhodnou ORP pro herní kolo
   */
  async getRandomORP() {
    try {
      const response = await fetch(`${this.baseURL}/orp/random`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání náhodné ORP:', error);
      throw new Error('Nepodařilo se načíst náhodnou ORP');
    }
  }
  
  /**
   * Načte statistiky databáze
   */
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/orp/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Chyba při načítání statistik:', error);
      throw error;
    }
  }
  
  /**
   * Health check backendu
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Backend není dostupný:', error);
      throw new Error('Backend server neběží');
    }
  }
}

export default APIClient;
