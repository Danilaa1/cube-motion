import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { BEAT, CLOSE, CUT, DIALS, FOUR, NEVER, NUMBERS, REACH, THESIS, TURN } from "../cues";

const GAIN = 1.85;
/** No two hits may start inside this window, so nothing ever lands on top of anything. */
const MIN_GAP = 28;

type Cue = { at: number; src: string; volume: number; len: number };

const beat = (i: number) => CUT.four + i * BEAT;

/**
 * The score. Every hit is a note in C major, so any two that ring together are
 * still a chord. The film has no transition effects: the bed carries the cuts.
 */
const SCORE: Cue[] = [
  { at: CUT.dials + DIALS.in, src: "n1.wav", volume: 0.4, len: 110 },
  { at: CUT.dials + DIALS.in + 32, src: "n2.wav", volume: 0.36, len: 110 },
  { at: CUT.dials + DIALS.line, src: "low.wav", volume: 0.5, len: 190 },

  { at: CUT.turn + TURN[0], src: "n2.wav", volume: 0.4, len: 110 },
  { at: CUT.turn + TURN[2] + 2, src: "n3.wav", volume: 0.4, len: 110 },

  { at: CUT.thesis + THESIS.name, src: "n1.wav", volume: 0.4, len: 110 },
  { at: CUT.thesis + THESIS.four, src: "n3.wav", volume: 0.44, len: 110 },
  { at: CUT.thesis + THESIS.dials + 2, src: "low.wav", volume: 0.54, len: 190 },

  { at: beat(0) + FOUR.name, src: "n1.wav", volume: 0.42, len: 110 },
  { at: beat(1) + FOUR.name, src: "n2.wav", volume: 0.42, len: 110 },
  { at: beat(2) + FOUR.name, src: "n3.wav", volume: 0.42, len: 110 },
  { at: beat(3) + FOUR.name, src: "n4.wav", volume: 0.42, len: 110 },

  { at: CUT.numbers + NUMBERS[0], src: "n1.wav", volume: 0.4, len: 110 },
  { at: CUT.numbers + NUMBERS[1], src: "n2.wav", volume: 0.4, len: 110 },
  { at: CUT.numbers + NUMBERS[2], src: "n3.wav", volume: 0.4, len: 110 },
  { at: CUT.numbers + NUMBERS[3], src: "n4.wav", volume: 0.4, len: 110 },

  { at: CUT.never + NEVER.line, src: "n2.wav", volume: 0.4, len: 110 },
  { at: CUT.never + NEVER.morphs[0], src: "n1.wav", volume: 0.3, len: 110 },
  { at: CUT.never + NEVER.morphs[1], src: "n1.wav", volume: 0.3, len: 110 },
  { at: CUT.never + NEVER.tail, src: "low.wav", volume: 0.48, len: 190 },

  { at: CUT.reach + REACH.words, src: "n3.wav", volume: 0.42, len: 110 },
  { at: CUT.reach + REACH.zero, src: "n4.wav", volume: 0.42, len: 110 },

  { at: CUT.close + CLOSE.name, src: "resolve.wav", volume: 0.5, len: 260 },
  { at: CUT.close + CLOSE.install + 2, src: "n4.wav", volume: 0.4, len: 110 },
];

/** Greedy spacing: authored sparse, enforced here so a retimed beat cannot collide. */
const spaced = (cues: Cue[]) => {
  const kept: Cue[] = [];
  for (const cue of [...cues].sort((a, b) => a.at - b.at)) {
    if (kept.length === 0 || cue.at - kept[kept.length - 1].at >= MIN_GAP) kept.push(cue);
  }
  return kept;
};

export const AudioTracks: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={CUT.end}>
      <Audio
        src={staticFile("bed.wav")}
        volume={(frame) => {
          const level = 0.5 * GAIN;
          if (frame < 120) return (frame / 120) * level;
          if (frame > CUT.end - 150) return Math.max(0, ((CUT.end - frame) / 150) * level);
          return level;
        }}
      />
    </Sequence>

    {spaced(SCORE).map((cue, i) => (
      <Sequence key={`${cue.src}-${i}`} from={Math.max(0, Math.round(cue.at))} durationInFrames={cue.len}>
        <Audio src={staticFile(cue.src)} volume={cue.volume * GAIN} />
      </Sequence>
    ))}
  </>
);
