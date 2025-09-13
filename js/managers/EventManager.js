class EventManager {
  constructor(gameController) {
    this.game = gameController;
  }

  bindEvents() {
    this.bindButtonEvents();
    this.bindDateEvents();
    this.bindKeyboardEvents();
    this.bindModeToggle();
  }

  bindButtonEvents() {
    const buttons = {
      submitWord: () => this.game.submitWord(),
      eraseWord: () => this.game.ui.eraseLastLetter(),
      clearWord: () => this.game.ui.clearCurrentWord(),
      shuffleLetters: () => this.game.ui.shuffleLetters(),
      toggleThemeBtn: () => this.game.themeManager.toggle(),
      "achievements-btn": () => this.game.modalManager.showAchievements(),
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", handler);
      }
    });
  }

  bindDateEvents() {
    document.getElementById("prevDayBtn")?.addEventListener("click", () => {
      this.game.changeDate(-1);
    });

    document.getElementById("nextDayBtn")?.addEventListener("click", () => {
      this.game.changeDate(1);
    });

    document
      .getElementById("selectDate")
      ?.addEventListener("change", (event) => {
        const newDate = new Date(event.target.value);
        this.game.setDate(newDate);
      });
  }

  bindKeyboardEvents() {
    document.addEventListener("keydown", (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (event.key) {
        case "Enter":
          this.game.submitWord();
          event.preventDefault();
          break;

        case "Backspace":
          this.game.ui.eraseLastLetter();
          event.preventDefault();
          break;

        case "Delete":
          this.game.ui.clearCurrentWord();
          event.preventDefault();
          break;

        case " ":
          this.game.ui.shuffleLetters();
          event.preventDefault();
          break;

        default:
          this.handleLetterKeyPress(event);
          break;
      }
    });
  }

  handleLetterKeyPress(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const pressed = event.key.toUpperCase();
    if (!/^[A-ZÅÄÖ]$/.test(pressed)) return;

    for (let i = 0; i < this.game.gameState.letters.length; i++) {
      if (
        this.game.gameState.letters[i] === pressed &&
        !this.game.gameState.selectedIndices.has(i)
      ) {
        if (this.game.gameState.addLetter(pressed, i)) {
          const cell = document.querySelector(`[data-index="${i}"]`);
          if (cell) cell.classList.add("used");
          this.game.ui.updateCurrentWordDisplay();
        }
        break;
      }
    }

    event.preventDefault();
  }

  bindModeToggle() {
  document
    .getElementById("nineLetterMode")
    ?.addEventListener("change", () => {
      const nineLetterMode =
        document.getElementById("nineLetterMode")?.checked || false;
      
      console.log('Nine letter mode toggled to:', nineLetterMode); // ADD THIS
      
      // Save the state to localStorage
      localStorage.setItem('nineLetterMode', JSON.stringify(nineLetterMode));
      
      this.game.gameState.possibleWords = nineLetterMode
        ? this.game.gameState.allPossibleWords.filter(
            (word) => word.length === 9,
          )
        : this.game.gameState.allPossibleWords;

      this.game.ui.renderFoundWords();
    });
}
}
