import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    TURSO_AUTH_TOKEN: z
      .string({ required_error: "TURSO_AUTH_TOKEN is required" })
      .min(10, "TURSO_AUTH_TOKEN must contain at most 10 character(s)"),
    TURSO_DATABASE_URL: z
      .string({ required_error: "TURSO_DATABASE_URL is required" })
      .min(1, "TURSO_DATABASE_URL is required"),
  },
  shared: {
    PROD: z.boolean(),
    DEV: z.boolean(),
    BASE_URL: z
      .string({ required_error: "BASE_URL is required" })
      .min(1, "BASE_URL is required"),
    MODE: z.enum(["development", "production"], {
      message: "MODE is required",
    }),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with PUBLIC_.
   */
  client: {},
  // @ts-ignore
  runtimeEnv: import.meta.env,
});
