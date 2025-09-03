class AchievementManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.achievements = this.getDateAchievements();
    this.globalAchievements = this.getGlobalAchievements();
  }

  formatDate(date) {
    const months = [
      'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
      'jul', 'aug', 'sep', 'okt', 'nov', 'dec'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  getDateAchievements() {
    const dateStr = this.formatDate(this.gameState.currentDate);
    
    return [
      {
        id: 'nine_letter_word',
        name: `Hittade ett 9-bokstavers ord (${dateStr})`,
        description: 'Hitta ett ord som använder alla 9 bokstäver',
        icon: '🌟',
        unlocked: false
      },
      {
        id: 'all_words',
        name: `Hittade alla möjliga ord (${dateStr})`,
        description: 'Hitta alla ord som går att bilda',
        icon: '🏆',
        unlocked: false
      }
    ];
  }

  getGlobalAchievements() {
    const totalNineLetterWords = this.getTotalNineLetterWords();
    const totalAllWordsCompleted = this.getTotalAllWordsCompleted();
    
    return [
      // Seven day streak achievement (global one-time)
      {
        id: 'seven_day_streak',
        name: 'Veckorekord',
        description: 'Spela 7 dagar i rad',
        icon: '🔥',
        unlocked: false,
        target: 1
      },
      
      // Nine-letter word achievements
      {
        id: 'nine_letter_10',
        name: 'Nio-bokstavers samlare',
        description: `Hitta 10 nio-bokstavers ord totalt (${Math.min(totalNineLetterWords, 10)}/10)`,
        icon: '📚',
        unlocked: false,
        target: 10
      },
      {
        id: 'nine_letter_25',
        name: 'Nio-bokstavers expert',
        description: `Hitta 25 nio-bokstavers ord totalt (${Math.min(totalNineLetterWords, 25)}/25)`,
        icon: '🎓',
        unlocked: false,
        target: 25
      },
      {
        id: 'nine_letter_50',
        name: 'Nio-bokstavers mästare',
        description: `Hitta 50 nio-bokstavers ord totalt (${Math.min(totalNineLetterWords, 50)}/50)`,
        icon: '👑',
        unlocked: false,
        target: 50
      },
      {
        id: 'nine_letter_100',
        name: 'Nio-bokstavers legend',
        description: `Hitta 100 nio-bokstavers ord totalt (${Math.min(totalNineLetterWords, 100)}/100)`,
        icon: '🌟',
        unlocked: false,
        target: 100
      },
      
      // All words achievements
      {
        id: 'all_words_10',
        name: 'Fullständighetssöker',
        description: `Hitta alla ord 10 gånger totalt (${Math.min(totalAllWordsCompleted, 10)}/10)`,
        icon: '🔍',
        unlocked: false,
        target: 10
      },
      {
        id: 'all_words_25',
        name: 'Perfektionist',
        description: `Hitta alla ord 25 gånger totalt (${Math.min(totalAllWordsCompleted, 25)}/25)`,
        icon: '✨',
        unlocked: false,
        target: 25
      },
      {
        id: 'all_words_50',
        name: 'Ordmästare',
        description: `Hitta alla ord 50 gånger totalt (${Math.min(totalAllWordsCompleted, 50)}/50)`,
        icon: '🏅',
        unlocked: false,
        target: 50
      },
      {
        id: 'all_words_100',
        name: 'Ultimat ordkung',
        description: `Hitta alla ord 100 gånger totalt (${Math.min(totalAllWordsCompleted, 100)}/100)`,
        icon: '👑',
        unlocked: false,
        target: 100
      },
      
      // Night owl achievement (moved to bottom)
      {
        id: 'night_owl',
        name: 'Nattuggla',
        description: 'Spela mellan 00:00 och 04:00',
        icon: '🦉',
        unlocked: false,
        target: 1
      }
    ];
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
    return hour >= 0 && hour < 4; // 00:00 to 03:59
  }

  // Track that the player played today (real date)
  trackPlaySession() {
    const today = new Date().toISOString().split('T')[0]; // Real today
    const key = `playSession_${today}`;
    
    if (!localStorage.getItem(key)) {
      // First time playing today
      localStorage.setItem(key, new Date().toISOString());
    }
  }

  // Get all real dates when player actually played
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

  // Check for 7 consecutive real days played
  checkSevenDayStreak() {
    const playedDates = this.getActualPlayDates();
    if (playedDates.length < 7) return false;
    
    // Check for any 7 consecutive calendar days
    for (let i = 0; i <= playedDates.length - 7; i++) {
      let consecutive = true;
      const startDate = new Date(playedDates[i]);
      
      for (let j = 1; j < 7; j++) {
        const expectedDate = new Date(startDate);
        expectedDate.setDate(startDate.getDate() + j);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (!playedDates.includes(expectedDateStr)) {
          consecutive = false;
          break;
        }
      }
      
      if (consecutive) return true;
    }
    
    return false;
  }

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

  checkAchievements(newWord) {
    const newlyUnlocked = [];
    
    // Track that player played today (real date)
    this.trackPlaySession();
    
    // Check night owl achievement on any word submission
    if (this.isNightTime() && !this.isGlobalUnlocked('night_owl')) {
      this.unlockGlobal('night_owl');
      const achievement = this.globalAchievements.find(a => a.id === 'night_owl');
      if (achievement) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
      }
    }
    
    // Check seven day streak achievement
    if (this.checkSevenDayStreak() && !this.isGlobalUnlocked('seven_day_streak')) {
      this.unlockGlobal('seven_day_streak');
      const achievement = this.globalAchievements.find(a => a.id === 'seven_day_streak');
      if (achievement) {
        achievement.unlocked = true;
        newlyUnlocked.push(achievement);
      }
    }
    
    // Check date-specific achievements
    if (newWord.length === 9 && !this.isUnlocked('nine_letter_word')) {
      this.unlock('nine_letter_word');
      const achievement = this.achievements.find(a => a.id === 'nine_letter_word');
      achievement.unlocked = true;
      newlyUnlocked.push(achievement);
    }

    const possibleWordsCount = this.gameState.possibleWords.length;
    const foundWordsCount = this.gameState.foundWords.size;
    
    let allWordsJustCompleted = false;
    if (foundWordsCount === possibleWordsCount && 
        possibleWordsCount > 0 && 
        !this.isUnlocked('all_words')) {
      this.unlock('all_words');
      const achievement = this.achievements.find(a => a.id === 'all_words');
      achievement.unlocked = true;
      newlyUnlocked.push(achievement);
      allWordsJustCompleted = true;
    }

    // Refresh global achievements to get current progress
    this.globalAchievements = this.getGlobalAchievements();
    
    // Check global 9-letter word achievements
    if (newWord.length === 9) {
      const totalNineLetterWords = this.getTotalNineLetterWords();
      
      this.globalAchievements.forEach(achievement => {
        if (achievement.id.startsWith('nine_letter_') &&
            totalNineLetterWords >= achievement.target && 
            !this.isGlobalUnlocked(achievement.id)) {
          this.unlockGlobal(achievement.id);
          achievement.unlocked = true;
          newlyUnlocked.push(achievement);
        }
      });
    }

    // Check global all words achievements
    if (allWordsJustCompleted) {
      const totalAllWordsCompleted = this.getTotalAllWordsCompleted();
      
      this.globalAchievements.forEach(achievement => {
        if (achievement.id.startsWith('all_words_') &&
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
    // Refresh global achievements to get current progress
    this.globalAchievements = this.getGlobalAchievements();
    
    // Update date-specific achievements
    this.achievements.forEach(achievement => {
      achievement.unlocked = this.isUnlocked(achievement.id);
    });
    
    // Update global achievements
    this.globalAchievements.forEach(achievement => {
      achievement.unlocked = this.isGlobalUnlocked(achievement.id);
    });
    
    // Return both types combined
    return [...this.achievements, ...this.globalAchievements];
  }

  getUnlockedAchievements() {
    const unlocked = [];
    
    // Date-specific achievements
    this.achievements.forEach(achievement => {
      if (this.isUnlocked(achievement.id)) {
        const key = this.getStorageKey(achievement.id);
        const timestamp = localStorage.getItem(key);
        unlocked.push({
          id: achievement.id,
          unlockedAt: timestamp
        });
      }
    });
    
    // Global achievements
    this.globalAchievements.forEach(achievement => {
      if (this.isGlobalUnlocked(achievement.id)) {
        const timestamp = localStorage.getItem(`global_achievement_${achievement.id}`);
        unlocked.push({
          id: achievement.id,
          unlockedAt: timestamp
        });
      }
    });
    
    return unlocked;
  }

  refreshForCurrentDate() {
    this.achievements = this.getDateAchievements();
    this.globalAchievements = this.getGlobalAchievements();
  }
}