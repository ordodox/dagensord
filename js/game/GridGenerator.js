class GridGenerator {
    static seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    static getSeed(date) {
        return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    }

    static isValidSwedishWord(word) {
        return /^[A-ZÅÄÖ]{9}$/i.test(word);
    }

    static generateLetters(dictionary, date) {
        const seed = this.getSeed(date);
        const clean9LetterWords = dictionary
            .getWords()
            .filter(word => word.length === 9 && this.isValidSwedishWord(word));

        if (clean9LetterWords.length === 0) {
            return Array(9).fill("X");
        }

        const index = Math.floor(this.seededRandom(seed) * clean9LetterWords.length);
        return clean9LetterWords[index].split("");
    }

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}