// === Share Manager ===
class ShareManager {
  constructor(gameState, achievementManager, translator) {
    this.gameState = gameState;
    this.achievementManager = achievementManager;
    this.translator = translator;
  }

  generateShareData() {
    const date = new Date(this.gameState.currentDate).toLocaleDateString(
      "sv-SE",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    // Convert Set to Array for filtering
    const foundWordsArray = Array.from(this.gameState.foundWords);
    const foundCount = foundWordsArray.length;

    // Always use the total count of ALL possible words (not filtered by mode)
    const totalCount = this.gameState.allPossibleWords
      ? this.gameState.allPossibleWords.length
      : 0;
    const percentage =
      totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;

    // Count 9-letter words found
    const nineLetterFound = foundWordsArray.filter(
      (word) => word.length === 9,
    ).length;
    const totalNineLetterWords = this.gameState.allPossibleWords
      ? this.gameState.allPossibleWords.filter((word) => word.length === 9)
          .length
      : 0;

    // Create visual progress bar with safety checks
    const barLength = 10;
    const filledBlocks =
      totalCount > 0
        ? Math.max(0, Math.round((foundCount / totalCount) * barLength))
        : 0;
    const progressBar =
      "█".repeat(filledBlocks) +
      "░".repeat(Math.max(0, barLength - filledBlocks));

    // Check for achievements using correct method
    const allAchievements = this.achievementManager.getAllAchievements();
    const earnedAchievements = allAchievements.filter((a) => a.unlocked).length;

    // Generate letter grid with more spacing
    const letters = this.gameState.letters || [];
    const centerIndex = this.gameState.middleIndex;


    const grid = letters.length >= 9
  ? `• ${letters[0]} • ${letters[1]} • ${letters[2]} •
• ${letters[3]} • ${letters[4]} • ${letters[5]} •
• ${letters[6]} • ${letters[7]} • ${letters[8]} •`
  : "";

    // Generate localized shareable text with translated title and grid
    const shareText = `🔤 ${this.translator.translate("title")} ${date}
${grid}

${foundCount}/${totalCount} ${this.translator.translate("share.words")} (${percentage}%)
${progressBar}
🎯 ${nineLetterFound}/${totalNineLetterWords} ${this.translator.translate("share.nine_letter_words")}
🏆 ${earnedAchievements} ${this.translator.translate("share.achievements")}

${this.translator.translate("share.play_at")} ${window.location.origin}${window.location.pathname}?date=${DateUtils.formatForInput(this.gameState.currentDate)}`;

    return {
      text: shareText,
      url: `${window.location.origin}${window.location.pathname}?date=${DateUtils.formatForInput(this.gameState.currentDate)}`,
      title: this.translator.translate("share.title", { date }),
    };
  }

  async shareResult() {
    const shareData = this.generateShareData();

    // Try native Web Share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          // Remove the url parameter to avoid duplication
        });
        return;
      } catch (err) {
        // User cancelled or error occurred, fall back to clipboard
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareData.text);
      // Show success message through UIManager if available
      if (window.game && window.game.ui) {
        window.game.ui.showMessage(
          this.translator.translate("share.copied"),
          true,
        );
      }
    } catch (err) {
      // Final fallback: Show modal with text to copy
      this.showShareModal(shareData.text);
    }
  }

  showShareModal(shareText) {
    const modal = document.createElement("div");
    modal.className = "share-modal";
    modal.innerHTML = `
      <div class="share-modal-content">
        <h3>${this.translator.translate("share.modalTitle")}</h3>
        <textarea readonly class="share-text" rows="8">${shareText}</textarea>
        <div class="share-modal-buttons">
          <button onclick="this.closest('.share-modal').remove()">${this.translator.translate("share.close")}</button>
          <button onclick="navigator.clipboard?.writeText(\`${shareText.replace(/`/g, "\\`")}\`).then(() => this.textContent = '${this.translator.translate("share.copied_button")}')">${this.translator.translate("share.copy")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  setupShareButton() {
    const shareIcon = document.getElementById("shareIconWrapper");
    const shareText = document.getElementById("shareTextWrapper");

    if (shareIcon) {
      shareIcon.addEventListener("click", () => {
        this.shareResult();
      });
    }

    if (shareText) {
      shareText.addEventListener("click", () => {
        this.shareResult();
      });
    }
  }
}
