export const CATEGORIES = [
  { value: "Cocktail", label: "Cocktails" },
  { value: "Longdrink", label: "Longdrinks" },
  { value: "Softdrink", label: "Softdrinks" },
  { value: "Bier", label: "Bier" },
  { value: "Wein", label: "Wein" },
  { value: "Sekt", label: "Sekt" },
  { value: "Shot", label: "Shots" },
  { value: "Kaffee", label: "Kaffee" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export const CATEGORY_VALUES = CATEGORIES.map((category) => category.value) as [Category, ...Category[]];


export function isCategory(value: string | undefined | null): value is Category {
  return CATEGORIES.some((category) => category.value === value);
}
