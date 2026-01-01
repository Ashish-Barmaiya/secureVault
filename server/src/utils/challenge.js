import crypto from "crypto";

/**
 * Generates a cryptographically secure random challenge string (hex).
 * @param {number} length - Number of bytes (default 32)
 * @returns {string} Hex string
 */
export const generateRandomChallenge = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};
