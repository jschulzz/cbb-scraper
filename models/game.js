import mongoose from "mongoose";
import { stats } from "./util.js";

const gameStats = {
  ...stats,
  win: Boolean,
  home: Boolean,
  team_id: String,
  performance_ids: [String],
};

export const gameSchema = new mongoose.Schema({
  id: String,
  link: String,
  date: Date,
  scraped: Date,
  teams: [gameStats],
});

export const Game = mongoose.model("games", gameSchema);
