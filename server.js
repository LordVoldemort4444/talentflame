/**
 * server.js
 * 
 * Sets up our Fastify server with Mongoose integration.
 * Serves static files, uses Handlebars templates (from src/pages),
 * and defines API endpoints for user operations, moves, Pokémon data,
 * evolution info, and now the new pokedex endpoints.
 */

const path = require("path");
const fastify = require("fastify")({ logger: false });
const mongoose = require("mongoose");
const User = require("./models/User");

// Import additional data models.
const PokedexTStats = require("./models/PokedexTStats");
const PokedexPic = require("./models/PokedexPic");
const PokedexDimensions = require("./models/PokedexDimensions");
const PokedexLvlRate = require("./models/PokedexLvlRate");
const PokedexAbilities = require("./models/PokedexAbilities");
const PokedexBFriendship = require("./models/PokedexBFriendship");
const PokedexGenderRatio = require("./models/PokedexGenderRatio");

// Import the evolution model.
const PokedexEvolutions = require("./models/PokedexEvolutions");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "doqq3i0ae",
  api_key: process.env.CLOUDINARY_API_KEY || "715764666279351",
  api_secret: process.env.CLOUDINARY_API_SECRET || "zAOk17isSjMyhGFfznYT8WdCqzU"
});

const mongoURI = process.env.MONGO_URI || "mongodb+srv://enocheiheilam:Enoch_24761022@cluster0.va1f0.mongodb.net/Talentflame?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

/* ---------- Helper Functions ---------- */
function calculateHP(base, iv, level, ev = 0) {
  const evPortion = Math.floor(ev / 4);
  return Math.floor(((2 * base + iv + evPortion) * level) / 100) + level + 10;
}

function calculateOtherStat(base, iv, level, natureMultiplier, ev = 0) {
  const evPortion = Math.floor(ev / 4);
  const baseCalc = Math.floor(((2 * base + iv + evPortion) * level) / 100) + 5;
  return Math.floor(baseCalc * natureMultiplier);
}

const natureMultipliers = {
  "Hardy":    { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 1 },
  "Lonely":   { Attack: 1.1,  Defense: 0.9,  SpAtk: 1,    SpDef: 1,    Speed: 1 },
  "Brave":    { Attack: 1.1,  Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 0.9 },
  "Adamant":  { Attack: 1.1,  Defense: 1,    SpAtk: 0.9,  SpDef: 1,    Speed: 1 },
  "Naughty":  { Attack: 1.1,  Defense: 1,    SpAtk: 1,    SpDef: 0.9,  Speed: 1 },
  "Bold":     { Attack: 0.9,  Defense: 1.1,  SpAtk: 1,    SpDef: 1,    Speed: 1 },
  "Docile":   { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 1 },
  "Relaxed":  { Attack: 1,    Defense: 1.1,  SpAtk: 1,    SpDef: 1,    Speed: 0.9 },
  "Impish":   { Attack: 1,    Defense: 1.1,  SpAtk: 0.9,  SpDef: 1,    Speed: 1 },
  "Lax":      { Attack: 1,    Defense: 1.1,  SpAtk: 1,    SpDef: 0.9,  Speed: 1 },
  "Modest":   { Attack: 0.9,  Defense: 1,    SpAtk: 1.1,  SpDef: 1,    Speed: 1 },
  "Mild":     { Attack: 1,    Defense: 1,    SpAtk: 1.1,  SpDef: 0.9,  Speed: 1 },
  "Quiet":    { Attack: 1,    Defense: 1,    SpAtk: 1.1,  SpDef: 1,    Speed: 0.9 },
  "Bashful":  { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 1 },
  "Rash":     { Attack: 1,    Defense: 1,    SpAtk: 1.1,  SpDef: 0.9,  Speed: 1 },
  "Calm":     { Attack: 1,    Defense: 0.9,  SpAtk: 1,    SpDef: 1.1,  Speed: 1 },
  "Gentle":   { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1.1,  Speed: 0.9 },
  "Careful":  { Attack: 1,    Defense: 1,    SpAtk: 0.9,  SpDef: 1.1,  Speed: 1 },
  "Quirky":   { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 1 },
  "Sassy":    { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1.1,  Speed: 0.9 },
  "Timid":    { Attack: 0.9,  Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 1.1 },
  "Hasty":    { Attack: 1,    Defense: 0.9,  SpAtk: 1,    SpDef: 1,    Speed: 1.1 },
  "Jolly":    { Attack: 1,    Defense: 1,    SpAtk: 0.9,  SpDef: 1,    Speed: 1.1 },
  "Naive":    { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 0.9,  Speed: 1.1 },
  "Serious":  { Attack: 1,    Defense: 1,    SpAtk: 1,    SpDef: 1,    Speed: 1 }
};

