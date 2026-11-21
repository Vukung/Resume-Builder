import "@testing-library/jest-dom/vitest";
import { randomUUID } from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error polyfill for jsdom
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== "function") {
  globalThis.crypto.randomUUID = randomUUID;
}

if (typeof document !== "undefined" && !document.getElementById("print-root")) {
  const printRoot = document.createElement("div");
  printRoot.id = "print-root";
  document.body.appendChild(printRoot);
}
