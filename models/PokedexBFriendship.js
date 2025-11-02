const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PokedexBFriendshipSchema = new Schema({
  _id: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  BaseFriendship: { type: Number, required: true }
}, { collection: "PokedexBFriendship" });

module.exports = mongoose.model("PokedexBFriendship", PokedexBFriendshipSchema);
