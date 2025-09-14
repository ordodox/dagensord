// === Share Manager ===
console.log('ShareManager loaded');

class ShareManager {
  constructor(gameState, achievementManager, translator) {
    console.log('ShareManager constructor called');
    this.gameState = gameState;
    this.achievementManager = achievementManager;
    this.translator = translator;
  }

  generateShareData() {
    console.log('generateShareData called');
    const date = new Date(this.gameState.currentDate).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    
    // Convert Set to Array for filtering
    const foundWordsArray = Array.from(this.gameState.foundWords);
    const foundCount = foundWordsArray.length;
    
    // Always use the total count of ALL possible words (not filtered by mode)
    const totalCount = this.gameState.allPossibleWords.length;
    const percentage = Math.round((foundCount / totalCount) * 100);
    
    // Count 9-letter words found
    const nineLetterFound = foundWordsArray.filter(word => word.length === 9).length;
    const totalNineLetterWords = this.gameState.allPossibleWords.filter(word => word.length === 9).length;
    
    // Create visual progress bar
    const barLength = 10;
    const filledBlocks = Math.round((foundCount / totalCount) * barLength);
    const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(barLength - filledBlocks);
    
    // Check for achievements using correct method
    const allAchievements = this.achievementManager.getAllAchievements();
    const earnedAchievements = allAchievements.filter(a => a.unlocked).length;
    
    // Generate localized shareable text with translated title
    const shareText = `🔤 ${this.translator.translate('title')} ${date}
${foundCount}/${totalCount} ${this.translator.translate('share.words')} (${percentage}%)
${progressBar}
🎯 ${nineLetterFound}/${totalNineLetterWords} ${this.translator.translate('share.nine_letter_words')}
🏆 ${earnedAchievements} ${this.translator.translate('share.achievements')}

${this.translator.translate('share.play_at')} ${window.location.origin}${window.location.pathname}?date=${DateUtils.formatForInput(this.gameState.currentDate)}`;

    const shareData = {
      text: shareText,
      url: `${window.location.origin}${window.location.pathname}?date=${DateUtils.formatForInput(this.gameState.currentDate)}`,
      title: this.translator.translate('share.title', { date })
    };
    
    console.log('Generated share data:', shareData);
    return shareData;
  }

  async shareResult() {
    console.log('shareResult called');
    const shareData = this.generateShareData();
    
    // Try native Web Share API first (mobile devices)
    if (navigator.share) {
      console.log('Navigator.share available, trying native share...');
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
        console.log('Native share successful');
        return;
      } catch (err) {
        console.log('Native share failed or cancelled:', err);
        // User cancelled or error occurred, fall back to clipboard
      }
    } else {
      console.log('Navigator.share not available, falling back to clipboard');
    }
    
    // Fallback: Copy to clipboard
    try {
      console.log('Trying to copy to clipboard...');
      await navigator.clipboard.writeText(shareData.text);
      console.log('Clipboard copy successful');
      // Show success message through UIManager if available
      if (window.game && window.game.ui) {
        window.game.ui.showMessage(this.translator.translate('share.copied'), true);
      }
    } catch (err) {
      console.log('Clipboard copy failed:', err);
      // Final fallback: Show modal with text to copy
      this.showShareModal(shareData.text);
    }
  }

  showShareModal(shareText) {
    console.log('showShareModal called');
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="share-modal-content">
        <h3>${this.translator.translate('share.modalTitle')}</h3>
        <textarea readonly class="share-text" rows="8">${shareText}</textarea>
        <div class="share-modal-buttons">
          <button onclick="this.closest('.share-modal').remove()">${this.translator.translate('share.close')}</button>
          <button onclick="navigator.clipboard?.writeText(\`${shareText.replace(/`/g, '\\`')}\`).then(() => this.textContent = '${this.translator.translate('share.copied_button')}')">${this.translator.translate('share.copy')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  setupShareButton() {
    console.log('Setting up share button...');
    const shareButton = document.getElementById('shareButton');
    console.log('Share button element:', shareButton);
    
    if (shareButton) {
      console.log('Adding click listener to share button');
      shareButton.addEventListener('click', () => {
        console.log('Share button clicked!');
        this.shareResult();
      });
    } else {
      console.error('Share button not found!');
    }
  }
}