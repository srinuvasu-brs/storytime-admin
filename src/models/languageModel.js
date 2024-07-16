import mongoose from "mongoose";

const languageSchema = mongoose.Schema({
  name: { type: String },
  code: { type: String },
  languageId: { type: String },
});

const Language = mongoose.model("Language", languageSchema);

export default Language;
