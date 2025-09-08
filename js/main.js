// === Main Game Controller ===
class WordGameController {
  constructor() {
    this.gameState = new GameState();
    this.dictionary = new DictionaryLoader();
    this.validator = new WordValidator(this.gameState, this.dictionary);
    this.ui = new UIManager(this.gameState, this.validator);
    this.themeManager = new ThemeManager();
    this.achievementManager = new AchievementManager(this.gameState);
    this.translator = new TranslationLoader();
    this.modalManager = null; // Will be initialized after translator
    this.eventManager = null; // Will be initialized after translator
  }

  async init() {
    // Initialize translator first
    const translationsLoaded = await this.translator.init();
    if (!translationsLoaded) {
      console.error("Could not load translations");
      return;
    }

    // Set page title
    this.translator.updateTitle("title");

    const dictionaryLoaded = await this.dictionary.load();
    if (!dictionaryLoaded) {
      this.ui.showMessage(
        this.translator.translate("messages.dictionaryLoadError"),
      );
      return;
    }

    this.gameState.dictionary = this.dictionary.dictionary;

    // Make translator globally available for other components
    window.game = this;

    // Initialize achievement manager
    const achievementsLoaded = await this.achievementManager.init();
    if (!achievementsLoaded) {
      console.warn("Could not load achievements");
    }

    // Initialize managers
    this.modalManager = new ModalManager(
      this.gameState,
      this.achievementManager,
      this.translator,
    );
    this.eventManager = new EventManager(this);

    this.setupInitialDate();
    this.setupGame();

    // Setup UI components
    this.modalManager.setupAchievementUI();
    this.modalManager.setupHelpUI();
    this.modalManager.populateHelpContent();
    this.eventManager.bindEvents();
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
      this.dictionary,
      this.gameState.currentDate,
    );

    const shuffledLetters = this.gameState.loadShuffledGrid();
    if (shuffledLetters) {
      const baseSorted = baseLetters.slice().sort().join("");
      const shuffledSorted = shuffledLetters.slice().sort().join("");

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

    // Set the complete unfiltered list first
    this.gameState.allPossibleWords = this.validator.getPossibleWords();

    // Then set the filtered list based on current mode
    const nineLetterMode =
      document.getElementById("nineLetterMode")?.checked || false;
    this.gameState.possibleWords = nineLetterMode
      ? this.gameState.allPossibleWords.filter((word) => word.length === 9)
      : this.gameState.allPossibleWords;

    this.ui.renderFoundWords();
    this.ui.updateDateInput();
    this.ui.updateNavigationButtons();
  }

  submitWord() {
    this.ui.showMessage("");

    const validation = this.validator.validate(this.gameState.currentWord);

    if (!validation.isValid) {
      this.ui.showMessage(validation.errors[0]);
      this.ui.clearCurrentWord();
      return;
    }

    this.gameState.addFoundWord(this.gameState.currentWord);

    const newAchievements = this.achievementManager.checkAchievements(
      this.gameState.currentWord,
    );

    this.ui.renderFoundWords();
    const successMessage = this.translator.translate("messages.wordFound", {
      word: this.gameState.currentWord,
    });
    this.ui.showMessage(successMessage, true);

    this.ui.clearCurrentWord();

    // Use modal manager for notifications
    newAchievements.forEach((achievement, index) => {
      setTimeout(
        () => this.modalManager.showAchievementNotification(achievement),
        (index + 1) * 1000,
      );
    });

    setTimeout(() => {
      this.ui.showMessage("");
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
}

// === Application Bootstrap ===
document.addEventListener("DOMContentLoaded", async () => {
  const game = new WordGameController();
  await game.init();

  setTimeout(() => {
    game.themeManager.init();
  }, 100);

  window.game = game;
});
