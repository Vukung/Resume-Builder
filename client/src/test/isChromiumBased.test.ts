import { describe, it, expect, afterEach } from "vitest";
import { isChromiumBased } from "../editor/print/isChromiumBased";

describe("isChromiumBased (Phase 6 Fix)", () => {
  const originalUserAgent = navigator.userAgent;
  const originalUAData = (navigator as unknown as { userAgentData?: unknown }).userAgentData;

  afterEach(() => {
    Object.defineProperty(window.navigator, "userAgent", { value: originalUserAgent, configurable: true });
    Object.defineProperty(window.navigator, "userAgentData", { value: originalUAData, configurable: true });
  });

  it("1. returns true for Chrome, Edge, Chrome iOS, and userAgentData brands with Chromium; false for Firefox and Safari", () => {
    // 1. Chrome desktop
    Object.defineProperty(window.navigator, "userAgentData", { value: undefined, configurable: true });
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      configurable: true,
    });
    expect(isChromiumBased()).toBe(true);

    // 2. Edge desktop
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      configurable: true,
    });
    expect(isChromiumBased()).toBe(true);

    // 3. Chrome on iOS (CriOS)
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.99 Mobile/15E148 Safari/604.1",
      configurable: true,
    });
    expect(isChromiumBased()).toBe(true);

    // 4. userAgentData brands with Chromium
    Object.defineProperty(window.navigator, "userAgent", { value: "", configurable: true });
    Object.defineProperty(window.navigator, "userAgentData", {
      value: { brands: [{ brand: "Not=A?Brand", version: "99" }, { brand: "Chromium", version: "120" }] },
      configurable: true,
    });
    expect(isChromiumBased()).toBe(true);

    // 5. Firefox desktop (must be false)
    Object.defineProperty(window.navigator, "userAgentData", { value: undefined, configurable: true });
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
      configurable: true,
    });
    expect(isChromiumBased()).toBe(false);

    // 6. Desktop Safari (must be false)
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      configurable: true,
    });
    expect(isChromiumBased()).toBe(false);
  });
});
