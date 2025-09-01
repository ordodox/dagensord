class GameState {
    constructor() {
        this.currentWord = "";
        this.selectedIndices = new Set();
        this.foundWords = new Set();
        this.dictionary = new Set();
        this.possibleWords = [];
        this.letters = [];
        this.middleLetter = "";
        this.middleIndex = 4;
        this.currentDate = new Date();
    }

    reset() {
        this.currentWord = "";
        this.selectedIndices.clear();
        this.foundWords.clear();
    }

    addLetter(letter, index) {
        if (this.selectedIndices.has(index)) return false;
        
        this.selectedIndices.add(index);
        this.currentWord += letter;
        return true;
    }

    clearCurrentWord() {
        this.currentWord = "";
        this.selectedIndices.clear();
    }

    addFoundWord(word) {
        this.foundWords.add(word);
        this.saveFoundWords();
    }

    saveFoundWords() {
        const key = this.getStorageKey();
        const words = Array.from(this.foundWords);
        try {
            localStorage.setItem(key, JSON.stringify(words));
        } catch (error) {
            console.error("Failed to save words:", error);
        }
    }

    loadFoundWords() {
        const key = this.getStorageKey();
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const words = JSON.parse(stored);
                this.foundWords = new Set(words);
            }
        } catch (error) {
            console.error("Failed to load words:", error);
            this.foundWords = new Set();
        }
    }

    getStorageKey() {
        const date = this.currentDate;
        return `foundWords-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    getShuffleStorageKey() {
        const date = this.currentDate;
        return `shuffledGrid-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    saveShuffledGrid() {
        const key = this.getShuffleStorageKey();
        try {
            localStorage.setItem(key, JSON.stringify(this.letters));
        } catch (error) {
            console.error("Failed to save shuffled grid:", error);
        }
    }

    loadShuffledGrid() {
        const key = this.getShuffleStorageKey();
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const shuffledLetters = JSON.parse(stored);
                if (Array.isArray(shuffledLetters) && shuffledLetters.length === 9) {
                    return shuffledLetters;
                }
            }
        } catch (error) {
            console.error("Failed to load shuffled grid:", error);
        }
        return null;
    }

    clearShuffledGrid() {
        const key = this.getShuffleStorageKey();
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Failed to clear shuffled grid:", error);
        }
    }

    setDate(newDate) {
        this.currentDate = DateUtils.normalizeDate(newDate);
        this.foundWords.clear();
    }
}