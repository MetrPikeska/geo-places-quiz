/**
 * GEO PLACES QUIZ - Main application file
 * Initializes all modules and starts the game
 */

import APIClient from './api-client.js';
import MapController from './map-controller.js';
import UIController from './ui-controller.js';
import GameController from './game-controller.js';

/**
 * Initialize application
 */
async function initApp() {
  console.log('🚀 Starting GEO PLACES QUIZ');
  
  try {
    // Create controller instances
    const api = new APIClient('http://localhost:3000/api');
    const mapController = new MapController('map');
    const uiController = new UIController();
    const gameController = new GameController(api, mapController, uiController);
    
    // Check backend availability
    uiController.showLoading('Connecting to database...');
    await api.checkHealth();
    console.log('✅ Backend is available');
    
    // Initialize map
    mapController.init();
    
    // Set restart handler
    uiController.setRestartHandler(() => gameController.restart());
    
    // Load regions and populate selector
    try {
      const regionsData = await api.getRegions();
      const regionSelect = document.getElementById('regionSelect');
      
      regionsData.regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
      });
      
      // Set region change handler
      regionSelect.addEventListener('change', async (e) => {
        const selectedRegion = e.target.value || null;
        await gameController.setRegionFilter(selectedRegion);
      });
    } catch (error) {
      console.warn('Could not load regions:', error);
    }
    
    // Start game
    await gameController.init();
    
    console.log('✅ Application ready');
    
  } catch (error) {
    console.error('❌ Error initializing application:', error);
    
    const errorMessage = error.message.includes('Backend')
      ? 'Backend server is not running.\n\nStart backend with:\ncd backend\nnpm install\nnpm run dev'
      : `Initialization error: ${error.message}`;
    
    alert(`❌ ${errorMessage}`);
  }
}

// Start application after DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
