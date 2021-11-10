export const stats = {
    fga: Number,
    fgm: Number,
    "2pa": Number,
  "2pm": Number,
  "3pa": Number,
  "3pm": Number,
  fta: Number,
  ftm: Number,
  orb: Number,
  drb: Number,
  trb: Number,
  ast: Number,
  stl: Number,
  blk: Number,
  tov: Number,
  pf: Number,
  pts: Number,
};

export const player = {
  ...stats,
  name: String,
  minutes: Number,
  started: Boolean,
};
