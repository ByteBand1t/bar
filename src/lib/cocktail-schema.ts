import { z } from "zod";

export const IngredientSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  amount: z.string(),
});

export const CocktailSchema = z.object({
  name: z.string().min(2, "Mind. 2 Zeichen").max(60, "Max. 60 Zeichen"),
  category: z.enum(["Cocktail", "Longdrink", "Softdrink", "Bier", "Wein", "Shot"]),
  description: z.string().min(10, "Mind. 10 Zeichen").max(300, "Max. 300 Zeichen"),
  imageFilename: z.string().nullable().optional(),
  imageWidth: z.number().int().positive().nullable().optional(),
  imageHeight: z.number().int().positive().nullable().optional(),
  isAlcoholFree: z.boolean(),
  isAvailable: z.boolean(),
  prepTimeMin: z.number().int().min(1).max(30).nullable().optional(),
  ingredients: z.array(IngredientSchema).min(1, "Mind. 1 Zutat"),
  steps: z.array(z.string().min(5, "Mind. 5 Zeichen").max(300, "Max. 300 Zeichen")).min(1, "Mind. 1 Schritt"),
});

export type CocktailInput = z.infer<typeof CocktailSchema>;
export type IngredientInput = z.infer<typeof IngredientSchema>;