function sanitizeUsername(username) {
  return username.replace(/[^a-zA-Z0-9]/g, "_");
}

/* ---------- Plugin Registration ---------- */
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/"
});
fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/view"), {
  engine: { handlebars: require("handlebars") },
  templates: path.join(__dirname, "src/pages"),
  viewExt: "hbs"
});

/* ---------- Routes ---------- */
// GET / - Starter page.
fastify.get("/", (req, reply) => {
  reply.view("index", { title: "TalentFlame Starter" });
});

// GET /home - Home page.
fastify.get("/home", (req, reply) => {
  const username = req.query.username || "Guest";
  reply.view("home", { title: "TalentFlame Home", username });
});

// GET /admin - Admin page.
fastify.get("/admin", (req, reply) => {
  const username = req.query.username || "Guest";
  reply.view("admin", { title: "Admin Panel - TalentFlame", username });
});

// GET /tutorial - Tutorial page.
fastify.get("/tutorial", (req, reply) => {
  const username = req.query.username || "Guest";
  reply.view("tutorial", { title: "Tutorial - Choose Your Starter", username });
});

// API Endpoint: Check if a username exists.
fastify.post("/api/check_username", async (req, reply) => {
  const username = (req.body.username || "").trim();
  try {
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") }).lean();
    reply.send({ exists: !!user });
  } catch (error) {
    console.error(error);
    reply.send({ exists: false });
  }
});

// API Endpoint: Register a new user.
fastify.post("/api/register", async (req, reply) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return reply.send({ success: false, error: "Missing parameters" });
  }
  if (password.length < 8) {
    return reply.send({ success: false, error: "Password must be at least 8 characters" });
  }
  try {
    const newUser = new User({
      username: username.trim(),
      password
    });
    await newUser.save();
    console.log(`Registered new user: ${username.trim()}`);
    reply.send({ success: true });
  } catch (error) {
    if (error.code === 11000) {
      return reply.send({ success: false, error: "Username already exists" });
    }
    console.error(error);
    reply.send({ success: false, error: "Database error" });
  }
});

// API Endpoint: Login.
fastify.post("/api/login", async (req, reply) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username.trim() }).lean();
    if (!user) {
      return reply.send({ success: false, error: "Cannot find user! Please try again later." });
    }
    if (user.password !== password) {
      return reply.send({ success: false, error: "Wrong password" });
    }
    const tutorial = user.proficiency === -1;
    reply.send({ success: true, tutorial });
  } catch (error) {
    console.error(error);
    reply.send({ success: false, error: "Database error" });
  }
});

// API Endpoint: Update a user's proficiency.
fastify.post("/api/update_proficiency", async (req, reply) => {
  const { username } = req.body;
  const proficiency = Number(req.body.proficiency);
  if (!username || isNaN(proficiency)) {
    return reply.send({ success: false, error: "Missing parameters" });
  }
  try {
    const updateResult = await User.updateOne({ username: username.trim() }, { proficiency });
    if ((updateResult.nModified || updateResult.modifiedCount) === 0) {
      return reply.send({ success: false, error: "User not found" });
    }
    console.log(`Updated ${username.trim()}'s proficiency to ${proficiency}`);
    reply.send({ success: true });
  } catch (error) {
    console.error("Error updating proficiency:", error);
    reply.send({ success: false, error: "Database error" });
  }
});

