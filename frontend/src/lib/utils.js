export function localized(value, language = "en") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.hi || value.kn || "";
}

export function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/** Scheme categories may arrive polluted ("Label | desc\n\n- **Description...") */
export function cleanCategory(category = "") {
  return String(category).split("\n")[0].split("|")[0].trim();
}

export function formatDate(value, language = "en") {
  if (!value) return "";
  return new Date(value).toLocaleDateString(toLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const localeMap = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
};

export const toLocale = (language = "en") => localeMap[language] || "en-IN";

/** Translate a known enum value with a readable fallback. */
export function translateOption(t, group, value) {
  if (!value || value === "not_collected") return t("common.notCollected");
  const key = `options.${group}.${value}`;
  return t(key, {
    defaultValue: String(value).replace(/_/g, " "),
  });
}
