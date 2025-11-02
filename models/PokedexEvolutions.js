const mongoose = require("mongoose");

// Schema for an individual evolution condition.
const EvolutionConditionSchema = new mongoose.Schema({
  method: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

// Schema for each evolution step.
const EvolutionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  stage: { type: String, required: true },
  nextEvolution: { type: String, default: "" },
  prevEvolution: { type: String, default: "" },
  evolutionConditions: { type: [EvolutionConditionSchema], default: [] },
  mega: { type: Boolean, default: false },
  megaForms: { 
    meganormal: { type: mongoose.Schema.Types.Mixed, default: null },
    megaX: { type: mongoose.Schema.Types.Mixed, default: null },
    megaY: { type: mongoose.Schema.Types.Mixed, default: null }
  }
}, { _id: false });

// Schema for alternate evolution branches.
const AlternateEvolutionSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: EvolutionSchema, required: true }
}, { _id: false });

// Main schema for the evolution chain.
const PokedexEvolutionsSchema = new mongoose.Schema({
  chain: { type: String, required: true },
  evolutions: { type: [EvolutionSchema], required: true },
  alternateEvolutions: { type: [AlternateEvolutionSchema], default: [] },
  mega: { type: Boolean, default: false },
  megaForms: {
    meganormal: { type: mongoose.Schema.Types.Mixed, default: null },
    megaX: { type: mongoose.Schema.Types.Mixed, default: null },
    megaY: { type: mongoose.Schema.Types.Mixed, default: null }
  }
});

// Export the model, explicitly using the "PokedexEvolutions" collection name.
module.exports = mongoose.model("PokedexEvolutions", PokedexEvolutionsSchema, "PokedexEvolutions");
