class GridGenerator {
  static seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static getSeed(date) {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 +
           date.getDate();
  }

  static isValidSwedishWord(word) { return /^[A-ZÅÄÖ]{9}$/i.test(word); }

  static generateLetters(dictionary, date) {
    const seed = this.getSeed(date);

    const clean9LetterWords = dictionary.getWords().filter(
        word => word.length === 9 && this.isValidSwedishWord(word));

    if (clean9LetterWords.length === 0) {
      console.log('No 9-letter words found, returning X array');
      return Array(9).fill("X");
    }

    const index =
        Math.floor(this.seededRandom(seed) * clean9LetterWords.length);
    const chosenWord = clean9LetterWords[index];
    const letters = chosenWord.split("");

    // Choose which letter will be the center (required) letter
    const centerLetterIndex = Math.floor(this.seededRandom(seed + 1000) * 9);
    const centerLetter = letters[centerLetterIndex];

    // Create a proper shuffle using Fisher-Yates with seeded random
    const shuffledLetters = [...letters ];
    for (let i = shuffledLetters.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom(seed + i + 2000) * (i + 1));
      [shuffledLetters[i], shuffledLetters[j]] =
          [ shuffledLetters[j], shuffledLetters[i] ];
    }

    // Ensure the chosen center letter is at position 4 (middle of 3x3 grid)
    const centerPosition = shuffledLetters.indexOf(centerLetter);
    if (centerPosition !== 4) {
      [shuffledLetters[4], shuffledLetters[centerPosition]] =
          [ shuffledLetters[centerPosition], shuffledLetters[4] ];
    }

    return shuffledLetters;
  }

  static shuffleArray(array) {
    const shuffled = [...array ];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [ shuffled[j], shuffled[i] ];
    }
    return shuffled;
  }
}
