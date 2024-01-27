import mongoose from "mongoose";
import { stats } from "./util.js";

export const playerSchema = new mongoose.Schema({
  id: String,
  name: String,
  team_id: String,
  ...stats
});

export const Player = mongoose.model("players", playerSchema);
