import mongoose from "mongoose";
import { stats, player } from "./util.js";

const gameStats = {
  ...stats,
  win: Boolean,
  home: Boolean,
  team: String,
  players: [player],
};

export const gameSchema = new mongoose.Schema({
  teams: [gameStats],
  link: String,
  date: Date,
  scraped: Date,
});

export const Game = mongoose.model("games", gameSchema);
