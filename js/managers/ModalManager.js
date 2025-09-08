class ModalManager {
  constructor(gameState, achievementManager, translator) {
    this.gameState = gameState;
    this.achievementManager = achievementManager;
    this.translator = translator;
  }

  setupAchievementUI() {
    const achievementsBtn = document.getElementById("achievements-btn");
    if (achievementsBtn) {
      achievementsBtn.addEventListener("click", () => this.showAchievements());
    }

    const modal = document.getElementById("achievement-modal");
    const closeBtn = document.querySelector(".achievement-close");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideAchievements());
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideAchievements();
      });
    }
  }

  setupHelpUI() {
    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => this.showHelp());
    }

    const helpModal = document.getElementById("help-modal");
    const helpCloseBtn = document.querySelector(".help-close");

    if (helpCloseBtn) {
      helpCloseBtn.addEventListener("click", () => this.hideHelp());
    }

    if (helpModal) {
      helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) this.hideHelp();
      });
    }
  }

  showHelp() {
    const modal = document.getElementById("help-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideHelp() {
    const modal = document.getElementById("help-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  showAchievements() {
    const modal = document.getElementById("achievement-modal");
    const list = document.getElementById("achievements-list");

    if (!modal || !list) return;

    const achievements = this.achievementManager.getAllAchievements();
    const unlockedAchievements =
      this.achievementManager.getUnlockedAchievements();

    list.innerHTML = achievements
      .map((achievement) => {
        const unlocked = unlockedAchievements.find(
          (u) => u.id === achievement.id,
        );
        const unlockedClass = achievement.unlocked ? "unlocked" : "locked";

        let dateText = "";
        if (unlocked) {
          const date = new Date(unlocked.unlockedAt);
          dateText = `<div class="achievement-item-date">Upplåst: ${date.toLocaleDateString(
            "sv-SE",
          )}</div>`;
        }

        return `
        <div class="achievement-item ${unlockedClass}">
          <div class="achievement-item-icon">${achievement.icon}</div>
          <div class="achievement-item-text">
            <div class="achievement-item-title">${achievement.name}</div>
            <div class="achievement-item-description">${
              achievement.description
            }</div>
            ${dateText}
          </div>
        </div>
      `;
      })
      .join("");

    modal.classList.remove("hidden");
  }

  hideAchievements() {
    const modal = document.getElementById("achievement-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  showAchievementNotification(achievement) {
    const notification = document.getElementById("achievement-notification");
    if (!notification) return;

    const icon = notification.querySelector(".achievement-icon");
    const title = notification.querySelector(".achievement-title");
    const description = notification.querySelector(".achievement-description");

    if (icon) icon.textContent = achievement.icon;
    if (title) title.textContent = achievement.name;
    if (description) description.textContent = achievement.description;

    notification.classList.remove("hidden");
    setTimeout(() => notification.classList.add("show"), 100);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.classList.add("hidden"), 300);
    }, 4000);
  }

  populateHelpContent() {
    const helpContent = document.getElementById("help-content");
    const helpTitle = document.getElementById("help-title");

    if (!helpContent || !this.translator) return;

    const help = this.translator.translations.help;
    if (!help) return;

    // Update title
    if (helpTitle) {
      helpTitle.textContent = help.title;
    }

    // Generate sections
    const sections = help.sections;
    let html = "";

    // Goal section
    if (sections.goal) {
      html += `
        <div class="help-section">
          <h3>${sections.goal.title}</h3>
          <p>${sections.goal.content}</p>
        </div>
      `;
    }

    // Rules section
    if (sections.rules) {
      html += `
        <div class="help-section">
          <h3>${sections.rules.title}</h3>
          <ul>
            ${sections.rules.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    // Controls section
    if (sections.controls) {
      html += `
        <div class="help-section">
          <h3>${sections.controls.title}</h3>
          <ul>
            ${sections.controls.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    // Achievements section
    if (sections.achievements) {
      html += `
        <div class="help-section">
          <h3>${sections.achievements.title}</h3>
          <p>${sections.achievements.content}</p>
        </div>
      `;
    }

    // Nine letter mode section
    if (sections.nineLetterMode) {
      html += `
        <div class="help-section">
          <h3>${sections.nineLetterMode.title}</h3>
          <p>${sections.nineLetterMode.content}</p>
        </div>
      `;
    }

    helpContent.innerHTML = html;
  }
}