// API Endpoint: Add a tutorial starter to a user's collection.
fastify.post("/api/user/add_starter", async (req, reply) => {
  const { username, starterName } = req.body;
  if (!username || !starterName) {
    return reply.send({ success: false, error: "Missing parameters" });
  }
  try {
    let baseStats = await PokedexTStats.findOne({
      name: new RegExp("^" + starterName + "$", "i"),
      form: "Standard"
    }).lean();
    if (!baseStats) {
      baseStats = await PokedexTStats.findOne({
        name: new RegExp("^" + starterName + "$", "i")
      }).lean();
    }
    console.log("BaseStats from PokedexTStats:", baseStats);
    if (!baseStats) {
      return reply.send({ success: false, error: "Starter Pokémon not found in stats" });
    }

    const Base_HP = baseStats.HP;
    const Base_Attack = baseStats.Attack;
    const Base_Defense = baseStats.Defense;
    const Base_SpAtk = baseStats.SpAtk;
    const Base_SpDef = baseStats.SpDef;
    const Base_Speed = baseStats.Speed;
    const Base_Total = baseStats.Total;

    const nameRegex = new RegExp("^" + baseStats.name + "$", "i");
    const endpoints = [
      PokedexPic.findOne({ name: nameRegex }).lean(),
      PokedexDimensions.findOne({ name: nameRegex }).lean(),
      PokedexAbilities.findOne({ name: nameRegex }).lean(),
      PokedexGenderRatio.findOne({ name: nameRegex }).lean(),
      PokedexBFriendship.findOne({ name: nameRegex }).lean(),
      PokedexLvlRate.findOne({ name: nameRegex }).lean()
    ];
    const [picData, dimensionsData, abilitiesData, genderData, friendshipData, lvlRateData] = await Promise.all(endpoints);
    let missingSources = [];
    if (!picData) missingSources.push("pic");
    if (!dimensionsData) missingSources.push("dimensions");
    if (!abilitiesData) missingSources.push("abilities");
    if (!genderData) missingSources.push("gender");
    if (!friendshipData) missingSources.push("friendship");
    if (!lvlRateData) missingSources.push("lvlRate");
    if (missingSources.length > 0) {
      console.error("Missing data from collections:", missingSources.join(", "));
      return reply.send({
        success: false,
        error: "One or more required data sources not found: " + missingSources.join(", ")
      });
    }

    const generateRandomIV = () => Math.floor(Math.random() * 32);
    const ivs = {
      IV_HP: generateRandomIV(),
      IV_Attack: generateRandomIV(),
      IV_Defense: generateRandomIV(),
      IV_SpAtk: generateRandomIV(),
      IV_SpDef: generateRandomIV(),
      IV_Speed: generateRandomIV()
    };

    const natureKeys = Object.keys(natureMultipliers);
    const randomNature = natureKeys[Math.floor(Math.random() * natureKeys.length)];
    const natureMult = natureMultipliers[randomNature] || { Attack: 1, Defense: 1, SpAtk: 1, SpDef: 1, Speed: 1 };

    const level = 1;
    const newHP = calculateHP(baseStats.HP, ivs.IV_HP, level);
    const newAttack = calculateOtherStat(baseStats.Attack, ivs.IV_Attack, level, natureMult.Attack);
    const newDefense = calculateOtherStat(baseStats.Defense, ivs.IV_Defense, level, natureMult.Defense);
    const newSpAtk = calculateOtherStat(baseStats.SpAtk, ivs.IV_SpAtk, level, natureMult.SpAtk);
    const newSpDef = calculateOtherStat(baseStats.SpDef, ivs.IV_SpDef, level, natureMult.SpDef);
    const newSpeed = calculateOtherStat(baseStats.Speed, ivs.IV_Speed, level, natureMult.Speed);
    const newTotal = newHP + newAttack + newDefense + newSpAtk + newSpDef + newSpeed;

    const Type = Array.isArray(baseStats.type) ? baseStats.type.join(", ") : baseStats.type;

    let genderRatio = genderData.genderRatio || { male: 50, female: 50 };
    const maleRatio = Number(genderRatio.male);
    const femaleRatio = Number(genderRatio.female);
    const totalRatio = maleRatio + femaleRatio;
    const finalGender = (maleRatio === 0 && femaleRatio === 0)
      ? "Unknown"
      : (Math.random() * totalRatio < maleRatio ? "Male" : "Female");
    console.log("Final Gender chosen:", finalGender);

    const finalAbility = abilitiesData.ability1 || "N/A";
    console.log("Final Ability chosen:", finalAbility);

    const picUrl = cloudinary.url(picData.pic, { secure: true, format: "png" });
    const processedWeightLbs = dimensionsData.weightLbs !== undefined ? String(dimensionsData.weightLbs).trim() : "";

    let newStarter = {
      Pic: picUrl,
      Name: baseStats.name,
      Type: Type,
      Abilities: finalAbility,
      Gender: finalGender,
      HeightM: dimensionsData.heightM,
      HeightFt: dimensionsData.heightFt,
      WeightKgs: dimensionsData.weightKgs,
      WeightLbs: processedWeightLbs,
      Total: newTotal,
      HP: newHP,
      Attack: newAttack,
      Defense: newDefense,
      SpAtk: newSpAtk,
      SpDef: newSpDef,
      Speed: newSpeed,
      Info: "",
      FriendshipValue: friendshipData.BaseFriendship,
      LevellingRate: lvlRateData.lvlRate,
      Level: level,
      EXP: 0,
      IV_HP: ivs.IV_HP,
      IV_Attack: ivs.IV_Attack,
      IV_Defense: ivs.IV_Defense,
      IV_SpAtk: ivs.IV_SpAtk,
      IV_SpDef: ivs.IV_SpDef,
      IV_Speed: ivs.IV_Speed,
      EV_HP: 0,
      EV_Attack: 0,
      EV_Defense: 0,
      EV_SpAtk: 0,
      EV_SpDef: 0,
      EV_Speed: 0,
      Nature: randomNature,
      Move1: "",
      Move2: "",
      Move3: "",
      Move4: "",
      Item: "",
      Base_HP: Base_HP,
      Base_Attack: Base_Attack,
      Base_Defense: Base_Defense,
      Base_SpAtk: Base_SpAtk,
      Base_SpDef: Base_SpDef,
      Base_Speed: Base_Speed,
      Base_Total: Base_Total
    };

    // --- New: Fetch evolution info for the starter ---
    const evoQueryObj = {
      $or: [
        { chain: new RegExp("^" + starterName + "$", "i") },
        { "evolutions.name": new RegExp("^" + starterName + "$", "i") }
      ]
    };
    console.log("add_starter: Using evo query object:", evoQueryObj);
    const evoDoc = await PokedexEvolutions.findOne(evoQueryObj).lean();
    if (evoDoc) {
      newStarter.Info = buildEvolutionInfo(evoDoc, starterName);
    } else {
      newStarter.Info = `${starterName} is not known to evolve.`;
    }
    console.log("New Starter Document to be inserted (with evolution info):", newStarter);

    const collectionName = `${username}'s Pokemons`;
    let UserPokemon;
    const userPokemonSchema = new mongoose.Schema({}, { strict: false, _id: { type: mongoose.Schema.Types.ObjectId, auto: true } });
    try {
      UserPokemon = mongoose.model(collectionName);
    } catch (error) {
      UserPokemon = mongoose.model(collectionName, userPokemonSchema, collectionName);
    }

    const inserted = await UserPokemon.create(newStarter);
    await User.updateOne({ username: username.trim() }, { Team1id: inserted._id.toString(), proficiency: 0 });
    console.log(`Added starter Pokémon ${inserted._id} to ${username}'s collection; updated Team1id and proficiency.`);
    reply.send({ success: true });
  } catch (error) {
    console.error("Error adding starter Pokémon:", error);
    reply.send({ success: false, error: "Database error" });
  }
});

