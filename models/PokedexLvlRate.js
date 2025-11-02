const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexLvlRateSchema = new Schema({
  _id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  form: { type: String, default: "Standard" },
  lvlRate: { type: String, required: true }
}, { collection: "PokedexLvlRate" });

module.exports = mongoose.model("PokedexLvlRate", PokedexLvlRateSchema);
