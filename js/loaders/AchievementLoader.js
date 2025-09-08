class AchievementLoader {
  static async loadDefinitions() {
    // Get achievements from translations instead of separate JSON file
    if (!window.game || !window.game.translator) {
      console.error("Translator not available for achievements");
      return null;
    }

    return window.game.translator.translations.achievements;
  }

  static formatDate(date, months) {
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  static processDateAchievements(definitions, gameState) {
    const dateStr = this.formatDate(
      gameState.currentDate,
      definitions.dateFormats.months,
    );

    // Convert object to array since it's now an object in translations
    return Object.entries(definitions.dateAchievements).map(
      ([id, achievement]) => ({
        id: id,
        name: achievement.nameTemplate.replace("{date}", dateStr),
        description: achievement.description,
        icon: achievement.icon,
        unlocked: false,
      }),
    );
  }

  static processGlobalAchievements(definitions, stats) {
    // Convert object to array since it's now an object in translations
    return Object.entries(definitions.globalAchievements).map(
      ([id, achievement]) => {
        let current = 0;

        switch (achievement.type) {
          case "streak":
            current = stats.currentStreak;
            break;
          case "nine_letter":
            current = stats.totalNineLetterWords;
            break;
          case "all_words":
            current = stats.totalAllWordsCompleted;
            break;
          case "total_words":
            current = stats.totalWordsFound;
            break;
          case "special":
            current = 1; // For night owl, we don't track progress
            break;
        }

        const result = {
          id: id,
          name: achievement.name,
          icon: achievement.icon,
          unlocked: false,
          target: achievement.target,
          type: achievement.type,
        };

        if (achievement.descriptionTemplate) {
          result.description = achievement.descriptionTemplate
            .replace("{current}", Math.min(current, achievement.target))
            .replace(`{${achievement.target}}`, achievement.target);
        } else {
          result.description = achievement.description;
        }

        return result;
      },
    );
  }
}
