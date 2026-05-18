export interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: string[];
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: "emoji",
    name: "Emoji",
    icon: "😊",
    stickers: ["😊", "😂", "😍", "🥰", "😎", "🤩", "😘", "🤪", "😏", "🥳", "😇", "🤗", "😜", "🥹", "🫶"],
  },
  {
    id: "hearts",
    name: "Hearts",
    icon: "❤️",
    stickers: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞", "💓", "💗", "💖", "💝", "💘"],
  },
  {
    id: "fun",
    name: "Fun",
    icon: "🎉",
    stickers: ["🎉", "🎊", "🎈", "🌈", "💫", "✨", "🔥", "⭐", "🌟", "🎀", "🎵", "🍭", "🫧", "🪄", "🎯"],
  },
  {
    id: "nature",
    name: "Nature",
    icon: "🌸",
    stickers: ["🌸", "🌺", "🌻", "🌹", "🦋", "🍀", "🌿", "🌙", "☀️", "⭐", "🌊", "🌴", "🍃", "🌷", "🫐"],
  },
];

export const createEmojiSticker = (emoji: string, size = 200): Promise<HTMLImageElement> => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Use a font stack that supports color emoji on all platforms
  ctx.font = `${size * 0.72}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL("image/png");
  });
};
