class ThemeManager {
  constructor() {
    this.currentTheme = "light";
  }


  init() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme && ["light", "dark"].includes(savedTheme)) {
    this.currentTheme = savedTheme;
    // Don't call applyTheme since inline script already set the theme
    // Just sync the currentTheme variable
  } else {
    const currentTheme = document.documentElement.getAttribute("data-theme");

    if (currentTheme && ["light", "dark"].includes(currentTheme)) {
      this.currentTheme = currentTheme;
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const defaultTheme = prefersDark ? "dark" : "light";
      this.applyTheme(defaultTheme);
    }
  }
}

  applyTheme(theme) {
  console.log('applyTheme called with:', theme);
  this.currentTheme = theme;

  if (theme === 'dark') {
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("dark-mode");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.body.classList.remove("dark-mode"); 
  }

  try {
    localStorage.setItem("theme", theme);
  } catch (error) {
    console.error("Failed to save theme:", error);
  }
}


  toggle() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(newTheme);
  }
}
