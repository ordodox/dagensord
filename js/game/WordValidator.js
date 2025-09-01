class WordValidator {
  constructor(gameState, dictionary) {
    this.gameState = gameState;
    this.dictionary = dictionary;
  }

  validate(word) {
    const errors = [];

    if (!word.includes(this.gameState.middleLetter)) {
      errors.push(`Måste innehålla bokstaven ${this.gameState.middleLetter}.`);
    }

    if (word.length < 3) {
      errors.push("Ordet måste vara minst 3 bokstäver!");
    }

    const nineLetterOnly = document.getElementById("nineLetterMode")?.checked;
    if (nineLetterOnly && word.length !== 9) {
      errors.push("Ordet måste bestå av alla 9 bokstäver.");
    }

    if (this.gameState.foundWords.has(word)) {
      errors.push("Ord redan hittat!");
    }

    if (!this.dictionary.has(word)) {
      errors.push(`${word} finns ej i ordlistan.`);
    }

    return {isValid : errors.length === 0, errors};
  }

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
    this.gameState.letters.forEach(
        letter => { counts[letter] = (counts[letter] || 0) + 1; });
    return counts;
  }

  isWordValid(word, letterCounts, nineLetterOnly) {
    if (word.length < 3)
      return false;
    if (!word.includes(this.gameState.middleLetter))
      return false;

    if (nineLetterOnly) {
      if (word.length !== 9)
        return false;
      const wordSorted = word.split('').sort().join('');
      const gridSorted = this.gameState.letters.slice().sort().join('');
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