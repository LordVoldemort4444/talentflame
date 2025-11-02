const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexGenderRatioSchema = new Schema({
  _id: { type: String, required: true },
  // Optional: include an id field if needed
  // id: { type: String, required: true },
  name: { type: String, required: true },
  form: { type: String, default: "Standard" },
  genderRatio: {
    male: { type: Number, required: true },
    female: { type: Number, required: true }
  },
  breedable: { type: Boolean, required: true }
}, { collection: "PokedexGenderRatio" });

module.exports = mongoose.model("PokedexGenderRatio", PokedexGenderRatioSchema);
