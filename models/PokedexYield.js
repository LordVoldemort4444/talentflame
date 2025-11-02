const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexYieldSchema = new Schema({
  _id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  expYield: { type: Number, required: true },
  HP: { type: Number, required: true },
  Attack: { type: Number, required: true },
  Defense: { type: Number, required: true },
  SpAtk: { type: Number, required: true },
  SpDef: { type: Number, required: true },
  Speed: { type: Number, required: true },
  TotalEVs: { type: Number, required: true }
}, { collection: "PokedexYield" });

module.exports = mongoose.model("PokedexYield", PokedexYieldSchema);
