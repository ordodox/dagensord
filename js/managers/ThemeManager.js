class ThemeManager {
  constructor() {
    this.currentTheme = "light";
  }

  init() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      this.currentTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      const currentBodyTheme = document.body.getAttribute("data-theme");

      if (currentBodyTheme && ["light", "dark"].includes(currentBodyTheme)) {
        this.applyTheme(currentBodyTheme);
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        this.applyTheme(prefersDark ? "dark" : "light");
      }
    }
  }

  toggle() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(newTheme);
  }

  applyTheme(theme) {
    this.currentTheme = theme;

    document.body.setAttribute("data-theme", theme);
    document.body.classList.toggle("dark-mode", theme === "dark");

    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }

    setTimeout(() => {
      this.updateIcons(theme);
    }, 50);
  }

  updateIcons(theme) {
    const iconSuffix = theme === "dark" ? "dark" : "light";
    const icons = {
      submitIcon: `img/ui/submit_${iconSuffix}.png`,
      eraseIcon: `img/ui/erase_${iconSuffix}.png`,
      resetIcon: `img/ui/reset_${iconSuffix}.png`,
      shuffleIcon: `img/ui/shuffle_${iconSuffix}.png`,
      achievementIcon: `img/ui/achievement_${iconSuffix}.png`,
      helpIcon: `img/ui/help_${iconSuffix}.png`,
      themeIcon: theme === "dark" ? "img/ui/light.png" : "img/ui/dark.png",
    };

    Object.entries(icons).forEach(([id, src]) => {
      const element = document.getElementById(id);
      if (element) {
        element.src = src;
      }
    });
  }
}
