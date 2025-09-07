class AchievementManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.definitions = null;
    this.achievements = [];
    this.globalAchievements = [];
  }

  async init() {
    this.definitions = await AchievementLoader.loadDefinitions();
    if (!this.definitions) {
      console.error('Failed to load achievement definitions');
      return false;
    }

    this.refreshAchievements();
    return true;
  }

  refreshAchievements() {
    if (!this.definitions)
      return;

    this.achievements = AchievementLoader.processDateAchievements(
        this.definitions, this.gameState);

    const stats = {
      totalNineLetterWords : this.getTotalNineLetterWords(),
      totalAllWordsCompleted : this.getTotalAllWordsCompleted(),
      currentStreak : this.getCurrentStreak()
    };

    this.globalAchievements =
        AchievementLoader.processGlobalAchievements(this.definitions, stats);
  }

  getStorageKey(achievementId) {
    const dateStr = this.gameState.currentDate.toISOString().split('T')[0];
    return `achievement_${achievementId}_${dateStr}`;
  }

  isUnlocked(achievementId) {
    const key = this.getStorageKey(achievementId);
    return localStorage.getItem(key) !== null;
  }

  unlock(achievementId) {
    const key = this.getStorageKey(achievementId);
    const timestamp = new Date().toISOString();
    localStorage.setItem(key, timestamp);
  }

  isGlobalUnlocked(achievementId) {
    return localStorage.getItem(`global_achievement_${achievementId}`) !== null;
  }

  unlockGlobal(achievementId) {
    const timestamp = new Date().toISOString();
    localStorage.setItem(`global_achievement_${achievementId}`, timestamp);
  }

  isNightTime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 0 && hour < 4;
  }

  trackPlaySession() {
    const today = new Date().toISOString().split('T')[0];
    const key = `playSession_${today}`;

    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, new Date().toISOString());
    }
  }

  getActualPlayDates() {
    const dates = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('playSession_')) {
        const dateStr = key.replace('playSession_', '');
        dates.push(dateStr);
      }
    }

    return dates.sort();
  }

  getCurrentStreak() {
    const playedDates = this.getActualPlayDates();
    if (playedDates.length === 0)
      return 0;

    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    let streak = 0;

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (playedDates.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  checkSevenDayStreak() { return this.getCurrentStreak() >= 7; }

  getTotalNineLetterWords() {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('foundWords-')) {
        const foundWords = JSON.parse(localStorage.getItem(key) || '[]');
        total += foundWords.filter(word => word.length === 9).length;
      }
    }

    return total;
  }

  getTotalAllWordsCompleted() {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('achievement_all_words_')) {
        total++;
      }
    }

    return total;
  }

  runMigration() {
    console.log('Running achievements migration...');
    this.migrateExistingProgress();
    console.log('Achievements migration complete');
  }

  migrateExistingProgress() {
    const savedDates = this.getAllSavedGameDates();

    savedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      this.migrateForDate(date);
    });
  }

  getAllSavedGameDates() {
    const dates = new Set();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith('foundWords-')) {
        const dateStr = key.replace('foundWords-', '');
        dates.add(dateStr);
      }
    }

    return Array.from(dates);
  }

  migrateForDate(date) {
    const originalDate = this.gameState.currentDate;
    this.gameState.currentDate = date;

    const foundWords = this.loadFoundWordsForDate(date);
    if (!foundWords || foundWords.length === 0) {
      this.gameState.currentDate = originalDate;
      return;
    }

    this.migrateNineLetterAchievement(foundWords);
    this.migrateAllWordsAchievement(foundWords, date);

    this.gameState.currentDate = originalDate;
  }

  loadFoundWordsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const key = `foundWords-${dateStr}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  migrateNineLetterAchievement(foundWords) {
    const hasNineLetterWord = foundWords.some(word => word.length === 9);
    if (hasNineLetterWord && !this.isUnlocked('nine_letter_word')) {
      this.unlock('nine_letter_word');
    }
  }

  migrateAllWordsAchievement(foundWords, date) {
    try {
      const baseLetters =
          GridGenerator.generateLetters(this.gameState.dictionary, date);
      const tempGameState = {
        letters : baseLetters,
        middleLetter : baseLetters[4],
        dictionary : this.gameState.dictionary
      };
      const tempValidator = new WordValidator(
          tempGameState, {dictionary : this.gameState.dictionary});
      const possibleWords = tempValidator.getPossibleWords();

      if (possibleWords.length > 0 &&
          foundWords.length === possibleWords.length &&
          !this.isUnlocked('all_words')) {
        this.unlock('all_words');
      }
    } catch (error) {
      console.warn('Could not migrate all words achievement for date:', date,
                   error);
    }
  }

  checkAchievements(newWord) {
    const newlyUnlocked = [];

    this.trackPlaySession();

    if (this.isNightTime() && !this.isGlobalUnlocked('night_owl')) {
      this.unlockGlobal('night_owl');
      const achievement =
          this.globalAchievements.find(a => a.id === 'night_owl');
      if (achievement) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
      }
    }

    if (this.checkSevenDayStreak() &&
        !this.isGlobalUnlocked('seven_day_streak')) {
      this.unlockGlobal('seven_day_streak');
      const achievement =
          this.globalAchievements.find(a => a.id === 'seven_day_streak');
      if (achievement) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
      }
    }

    if (newWord.length === 9 && !this.isUnlocked('nine_letter_word')) {
      this.unlock('nine_letter_word');
      const achievement =
          this.achievements.find(a => a.id === 'nine_letter_word');
      if (achievement) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
      }
    }

    const totalPossibleWordsCount = this.gameState.allPossibleWords.length;
    const foundWordsCount = this.gameState.foundWords.size;

    let allWordsJustCompleted = false;
    if (foundWordsCount === totalPossibleWordsCount &&
        totalPossibleWordsCount > 0 && !this.isUnlocked('all_words')) {
      this.unlock('all_words');
      const achievement = this.achievements.find(a => a.id === 'all_words');
      if (achievement) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
        allWordsJustCompleted = true;
      }
    }

    this.refreshAchievements();

    if (newWord.length === 9) {
      const totalNineLetterWords = this.getTotalNineLetterWords();

      this.globalAchievements.forEach(achievement => {
        if (achievement.type === 'nine_letter' &&
            totalNineLetterWords >= achievement.target &&
            !this.isGlobalUnlocked(achievement.id)) {
          this.unlockGlobal(achievement.id);
          achievement.unlocked = true;
          newlyUnlocked.push(achievement);
        }
      });
    }

    if (allWordsJustCompleted) {
      const totalAllWordsCompleted = this.getTotalAllWordsCompleted();

      this.globalAchievements.forEach(achievement => {
        if (achievement.type === 'all_words' &&
            totalAllWordsCompleted >= achievement.target &&
            !this.isGlobalUnlocked(achievement.id)) {
          this.unlockGlobal(achievement.id);
          achievement.unlocked = true;
          newlyUnlocked.push(achievement);
        }
      });
    }

    return newlyUnlocked;
  }

  getAllAchievements() {
    this.refreshAchievements();

    this.achievements.forEach(achievement => {
      achievement.unlocked = this.isUnlocked(achievement.id);
    });

    this.globalAchievements.forEach(achievement => {
      achievement.unlocked = this.isGlobalUnlocked(achievement.id);
    });

    return [...this.achievements, ...this.globalAchievements ];
  }

  getUnlockedAchievements() {
    const unlocked = [];

    // Date-specific achievements
    this.achievements.forEach(achievement => {
      if (this.isUnlocked(achievement.id)) {
        const key = this.getStorageKey(achievement.id);
        const timestamp = localStorage.getItem(key);
        unlocked.push({id : achievement.id, unlockedAt : timestamp});
      }
    });

    // Global achievements
    this.globalAchievements.forEach(achievement => {
      if (this.isGlobalUnlocked(achievement.id)) {
        const timestamp =
            localStorage.getItem(`global_achievement_${achievement.id}`);
        unlocked.push({id : achievement.id, unlockedAt : timestamp});
      }
    });

    return unlocked;
  }

  refreshForCurrentDate() { this.refreshAchievements(); }
}
