class TranslationLoader {
  constructor() {
    this.translations = {};
  }

  async init() {
    try {
      const response = await fetch(LanguageConfig.translationFile);
      if (!response.ok) throw new Error("Translation file not found");
      this.translations = await response.json();
      return true;
    } catch (error) {
      console.error("Failed to load translations:", error);
      return false;
    }
  }

  translate(key, params = {}) {
    const keys = key.split(".");
    let value = this.translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Replace parameters like {count}, {word}, etc.
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  updateElement(element, key, params = {}) {
    if (element) {
      element.textContent = this.translate(key, params);
    }
  }

  updateTitle(key, params = {}) {
    document.title = this.translate(key, params);
  }
}
