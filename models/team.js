import mongoose from "mongoose";
import { stats } from "./util.js";

export const teamSchema = new mongoose.Schema({
  id: String,
  ...stats,
  points_allowed: Number,
  sos: Number,
  o_rtg: Number,
  d_rtg: Number,
  wins: Number,
  losses: Number,
  link: String,
  name: String,
  year: Number,
  scraped: Date,
  conference: String,
  logo_url: String,
  mascot: String,
  player_ids: [String],
});

export const Team = mongoose.model("teams", teamSchema);
