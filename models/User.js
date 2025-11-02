const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  pokeCoins: { type: Number, default: 0 },
  proficiency: { type: Number, default: -1 },
  Team1id: { type: String, default: "" },
  Team2id: { type: String, default: "" },
  Team3id: { type: String, default: "" },
  Team4id: { type: String, default: "" },
  Team5id: { type: String, default: "" },
  Team6id: { type: String, default: "" }
}, { collection: "User" });

module.exports = mongoose.model("User", UserSchema);