// --- Revised Evolution Info Helper Functions with Detailed Logging ---
function translateCondition(cond) {
  let result = "";
  switch (cond.method) {
    case "level":
      result = `starting from level ${cond.value}`;
      break;
    case "consumedItem":
      result = `using ${cond.value}`;
      break;
    case "tradeAndHeldItem":
      result = `when traded while holding ${cond.value.item}`;
      break;
    case "tradeOrConsumedItem":
      result = `when traded or using ${cond.value.item}`;
      break;
    case "levelAndMove":
      result = `when leveling up while knowing ${cond.value.move}`;
      break;
    case "levelAndHeldItemAndTime":
      result = `when leveling up while holding ${cond.value.item} during ${cond.value.time}`;
      break;
    case "friendship":
      result = `when friendship reaches ${cond.value}`;
      break;
    case "friendshipAndTimeOrBag":
      result = `when friendship reaches ${cond.value.friendship} and (during ${cond.value.time} or holding ${cond.value.alternativeItem})`;
      break;
    case "friendshipAndMove":
      result = `when friendship reaches ${cond.value.friendship} and knowing a ${cond.value.moveType}-type move`;
      break;
    case "special":
      result = `after performing ${cond.value.action} ${cond.value.count} times`;
      break;
    case "levelAndStatComparison":
      if (cond.value && cond.value.statConditions) {
        const comparisons = Object.entries(cond.value.statConditions)
          .map(([stat, comp]) => `${stat} ${comp}`)
          .join(" and ");
        result = `at level ${cond.value.level} if ${comparisons}`;
      }
      break;
    default:
      result = "";
  }
  console.log(`translateCondition: method=${cond.method}, result="${result}"`);
  return result;
}

