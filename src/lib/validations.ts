import { z } from "zod";

export const CreateOrderSchema = z.object({
  guestName: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(40, "Name darf maximal 40 Zeichen lang sein"),
  guestTag: z.string().max(40).optional(),
  notes: z.string().max(200).optional(),
  idempotencyKey: z.string().min(8).max(64).optional(),
  items: z
    .array(
      z.object({
        cocktailId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
        itemNote: z.string().max(100).optional(),
      })
    )
    .min(1, "Mindestens ein Getränk auswählen"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
