/**
 * UI Controller - Správa uživatelského rozhraní
 * Aktualizuje DOM elementy
 */

class UIController {
  constructor() {
    this.elements = {
      questionText: document.getElementById('questionText'),
      score: document.getElementById('score'),
      accuracy: document.getElementById('accuracy'),
      attempts: document.getElementById('attempts'),
      correct: document.getElementById('correct'),
      feedback: document.getElementById('feedback'),
      restartBtn: document.getElementById('restartBtn')
    };
  }
  
  /**
   * Zobraz aktuální otázku
   */
  showQuestion(nazevORP) {
    this.elements.questionText.textContent = nazevORP;
  }
  
  /**
   * Aktualizuj skóre
   */
  updateScore(gameState) {
    this.elements.score.textContent = gameState.score;
    this.elements.attempts.textContent = `Pokusů: ${gameState.attempts}`;
    this.elements.correct.textContent = `Správně: ${gameState.correct}`;
    
    // Vypočti úspěšnost
    const accuracy = gameState.attempts > 0 
      ? Math.round((gameState.correct / gameState.attempts) * 100) 
      : 0;
    this.elements.accuracy.textContent = `${accuracy}%`;
  }
  
  /**
   * Zobraz feedback zprávu
   */
  showFeedback(message, isCorrect, duration = 1500) {
    const feedback = this.elements.feedback;
    
    feedback.textContent = message;
    feedback.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    
    // Automaticky skryj po určité době
    setTimeout(() => {
      feedback.classList.add('hidden');
    }, duration);
  }
  
  /**
   * Zobraz chybovou hlášku
   */
  showError(message) {
    alert(`❌ Chyba: ${message}`);
  }
  
  /**
   * Zobraz loading stav
   */
  showLoading(message = 'Načítání...') {
    this.elements.questionText.textContent = message;
  }
  
  /**
   * Nastav callback pro restart tlačítko
   */
  setRestartHandler(callback) {
    this.elements.restartBtn.addEventListener('click', callback);
  }
}

export default UIController;
