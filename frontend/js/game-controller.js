/**
 * Game Controller - Game logic
 * Manages game flow, scoring and game state
 */

class GameController {
  constructor(apiClient, mapController, uiController) {
    this.api = apiClient;
    this.map = mapController;
    this.ui = uiController;
    
    this.state = {
      score: 0,
      attempts: 0,
      correct: 0,
      currentTarget: null,
      isProcessing: false
    };
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
      
      // Load random ORP from database
      const randomORP = await this.api.getRandomORP();
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
      
      this.map.highlightCorrect(clickedKod, distance);
      
      const precisionPercent = Math.round(coefficient * 100);
      this.ui.showFeedback(`✅ Správně! Přesnost: ${precisionPercent}% (+${coefficient.toFixed(2)} b)`, true, 1500);
      this.ui.updateScore(this.state);
      
      // Next round after 1.5s
      setTimeout(() => this.nextRound(), 1500);
      
    } else {
      // Wrong answer - gradient based on distance
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
   * Restart game
   */
  restart() {
    this.state = {
      score: 0,
      attempts: 0,
      correct: 0,
      currentTarget: null,
      isProcessing: false
    };
    
    this.ui.updateScore(this.state);
    this.map.resetStyles();
    this.nextRound();
    
    console.log('🔄 Game restarted');
  }
}

export default GameController;
