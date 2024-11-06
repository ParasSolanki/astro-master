/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    session: import("./server/auth").Session | null;
    user: import("./server/auth").User | null;
  }
}
