/**
 * Game Controller - Herní logika
 * Řídí průběh hry, skórování a herní stav
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
   * Inicializuje hru
   */
  async init() {
    try {
      this.ui.showLoading('Načítám data z databáze...');
      
      // Načti všechny ORP
      const geojson = await this.api.getAllORP();
      
      // Vykresli na mapu
      this.map.renderORP(geojson);
      
      // Nastav handler pro kliknutí
      this.map.setORPClickHandler((feature) => this.handleAnswer(feature));
      
      // Spusť první kolo
      await this.nextRound();
      
      console.log('✅ Hra inicializována');
    } catch (error) {
      console.error('Chyba při inicializaci hry:', error);
      this.ui.showError('Nepodařilo se načíst data. Ujisti se, že backend běží.');
    }
  }
  
  /**
   * Načte další kolo
   */
  async nextRound() {
    try {
      this.state.isProcessing = false;
      this.map.resetStyles();
      
      // Načti náhodnou ORP z databáze
      const randomORP = await this.api.getRandomORP();
      this.state.currentTarget = randomORP.properties;
      
      // Zobraz otázku
      this.ui.showQuestion(randomORP.properties.nazev);
      
      console.log(`🎯 Cílová ORP: ${randomORP.properties.nazev}`);
    } catch (error) {
      console.error('Chyba při načítání dalšího kola:', error);
      this.ui.showError('Nepodařilo se načíst další ORP');
    }
  }
  
  /**
   * Zpracuje odpověď hráče
   */
  async handleAnswer(clickedFeature) {
    // Ignore clicks během zpracování
    if (this.state.isProcessing) {
      return;
    }
    
    this.state.isProcessing = true;
    this.state.attempts++;
    
    const clickedKod = clickedFeature.properties.kod;
    const targetKod = this.state.currentTarget.kod;
    
    // Správná odpověď
    if (clickedKod === targetKod) {
      this.state.correct++;
      this.state.score++;
      
      this.map.highlightCorrect(clickedKod);
      this.ui.showFeedback('✅ Správně!', true, 1000);
      this.ui.updateScore(this.state);
      
      // Další kolo po 1s
      setTimeout(() => this.nextRound(), 1000);
      
    } else {
      // Špatná odpověď - gradient podle vzdálenosti
      this.map.highlightWrong(clickedKod, targetKod);
      this.map.highlightCorrect(targetKod);
      
      const wrongName = clickedFeature.properties.nazev;
      const correctName = this.state.currentTarget.nazev;
      
      this.ui.showFeedback(
        `❌ Špatně! Klikl jsi na: ${wrongName}\n✅ Správně bylo: ${correctName}`, 
        false, 
        2500
      );
      this.ui.updateScore(this.state);
      
      // Další kolo po 2.5s
      setTimeout(() => this.nextRound(), 2500);
    }
  }
  
  /**
   * Restart hry
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
    
    console.log('🔄 Hra restartována');
  }
}

export default GameController;
