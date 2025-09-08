class UIManager {
  constructor(gameState, validator) {
    this.gameState = gameState;
    this.validator = validator;
    this.elements = this.getElements();
  }

  getElements() {
    return {
      grid: document.getElementById("grid"),
      currentWord: document.getElementById("currentWord"),
      message: document.getElementById("message"),
      foundWords: document.getElementById("foundWords"),
      summary: document.getElementById("wordsFoundSummary"),
      dateInput: document.getElementById("selectDate"),
    };
  }

  drawGrid() {
    this.elements.grid.innerHTML = "";

    this.gameState.letters.forEach((letter, index) => {
      const cell = this.createLetterCell(letter, index);
      this.elements.grid.appendChild(cell);
    });
  }

  createLetterCell(letter, index) {
    const cell = document.createElement("div");
    cell.className = "letter-cell";
    cell.textContent = letter;
    cell.dataset.index = index;

    if (index === this.gameState.middleIndex) {
      cell.classList.add("center");
    }

    cell.addEventListener("click", () =>
      this.handleLetterClick(letter, index, cell),
    );
    return cell;
  }

  handleLetterClick(letter, index, cell) {
    if (this.gameState.addLetter(letter, index)) {
      cell.classList.add("used");
      this.updateCurrentWordDisplay();
    }
  }

  updateCurrentWordDisplay() {
    this.elements.currentWord.textContent = this.gameState.currentWord;
  }

  // Add this method to the UIManager class
  eraseLastLetter() {
    const removedIndex = this.gameState.removeLastLetter();
    if (removedIndex !== false) {
      // Update the visual state of the grid cell
      const gridCells = document.querySelectorAll(".letter-cell");
      if (gridCells[removedIndex]) {
        gridCells[removedIndex].classList.remove("used");
      }

      // Update the current word display
      this.updateCurrentWordDisplay();

      // Clear any messages (like error messages)
      this.showMessage("");

      return true;
    }
    return false;
  }

  clearCurrentWord() {
    this.gameState.clearCurrentWord();
    this.updateCurrentWordDisplay();

    document.querySelectorAll(".letter-cell").forEach((cell) => {
      cell.classList.remove("used");
    });
  }

  showMessage(text, isSuccess = false) {
    if (text) {
      this.elements.message.textContent = text;
      this.elements.message.style.visibility = "visible";
      this.elements.message.style.opacity = "1";
    } else {
      this.elements.message.style.visibility = "hidden";
      this.elements.message.style.opacity = "0";
      // Don't clear the text, just hide it
    }

    if (isSuccess) {
      this.elements.message.classList.add("celebrating");
      setTimeout(() => {
        this.elements.message.classList.remove("celebrating");
      }, 500);
    }
  }

  shuffleLetters() {
    // Store the current word letters (not indices)
    const currentWordLetters = this.gameState.currentWord.split("");

    const outerIndices = [0, 1, 2, 3, 5, 6, 7, 8];
    const outerLetters = outerIndices.map((i) => this.gameState.letters[i]);
    const shuffled = GridGenerator.shuffleArray(outerLetters);

    outerIndices.forEach((index, i) => {
      this.gameState.letters[index] = shuffled[i];
    });

    // Save the shuffled arrangement
    this.gameState.saveShuffledGrid();

    // Clear current selection
    this.gameState.selectedIndices.clear();

    // Rebuild the selection based on the letters in the current word
    for (const letter of currentWordLetters) {
      // Find an available cell with this letter
      for (let i = 0; i < this.gameState.letters.length; i++) {
        if (
          this.gameState.letters[i] === letter &&
          !this.gameState.selectedIndices.has(i)
        ) {
          this.gameState.selectedIndices.add(i);
          break;
        }
      }
    }

    this.drawGrid();

    // Re-apply the 'used' state to the correct cells
    this.gameState.selectedIndices.forEach((index) => {
      const cell = document.querySelector(`[data-index="${index}"]`);
      if (cell) {
        cell.classList.add("used");
      }
    });
  }

  renderFoundWords() {
    const container = this.elements.foundWords;
    container.innerHTML = "";

    const nineLetterOnly = document.getElementById("nineLetterMode")?.checked;
    const { foundByLength, totalByLength } =
      this.groupWordsByLength(nineLetterOnly);
    const lengths = Object.keys(totalByLength)
      .map(Number)
      .sort((a, b) => a - b);

    lengths.forEach((length) => {
      const group = this.createWordGroup(
        length,
        foundByLength[length] || [],
        totalByLength[length],
      );
      container.appendChild(group);
    });

    this.updateSummary(nineLetterOnly);
  }

  groupWordsByLength(nineLetterOnly) {
    const foundByLength = {};
    const totalByLength = {};

    this.gameState.possibleWords.forEach((word) => {
      if (nineLetterOnly && word.length !== 9) return;
      const len = word.length;
      totalByLength[len] = (totalByLength[len] || 0) + 1;
    });

    this.gameState.foundWords.forEach((word) => {
      if (nineLetterOnly && word.length !== 9) return;
      const len = word.length;
      if (!foundByLength[len]) foundByLength[len] = [];
      foundByLength[len].push(word);
    });

    return { foundByLength, totalByLength };
  }

  createWordGroup(length, foundWords, totalWords) {
    const group = document.createElement("div");
    group.className = "word-group";

    const heading = document.createElement("h3");
    heading.textContent = `${length} bokstäver`;
    group.appendChild(heading);

    const wordsList = document.createElement("div");
    wordsList.className = "words-list";

    if (foundWords.length > 0) {
      foundWords
        .sort((a, b) => a.localeCompare(b, "sv"))
        .forEach((word) => {
          const link = this.createWordLink(word);
          wordsList.appendChild(link);
        });
    }

    group.appendChild(wordsList);

    const remaining = document.createElement("div");
    remaining.className = "remaining-count";
    const leftCount = totalWords - foundWords.length;
    remaining.textContent = `${leftCount} ord kvar`;
    group.appendChild(remaining);

    return group;
  }

  createWordLink(word) {
    const link = document.createElement("a");
    link.className = "word-link";
    link.textContent = word;
    link.href = `https://svenska.se/tre/?sok=${encodeURIComponent(word)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  // In your existing UIManager class, update these methods:

  updateSummary(nineLetterOnly) {
    // Calculate the totals first
    const totalFound = Array.from(this.gameState.foundWords).filter(
      (word) => !nineLetterOnly || word.length === 9,
    ).length;

    const totalPossible = this.gameState.possibleWords.filter(
      (word) => !nineLetterOnly || word.length === 9,
    ).length;

    // Use translator if available
    const summaryText = window.game?.translator
      ? window.game.translator.translate("wordsFound", {
          found: totalFound,
          total: totalPossible,
        })
      : `${totalFound} / ${totalPossible} ord`;

    // Update your summary element
    document.getElementById("wordsFoundSummary").textContent = summaryText;
  }

  updateDateInput() {
    if (this.elements.dateInput) {
      this.elements.dateInput.value = DateUtils.formatForInput(
        this.gameState.currentDate,
      );
    }
  }

  updateNavigationButtons() {
    const nextBtn = document.getElementById("nextDayBtn");
    if (!nextBtn) return;

    const tomorrow = new Date(this.gameState.currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (DateUtils.isFuture(tomorrow)) {
      nextBtn.disabled = true;
      nextBtn.style.opacity = "0.4";
    } else {
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
    }
  }
}
