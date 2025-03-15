import { UAParser } from "ua-parser-js";

const getDeviceType = () => {
  try {
    const parser = new UAParser();
    const result = parser.getResult();

    const device = result.device.type; // "mobile", "tablet", "console", "smarttv", "wearable", "xr", "embedded", or undefined
    const osName = result.os.name; // e.g., "iOS", "Android", "Windows"

    if (device === "mobile" || device === "tablet") {
      if (osName === "iOS") {
        return `iOS ${result.os.version}`;
      } else if (osName === "Android") {
        return `Android ${result.os.version}`;
      } else {
        return "Mobile (Other)"; // Fallback for other mobile OS
      }
    } else if (device === undefined) {
      return `Desktop (${result.os.name} ver${result.os.version})`; // Desktop/laptop devices have device.type as undefined
    } else {
      return "Other Device"; // Handle console, smarttv, wearable, xr, embedded
    }
  } catch (error) {
    console.error("UAParser failed:", error);
    // Fallback to user agent detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

    if (/android/i.test(userAgent)) {
      return "Android";
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      return "iOS";
    } else if (!isMobile) {
      return "Desktop";
    } else {
      return "Unknown";
    }
  }
};

export { getDeviceType }