function buildEvolutionInfo(evoDoc, searchedName) {
  console.log("buildEvolutionInfo: Received evoDoc:", JSON.stringify(evoDoc, null, 2));
  console.log("buildEvolutionInfo: Searched name:", searchedName);
  
  if (!evoDoc || !evoDoc.evolutions || evoDoc.evolutions.length <= 1) {
    const message = `${searchedName} is not known to evolve.`;
    console.log("buildEvolutionInfo: No evolution chain data. Returning:", message);
    return message;
  }
  
  if (searchedName.toLowerCase().includes("mega")) {
    for (let evolution of evoDoc.evolutions) {
      if (evolution.mega && evolution.megaForms) {
        for (let megaKey of ["meganormal", "megaX", "megaY"]) {
          let megaData = evolution.megaForms[megaKey];
          if (megaData && megaData.name && megaData.name.toLowerCase() === searchedName.toLowerCase()) {
            const megaMessage = `${megaData.name} evolves from ${evolution.name} using ${megaData.stone}.`;
            console.log(`buildEvolutionInfo: Found mega form (${megaKey}), returning: ${megaMessage}`);
            return megaMessage;
          }
        }
      }
    }
    console.log("buildEvolutionInfo: Searched mega form not found in chain.");
    return `${searchedName} is not known to evolve.`;
  }
  
  const idx = evoDoc.evolutions.findIndex(e => e.name.toLowerCase() === searchedName.toLowerCase());
  
  if (idx === -1) {
    console.log(`buildEvolutionInfo: ${searchedName} not found in evolutions array, returning full chain info.`);
    let fullChain = [];
    for (let i = 0; i < evoDoc.evolutions.length - 1; i++) {
      let current = evoDoc.evolutions[i];
      let next = evoDoc.evolutions[i + 1];
      let condition = "";
      if (current.evolutionConditions && current.evolutionConditions.length > 0) {
        condition = translateCondition(current.evolutionConditions[0]);
      }
      fullChain.push(`${current.name} evolves to ${next.name}${condition ? " " + condition : ""}`);
    }
    const fullChainStr = fullChain.join(", ") + ".";
    console.log("buildEvolutionInfo: Returning full chain info:", fullChainStr);
    return fullChainStr;
  }
  
  let parts = [];
  if (idx > 0) {
    let fromParts = [];
    for (let i = idx; i > 0; i--) {
      let current = evoDoc.evolutions[i];
      let prev = evoDoc.evolutions[i - 1];
      let condition = "";
      if (prev.evolutionConditions && prev.evolutionConditions.length > 0) {
        condition = translateCondition(prev.evolutionConditions[0]);
      }
      fromParts.push(`${current.name} evolves from ${prev.name}${condition ? " " + condition : ""}`);
    }
    parts.push(fromParts.join(", "));
  }
  if (idx < evoDoc.evolutions.length - 1) {
    let toParts = [];
    for (let i = idx; i < evoDoc.evolutions.length - 1; i++) {
      let current = evoDoc.evolutions[i];
      let next = evoDoc.evolutions[i + 1];
      let condition = "";
      if (current.evolutionConditions && current.evolutionConditions.length > 0) {
        condition = translateCondition(current.evolutionConditions[0]);
      }
      toParts.push(`${current.name} evolves to ${next.name}${condition ? " " + condition : ""}`);
    }
    parts.push(toParts.join(", "));
  }
  let finalEvolution = evoDoc.evolutions[evoDoc.evolutions.length - 1];
  if (finalEvolution.mega && finalEvolution.megaForms && idx === evoDoc.evolutions.length - 1) {
    let megaFormsArr = [];
    for (let megaKey of ["meganormal", "megaX", "megaY"]) {
      if (finalEvolution.megaForms[megaKey] && finalEvolution.megaForms[megaKey].name) {
        megaFormsArr.push(`${finalEvolution.name} can mega evolve into ${finalEvolution.megaForms[megaKey].name} using ${finalEvolution.megaForms[megaKey].stone}`);
      }
    }
    if (megaFormsArr.length > 0) {
      parts.push(megaFormsArr.join(" or "));
    }
  }
  
  const finalString = parts.join(". ") + ".";
  console.log("buildEvolutionInfo: Final evolution info string:", finalString);
  return finalString;
}

