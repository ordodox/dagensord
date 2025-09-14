class WordValidator {
  constructor(gameState, dictionary) {
    this.gameState = gameState;
    this.dictionary = dictionary;
  }

  validate(word) {
    const errors = [];

    if (word.length < 3) {
      errors.push(this.getTranslation("messages.wordTooShort"));
    }

    // Add nine-letter mode check
    const nineLetterMode =
      document.getElementById("nineLetterMode")?.checked || false;
    if (nineLetterMode && word.length !== 9) {
      errors.push(this.getTranslation("messages.nineLetterModeOnly"));
    }

    if (!word.includes(this.gameState.middleLetter)) {
      errors.push(
        this.getTranslation("messages.wordMissingCenter", {
          letter: this.gameState.middleLetter,
        }),
      );
    }

    if (!this.dictionary.contains(word)) {
      errors.push(this.getTranslation("messages.wordNotInDictionary"));
    }

    if (this.gameState.foundWords.has(word)) {
      errors.push(this.getTranslation("messages.wordAlreadyFound"));
    }

    return { isValid: errors.length === 0, errors };
  }

  getTranslation(key, params = {}) {
    // Access translator through global game instance
    if (window.game && window.game.translator) {
      return window.game.translator.translate(key, params);
    }
    // Fallback to key if translator not available
    return key;
  } // ADD THIS MISSING CLOSING BRACE

  getPossibleWords() {
    const letterCounts = this.getLetterCounts();
    const nineLetterOnly = document.getElementById("nineLetterMode")?.checked;
    const results = [];

    for (const word of this.dictionary.getWords()) {
      if (!this.isWordValid(word, letterCounts, nineLetterOnly)) {
        continue;
      }
      results.push(word);
    }

    return results;
  }

  getLetterCounts() {
    const counts = {};
    this.gameState.letters.forEach((letter) => {
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  }

  isWordValid(word, letterCounts, nineLetterOnly) {
    if (word.length < 3) return false;
    if (!word.includes(this.gameState.middleLetter)) return false;

    if (nineLetterOnly) {
      if (word.length !== 9) return false;
      const wordSorted = word.split("").sort().join("");
      const gridSorted = this.gameState.letters.slice().sort().join("");
      return wordSorted === gridSorted;
    }

    const wordLetterCounts = {};
    for (const char of word) {
      wordLetterCounts[char] = (wordLetterCounts[char] || 0) + 1;
      if (!letterCounts[char] || wordLetterCounts[char] > letterCounts[char]) {
        return false;
      }
    }

    return true;
  }
}
