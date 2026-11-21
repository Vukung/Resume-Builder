import "@testing-library/jest-dom/vitest";
import { randomUUID } from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error polyfill for jsdom
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== "function") {
  globalThis.crypto.randomUUID = randomUUID;
}
