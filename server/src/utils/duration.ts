const DURATION_PATTERN = /^(\d+)([smhd])$/;

const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export const durationToMs = (duration: string) => {
  const match = DURATION_PATTERN.exec(duration);

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const [, rawValue, unit] = match;
  return Number(rawValue) * UNIT_TO_MS[unit];
};

export const durationToDate = (duration: string, from = new Date()) =>
  new Date(from.getTime() + durationToMs(duration));
