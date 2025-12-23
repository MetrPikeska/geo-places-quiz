/**
 * Game Controller - Game logic
 * Manages game flow, scoring and game state
 */

import StatisticsService from './statistics-service.js';

class GameController {
  constructor(apiClient, mapController, uiController) {
    this.api = apiClient;
    this.map = mapController;
    this.ui = uiController;
    this.statistics = new StatisticsService();
    
    // VÚSC code to name mapping (same as in backend)
    this.vuscNames = {
      19: 'Hlavní město Praha',
      27: 'Středočeský kraj',
      35: 'Jihočeský kraj',
      43: 'Plzeňský kraj',
      51: 'Karlovarský kraj',
      60: 'Ústecký kraj',
      78: 'Liberecký kraj',
      86: 'Královéhradecký kraj',
      94: 'Pardubický kraj',
      108: 'Kraj Vysočina',
      116: 'Jihomoravský kraj',
      124: 'Olomoucký kraj',
      132: 'Moravskoslezský kraj',
      141: 'Zlínský kraj'
    };
    
    this.state = {
      score: 0,
      attempts: 0,
      correct: 0,
      currentTarget: null,
      isProcessing: false,
      filterType: null, // 'okres' or 'kraj'
      filterValue: null
    };
    
    // Start new session
    this.statistics.startSession();
  }
  
  /**
   * Set filter by okres or kraj
   * @param {string} type - 'okres' or 'kraj'
   * @param {string} value - Name of the region/kraj or null for all
   */
  async setFilter(type, value) {
    this.state.filterType = value ? type : null;
    this.state.filterValue = value;
    
    // Reload map with filtered ORP
    if (value) {
      this.ui.showLoading(`Loading ${value}...`);
      const geojson = type === 'kraj'
        ? await this.api.getORPByKraj(value)
        : await this.api.getORPByRegion(value);
      this.map.renderORP(geojson);
    } else {
      this.ui.showLoading('Loading all ORP...');
      const geojson = await this.api.getAllORP();
      this.map.renderORP(geojson);
    }
    
    // Start new round
    await this.nextRound();
  }
  
  /**
   * Initialize game
   */
  async init() {
    try {
      this.ui.showLoading('Loading data from database...');
      
      // Load all ORP
      const geojson = await this.api.getAllORP();
      
      // Render on map
      this.map.renderORP(geojson);
      
      // Set click handler
      this.map.setORPClickHandler((feature) => this.handleAnswer(feature));
      
      // Start first round
      await this.nextRound();
      
      console.log('✅ Game initialized');
    } catch (error) {
      console.error('Error initializing game:', error);
      this.ui.showError('Failed to load data. Make sure backend is running.');
    }
  }
  
  /**
   * Load next round
   */
  async nextRound() {
    try {
      this.state.isProcessing = false;
      this.map.resetStyles();
      
      // Load random ORP from database (with optional filter)
      const filter = this.state.filterValue
        ? { [this.state.filterType]: this.state.filterValue }
        : null;
      const randomORP = await this.api.getRandomORP(filter);
      this.state.currentTarget = randomORP.properties;
      
      // Display question
      this.ui.showQuestion(randomORP.properties.nazev);
      
      console.log(`🎯 Target ORP: ${randomORP.properties.nazev}`);
    } catch (error) {
      console.error('Error loading next round:', error);
      this.ui.showError('Failed to load next ORP');
    }
  }
  
