let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playTickSound = (): void => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  } catch (e) {
    console.warn("Could not play tick sound", e);
  }
};

export const playShutterSound = (): void => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Sharp mechanical click (shutter open)
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.type = "square";
    click.frequency.setValueAtTime(2400, now);
    click.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    clickGain.gain.setValueAtTime(0.55, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    click.start(now);
    click.stop(now + 0.04);

    // Brief noise burst (mechanical body)
    const bufferSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5) * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.25, now);
    noise.start(now);

    // Soft closing click after ~80 ms
    const click2 = ctx.createOscillator();
    const clickGain2 = ctx.createGain();
    click2.connect(clickGain2);
    clickGain2.connect(ctx.destination);
    click2.type = "square";
    click2.frequency.setValueAtTime(1800, now + 0.08);
    click2.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    clickGain2.gain.setValueAtTime(0.3, now + 0.08);
    clickGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    click2.start(now + 0.08);
    click2.stop(now + 0.12);
  } catch (e) {
    console.warn("Could not play shutter sound", e);
  }
};
