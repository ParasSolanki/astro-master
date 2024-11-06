import { z } from "astro:schema";

export const authSchema = z.object({
  username: z
    .string({ message: "Username is required" })
    .min(2, {
      message: "Username must be at least 2 characters long",
    })
    .max(20, {
      message: "Username must be less than 40 characters long",
    }),
  password: z
    .string({ message: "Password is required" })
    .min(2, {
      message: "Password must be at least 2 characters long",
    })
    .max(40, {
      message: "Password must be less than 40 characters long",
    }),
  action: z.union([z.literal("login"), z.literal("signup")]),
});
