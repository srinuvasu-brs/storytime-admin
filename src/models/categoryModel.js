import mongoose from "mongoose";

const categoryShema = mongoose.Schema({
  categoryid: { type: String },
  category: { type: String },
  keywords: { type: String },
  count: { type: Number },
  updated_at: { type: Date }
});

const Category = mongoose.model("Category", categoryShema);

export default Category;
