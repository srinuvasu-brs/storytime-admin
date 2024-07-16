import mongoose from "mongoose";

const weeklyCountSchema = mongoose.Schema({
  authors: { type: Number },
  categories: { type: Number },
  updated_at: { type: Date }
});

const WeeklyCount = mongoose.model("WeeklyCount", weeklyCountSchema);

export default WeeklyCount;