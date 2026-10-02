import { loadSettings } from "../store/settings";

export type SoundName = "click" | "roll" | "place" | "destroy" | "combo" | "victory" | "defeat";

const tones: Record<SoundName, [number, number, OscillatorType]> = {
  click: [220, 0.04, "square"],
  roll: [120, 0.12, "sawtooth"],
  place: [180, 0.09, "square"],
  destroy: [80, 0.18, "sawtooth"],
  combo: [520, 0.16, "square"],
  victory: [660, 0.38, "triangle"],
  defeat: [105, 0.42, "sawtooth"],
};

export function playSound(name: SoundName): void {
  const settings = loadSettings();
  if (settings.masterVolume <= 0 || settings.effectsVolume <= 0) return;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const [frequency, duration, type] = tones[name];
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * 0.72), context.currentTime + duration);
  gain.gain.setValueAtTime(settings.masterVolume * settings.effectsVolume * 0.11, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
  oscillator.addEventListener("ended", () => void context.close());
}

