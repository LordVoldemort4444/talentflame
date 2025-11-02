const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexAbilitiesSchema = new Schema({
  _id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  form: { type: String, default: "Standard" },
  ability1: { type: String, required: true },
  ability2: { type: String, default: "" },
  hidden: { type: String, default: "" }
}, { collection: "PokedexAbilities" });

module.exports = mongoose.model("PokedexAbilities", PokedexAbilitiesSchema);
