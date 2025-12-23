/**
 * Statistics Service
 * Manages persistent game statistics using localStorage
 */

class StatisticsService {
  constructor() {
    this.STORAGE_KEY = 'geo_quiz_statistics';
    this.initializeStats();
  }

  /**
   * Initialize or load existing statistics
   */
  initializeStats() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      this.stats = JSON.parse(stored);
    } else {
      this.stats = this.createDefaultStats();
      this.save();
    }
  }

  /**
   * Create default statistics structure
   */
  createDefaultStats() {
    return {
      overall: {
        totalAttempts: 0,
        totalCorrect: 0,
        totalScore: 0,
        averagePrecision: 0,
        bestScore: 0,
        bestAccuracy: 0,
        totalPrecisionSum: 0 // For calculating average precision
      },
      byKraj: {}, // Statistics per region
      byOkres: {}, // Statistics per district
      sessions: [], // Recent game sessions
      achievements: {
        perfectScore: 0, // Count of games with 100% accuracy
        highPrecision: 0, // Count of answers with precision >= 0.9
        masterRegions: [] // Regions with >= 90% accuracy
      },
      timestamps: {
        firstPlayed: new Date().toISOString(),
        lastPlayed: new Date().toISOString()
      }
    };
  }

  /**
   * Record a game attempt
   * @param {boolean} correct - Whether the answer was correct
   * @param {number} precision - Precision coefficient (0.5-1.0)
   * @param {string} orpName - Name of the ORP
   * @param {string} kraj - Region name (optional)
   * @param {string} okres - District name (optional)
   */
  recordAttempt(correct, precision, orpName, kraj = null, okres = null) {
    // Update overall stats
    this.stats.overall.totalAttempts++;
    if (correct) {
      this.stats.overall.totalCorrect++;
      this.stats.overall.totalScore += precision;
      this.stats.overall.totalPrecisionSum += precision;
      
      // Track high precision achievements
      if (precision >= 0.9) {
        this.stats.achievements.highPrecision++;
      }
    }

    // Update best score
    if (precision > this.stats.overall.bestScore) {
      this.stats.overall.bestScore = precision;
    }

    // Calculate current accuracy
    const currentAccuracy = (this.stats.overall.totalCorrect / this.stats.overall.totalAttempts) * 100;
    if (currentAccuracy > this.stats.overall.bestAccuracy) {
      this.stats.overall.bestAccuracy = currentAccuracy;
    }

    // Update average precision
    if (this.stats.overall.totalCorrect > 0) {
      this.stats.overall.averagePrecision = 
        this.stats.overall.totalPrecisionSum / this.stats.overall.totalCorrect;
    }

    // Update region statistics
    if (kraj) {
      this.updateRegionStats('byKraj', kraj, correct);
    }

    // Update district statistics
    if (okres) {
      this.updateRegionStats('byOkres', okres, correct);
    }

    // Update timestamp
    this.stats.timestamps.lastPlayed = new Date().toISOString();

    this.save();
  }

  /**
   * Update statistics for a specific region or district
   */
  updateRegionStats(category, name, correct) {
    if (!this.stats[category][name]) {
      this.stats[category][name] = {
        attempts: 0,
        correct: 0,
        accuracy: 0
      };
    }

    const regionStats = this.stats[category][name];
    regionStats.attempts++;
    if (correct) {
      regionStats.correct++;
    }
    regionStats.accuracy = (regionStats.correct / regionStats.attempts) * 100;

    // Check for master region achievement
    if (category === 'byKraj' && regionStats.accuracy >= 90 && regionStats.attempts >= 10) {
      if (!this.stats.achievements.masterRegions.includes(name)) {
        this.stats.achievements.masterRegions.push(name);
      }
    }
  }

  /**
   * Start a new game session
   */
  startSession(filterType = null, filterValue = null) {
    const session = {
      id: Date.now(),
      startTime: new Date().toISOString(),
      filterType,
      filterValue,
      attempts: 0,
      correct: 0,
      score: 0
    };

    this.currentSession = session;
  }

  /**
   * End current game session and save to history
   */
  endSession() {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.accuracy = this.currentSession.attempts > 0 
      ? (this.currentSession.correct / this.currentSession.attempts) * 100 
      : 0;

    // Check for perfect score achievement
    if (this.currentSession.accuracy === 100 && this.currentSession.attempts >= 5) {
      this.stats.achievements.perfectScore++;
    }

    // Keep only last 50 sessions
    this.stats.sessions.unshift(this.currentSession);
    if (this.stats.sessions.length > 50) {
      this.stats.sessions = this.stats.sessions.slice(0, 50);
    }

    this.currentSession = null;
    this.save();
  }

  /**
   * Update current session stats
   */
  updateSession(correct, score) {
    if (!this.currentSession) return;

    this.currentSession.attempts++;
    if (correct) {
      this.currentSession.correct++;
      this.currentSession.score += score;
    }
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    return {
      ...this.stats.overall,
      accuracy: this.stats.overall.totalAttempts > 0
        ? (this.stats.overall.totalCorrect / this.stats.overall.totalAttempts) * 100
        : 0
    };
  }

  /**
   * Get statistics for a specific region or district
   */
  getRegionStats(category, name) {
    return this.stats[category][name] || null;
  }

  /**
   * Get all region statistics sorted by accuracy
   */
  getAllRegionStats(category) {
    const regions = this.stats[category];
    return Object.entries(regions)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * Get recent sessions
   */
  getRecentSessions(limit = 10) {
    return this.stats.sessions.slice(0, limit);
  }

  /**
   * Get achievements
   */
  getAchievements() {
    return this.stats.achievements;
  }

  /**
   * Reset all statistics
   */
  resetStats() {
    if (confirm('Opravdu chcete smazat všechny statistiky? Tuto akci nelze vrátit zpět.')) {
      this.stats = this.createDefaultStats();
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Export statistics as JSON
   */
  exportStats() {
    const dataStr = JSON.stringify(this.stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geo-quiz-stats-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Save statistics to localStorage
   */
  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
  }

  /**
   * Get formatted play time statistics
   */
  getPlayTimeStats() {
    const first = new Date(this.stats.timestamps.firstPlayed);
    const last = new Date(this.stats.timestamps.lastPlayed);
    const daysSinceFirst = Math.floor((last - first) / (1000 * 60 * 60 * 24));

    return {
      firstPlayed: first.toLocaleDateString('cs-CZ'),
      lastPlayed: last.toLocaleDateString('cs-CZ'),
      daysSinceFirst,
      totalSessions: this.stats.sessions.length
    };
  }
}

export default StatisticsService;
