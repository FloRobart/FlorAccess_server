/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param unsafe The input string that may contain unsafe HTML characters.
 * @returns The escaped string with HTML special characters replaced.
 */
const escapeHtml = (unsafe: string) => {
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return unsafe;
};



export default escapeHtml;