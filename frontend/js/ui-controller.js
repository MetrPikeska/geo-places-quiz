/**
 * UI Controller - User interface management
 * Updates DOM elements
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
   * Display current question
   */
  showQuestion(nazevORP) {
    this.elements.questionText.textContent = nazevORP;
  }
  
  /**
   * Update score
   */
  updateScore(gameState) {
    this.elements.score.textContent = gameState.score;
    this.elements.attempts.textContent = `Attempts: ${gameState.attempts}`;
    this.elements.correct.textContent = `Correct: ${gameState.correct}`;
    
    // Calculate accuracy
    const accuracy = gameState.attempts > 0 
      ? Math.round((gameState.correct / gameState.attempts) * 100) 
      : 0;
    this.elements.accuracy.textContent = `${accuracy}%`;
  }
  
  /**
   * Display feedback message
   */
  showFeedback(message, isCorrect, duration = 1500) {
    const feedback = this.elements.feedback;
    
    feedback.textContent = message;
    feedback.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    
    // Automatically hide after specified time
    setTimeout(() => {
      feedback.classList.add('hidden');
    }, duration);
  }
  
  /**
   * Display error message
   */
  showError(message) {
    alert(`❌ Error: ${message}`);
  }
  
  /**
   * Display loading state
   */
  showLoading(message = 'Loading...') {
    this.elements.questionText.textContent = message;
  }
  
  /**
   * Set callback for restart button
   */
  setRestartHandler(callback) {
    this.elements.restartBtn.addEventListener('click', callback);
  }
}

export default UIController;
