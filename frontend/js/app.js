/**
 * GEO PLACES QUIZ - Hlavní aplikační soubor
 * Inicializuje všechny moduly a spouští hru
 */

import APIClient from './api-client.js';
import MapController from './map-controller.js';
import UIController from './ui-controller.js';
import GameController from './game-controller.js';

/**
 * Inicializace aplikace
 */
async function initApp() {
  console.log('🚀 Spouštím GEO PLACES QUIZ');
  
  try {
    // Vytvoř instance controllerů
    const api = new APIClient('http://localhost:3000/api');
    const mapController = new MapController('map');
    const uiController = new UIController();
    const gameController = new GameController(api, mapController, uiController);
    
    // Zkontroluj dostupnost backendu
    uiController.showLoading('Připojuji se k databázi...');
    await api.checkHealth();
    console.log('✅ Backend je dostupný');
    
    // Inicializuj mapu
    mapController.init();
    
    // Nastav restart handler
    uiController.setRestartHandler(() => gameController.restart());
    
    // Spusť hru
    await gameController.init();
    
    console.log('✅ Aplikace připravena');
    
  } catch (error) {
    console.error('❌ Chyba při inicializaci aplikace:', error);
    
    const errorMessage = error.message.includes('Backend')
      ? 'Backend server neběží.\n\nSpusť backend příkazem:\ncd backend\nnpm install\nnpm run dev'
      : `Chyba při inicializaci: ${error.message}`;
    
    alert(`❌ ${errorMessage}`);
  }
}

// Spusť aplikaci po načtení DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
