class AchievementLoader {
  static async loadDefinitions() {
    try {
      const response = await fetch('js/data/achievements.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load achievement definitions:', error);
      return null;
    }
  }

  static formatDate(date, months) {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  static processDateAchievements(definitions, gameState) {
    const dateStr = this.formatDate(gameState.currentDate, definitions.dateFormats.months);
    
    return definitions.dateAchievements.map(achievement => ({
      id: achievement.id,
      name: achievement.nameTemplate.replace('{date}', dateStr),
      description: achievement.description,
      icon: achievement.icon,
      unlocked: false
    }));
  }

  static processGlobalAchievements(definitions, stats) {
    return definitions.globalAchievements.map(achievement => {
      let current = 0;
      
      switch (achievement.type) {
        case 'streak':
          current = stats.currentStreak;
          break;
        case 'nine_letter':
          current = stats.totalNineLetterWords;
          break;
        case 'all_words':
          current = stats.totalAllWordsCompleted;
          break;
        case 'special':
          current = 1; // For night owl, we don't track progress
          break;
      }

      const result = {
        id: achievement.id,
        name: achievement.name,
        icon: achievement.icon,
        unlocked: false,
        target: achievement.target,
        type: achievement.type
      };

      if (achievement.descriptionTemplate) {
        result.description = achievement.descriptionTemplate
          .replace('{current}', Math.min(current, achievement.target))
          .replace(`{${achievement.target}}`, achievement.target);
      } else {
        result.description = achievement.description;
      }

      return result;
    });
  }
}