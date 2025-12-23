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
    
    // Load kraje and okresy and populate selectors
    try {
      // Load kraje
      const krajeData = await api.getKraje();
      const krajSelect = document.getElementById('krajSelect');
      
      krajeData.kraje.forEach(kraj => {
        const option = document.createElement('option');
        option.value = kraj.code; // Use code as value
        option.textContent = kraj.name; // Display name
        krajSelect.appendChild(option);
      });
      
      // Load okresy
      const regionsData = await api.getRegions();
      const okresSelect = document.getElementById('okresSelect');
      
      regionsData.regions.forEach(okres => {
        const option = document.createElement('option');
        option.value = okres;
        option.textContent = okres;
        okresSelect.appendChild(option);
      });
      
      // Set kraj change handler
      krajSelect.addEventListener('change', async (e) => {
        const selectedKraj = e.target.value;
        if (selectedKraj) {
          okresSelect.value = ''; // Clear okres selection
        }
        await gameController.setFilter('kraj', selectedKraj || null);
      });
      
      // Set okres change handler
      okresSelect.addEventListener('change', async (e) => {
        const selectedOkres = e.target.value;
        if (selectedOkres) {
          krajSelect.value = ''; // Clear kraj selection
        }
        await gameController.setFilter('okres', selectedOkres || null);
      });
      
      // Set up statistics button
      const statsBtn = document.getElementById('statsBtn');
      statsBtn.addEventListener('click', () => {
        gameController.showStatistics();
      });

      // Set up export and reset buttons
      const exportStatsBtn = document.getElementById('exportStatsBtn');
      exportStatsBtn.addEventListener('click', () => {
        gameController.statistics.exportStats();
      });

      const resetStatsBtn = document.getElementById('resetStatsBtn');
      resetStatsBtn.addEventListener('click', () => {
        gameController.resetStatistics();
      });
      
    } catch (error) {
      console.warn('Could not load filters:', error);
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