  /**
   * Handle player's answer
   */
  async handleAnswer(clickedFeature) {
    // Ignore clicks during processing
    if (this.state.isProcessing) {
      return;
    }
    
    this.state.isProcessing = true;
    this.state.attempts++;
    
    const clickedKod = clickedFeature.properties.kod;
    const targetKod = this.state.currentTarget.kod;
    
    // Correct answer
    if (clickedKod === targetKod) {
      this.state.correct++;
      
      // Calculate precision coefficient based on click distance from centroid
      const { distance, coefficient } = this.map.calculatePrecisionScore(clickedKod);
      this.state.score += coefficient;
      
      // Convert VÚSC code to kraj name
      const krajName = this.vuscNames[this.state.currentTarget.kraj] || null;
      
      // Record statistics
      this.statistics.recordAttempt(
        true, 
        coefficient, 
        this.state.currentTarget.nazev,
        krajName,
        this.state.currentTarget.okres
      );
      this.statistics.updateSession(true, coefficient);
      
      this.map.highlightCorrect(clickedKod, distance);
      
      const precisionPercent = Math.round(coefficient * 100);
      this.ui.showFeedback(`✅ Správně! Přesnost: ${precisionPercent}% (+${coefficient.toFixed(2)} b)`, true, 1500);
      this.ui.updateScore(this.state);
      
      // Next round after 1.5s
      setTimeout(() => this.nextRound(), 1500);
      
    } else {
      // Wrong answer - gradient based on distance
      
      // Convert VÚSC code to kraj name
      const krajName = this.vuscNames[this.state.currentTarget.kraj] || null;
      
      // Record statistics
      this.statistics.recordAttempt(
        false, 
        0, 
        this.state.currentTarget.nazev,
        krajName,
        this.state.currentTarget.okres
      );
      this.statistics.updateSession(false, 0);
      
      this.map.highlightWrong(clickedKod, targetKod);
      this.map.highlightCorrect(targetKod);
      
      const wrongName = clickedFeature.properties.nazev;
      const correctName = this.state.currentTarget.nazev;
      
      this.ui.showFeedback(
        `❌ Wrong! You clicked: ${wrongName}\n✅ Correct was: ${correctName}`, 
        false, 
        2500
      );
      this.ui.updateScore(this.state);
      
      // Next round after 2.5s
      setTimeout(() => this.nextRound(), 2500);
    }
  }
  
  /**
   * Reload map with current filter
   */
  async reloadMap() {
    try {
      this.ui.showLoading('Loading filtered data...');
      
      let geojson;
      
      if (this.state.filterType === 'kraj' && this.state.filterValue) {
        // Load ORP filtered by kraj
        geojson = await this.api.getORPByKraj(this.state.filterValue);
      } else if (this.state.filterType === 'okres' && this.state.filterValue) {
        // Load ORP filtered by okres
        geojson = await this.api.getORPByRegion(this.state.filterValue);
      } else {
        // Load all ORP
        geojson = await this.api.getAllORP();
      }
      
      // Re-render map with filtered data
      this.map.renderORP(geojson);
      
      console.log(`✅ Map reloaded with filter: ${this.state.filterType}=${this.state.filterValue}`);
    } catch (error) {
      console.error('Error reloading map:', error);
      this.ui.showError('Failed to load filtered data.');
    }
  }
  
  /**
   * Restart game
   */
  async restart() {
    // End current session
    if (this.state.attempts > 0) {
      this.statistics.endSession();
    }
    
    this.state = {
      score: 0,
      attempts: 0,
      correct: 0,
      currentTarget: null,
      isProcessing: false,
      filterType: this.state.filterType,
      filterValue: this.state.filterValue
    };
    
    // Start new session
    this.statistics.startSession(this.state.filterType, this.state.filterValue);
    
    this.ui.updateScore(this.state);
    this.map.resetStyles();
    await this.nextRound();
    
    console.log('🔄 Game restarted');
  }
  
  /**
   * Set filter
   */
  async setFilter(type, value) {
    // End current session
    if (this.state.attempts > 0) {
      this.statistics.endSession();
    }
    
    this.state.filterType = type;
    this.state.filterValue = value;
    
    // Reload map with filtered data
    await this.reloadMap();
    
    // Restart with new filter
    await this.restart();
  }
  
  /**
   * Show statistics modal
   */
  showStatistics() {
    this.ui.showStatistics(this.statistics);
  }
  
  /**
   * Reset all statistics
   */
  resetStatistics() {
    if (this.statistics.resetStats()) {
      this.ui.updateStatisticsDisplay(this.statistics);
    }
  }
}

export default GameController;
