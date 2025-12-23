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
      restartBtn: document.getElementById('restartBtn'),
      statsBtn: document.getElementById('statsBtn'),
      statsModal: document.getElementById('statsModal'),
      closeStatsBtn: document.getElementById('closeStatsBtn'),
      exportStatsBtn: document.getElementById('exportStatsBtn'),
      resetStatsBtn: document.getElementById('resetStatsBtn')
    };
    
    this.setupModalListeners();
  }
  
  /**
   * Setup modal event listeners
   */
  setupModalListeners() {
    // Close on background click
    this.elements.statsModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.statsModal) {
        this.hideStatistics();
      }
    });
    
    // Close on close button
    this.elements.closeStatsBtn?.addEventListener('click', () => {
      this.hideStatistics();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.elements.statsModal.classList.contains('hidden')) {
        this.hideStatistics();
      }
    });
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
    this.elements.score.textContent = gameState.score.toFixed(2);
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
  
  /**
   * Show statistics modal
   */
  showStatistics(statisticsService) {
    const stats = statisticsService.getOverallStats();
    const achievements = statisticsService.getAchievements();
    const regionStats = statisticsService.getAllRegionStats('byKraj');
    const recentSessions = statisticsService.getRecentSessions(5);
    
    // Update overall stats
    document.getElementById('statTotalAttempts').textContent = stats.totalAttempts;
    document.getElementById('statTotalCorrect').textContent = stats.totalCorrect;
    document.getElementById('statAccuracy').textContent = stats.accuracy.toFixed(1) + '%';
    document.getElementById('statTotalScore').textContent = stats.totalScore.toFixed(2);
    document.getElementById('statAvgPrecision').textContent = stats.averagePrecision.toFixed(2);
    document.getElementById('statBestScore').textContent = stats.bestScore.toFixed(2);
    
    // Update achievements
    document.getElementById('achievementPerfect').textContent = achievements.perfectScore;
    document.getElementById('achievementHighPrecision').textContent = achievements.highPrecision;
    document.getElementById('achievementMasterRegions').textContent = 
      achievements.masterRegions.length > 0 
        ? achievements.masterRegions.join(', ') 
        : 'Žádný';
    
    // Update region stats
    const regionStatsDiv = document.getElementById('regionStats');
    if (regionStats.length > 0) {
      regionStatsDiv.innerHTML = regionStats.map(region => `
        <div class="region-stat-item">
          <span class="region-name">${region.name}</span>
          <div class="region-accuracy">
            <span>${region.correct}/${region.attempts}</span>
            <span><strong>${region.accuracy.toFixed(1)}%</strong></span>
          </div>
        </div>
      `).join('');
    } else {
      regionStatsDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Zatím žádné statistiky po krajích</p>';
    }
    
    // Update session history
    const sessionHistoryDiv = document.getElementById('sessionHistory');
    if (recentSessions.length > 0) {
      sessionHistoryDiv.innerHTML = recentSessions.map(session => {
        const date = new Date(session.startTime).toLocaleDateString('cs-CZ');
        const time = new Date(session.startTime).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        const filter = session.filterType 
          ? `${session.filterType}: ${session.filterValue}` 
          : 'Všechny ORP';
        
        return `
          <div class="session-item">
            <div><strong>${date} ${time}</strong> - ${filter}</div>
            <div>${session.correct}/${session.attempts} (${session.accuracy.toFixed(1)}%) - Skóre: ${session.score.toFixed(2)}</div>
          </div>
        `;
      }).join('');
    } else {
      sessionHistoryDiv.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Zatím žádná historie her</p>';
    }
    
    this.elements.statsModal.classList.remove('hidden');
  }
  
  /**
   * Hide statistics modal
   */
  hideStatistics() {
    this.elements.statsModal.classList.add('hidden');
  }
  
  /**
   * Update statistics display (for refresh after reset)
   */
  updateStatisticsDisplay(statisticsService) {
    if (!this.elements.statsModal.classList.contains('hidden')) {
      this.showStatistics(statisticsService);
    }
  }
}

export default UIController;
