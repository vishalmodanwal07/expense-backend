/** Basic email shape check (aligned with backend signup expectations). */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

/**
 * Normalizes Indian mobile: strips spaces, optional +91 / 91 prefix.
 * @returns {string|null} 10-digit string or null if invalid
 */
export function normalizeIndianMobile(input) {
  if (input == null) return null;
  let s = String(input).replace(/\s/g, "").trim();
  if (!s) return null;
  if (s.startsWith("+91")) s = s.slice(3);
  else if (s.startsWith("91") && s.length === 12) s = s.slice(2);
  if (!/^[6-9]\d{9}$/.test(s)) return null;
  return s;
}

/** User row must have a valid email and a valid Indian mobile to record expenses. */
export function userHasValidContactForExpenses(user) {
  if (!user) return false;
  const emailOk = isValidEmailFormat(user.email || "");
  const mobileOk = normalizeIndianMobile(String(user.mobile ?? "")) != null;
  return emailOk && mobileOk;
}
