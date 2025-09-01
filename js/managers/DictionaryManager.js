class DictionaryManager {
  constructor() {
    this.dictionary = new Set();
    this.isLoaded = false;
  }

  async load() {
    try {
      const response = await fetch('SAOL14.txt');
      if (!response.ok) {
        throw new Error("Dictionary file not found");
      }

      const text = await response.text();
      const words = text.split('\n')
                        .map(word => word.trim().toUpperCase())
                        .filter(word => /^[A-ZÅÄÖ]{3,}$/i.test(word) &&
                                        word.length > 0);

      this.dictionary = new Set(words);
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error("Failed to load dictionary:", error);
      return false;
    }
  }

  has(word) { return this.dictionary.has(word.toUpperCase()); }

  getWords() { return Array.from(this.dictionary); }
}