// --- Revised Evolution Info Endpoint ---
fastify.get("/api/evolution", async (req, reply) => {
  const { name } = req.query;
  console.log("Evolution endpoint: Received query name =", name);
  if (!name) {
    console.log("Evolution endpoint: Missing name parameter.");
    return reply.send({ error: "Missing name" });
  }
  
  const queryObj = {
    $or: [
      { chain: new RegExp("^" + name + "$", "i") },
      { "evolutions.name": new RegExp("^" + name + "$", "i") }
    ]
  };
  console.log("Evolution endpoint: Using query object:", queryObj);
  
  try {
    const matchingDocs = await PokedexEvolutions.find(queryObj).lean();
    console.log("Evolution endpoint: Found", matchingDocs.length, "document(s) with the query.");
    
    if (matchingDocs.length === 0) {
      const sampleDocs = await PokedexEvolutions.find({}).limit(3).lean();
      console.log("Evolution endpoint: Sample documents from collection:", JSON.stringify(sampleDocs, null, 2));
      console.log("Evolution endpoint: No evolution document found for", name);
      return reply.send({ evolutionInfo: "This Pokémon does not evolve." });
    }
    
    const evoDoc = matchingDocs[0];
    console.log("Evolution endpoint: Retrieved evoDoc:", JSON.stringify(evoDoc, null, 2));
    
    const evolutionInfo = buildEvolutionInfo(evoDoc, name);
    reply.send({ evolutionInfo });
  } catch (error) {
    console.error("Evolution endpoint: Error fetching evolution info:", error);
    reply.send({ error: "Database error" });
  }
});

