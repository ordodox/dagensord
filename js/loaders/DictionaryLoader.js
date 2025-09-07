class DictionaryLoader {
  constructor() {
    this.dictionary = new Set();
    this.isLoaded = false;
  }

  async load() {
    try {
      // Use the dictionary file from language config
      const response = await fetch(LanguageConfig.dictionaryFile);
      if (!response.ok)
        throw new Error('Dictionary file not found');

      const text = await response.text();

      // Process the text into words
      const words =
          text.split('\n')
              .map(word => word.trim().toUpperCase()) // Clean and normalize
              .filter(word => word.length > 0);       // Remove empty lines

      // Add words to the Set
      words.forEach(word => this.dictionary.add(word));

      this.isLoaded = true;
      console.log(`Dictionary loaded: ${this.dictionary.size} words (${
          LanguageConfig.language})`);
      return true;
    } catch (error) {
      console.error('Failed to load dictionary:', error);
      return false;
    }
  }

  has(word) { return this.dictionary.has(word.toUpperCase()); }

  contains(word) { return this.has(word); }

  getWords() { return Array.from(this.dictionary); }
}
