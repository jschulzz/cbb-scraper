import mongoose from "mongoose";
import { player, stats } from "./util.js";

export const teamSchema = new mongoose.Schema({
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
  logo_url: String,
  mascot: String,
  players: [player],
});

export const Team = mongoose.model("teams", teamSchema);
