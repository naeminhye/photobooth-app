

// Utility to convert hex to RGB
const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

// Utility to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => {
        const hex = Math.max(0, Math.min(255, n)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Utility to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
};

// Utility to convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
};

// Enum for color formats
enum ColorFormatEnum {
    HEX = 'hex',
    RGB = 'rgb',
    HSL = 'hsl',
    INVALID = 'invalid',
}

// Function to check color format
function getColorFormat(color: string): ColorFormatEnum {
    // Remove any whitespace and convert to lowercase for consistency
    const cleanedColor = color.trim().toLowerCase();

    // Check Hex format (e.g., #FF0000, #F00, #FF0000AA)
    const hexRegex = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    if (hexRegex.test(cleanedColor)) {
        return ColorFormatEnum.HEX;
    }

    // Check RGB format (e.g., rgb(255, 0, 0), rgba(255, 0, 0, 0.5))
    const rgbRegex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
    const rgbaRegex = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(0?\.\d+|1(\.0+)?|0)\)$/;
    if (rgbRegex.test(cleanedColor) || rgbaRegex.test(cleanedColor)) {
        return ColorFormatEnum.RGB;
    }

    // Check HSL format (e.g., hsl(120, 50%, 50%), hsla(120, 50%, 50%, 0.5))
    const hslRegex = /^hsl\(\d{1,3},\s*\d{1,3}%\s*,\s*\d{1,3}%\)$/;
    const hslaRegex = /^hsla\(\d{1,3},\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0?\.\d+|1(\.0+)?|0)\)$/;
    if (hslRegex.test(cleanedColor) || hslaRegex.test(cleanedColor)) {
        return ColorFormatEnum.HSL;
    }

    // If no match is found, return invalid
    return ColorFormatEnum.INVALID;
}

const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export { rgbToHex, hexToRgb, rgbToHsl, hslToRgb, getColorFormat, getContrastColor, ColorFormatEnum }