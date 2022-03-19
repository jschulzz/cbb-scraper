import mongoose from "mongoose";
import { stats } from "./util.js";

export const performanceSchema = new mongoose.Schema({
  id: String,
  player_id: String,
  team_id: String,
  opponent_id: String,
  minutes: Number,
  started: Boolean,
  ...stats,
});

export const Performance = mongoose.model("performances", performanceSchema);
