export interface FrameTemplate {
  id: string;
  name: string;
  icon: string;
  generateSVG: (width: number, height: number) => string;
}

// Deterministic pseudo-random from a seed (avoids re-render flicker)
const sr = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: "film",
    name: "Film Strip",
    icon: "🎞️",
    generateSVG: (w, h) => {
      const bw = Math.min(w * 0.06, Math.max(30, w * 0.05));
      const ph = bw * 0.45;
      const pw = bw * 0.65;
      const count = Math.max(4, Math.floor(h / (ph * 3.2)));
      const gap = h / (count + 1);
      const perfs = Array.from({ length: count }, (_, i) => {
        const cy = gap * (i + 1);
        return `<rect x="${bw * 0.17}" y="${cy - ph / 2}" width="${pw}" height="${ph}" rx="${ph * 0.35}" fill="white"/>
                <rect x="${w - bw + bw * 0.17}" y="${cy - ph / 2}" width="${pw}" height="${ph}" rx="${ph * 0.35}" fill="white"/>`;
      }).join("");
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <rect x="0" y="0" width="${bw}" height="${h}" fill="#1a1a1a"/>
        <rect x="${w - bw}" y="0" width="${bw}" height="${h}" fill="#1a1a1a"/>
        ${perfs}
      </svg>`;
    },
  },
  {
    id: "hearts",
    name: "Hearts",
    icon: "💕",
    generateSVG: (w, h) => {
      const s = Math.min(w, h) * 0.055;
      const fs = s * 1.9;
      const hColors = ["#ff69b4", "#ff1493", "#ffb6c1", "#ff69b4"];
      const tc = Math.max(3, Math.floor(w / (s * 2.8)));
      const sc = Math.max(3, Math.floor(h / (s * 2.8)));
      let out = "";
      for (let i = 0; i < tc; i++) {
        const x = (i / (tc - 1)) * w;
        out += `<text x="${x}" y="${s * 1.1}" font-size="${fs}" text-anchor="middle" dominant-baseline="central" fill="${hColors[i % 4]}" opacity="0.92">♥</text>`;
        out += `<text x="${x}" y="${h - s * 1.1}" font-size="${fs}" text-anchor="middle" dominant-baseline="central" fill="${hColors[(i + 1) % 4]}" opacity="0.92">♥</text>`;
      }
      for (let i = 1; i < sc - 1; i++) {
        const y = (i / (sc - 1)) * h;
        out += `<text x="${s * 1.1}" y="${y}" font-size="${fs * 0.85}" text-anchor="middle" dominant-baseline="central" fill="${hColors[i % 4]}" opacity="0.8">♥</text>`;
        out += `<text x="${w - s * 1.1}" y="${y}" font-size="${fs * 0.85}" text-anchor="middle" dominant-baseline="central" fill="${hColors[(i + 2) % 4]}" opacity="0.8">♥</text>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out}</svg>`;
    },
  },
  {
    id: "stars",
    name: "Gold Stars",
    icon: "⭐",
    generateSVG: (w, h) => {
      const s = Math.min(w, h) * 0.065;
      const fs = s * 1.8;
      const star = (x: number, y: number, size = fs, op = 0.92) =>
        `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central" fill="#FFD700" opacity="${op}">★</text>`;
      let out = "";
      // Corners
      [[s, s], [w - s, s], [s, h - s], [w - s, h - s]].forEach(([x, y]) => { out += star(x, y); });
      // Mid-edge smaller stars
      [[w / 2, s * 0.85], [w / 2, h - s * 0.85], [s * 0.85, h / 2], [w - s * 0.85, h / 2]].forEach(
        ([x, y]) => { out += star(x, y, fs * 0.65, 0.6); }
      );
      // Sprinkle sparkles along edges
      const edgeCount = Math.floor((w + h) / (s * 4));
      for (let i = 0; i < edgeCount; i++) {
        const t = (i + 0.5) / edgeCount;
        const side = i % 4;
        let x: number, y: number;
        if (side === 0) { x = t * w; y = s * 0.45; }
        else if (side === 1) { x = t * w; y = h - s * 0.45; }
        else if (side === 2) { x = s * 0.45; y = t * h; }
        else { x = w - s * 0.45; y = t * h; }
        out += star(x!, y!, fs * 0.38, 0.35);
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out}</svg>`;
    },
  },
  {
    id: "vintage",
    name: "Vintage",
    icon: "🎀",
    generateSVG: (w, h) => {
      const b = Math.min(w, h) * 0.035;
      const cs = Math.min(w, h) * 0.08;
      const ornamentSize = b * 2.8;
      const corners: [number, number][] = [[b * 2, b * 2], [w - b * 2, b * 2], [b * 2, h - b * 2], [w - b * 2, h - b * 2]];
      const ornaments = corners.map(([x, y]) =>
        `<text x="${x}" y="${y}" font-size="${ornamentSize}" text-anchor="middle" dominant-baseline="central" fill="#d4af37" opacity="0.95">✦</text>`
      ).join("");
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <rect x="${b * 0.5}" y="${b * 0.5}" width="${w - b}" height="${h - b}" fill="none" stroke="#d4af37" stroke-width="${b * 0.5}" rx="6"/>
        <rect x="${b * 1.4}" y="${b * 1.4}" width="${w - b * 2.8}" height="${h - b * 2.8}" fill="none" stroke="#d4af37" stroke-width="${b * 0.18}" rx="3"/>
        ${ornaments}
        <line x1="${cs + b * 2}" y1="${b * 0.85}" x2="${w - cs - b * 2}" y2="${b * 0.85}" stroke="#d4af37" stroke-width="${b * 0.15}" opacity="0.5"/>
        <line x1="${cs + b * 2}" y1="${h - b * 0.85}" x2="${w - cs - b * 2}" y2="${h - b * 0.85}" stroke="#d4af37" stroke-width="${b * 0.15}" opacity="0.5"/>
      </svg>`;
    },
  },
  {
    id: "party",
    name: "Party",
    icon: "🎉",
    generateSVG: (w, h) => {
      const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9f43"];
      const bw = Math.min(w, h) * 0.055;
      const total = Math.floor((2 * (w + h)) / (bw * 2.8));
      let out = "";
      for (let i = 0; i < total; i++) {
        const color = colors[i % colors.length];
        const side = i % 4;
        const frac = (Math.floor(i / 4) + sr(i * 7)) / Math.ceil(total / 4);
        const rnd1 = sr(i * 13 + 1);
        const rnd2 = sr(i * 17 + 3);
        let x: number, y: number;
        if (side === 0) { x = frac * w; y = rnd1 * bw * 1.5; }
        else if (side === 1) { x = frac * w; y = h - rnd1 * bw * 1.5; }
        else if (side === 2) { x = rnd1 * bw * 1.5; y = frac * h; }
        else { x = w - rnd1 * bw * 1.5; y = frac * h; }
        const size = bw * (0.25 + rnd2 * 0.4);
        if (i % 3 === 2) {
          out += `<rect x="${x! - size * 0.35}" y="${y! - size * 0.5}" width="${size * 0.7}" height="${size}" fill="${color}" opacity="0.82" rx="2" transform="rotate(${i * 37} ${x} ${y})"/>`;
        } else {
          out += `<circle cx="${x}" cy="${y}" r="${size * 0.5}" fill="${color}" opacity="0.82"/>`;
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out}</svg>`;
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    icon: "◻",
    generateSVG: (w, h) => {
      const b = Math.min(w, h) * 0.028;
      const c = Math.min(w, h) * 0.09;
      const sw = b * 0.65;
      const pts: [number, number, number, number, number, number, number, number][] = [
        // top-left
        [b, c + b, b, b, c + b, b, b, b],
        // top-right
        [w - c - b, b, w - b, b, w - b, b, w - b, c + b],
        // bottom-left
        [b, h - c - b, b, h - b, c + b, h - b, b, h - b],
        // bottom-right
        [w - b, h - c - b, w - b, h - b, w - c - b, h - b, w - b, h - b],
      ];
      const lines = pts.map(([x1, y1, x2, y2, x3, y3]) =>
        `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="white" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`
      ).join("");
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${lines}</svg>`;
    },
  },
];

export const frameToDataURL = (template: FrameTemplate, width: number, height: number): string => {
  const svg = template.generateSVG(width, height);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