// GET Pokémon stats (from PokedexTStats)
// --- Modified to search by universal name OR form ---
fastify.get("/api/pokemon/stats", async (req, reply) => {
  const { name } = req.query;
  if (!name) return reply.send({ error: "Missing name" });
  const query = { $or: [ { name: new RegExp("^" + name + "$", "i") }, { form: new RegExp("^" + name + "$", "i") } ] };
  try {
    const results = await PokedexTStats.find(query).lean();
    if (!results || results.length === 0) return reply.send({ error: "Not found" });
    reply.send({ stats: results.length === 1 ? results[0] : results });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET dimensions (from PokedexDimensions)
fastify.get("/api/dimensions", async (req, reply) => {
  const { name, form } = req.query;
  if (!name) return reply.send({ error: "Missing name" });
  let query = { name: new RegExp("^" + name + "$", "i") };
  if (form) query.form = form;
  try {
    let result = await PokedexDimensions.findOne(query).lean();
    if (!result) {
      result = await PokedexDimensions.findOne({ name: new RegExp("^" + name + "$", "i"), form: "Standard" }).lean();
    }
    if (!result) return reply.send({ error: "Not found" });
    reply.send({ dimensions: result });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET abilities (from PokedexAbilities)
fastify.get("/api/abilities", async (req, reply) => {
  const { name, form } = req.query;
  if (!name) return reply.send({ error: "Missing name" });
  let query = { name: new RegExp("^" + name + "$", "i") };
  if (form) query.form = form;
  try {
    let result = await PokedexAbilities.findOne(query).lean();
    if (!result) {
      result = await PokedexAbilities.findOne({ name: new RegExp("^" + name + "$", "i"), form: "Standard" }).lean();
    }
    if (!result) return reply.send({ error: "Not found" });
    reply.send({ abilities: result });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET gender ratio (from PokedexGenderRatio)
fastify.get("/api/gender", async (req, reply) => {
  const { name, form } = req.query;
  if (!name) return reply.send({ error: "Missing name" });
  let query = { name: new RegExp("^" + name + "$", "i") };
  if (form) query.form = form;
  try {
    let result = await PokedexGenderRatio.findOne(query).lean();
    if (!result) {
      result = await PokedexGenderRatio.findOne({ name: new RegExp("^" + name + "$", "i"), form: "Standard" }).lean();
    }
    if (!result) return reply.send({ error: "Not found" });
    reply.send({ gender: result });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET picture (from PokedexPic)
fastify.get("/api/pic", async (req, reply) => {
  const { name, form } = req.query;
  if (!name) return reply.send({ error: "Missing name" });
  let query = { name: new RegExp("^" + name + "$", "i") };
  if (form) query.form = form;
  try {
    let result = await PokedexPic.findOne(query).lean();
    console.log("PokedexPic result:", result);
    if (!result) {
      result = await PokedexPic.findOne({ name: new RegExp("^" + name + "$", "i"), form: "Standard" }).lean();
      console.log("PokedexPic fallback (Standard) result:", result);
    }
    if (!result) return reply.send({ error: "Not found" });
    const picUrl = cloudinary.url(result.pic, { secure: true, format: "png" });
    console.log("Generated Cloudinary URL:", picUrl);
    reply.send({ pic: { picUrl } });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET yield (from PokedexYield)
fastify.get("/api/yield", async (req, reply) => {
  const { id, name } = req.query;
  let query = {};
  if (id) {
    query._id = id.padStart(4, "0");
  } else if (name) {
    query.Name = new RegExp("^" + name + "$", "i");
  }
  try {
    const result = await require("./models/PokedexYield").findOne(query).lean();
    if (!result) return reply.send({ error: "Not found" });
    reply.send({ yield: result });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET friendship (from PokedexBFriendship)
fastify.get("/api/friendship", async (req, reply) => {
  const { id, name } = req.query;
  let query = {};
  if (id) {
    query._id = id.padStart(4, "0");
  } else if (name) {
    query.Name = new RegExp("^" + name + "$", "i");
  }
  try {
    const result = await PokedexBFriendship.findOne(query).lean();
    if (!result) return reply.send({ error: "Not found" });
    reply.send({ friendship: result });
  } catch (e) {
    console.error(e);
    reply.send({ error: "Database error" });
  }
});

// GET Pokémon by custom id (e.g., "0002")
fastify.get("/api/pokemon/:id", async (req, reply) => {
  const { id } = req.params;
  if (!id) return reply.send({ found: false, error: "Missing id" });
  try {
    const results = await PokedexTStats.find({ id: new RegExp("^" + id + "$", "i") }).lean();
    if (!results || results.length === 0) return reply.send({ found: false, error: "Not found" });
    reply.send({ found: true, pokemon: results.length === 1 ? results[0] : results });
  } catch (error) {
    console.error(error);
    reply.send({ found: false, error: "Database error" });
  }
});

// GET Pokémon with the maximum id (wrap-around when navigating left)
fastify.get("/api/pokemon/max", async (req, reply) => {
  try {
    const result = await PokedexTStats.findOne({}).sort({ id: -1 }).lean();
    if (!result) return reply.send({ found: false, error: "No Pokémon found" });
    const results = await PokedexTStats.find({ id: result.id }).lean();
    reply.send({ found: true, pokemon: results.length === 1 ? results[0] : results });
  } catch (error) {
    console.error(error);
    reply.send({ found: false, error: "Database error" });
  }
});

// GET Pokémon with the minimum id (wrap-around when navigating right)
fastify.get("/api/pokemon/min", async (req, reply) => {
  try {
    const result = await PokedexTStats.findOne({}).sort({ id: 1 }).lean();
    if (!result) return reply.send({ found: false, error: "No Pokémon found" });
    const results = await PokedexTStats.find({ id: result.id }).lean();
    reply.send({ found: true, pokemon: results.length === 1 ? results[0] : results });
  } catch (error) {
    console.error(error);
    reply.send({ found: false, error: "Database error" });
  }
});

// Dynamic models for user collections.
const dynamicModels = {};

fastify.get("/api/user/team", async (req, reply) => {
  const username = req.query.username;
  if (!username) {
    return reply.send({ success: false, error: "Missing username" });
  }
  try {
    const user = await User.findOne({ username: username.trim() }).lean();
    if (!user) {
      return reply.send({ success: false, error: "User not found" });
    }
    const teamIds = [
      user.Team1id,
      user.Team2id,
      user.Team3id,
      user.Team4id,
      user.Team5id,
      user.Team6id
    ];
    console.log("Team IDs (raw):", teamIds);
    const sanitizedUsername = sanitizeUsername(username.trim());
    const collectionName = `${sanitizedUsername}'s Pokemons`;
    let UserPokemon;
    if (dynamicModels[collectionName]) {
      UserPokemon = dynamicModels[collectionName];
    } else {
      try {
        UserPokemon = mongoose.model(collectionName);
      } catch (error) {
        const userPokemonSchema = new mongoose.Schema({}, { strict: false, _id: { type: mongoose.Schema.Types.ObjectId, auto: true } });
        UserPokemon = mongoose.model(collectionName, userPokemonSchema, collectionName);
      }
      dynamicModels[collectionName] = UserPokemon;
    }
    const team = [];
    for (let id of teamIds) {
      if (id) {
        const actualId = typeof id === "object" && id._id ? id._id : id;
        console.log("Fetching Pokémon with ID:", actualId);
        const poke = await UserPokemon.findById(actualId).lean();
        team.push(poke || null);
      } else {
        team.push(null);
      }
    }
    console.log("Final team array:", team);
    return reply.send({ success: true, team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return reply.send({ success: false, error: "Database error" });
  }
});

// NEW Endpoint: Get the master list of Standard 151 Pokémon (sorted by id)
fastify.get("/api/pokedex/master", async (req, reply) => {
  try {
    const masterList = await PokedexTStats.find({ form: "Standard" }).sort({ id: 1 }).lean();
    if (!masterList || masterList.length === 0) {
      return reply.send({ error: "No master list found" });
    }
    reply.send({ master: masterList });
  } catch (error) {
    console.error(error);
    reply.send({ error: "Database error" });
  }
});

// NEW Endpoint: Get all Pokémon owned by the current user
fastify.get("/api/user/owned", async (req, reply) => {
  const username = req.query.username;
  if (!username) {
    return reply.send({ success: false, error: "Missing username" });
  }
  try {
    const sanitizedUsername = sanitizeUsername(username.trim());
    const collectionName = `${username}'s Pokemons`;
    let UserPokemon;
    try {
      UserPokemon = mongoose.model(collectionName);
    } catch (error) {
      const userPokemonSchema = new mongoose.Schema({}, { strict: false, _id: { type: mongoose.Schema.Types.ObjectId, auto: true } });
      UserPokemon = mongoose.model(collectionName, userPokemonSchema, collectionName);
    }
    const owned = await UserPokemon.find({}).lean();
    reply.send({ success: true, owned });
  } catch (error) {
    console.error("Error fetching user's owned pokemons:", error);
    reply.send({ success: false, error: "Database error" });
  }
});

/* ---------- Start the Server ---------- */
const PORT = process.env.PORT || 3000;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});
