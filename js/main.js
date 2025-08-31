// === Main Game Controller ===
class WordGameController {
    constructor() {
        this.gameState = new GameState();
        this.dictionary = new DictionaryManager();
        this.validator = new WordValidator(this.gameState, this.dictionary);
        this.ui = new UIManager(this.gameState, this.validator);
        this.themeManager = new ThemeManager();
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
        this.gameState.letters = GridGenerator.generateLetters(this.dictionary, this.gameState.currentDate);
        this.gameState.middleLetter = this.gameState.letters[this.gameState.middleIndex];
        
        this.ui.drawGrid();
        this.gameState.loadFoundWords();
        this.gameState.possibleWords = this.validator.getPossibleWords();
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
        this.ui.renderFoundWords();
        this.ui.showMessage(`${this.gameState.currentWord} hittat! 🎉`, true);

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
            submitWord: () => this.submitWord(),
            clearWord: () => this.ui.clearCurrentWord(),
            shuffleLetters: () => this.ui.shuffleLetters(),
            toggleThemeBtn: () => this.themeManager.toggle()
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
            this.changeDate(-1);
        });

        document.getElementById("nextDayBtn")?.addEventListener("click", () => {
            this.changeDate(1);
        });

        document.getElementById("selectDate")?.addEventListener("change", (event) => {
            const newDate = new Date(event.target.value);
            this.setDate(newDate);
        });
    }

    bindKeyboardEvents() {
        document.addEventListener("keydown", (event) => {
            // Ignore if typing in input fields
            if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
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
        // Only handle letter keys without modifiers
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        const pressed = event.key.toUpperCase();
        if (!/^[A-ZÅÄÖ]$/.test(pressed)) return;

        // Find first available letter in grid
        for (let i = 0; i < this.gameState.letters.length; i++) {
            if (this.gameState.letters[i] === pressed && !this.gameState.selectedIndices.has(i)) {
                if (this.gameState.addLetter(pressed, i)) {
                    const cell = document.querySelector(`[data-index="${i}"]`);
                    if (cell) cell.classList.add("used");
                    this.ui.updateCurrentWordDisplay();
                }
                break;
            }
        }
        
        event.preventDefault();
    }

    bindModeToggle() {
        document.getElementById("nineLetterMode")?.addEventListener("change", () => {
            this.gameState.possibleWords = this.validator.getPossibleWords();
            this.ui.renderFoundWords();
        });
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