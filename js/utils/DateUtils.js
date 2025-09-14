class DateUtils {
  static formatForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  static formatForDisplay(date) {
    return new Date(date).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  static isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  static isFuture(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  }

  static normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
