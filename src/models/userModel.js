import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  languages: { type: Array },
  categories: { type: Array },
  saved_stories: { type: Array },
  token: { type: String },
  verified: { type: Boolean, default: false },
  verifyToken: { type: String }, //verifyToken with link from webiste
  verifyTokenExpires: Date,
  verifyCode: { type: String }, //verifyCode from Mobile
  verifyCodeExpires: Date,
  resetPasswordToken: { type: String }, //resetPasswordToken with link from webiste
  resetPasswordExpires: Date,
  resetPasswordCode: { type: String }, //resetPasswordCode from Mobile
  resetPasswordCodeExpires: Date,
});

const User = mongoose.model("User", userSchema);

export default User;
