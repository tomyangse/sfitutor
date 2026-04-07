/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * 
 * Quality:
 * 5 - perfect response
 * 4 - correct response after a hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; where the correct one seemed easy to recall
 * 1 - incorrect response; the correct one remembered
 * 0 - complete blackout
 */

export interface SM2State {
  easiness_factor: number;
  interval: number; // in days
  repetitions: number;
  next_review: Date;
}

export function sm2Review(
  quality: number,
  state: Partial<SM2State> = {}
): SM2State {
  let { easiness_factor = 2.5, interval = 0, repetitions = 0 } = state;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness_factor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easiness_factor = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easiness_factor < 1.3) easiness_factor = 1.3;

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval);

  return {
    easiness_factor,
    interval,
    repetitions,
    next_review,
  };
}
