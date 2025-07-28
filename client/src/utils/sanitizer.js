// utils/sanitizer.js
export function safeJsonParse(str) {
  try {
    const parsed = JSON.parse(str);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

function sanitizeObject(obj) {
  if (typeof obj === "string") return sanitizeString(obj);
  if (typeof obj !== "object" || obj === null) return obj;

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    sanitized[key] = sanitizeObject(obj[key]);
  }
  return sanitized;
}

function sanitizeString(str) {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
