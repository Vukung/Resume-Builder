interface NavigatorUAData {
  brands?: Array<{ brand: string; version: string }>;
}

export function isChromiumBased(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const uaData = (navigator as unknown as { userAgentData?: NavigatorUAData }).userAgentData;
  if (uaData?.brands && Array.isArray(uaData.brands)) {
    if (uaData.brands.some((b) => b.brand === "Chromium")) {
      return true;
    }
  }

  const ua = navigator.userAgent || "";
  return ua.includes("Chrome/") || ua.includes("CriOS/");
}
