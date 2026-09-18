// 16-bit PCM WAV for the cube-motion film. Everything here is a note, not an
// effect: a warm bed, a few soft mallet tones in the same key, and a chord to
// land on. No whooshes, no risers, no noise sweeps.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
fs.mkdirSync(OUT, { recursive: true });

const RATE = 44100;

const write = (name, left, right = left) => {
  const samples = left.length;
  const data = samples * 4;
  const buf = Buffer.alloc(44 + data);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + data, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(data, 40);
  for (let i = 0; i < samples; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`${name.padEnd(12)} ${(data / 1024).toFixed(0)} KB`);
};

const buffers = (seconds) => {
  const n = Math.floor(RATE * seconds);
  return [new Float32Array(n), new Float32Array(n), n];
};
const sine = (freq, t) => Math.sin(2 * Math.PI * freq * t);
const noise = () => Math.random() * 2 - 1;

const lowpass = (buf, cutoff) => {
  const a = Math.exp((-2 * Math.PI * cutoff) / RATE);
  let y = 0;
  for (let i = 0; i < buf.length; i++) buf[i] = y = y * a + buf[i] * (1 - a);
};
const soften = (buf, cutoff) => {
  lowpass(buf, cutoff);
  lowpass(buf, cutoff);
};

/**
 * One soft mallet tone. The fundamental rings on while the harmonics fall away
 * quickly, which is what separates a felt mallet from a bell.
 */
const mallet = (freq, t) => {
  if (t < 0) return 0;
  const attack = 1 - Math.exp(-t * 420);
  const core = sine(freq, t) * Math.exp(-t * 1.7);
  const second = sine(freq * 2, t) * Math.exp(-t * 4.2) * 0.3;
  const third = sine(freq * 3, t) * Math.exp(-t * 6.5) * 0.1;
  const shimmer = sine(freq * 4.16, t) * Math.exp(-t * 9) * 0.045;
  return attack * (core + second + third + shimmer);
};

// The four reveal tones, a C major triad and its octave, so any order is consonant.
const NOTES = { n1: 523.25, n2: 659.25, n3: 783.99, n4: 1046.5 };

const tone = (name, freq, pan) => {
  const [l, r, n] = buffers(1.9);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const wood = noise() * Math.exp(-t * 900) * 0.05;
    const s = (mallet(freq, t) * 0.34 + wood) * 0.9;
    l[i] = s * (1 - pan);
    r[i] = s * pan;
  }
  soften(l, 7000);
  soften(r, 7000);
  write(`${name}.wav`, l, r);
};

// The tone under a statement line. A low, warm, struck note, not an impact.
const low = () => {
  const [l, r, n] = buffers(3.2);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const attack = 1 - Math.exp(-t * 120);
    const s =
      attack *
      (sine(65.41, t) * Math.exp(-t * 1.1) +
        sine(130.81, t) * Math.exp(-t * 1.6) * 0.34 +
        sine(98.0, t) * Math.exp(-t * 2.0) * 0.16) *
      0.5;
    l[i] = s;
    r[i] = s;
  }
  soften(l, 1100);
  soften(r, 1100);
  write("low.wav", l, r);
};

// The chord the film lands on.
const resolve = () => {
  const [l, r, n] = buffers(4.2);
  const notes = [130.81, 196.0, 246.94, 293.66, 329.63, 392.0, 523.25];
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let sl = 0;
    let sr = 0;
    notes.forEach((f, k) => {
      const lt = t - k * 0.026;
      if (lt < 0) return;
      const env = (1 - Math.exp(-lt * 55)) * Math.exp(-lt * 0.82);
      const osc = sine(f, lt) + sine(f * 1.0014, lt) * 0.72 + sine(f * 2, lt) * 0.1;
      const pan = 0.24 + (k / (notes.length - 1)) * 0.52;
      sl += osc * env * (1 - pan) * 0.085;
      sr += osc * env * pan * 0.085;
    });
    l[i] = sl;
    r[i] = sr;
  }
  soften(l, 5600);
  soften(r, 5600);
  write("resolve.wav", l, r);
};

// 35s under the type: five warm chords, a drone, and a sparse motif. Nothing
// on a grid, because a pulse is what makes a bed sound like a stock loop.
const bed = () => {
  const seconds = 36.4;
  const [l, r, n] = buffers(seconds);
  const chords = [
    { drone: 65.41, freqs: [261.63, 329.63, 392.0, 493.88, 587.33], motif: [587.33, 493.88, 392.0] }, // Cmaj9
    { drone: 82.41, freqs: [329.63, 392.0, 440.0, 493.88, 587.33], motif: [493.88, 440.0, 392.0] }, // Em11
    { drone: 55.0, freqs: [220.0, 261.63, 329.63, 392.0, 493.88], motif: [493.88, 392.0, 329.63] }, // Am9
    { drone: 87.31, freqs: [174.61, 220.0, 261.63, 329.63, 392.0], motif: [392.0, 329.63, 261.63] }, // Fmaj9
    { drone: 65.41, freqs: [261.63, 329.63, 392.0, 493.88, 587.33], motif: [392.0, 493.88, 587.33] }, // Cmaj9
  ];
  const SECTION = 7.1;
  const XFADE = 1.3;
  const MOTIF_AT = [1.5, 2.8, 4.4];

  const voice = (chord, t, weight, out) => {
    chord.freqs.forEach((f, k) => {
      const tilt = k < 2 ? 1 : 0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 13 + k);
      const warm = (sine(f, t) + sine(f * 1.0019, t) + 0.38 * sine(f * 0.5, t)) * 0.026 * tilt * weight;
      const pan = 0.16 + (k / (chord.freqs.length - 1)) * 0.68;
      out[0] += warm * (1 - pan);
      out[1] += warm * pan;
    });
    const drone = (sine(chord.drone, t) * 0.85 + sine(chord.drone * 2, t) * 0.14) * 0.046 * weight;
    out[0] += drone;
    out[1] += drone;
  };

  const out = [0, 0];
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    out[0] = 0;
    out[1] = 0;

    const idx = Math.min(chords.length - 1, Math.floor(t / SECTION));
    const into = t - idx * SECTION;
    voice(chords[idx], t, Math.min(1, into / XFADE), out);
    if (idx > 0 && into < XFADE) voice(chords[idx - 1], t, 1 - into / XFADE, out);

    // The chord's own bass note, struck once when the chord arrives.
    const bass = sine(chords[idx].drone, into) * (1 - Math.exp(-into * 26)) * Math.exp(-into * 0.9) * 0.07;

    // Three notes falling through the chord, far enough apart to stay out of the way.
    let motif = 0;
    MOTIF_AT.forEach((at, k) => {
      motif += mallet(chords[idx].motif[k], into - at) * 0.055;
    });

    let master = 1;
    if (t < 3.5) master = t / 3.5;
    else if (t > seconds - 3.2) master = Math.max(0, (seconds - t) / 3.2);
    master *= 1 + 0.1 * Math.sin((2 * Math.PI * t) / 19);

    l[i] = (out[0] + bass + motif * 0.9) * master;
    r[i] = (out[1] + bass + motif) * master;
  }
  soften(l, 4400);
  soften(r, 4400);
  write("bed.wav", l, r);
};

console.log("cube-motion film audio");
tone("n1", NOTES.n1, 0.44);
tone("n2", NOTES.n2, 0.52);
tone("n3", NOTES.n3, 0.46);
tone("n4", NOTES.n4, 0.54);
low();
resolve();
bed();
