const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexPicSchema = new Schema({
  _id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  form: { type: String, default: "Standard" },
  pic: { type: String, required: true }
}, { collection: "PokedexPic" });

module.exports = mongoose.model("PokedexPic", PokedexPicSchema);
