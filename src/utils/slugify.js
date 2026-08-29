/**
 * Robust slugifier for matching categories, subcategories, families, and brands.
 * Converts strings like "Feature Phones", "Feature-Phones", "feature_phones" to "feature-phones".
 */
export const slugify = (value = "") => {
  if (!value || typeof value !== "string") return "";
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
};

export default slugify;
