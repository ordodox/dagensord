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
    this.shareManager = null; // Will be initialized after translator
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
    this.shareManager = new ShareManager(
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
    this.shareManager.setupShareButton();
    this.eventManager.bindEvents();
  }

  getDateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");

    if (dateParam) {
      // Validate the date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateParam)) {
        const date = new Date(dateParam);
        // Check if it's a valid date and not in the future
        if (!isNaN(date.getTime()) && !DateUtils.isFuture(date)) {
          return dateParam;
        }
      }
    }

    // If no valid date parameter, return null to use default logic
    return null;
  }

  updateURL(date) {
    const url = new URL(window.location);
    url.searchParams.set("date", date);
    window.history.replaceState({}, "", url);
  }

setupInitialDate() {
  const dateInput = document.getElementById("selectDate");
  const today = new Date();
  const todayStr = DateUtils.formatForInput(today);

  dateInput.max = todayStr;

  // Check for URL date parameter first
  const urlDate = this.getDateFromURL();
  let initialDate = today;

  if (urlDate) {
    // Use URL date
    initialDate = new Date(urlDate);
    dateInput.value = urlDate;
  } else {
    // No URL date parameter - default to today's date
    initialDate = today;
    dateInput.value = todayStr;
    
    // Note: We're not using localStorage for initial date anymore
    // The saved date is only used for other purposes, not page load
  }

  this.gameState.setDate(initialDate);

  // Save the selected date to localStorage (for other functionality)
  localStorage.setItem("selectedDate", DateUtils.formatForInput(initialDate));

  // Update URL to reflect the current date
  this.updateURL(DateUtils.formatForInput(initialDate));
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

    // Restore nine-letter mode state after allPossibleWords is set
    const savedMode = localStorage.getItem("nineLetterMode");
    if (savedMode !== null) {
      const nineLetterToggle = document.getElementById("nineLetterMode");
      if (nineLetterToggle) {
        nineLetterToggle.checked = JSON.parse(savedMode);
      }
    }

    // Then set the filtered list based on current mode
    const nineLetterMode =
      document.getElementById("nineLetterMode")?.checked || false;
    this.gameState.possibleWords = nineLetterMode
      ? this.gameState.allPossibleWords.filter((word) => word.length === 9)
      : this.gameState.allPossibleWords;

    this.ui.renderFoundWords();
    this.ui.updateDateInput();
    this.ui.updateNavigationButtons();

    // Set up the toggle event listener
    const toggle = document.getElementById("nineLetterMode");
    if (toggle) {
      // Remove any existing event listeners first
      if (this.handleToggleChange) {
        toggle.removeEventListener("change", this.handleToggleChange);
      }

      this.handleToggleChange = (e) => {
        // Always get fresh word list during toggle
        this.gameState.allPossibleWords = this.validator.getPossibleWords();
        this.gameState.nineLetterMode = e.target.checked;

        // Filter possible words based on toggle state
        if (this.gameState.nineLetterMode) {
          this.gameState.possibleWords = this.gameState.allPossibleWords.filter(
            (word) => word.length === 9,
          );
        } else {
          this.gameState.possibleWords = [...this.gameState.allPossibleWords];
        }

        // Save the setting
        localStorage.setItem("nineLetterMode", this.gameState.nineLetterMode);

        // Re-render the found words display
        this.ui.renderFoundWords();
      };

      // Add the event listener
      toggle.addEventListener("change", this.handleToggleChange);
    }
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

    // Save the selected date to localStorage
    localStorage.setItem("selectedDate", DateUtils.formatForInput(newDate));

    // Update URL when date changes
    this.updateURL(DateUtils.formatForInput(newDate));

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
