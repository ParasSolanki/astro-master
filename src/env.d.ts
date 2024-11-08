/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  namespace App {
    interface Locals extends Record<string, any> {
      session: import("./server/auth").Session | null;
      user: import("./server/auth").User | null;
    }
  }
}

export {};
