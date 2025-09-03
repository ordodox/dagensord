// === Main Game Controller ===
class WordGameController {
  constructor() {
    this.gameState = new GameState();
    this.dictionary = new DictionaryManager();
    this.validator = new WordValidator(this.gameState, this.dictionary);
    this.ui = new UIManager(this.gameState, this.validator);
    this.themeManager = new ThemeManager();
    this.achievementManager = new AchievementManager(this.gameState);
  }

  async init() {
    const dictionaryLoaded = await this.dictionary.load();
    if (!dictionaryLoaded) {
      this.ui.showMessage("Kunde inte ladda ordlistan.");
      return;
    }

    this.gameState.dictionary = this.dictionary.dictionary;
    this.setupInitialDate();
    this.setupGame();
    this.bindEvents();
    this.setupAchievementUI();
  }

  setupAchievementUI() {
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
      achievementsBtn.addEventListener('click', () => this.showAchievements());
    }

    const modal = document.getElementById('achievement-modal');
    const closeBtn = document.querySelector('.achievement-close');
    const refreshBtn = document.getElementById('achievement-refresh-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideAchievements());
    }
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.achievementManager.runMigration();
        this.showAchievements(); // Refresh the modal display
      });
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideAchievements();
      });
    }
  }

  showAchievements() {
    const modal = document.getElementById('achievement-modal');
    const list = document.getElementById('achievements-list');
    
    if (!modal || !list) return;
    
    const achievements = this.achievementManager.getAllAchievements();
    const unlockedAchievements = this.achievementManager.getUnlockedAchievements();
    
    list.innerHTML = achievements.map(achievement => {
      const unlocked = unlockedAchievements.find(u => u.id === achievement.id);
      const unlockedClass = achievement.unlocked ? 'unlocked' : 'locked';
      
      let dateText = '';
      if (unlocked) {
        const date = new Date(unlocked.unlockedAt);
        dateText = `<div class="achievement-item-date">Upplåst: ${date.toLocaleDateString('sv-SE')}</div>`;
      }
      
      return `
        <div class="achievement-item ${unlockedClass}">
          <div class="achievement-item-icon">${achievement.icon}</div>
          <div class="achievement-item-text">
            <div class="achievement-item-title">${achievement.name}</div>
            <div class="achievement-item-description">${achievement.description}</div>
            ${dateText}
          </div>
        </div>
      `;
    }).join('');
    
    modal.classList.remove('hidden');
  }

  hideAchievements() {
    const modal = document.getElementById('achievement-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  showAchievementNotification(achievement) {
    const notification = document.getElementById('achievement-notification');
    if (!notification) return;
    
    const icon = notification.querySelector('.achievement-icon');
    const title = notification.querySelector('.achievement-title');
    const description = notification.querySelector('.achievement-description');
    
    if (icon) icon.textContent = achievement.icon;
    if (title) title.textContent = achievement.name;
    if (description) description.textContent = achievement.description;
    
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.classList.add('hidden'), 300);
    }, 4000);
  }

  setupInitialDate() {
    const dateInput = document.getElementById("selectDate");
    const today = new Date();
    const todayStr = DateUtils.formatForInput(today);

    dateInput.max = todayStr;

    let initialDate = today;
    if (dateInput.value) {
      const parsedDate = new Date(dateInput.value);
      if (!isNaN(parsedDate) && !DateUtils.isFuture(parsedDate)) {
        initialDate = parsedDate;
      }
    } else {
      dateInput.value = todayStr;
    }

    this.gameState.setDate(initialDate);
  }

  setupGame() {
    const baseLetters = GridGenerator.generateLetters(
        this.dictionary, this.gameState.currentDate);

    const shuffledLetters = this.gameState.loadShuffledGrid();
    if (shuffledLetters) {
      const baseSorted = baseLetters.slice().sort().join('');
      const shuffledSorted = shuffledLetters.slice().sort().join('');

      if (baseSorted === shuffledSorted) {
        this.gameState.letters = shuffledLetters;
      } else {
        this.gameState.letters = baseLetters;
        this.gameState.clearShuffledGrid();
      }
    } else {
      this.gameState.letters = baseLetters;
    }
    this.gameState.middleLetter =
        this.gameState.letters[this.gameState.middleIndex];

    this.ui.drawGrid();
    this.gameState.loadFoundWords();
    
    // NEW: Set the complete unfiltered list first
    this.gameState.allPossibleWords = this.validator.getPossibleWords();
    
    // NEW: Then set the filtered list based on current mode
    const nineLetterMode = document.getElementById("nineLetterMode")?.checked || false;
    this.gameState.possibleWords = nineLetterMode ? 
      this.gameState.allPossibleWords.filter(word => word.length === 9) : 
      this.gameState.allPossibleWords;
    
    this.ui.renderFoundWords();
    this.ui.updateDateInput();
    this.ui.updateNavigationButtons();
  }

  submitWord() {
    this.ui.showMessage("");

    const validation = this.validator.validate(this.gameState.currentWord);

    if (!validation.isValid) {
      this.ui.showMessage(validation.errors[0]);
      return;
    }

    this.gameState.addFoundWord(this.gameState.currentWord);
    
    const newAchievements = this.achievementManager.checkAchievements(this.gameState.currentWord);
    
    this.ui.renderFoundWords();
    this.ui.showMessage(`${this.gameState.currentWord} hittat! 🎉`, true);

    newAchievements.forEach((achievement, index) => {
      setTimeout(() => this.showAchievementNotification(achievement), (index + 1) * 1000);
    });

    setTimeout(() => {
      this.ui.showMessage("");
      this.ui.clearCurrentWord();
    }, 2000);
  }

  changeDate(deltaDays) {
    const newDate = new Date(this.gameState.currentDate);
    newDate.setDate(newDate.getDate() + deltaDays);

    if (DateUtils.isFuture(newDate)) {
      return;
    }

    this.setDate(newDate);
  }

  setDate(newDate) {
    if (DateUtils.isFuture(newDate)) {
      return;
    }

    this.gameState.setDate(newDate);
    this.gameState.clearShuffledGrid();
    this.achievementManager.refreshForCurrentDate();

    this.setupGame();
  }

  bindEvents() {
    this.bindButtonEvents();
    this.bindDateEvents();
    this.bindKeyboardEvents();
    this.bindModeToggle();
  }

  bindButtonEvents() {
    const buttons = {
      submitWord : () => this.submitWord(),
      clearWord : () => this.ui.clearCurrentWord(),
      shuffleLetters : () => this.ui.shuffleLetters(),
      toggleThemeBtn : () => this.themeManager.toggle(),
      'achievements-btn' : () => this.showAchievements()
    };

    Object.entries(buttons).forEach(([ id, handler ]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", handler);
      }
    });
  }

  bindDateEvents() {
    document.getElementById("prevDayBtn")
        ?.addEventListener("click", () => { this.changeDate(-1); });

    document.getElementById("nextDayBtn")
        ?.addEventListener("click", () => { this.changeDate(1); });

    document.getElementById("selectDate")
        ?.addEventListener("change", (event) => {
          const newDate = new Date(event.target.value);
          this.setDate(newDate);
        });
  }

  bindKeyboardEvents() {
    document.addEventListener("keydown", (event) => {
      if (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA") {
        return;
      }

      switch (event.key) {
      case "Enter":
        this.submitWord();
        event.preventDefault();
        break;

      case "Backspace":
      case "Delete":
        this.ui.clearCurrentWord();
        event.preventDefault();
        break;

      case " ":
        this.ui.shuffleLetters();
        event.preventDefault();
        break;

      default:
        this.handleLetterKeyPress(event);
        break;
      }
    });
  }

  handleLetterKeyPress(event) {
    if (event.ctrlKey || event.metaKey || event.altKey)
      return;

    const pressed = event.key.toUpperCase();
    if (!/^[A-ZÅÄÖ]$/.test(pressed))
      return;

    for (let i = 0; i < this.gameState.letters.length; i++) {
      if (this.gameState.letters[i] === pressed &&
          !this.gameState.selectedIndices.has(i)) {
        if (this.gameState.addLetter(pressed, i)) {
          const cell = document.querySelector(`[data-index="${i}"]`);
          if (cell)
            cell.classList.add("used");
          this.ui.updateCurrentWordDisplay();
        }
        break;
      }
    }

    event.preventDefault();
  }

  bindModeToggle() {
    document.getElementById("nineLetterMode")
        ?.addEventListener("change", () => {
          // NEW: Update filtered list based on current mode, but keep allPossibleWords unchanged
          const nineLetterMode = document.getElementById("nineLetterMode")?.checked || false;
          this.gameState.possibleWords = nineLetterMode ? 
            this.gameState.allPossibleWords.filter(word => word.length === 9) : 
            this.gameState.allPossibleWords;
          
          this.ui.renderFoundWords();
        });
  }
}

// === Application Bootstrap ===
document.addEventListener("DOMContentLoaded", async () => {
  const game = new WordGameController();
  await game.init();

  setTimeout(() => { game.themeManager.init(); }, 100);

  window.game = game;
});