const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexDimensionsSchema = new Schema({
  _id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  form: { type: String, default: "Standard" },
  heightFt: { type: String, required: true },
  heightM: { type: String, required: true },
  weightLbs: { type: String, required: true },
  weightKgs: { type: String, required: true }
}, { collection: "PokedexDimensions" });

module.exports = mongoose.model("PokedexDimensions", PokedexDimensionsSchema);
