console.log("common.js loaded: Initializing stat calculation functions.");

/* ---------- Stat Calculation Functions (Client Side) ---------- */
function calculateHP(base, iv, level, ev = 0) {
  const evPortion = Math.floor(ev / 4);
  return Math.floor(((2 * base + iv + evPortion) * level) / 100) + level + 10;
}

function calculateOtherStat(base, iv, level, natureMultiplier, ev = 0) {
  const evPortion = Math.floor(ev / 4);
  const baseCalc = Math.floor(((2 * base + iv + evPortion) * level) / 100) + 5;
  return Math.floor(baseCalc * natureMultiplier);
}

function normalizePokemonName(name) {
  const lower = name.toLowerCase();
  if (lower === "nidoranm") {
    return "Nidoran♂";
  } else if (lower === "nidoranf") {
    return "Nidoran♀";
  }
  return name;
}
window.normalizePokemonName = normalizePokemonName;

/* ---------- Type Chart, Immunities, and Effectiveness ---------- */
const typeChart = {
  "Normal": { "Rock": 0.5, "Ghost": 0, "Steel": 0.5 },
  "Fighting": { "Normal": 2, "Rock": 2, "Steel": 2, "Ice": 2, "Dark": 2, "Poison": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Ghost": 0, "Fairy": 0.5 },
  "Flying": { "Fighting": 2, "Bug": 2, "Grass": 2, "Rock": 0.5, "Steel": 0.5, "Electric": 0.5 },
  "Poison": { "Grass": 2, "Fairy": 2, "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0 },
  "Ground": { "Poison": 2, "Rock": 2, "Steel": 2, "Fire": 2, "Electric": 2, "Bug": 0.5, "Grass": 0.5, "Flying": 0 },
  "Rock": { "Flying": 2, "Bug": 2, "Fire": 2, "Ice": 2, "Fighting": 0.5, "Ground": 0.5, "Steel": 0.5 },
  "Bug": { "Grass": 2, "Psychic": 2, "Dark": 2, "Fighting": 0.5, "Flying": 0.5, "Poison": 0.5, "Ghost": 0.5, "Steel": 0.5, "Fire": 0.5, "Fairy": 0.5 },
  "Ghost": { "Ghost": 2, "Psychic": 2, "Normal": 0, "Dark": 0.5 },
  "Steel": { "Rock": 2, "Ice": 2, "Fairy": 2, "Steel": 0.5, "Fire": 0.5, "Water": 0.5, "Electric": 0.5 },
  "Fire": { "Bug": 2, "Steel": 2, "Grass": 2, "Ice": 2, "Rock": 0.5, "Fire": 0.5, "Water": 0.5, "Dragon": 0.5 },
  "Water": { "Ground": 2, "Rock": 2, "Fire": 2, "Water": 0.5, "Grass": 0.5, "Dragon": 0.5 },
  "Grass": { "Ground": 2, "Rock": 2, "Water": 2, "Flying": 0.5, "Poison": 0.5, "Bug": 0.5, "Steel": 0.5, "Fire": 0.5, "Grass": 0.5, "Dragon": 0.5 },
  "Electric": { "Flying": 2, "Water": 2, "Grass": 0.5, "Electric": 0.5, "Dragon": 0.5, "Ground": 0 },
  "Psychic": { "Fighting": 2, "Poison": 2, "Steel": 0.5, "Psychic": 0.5, "Dark": 0 },
  "Ice": { "Flying": 2, "Ground": 2, "Grass": 2, "Dragon": 2, "Steel": 0.5, "Fire": 0.5, "Water": 0.5, "Ice": 0.5 },
  "Dragon": { "Dragon": 2, "Steel": 0.5, "Fairy": 0 },
  "Dark": { "Ghost": 2, "Psychic": 2, "Fighting": 0.5, "Dark": 0.5, "Fairy": 0.5 },
  "Fairy": { "Fighting": 2, "Dragon": 2, "Dark": 2, "Poison": 0.5, "Steel": 0.5, "Fire": 0.5 }
};
const immunities = {
  "Normal": { "Ghost": true },
  "Ghost": { "Normal": true, "Fighting": true },
  "Ground": { "Electric": true },
  "Flying": { "Ground": true },
  "Dark": { "Psychic": true },
  "Steel": { "Poison": true },
  "Fairy": { "Dragon": true }
};

function getMultiplierForType(attackingType, defendingType) {
  if (immunities[defendingType] && immunities[defendingType][attackingType]) {
    return 0;
  }
  if (typeChart[attackingType] && typeChart[attackingType][defendingType] !== undefined) {
    return typeChart[attackingType][defendingType];
  }
  return 1;
}

function computeEffectiveness(pokemon) {
  let defendingTypes = [];
  if (Array.isArray(pokemon.Type)) {
    defendingTypes = pokemon.Type;
  } else if (typeof pokemon.Type === "string") {
    defendingTypes = pokemon.Type.split(",").map(t => t.trim());
  }
  if (!defendingTypes.length) {
    return { weaknesses: [], resistances: [], neutrals: [] };
  }
  
  const attackingTypes = Object.keys(typeChart);
  const weaknesses = [];
  const resistances = [];
  const neutrals = [];
  
  attackingTypes.forEach(attType => {
    let multiplier = 1;
    defendingTypes.forEach(defType => {
      multiplier *= getMultiplierForType(attType, defType);
    });
    if (multiplier > 1) {
      weaknesses.push(`${attType} (${multiplier}x)`);
    } else if (multiplier < 1) {
      resistances.push(`${attType} (${multiplier}x)`);
    } else {
      neutrals.push(`${attType} (1x)`);
    }
  });
  
  return { weaknesses, resistances, neutrals };
}

/* ---------- Nature Multipliers ---------- */
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

/* ---------- Global Variables for Navigation ---------- */
window.currentPokemonId = null;
window.isNavigating = false; // Debounce flag
window.currentForm = "Standard"; // Stores the currently selected form (for Pokedex search)

/* ---------- Helper: Assemble Full Pokémon Data ---------- */
async function assembleAndDisplayPokemon(stats) {
  // Build query using the universal name (and form if not Standard)
  const baseQuery =
    "name=" +
    encodeURIComponent(stats.name.trim()) +
    (stats.form && stats.form !== "Standard" ? "&form=" + encodeURIComponent(stats.form) : "");
  
  try {
    const [dimensionsData, abilitiesData, genderData, picData] = await Promise.all([
      fetch("/api/dimensions?" + baseQuery).then(r => r.json()),
      fetch("/api/abilities?" + baseQuery).then(r => r.json()),
      fetch("/api/gender?" + baseQuery).then(r => r.json()),
      fetch("/api/pic?" + baseQuery).then(r => r.json())
    ]);
    
    if (dimensionsData.error || abilitiesData.error || genderData.error || picData.error) {
      alert("Error fetching additional Pokémon data.");
      return;
    }
    
    const pokemon = {};
    // Save universal numeric id for navigation.
    pokemon.universalId = stats.id;
    // Use universal name for lookups; use special form for display if available.
    pokemon.Name = stats.name;
    pokemon.DisplayName = (stats.form && stats.form !== "Standard") ? stats.form : stats.name;
    
    // Set type.
    if (stats.type) {
      pokemon.Type = Array.isArray(stats.type)
        ? stats.type.filter(t => t && t.trim() !== "").join(", ")
        : stats.type;
    } else {
      pokemon.Type = "";
    }
    
    // Process gender ratio.
    if (genderData.gender && genderData.gender.genderRatio) {
      const male = genderData.gender.genderRatio.male;
      const female = genderData.gender.genderRatio.female;
      if (male === 0 && female === 0) {
        pokemon["Gender Ratio"] = "Unknown";
      } else {
        const total = male + female;
        const malePercent = (male / total * 100).toFixed(1);
        const femalePercent = (female / total * 100).toFixed(1);
        pokemon["Gender Ratio"] = `${malePercent}% Male, ${femalePercent}% Female`;
      }
    } else {
      pokemon["Gender Ratio"] = "Unknown";
    }
    pokemon.Gender = pokemon["Gender Ratio"];
    
    // Abilities.
    pokemon.Ability1 = abilitiesData.abilities.ability1 || "N/A";
    pokemon.Ability2 = abilitiesData.abilities.ability2 || "";
    pokemon.HiddenAbility = abilitiesData.abilities.hidden || "";
    
    // Picture.
    pokemon.Pic = (picData.pic && picData.pic.picUrl) ? picData.pic.picUrl : "";
    
    // Dimensions.
    if (dimensionsData.dimensions) {
      const dims = dimensionsData.dimensions;
      pokemon.HeightM = dims.heightM;
      pokemon.HeightFt = dims.heightFt;
      pokemon.WeightKgs = dims.weightKgs;
      let weightLbs = dims.weightLbs;
      weightLbs = String(weightLbs).replace(/lbs/gi, "").trim();
      pokemon.WeightLbs = weightLbs;
      pokemon.Height = `${pokemon.HeightM} m (${pokemon.HeightFt})`;
      pokemon.Weight = `${pokemon.WeightKgs} kg (${pokemon.WeightLbs} lbs)`;
    } else {
      pokemon.HeightM = "";
      pokemon.HeightFt = "";
      pokemon.WeightKgs = "";
      pokemon.WeightLbs = "";
      pokemon.Height = "";
      pokemon.Weight = "";
    }
    
    // Stats.
    pokemon.Total = stats.Total;
    pokemon.HP = stats.HP;
    pokemon.Attack = stats.Attack;
    pokemon.Defense = stats.Defense;
    pokemon.SpAtk = stats.SpAtk;
    pokemon.SpDef = stats.SpDef;
    pokemon.Speed = stats.Speed;
    
    // Fetch evolution info using the universal name.
    try {
      const evoRes = await fetch("/api/evolution?" + "name=" + encodeURIComponent(stats.name));
      const evoData = await evoRes.json();
      pokemon.Info = evoData.evolutionInfo || "";
      console.log("assembleAndDisplayPokemon fetched evolution info:", pokemon.Info);
    } catch (err) {
      console.error("Error fetching evolution info", err);
      pokemon.Info = "Evolution info unavailable.";
    }
    
    displayPokemonCard(pokemon);
  } catch (err) {
    console.error(err);
    alert("Error assembling Pokémon data.");
  }
}

/* ---------- Helper: Handle Multiple Forms (with Optional Force Prompt) ---------- */
function handleMultipleFormsAndDisplay(pokemonData, forcePrompt = false) {
  if (Array.isArray(pokemonData)) {
    // If forcePrompt is false and a form was already selected, use it.
    if (!forcePrompt && window.currentForm) {
      const selected = pokemonData.find(formObj => {
        const formName = formObj.form ? formObj.form : "Standard";
        return formName.toLowerCase() === window.currentForm.toLowerCase();
      });
      if (selected) {
        assembleAndDisplayPokemon(selected);
        return;
      }
    }
    // Otherwise, prompt the user to choose a form.
    const formsList = pokemonData.map((formObj, index) =>
      `${index + 1}: ${formObj.form ? formObj.form : "Standard"}`
    ).join("\n");
    const choice = prompt(`Multiple forms found for ${pokemonData[0].name}:\n${formsList}\nEnter the number of the form you want:`);
    const index = parseInt(choice, 10) - 1;
    if (isNaN(index) || index < 0 || index >= pokemonData.length) {
      alert("Invalid choice. Displaying default form.");
      window.currentForm = pokemonData[0].form || "Standard";
      assembleAndDisplayPokemon(pokemonData[0]);
    } else {
      window.currentForm = pokemonData[index].form || "Standard";
      assembleAndDisplayPokemon(pokemonData[index]);
    }
  } else {
    assembleAndDisplayPokemon(pokemonData);
  }
}

/* ---------- Display Pokémon Card ---------- */
function displayPokemonCard(pokemon) {
  // Use DisplayName (which might be a special form) for presentation.
  const displayName = pokemon.DisplayName || pokemon.Name || "Unknown";
  let typeValue = pokemon.Type || "";
  const displayType = Array.isArray(typeValue)
    ? typeValue.filter(t => t && t.trim() !== "").join(", ")
    : String(typeValue);
  
  console.log("displayPokemonCard: Displaying Pokémon card for", displayName);
  
  // Remove any existing overlay and arrow key listeners.
  const oldOverlay = document.getElementById("overlay");
  if (oldOverlay) {
    oldOverlay.remove();
    document.removeEventListener("keydown", handleArrowNavigation);
  }
  
  // Use universalId for navigation and display.
  window.currentPokemonId = parseInt(pokemon.universalId, 10);
  
  // Create overlay.
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";
  
  // Create container for the navigation instruction and the card.
  const cardContainer = document.createElement("div");
  cardContainer.style.display = "flex";
  cardContainer.style.flexDirection = "column";
  cardContainer.style.alignItems = "center";

  // Create navigation instruction (positioned above the card).
  const navInstruction = document.createElement("p");
  navInstruction.textContent = "You can navigate through the pokedex using keyboard arrows ←→.";
  navInstruction.style.fontSize = "0.8em";
  navInstruction.style.color = "#fff";
  navInstruction.style.textShadow = "1px 1px 2px rgba(0,0,0,0.7)";
  navInstruction.style.marginBottom = "5px";
  
  // Create the card.
  const card = document.createElement("div");
  card.id = "pokemonCard";
  const typeColors = {
    Fire: '#EE8130',
    Water: '#6390F0',
    Grass: '#7AC74C',
    Ice: '#96D9D6',
    Flying: '#A98FF3',
    Normal: '#A8A77A',
    Steel: '#B7B7CE',
    Ground: '#E2BF65',
    Fighting: '#C22E28',
    Ghost: '#735797',
    Fairy: '#D685AD',
    Dragon: '#6F35FC',
    Poison: '#A33EA1',
    Psychic: '#F95587',
    Rock: '#B6A136',
    Electric: '#F7D02C',
    Bug: '#A6B91A',
    Dark: '#705746'
  };
  const firstType = displayType.split(",")[0].trim();
  const bgColor = typeColors[firstType] || "#FFFFFF";
  card.style.backgroundColor = bgColor;
  card.style.padding = "20px";
  card.style.borderRadius = "10px";
  card.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  card.style.maxWidth = "50%";
  card.style.maxHeight = "80vh";
  card.style.overflowY = "auto";
  card.style.textAlign = "center";
  card.style.position = "relative";
  
  // Header: display the universal id.
  const idElem = document.createElement("h2");
  idElem.textContent = `#${pokemon.universalId}`;
  card.appendChild(idElem);
  
  // Name.
  const nameElem = document.createElement("p");
  nameElem.textContent = `Name: ${displayName}`;
  card.appendChild(nameElem);
  
  // Type.
  const typeElem = document.createElement("p");
  typeElem.textContent = `Type: ${displayType}`;
  card.appendChild(typeElem);
  
  // Gender.
  const genderElem = document.createElement("p");
  genderElem.textContent = "Gender: " + (pokemon.Gender || "Unknown");
  card.appendChild(genderElem);
  
  // Stats.
  const statsContainer = document.createElement("div");
  statsContainer.style.textAlign = "center";
  statsContainer.style.marginBottom = "10px";
  const statFields = [
    { label: "Total", key: "Total" },
    { label: "HP", key: "HP" },
    { label: "Attack", key: "Attack" },
    { label: "Defense", key: "Defense" },
    { label: "Sp. Atk", key: "SpAtk" },
    { label: "Sp. Def", key: "SpDef" },
    { label: "Speed", key: "Speed" }
  ];
  statFields.forEach(field => {
    const statLine = document.createElement("div");
    statLine.style.margin = "3px 0";
    statLine.textContent = `${field.label}: ${pokemon[field.key] || "0"}`;
    statsContainer.appendChild(statLine);
  });
  card.appendChild(statsContainer);
  
  // Abilities.
  const abilityRow = document.createElement("div");
  abilityRow.style.display = "flex";
  abilityRow.style.justifyContent = "space-between";
  abilityRow.style.marginTop = "10px";
  
  const leftAbility = document.createElement("div");
  leftAbility.style.flex = "1";
  leftAbility.style.marginRight = "5px";
  const abilityHeading = document.createElement("h4");
  abilityHeading.textContent = "Abilities:";
  abilityHeading.style.margin = "0";
  abilityHeading.style.textDecoration = "underline";
  leftAbility.appendChild(abilityHeading);
  const ability1 = document.createElement("p");
  ability1.style.margin = "0";
  ability1.textContent = pokemon.Ability1 || "N/A";
  leftAbility.appendChild(ability1);
  if (pokemon.Ability2 && pokemon.Ability2.trim() !== "") {
    const ability2 = document.createElement("p");
    ability2.style.margin = "0";
    ability2.textContent = pokemon.Ability2;
    leftAbility.appendChild(ability2);
  }
  
  const rightAbility = document.createElement("div");
  rightAbility.style.flex = "1";
  rightAbility.style.marginLeft = "5px";
  const hiddenHeading = document.createElement("h4");
  hiddenHeading.textContent = "Hidden:";
  hiddenHeading.style.margin = "0";
  hiddenHeading.style.textDecoration = "underline";
  rightAbility.appendChild(hiddenHeading);
  const hiddenAbility = document.createElement("p");
  hiddenAbility.style.margin = "0";
  hiddenAbility.textContent = pokemon.HiddenAbility || "—";
  rightAbility.appendChild(hiddenAbility);
  
  abilityRow.appendChild(leftAbility);
  abilityRow.appendChild(rightAbility);
  card.appendChild(abilityRow);
  
  // Image.
  const imgElem = document.createElement("img");
  imgElem.src = pokemon.Pic || "";
  imgElem.alt = displayName;
  imgElem.style.width = "60%";
  imgElem.style.marginTop = "10px";
  card.appendChild(imgElem);
  
  // Height/Weight.
  const hwRow = document.createElement("div");
  hwRow.style.display = "flex";
  hwRow.style.justifyContent = "space-between";
  hwRow.style.marginTop = "10px";
  
  const heightColumn = document.createElement("div");
  heightColumn.style.flex = "1";
  heightColumn.style.marginRight = "5px";
  const heightHeading = document.createElement("h4");
  heightHeading.textContent = "Height:";
  heightHeading.style.margin = "0";
  heightHeading.style.textDecoration = "underline";
  heightColumn.appendChild(heightHeading);
  const heightPara1 = document.createElement("p");
  heightPara1.style.margin = "0";
  heightPara1.textContent = `${pokemon.HeightM || ""} m`;
  const heightPara2 = document.createElement("p");
  heightPara2.style.margin = "0";
  heightPara2.textContent = pokemon.HeightFt || "";
  heightColumn.appendChild(heightPara1);
  heightColumn.appendChild(heightPara2);
  
  const weightColumn = document.createElement("div");
  weightColumn.style.flex = "1";
  weightColumn.style.marginLeft = "5px";
  const weightHeading = document.createElement("h4");
  weightHeading.textContent = "Weight:";
  weightHeading.style.margin = "0";
  weightHeading.style.textDecoration = "underline";
  weightColumn.appendChild(weightHeading);
  const weightPara1 = document.createElement("p");
  weightPara1.style.margin = "0";
  weightPara1.textContent = `${pokemon.WeightKgs || ""} kg`;
  const weightPara2 = document.createElement("p");
  weightPara2.style.margin = "0";
  weightPara2.textContent = `${pokemon.WeightLbs || ""} lbs`;
  weightColumn.appendChild(weightPara1);
  weightColumn.appendChild(weightPara2);
  
  hwRow.appendChild(heightColumn);
  hwRow.appendChild(weightColumn);
  card.appendChild(hwRow);
  
  card.appendChild(document.createElement("br"));
  
  // Evolution Info.
  const infoElem = document.createElement("p");
  infoElem.textContent = pokemon.Info || "";
  card.appendChild(infoElem);
  card.appendChild(document.createElement("br"));
  
  // Effectiveness.
  const weakLabel = document.createElement("p");
  weakLabel.textContent = "Weaknesses:";
  card.appendChild(weakLabel);
  const weakPara = document.createElement("p");
  weakPara.textContent = computeEffectiveness(pokemon).weaknesses.join(", ");
  card.appendChild(weakPara);
  card.appendChild(document.createElement("br"));
  
  const resLabel = document.createElement("p");
  resLabel.textContent = "Resistances:";
  card.appendChild(resLabel);
  const resPara = document.createElement("p");
  resPara.textContent = computeEffectiveness(pokemon).resistances.join(", ");
  card.appendChild(resPara);
  card.appendChild(document.createElement("br"));
  
  const neuLabel = document.createElement("p");
  neuLabel.textContent = "Neutral:";
  card.appendChild(neuLabel);
  const neuPara = document.createElement("p");
  neuPara.textContent = computeEffectiveness(pokemon).neutrals.join(", ");
  card.appendChild(neuPara);
  
  // Assemble container: navigation instruction above the card.
  cardContainer.appendChild(navInstruction);
  cardContainer.appendChild(card);
  
  overlay.appendChild(cardContainer);
  document.body.appendChild(overlay);
  
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) {
      overlay.remove();
      document.removeEventListener("keydown", handleArrowNavigation);
    }
  });
  
  document.removeEventListener("keydown", handleArrowNavigation);
  document.addEventListener("keydown", handleArrowNavigation);
}

/* ---------- Global Arrow Navigation Function with Prompt Logic ---------- */
function handleArrowNavigation(e) {
  if (window.isNavigating) return;
  if (!document.getElementById("overlay")) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    window.isNavigating = true;
  }
  
  if (e.key === "ArrowLeft") {
    const prevId = window.currentPokemonId - 1;
    if (prevId < 1) {
      // Wrap-around: fetch max.
      fetch("/api/pokemon/max")
        .then(res => res.json())
        .then(result => {
          if (result.found) {
            // Force prompt if multiple forms.
            handleMultipleFormsAndDisplay(result.pokemon, true);
          }
          window.isNavigating = false;
        })
        .catch(() => window.isNavigating = false);
    } else {
      const newId = String(prevId).padStart(4, "0");
      fetchPokemonById(newId).then(success => {
        if (!success) {
          fetch("/api/pokemon/max")
            .then(res => res.json())
            .then(result => {
              if (result.found) {
                handleMultipleFormsAndDisplay(result.pokemon, true);
              }
              window.isNavigating = false;
            })
            .catch(() => window.isNavigating = false);
        } else {
          window.isNavigating = false;
        }
      });
    }
  } else if (e.key === "ArrowRight") {
    const nextId = window.currentPokemonId + 1;
    const newId = String(nextId).padStart(4, "0");
    fetch(`/api/pokemon/${newId}`)
      .then(res => res.json())
      .then(result => {
        if (!result.found) {
          fetch("/api/pokemon/min")
            .then(res => res.json())
            .then(minResult => {
              if (minResult.found) {
                handleMultipleFormsAndDisplay(minResult.pokemon, true);
              }
              window.isNavigating = false;
            })
            .catch(() => window.isNavigating = false);
        } else {
          window.currentPokemonId = nextId;
          handleMultipleFormsAndDisplay(result.pokemon, true);
          window.isNavigating = false;
        }
      })
      .catch(error => {
        console.error(error);
        alert("An error occurred while fetching Pokémon data.");
        window.isNavigating = false;
      });
  }
}

async function fetchPokemonById(id) {
  try {
    const res = await fetch(`/api/pokemon/${id}`);
    const result = await res.json();
    if (result.found) {
      handleMultipleFormsAndDisplay(result.pokemon, true);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching Pokémon data.");
    return false;
  }
}

window.isNavigating = false; // Initialize debounce flag

/* ---------- Function to Calculate EXP Required for a Given Level ---------- */
function getExpForLevel(L, levellingRate) {
  if (L <= 1) return 0;
  let exp = 0;
  switch(levellingRate) {
    case "Fast":
      exp = 0.8 * Math.pow(L, 3);
      break;
    case "Medium Fast":
      exp = Math.pow(L, 3);
      break;
    case "Medium Slow":
      exp = 1.2 * Math.pow(L, 3) - 15 * Math.pow(L, 2) + 100 * L - 140;
      break;
    case "Slow":
      exp = 1.25 * Math.pow(L, 3);
      break;
    case "Erratic":
      if (L < 50) {
        exp = Math.pow(L, 3) * (100 - L) / 50;
      } else if (L < 68) {
        exp = Math.pow(L, 3) * (150 - L) / 100;
      } else if (L < 98) {
        exp = Math.pow(L, 3) * ((1911 - 10 * L) / 3) / 500;
      } else {
        exp = Math.pow(L, 3) * (160 - L) / 100;
      }
      break;
    case "Fluctuating":
      if (L < 15) {
        exp = Math.pow(L, 3) * (((L + 1) / 3) + 24) / 50;
      } else if (L < 36) {
        exp = Math.pow(L, 3) * (L + 14) / 50;
      } else {
        exp = Math.pow(L, 3) * ((L / 2) + 32) / 50;
      }
      break;
    default:
      exp = Math.pow(L, 3);
  }
  return Math.floor(exp);
}

/* ---------- New Function: Display "Your Pokedex" Popup ---------- */
async function displayYourPokedexPopup() {
  try {
    // Assume we have a global variable window.username (set from the home page)
    const username = window.username || prompt("Enter your username:");
    if (!username) {
      alert("Username is required.");
      return;
    }
    
    // Fetch master list of standard Pokémon.
    const masterRes = await fetch("/api/pokedex/master");
    const masterData = await masterRes.json();
    if (masterData.error) {
      alert("Error fetching master pokedex: " + masterData.error);
      return;
    }
    const masterList = masterData.master;
    
    // Fetch user's owned Pokémon.
    const ownedRes = await fetch("/api/user/owned?username=" + encodeURIComponent(username));
    const ownedData = await ownedRes.json();
    if (!ownedData.success) {
      alert("Error fetching your Pokémon: " + ownedData.error);
      return;
    }
    const ownedList = ownedData.owned;
    
    // Create a map (by lower-case name) for quick lookup.
    const ownedMap = {};
    ownedList.forEach(poke => {
      if (poke.Name) {
        ownedMap[poke.Name.toLowerCase()] = poke;
      }
    });
    
    // Create overlay popup.
    const overlay = document.createElement("div");
    overlay.id = "pokedexPopupOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";
    
    // Create container for grid.
    const gridContainer = document.createElement("div");
    gridContainer.id = "pokedexGrid";
    gridContainer.style.width = "90%";
    gridContainer.style.maxHeight = "90%";
    gridContainer.style.backgroundColor = "#fff";
    gridContainer.style.borderRadius = "10px";
    gridContainer.style.padding = "20px";
    gridContainer.style.overflowY = "auto";
    gridContainer.style.display = "grid";
    gridContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
    gridContainer.style.gridGap = "15px";
    
    // For each Pokémon in the master list, create a card.
    masterList.forEach(masterPoke => {
      // Only consider Standard forms.
      if (masterPoke.form !== "Standard") return;
      
      const card = document.createElement("div");
      card.style.border = "2px solid #ccc";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";
      card.style.textAlign = "center";
      
      // Display id and name.
      const idElem = document.createElement("p");
      idElem.textContent = masterPoke.id;
      idElem.style.margin = "5px 0";
      idElem.style.fontWeight = "bold";
      
      const nameElem = document.createElement("p");
      nameElem.textContent = masterPoke.name;
      nameElem.style.margin = "5px 0";
      
      card.appendChild(idElem);
      card.appendChild(nameElem);
      
      // Check ownership.
      const ownedPoke = ownedMap[masterPoke.name.toLowerCase()];
      if (ownedPoke && ownedPoke.Pic) {
        // Create image element using owned picture (full color).
        const img = document.createElement("img");
        img.src = ownedPoke.Pic;
        img.alt = masterPoke.name;
        img.style.width = "100%";
        img.style.borderRadius = "4px";
        card.appendChild(img);
      } else {
        // For not-owned, display a placeholder.
        const placeholder = document.createElement("div");
        placeholder.style.width = "100%";
        placeholder.style.height = "80px";
        placeholder.style.backgroundColor = "#eee";
        placeholder.style.borderRadius = "4px";
        placeholder.style.display = "flex";
        placeholder.style.alignItems = "center";
        placeholder.style.justifyContent = "center";
        placeholder.style.filter = "grayscale(100%)";
        const phText = document.createElement("span");
        phText.textContent = "Not Owned";
        phText.style.fontSize = "0.8em";
        phText.style.color = "#666";
        placeholder.appendChild(phText);
        card.appendChild(placeholder);
      }
      
      gridContainer.appendChild(card);
    });
    
    overlay.appendChild(gridContainer);
    document.body.appendChild(overlay);
    
    // Remove popup when clicking outside grid.
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  } catch (error) {
    console.error("Error displaying your pokedex:", error);
    alert("An error occurred while displaying your pokedex.");
  }
}

window.displayYourPokedexPopup = displayYourPokedexPopup;


function displayTeamPokemonPopup(pokemon) {
  const displayName = pokemon.DisplayName || pokemon.Name || "Unknown";
  console.log("displayTeamPokemonPopup: Displaying team popup for", pokemon.Name);
  
  const overlay = document.createElement("div");
  overlay.id = "teamPopupOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const popup = document.createElement("div");
  popup.id = "teamPopup";
  popup.style.backgroundColor = "#fff";
  popup.style.width = "80%";
  popup.style.maxWidth = "800px";
  popup.style.height = "80%";
  popup.style.display = "flex";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  popup.style.overflow = "hidden";

  // LEFT SIDE (Team Slot Details)
  const leftContainer = document.createElement("div");
  leftContainer.style.flex = "1";
  leftContainer.style.display = "flex";
  leftContainer.style.flexDirection = "column";
  leftContainer.style.borderRight = "1px solid #ccc";

  // TOP LEFT BOX: Level/EXP info and Stat Bars
  const topLeftBox = document.createElement("div");
  topLeftBox.style.display = "flex";
  topLeftBox.style.flexDirection = "column";
  topLeftBox.style.flex = "1";
  topLeftBox.style.margin = "5px";
  topLeftBox.style.border = "1px solid #ccc";
  topLeftBox.style.borderRadius = "5px";
  topLeftBox.style.padding = "10px";
  
  // Level and EXP details
  const levelElem = document.createElement("p");
  levelElem.textContent = "Level: " + pokemon.Level;
  levelElem.style.marginBottom = "5px";
  topLeftBox.appendChild(levelElem);
  
  const nextLevelExp = getExpForLevel(pokemon.Level + 1, pokemon.LevellingRate);
  const expText = document.createElement("p");
  expText.textContent = "EXP: " + pokemon.EXP + " / " + nextLevelExp;
  expText.style.margin = "0 0 5px 0";
  topLeftBox.appendChild(expText);
  
  const expBarContainer = document.createElement("div");
  expBarContainer.style.width = "100%";
  expBarContainer.style.height = "20px";
  expBarContainer.style.backgroundColor = "#eee";
  expBarContainer.style.borderRadius = "10px";
  expBarContainer.style.overflow = "hidden";
  const expProgress = document.createElement("div");
  const expProgressPercent = Math.min((pokemon.EXP / nextLevelExp) * 100, 100);
  expProgress.style.width = expProgressPercent + "%";
  expProgress.style.height = "100%";
  expProgress.style.backgroundColor = "#76c7c0";
  expBarContainer.appendChild(expProgress);
  topLeftBox.appendChild(expBarContainer);
  
  // Stat Bars wrapper: fills remaining space with some padding
  const statWrapper = document.createElement("div");
  statWrapper.style.flex = "1";
  statWrapper.style.marginTop = "10px";
  statWrapper.style.padding = "5px";
  statWrapper.style.boxSizing = "border-box";
  statWrapper.style.overflowY = "auto";
  
  const statBarsDiv = document.createElement("div");
  const levelForMax = 100;
  const natureMult = natureMultipliers[pokemon.Nature] || { Attack: 1, Defense: 1, SpAtk: 1, SpDef: 1, Speed: 1 };
  const maxHP = calculateHP(pokemon.Base_HP, pokemon.IV_HP, levelForMax, pokemon.EV_HP);
  const maxAttack = calculateOtherStat(pokemon.Base_Attack, pokemon.IV_Attack, levelForMax, natureMult.Attack, pokemon.EV_Attack);
  const maxDefense = calculateOtherStat(pokemon.Base_Defense, pokemon.IV_Defense, levelForMax, natureMult.Defense, pokemon.EV_Defense);
  const maxSpAtk = calculateOtherStat(pokemon.Base_SpAtk, pokemon.IV_SpAtk, levelForMax, natureMult.SpAtk, pokemon.EV_SpAtk);
  const maxSpDef = calculateOtherStat(pokemon.Base_SpDef, pokemon.IV_SpDef, levelForMax, natureMult.SpDef, pokemon.EV_SpDef);
  const maxSpeed = calculateOtherStat(pokemon.Base_Speed, pokemon.IV_Speed, levelForMax, natureMult.Speed, pokemon.EV_Speed);
  const maxTotal = maxHP + maxAttack + maxDefense + maxSpAtk + maxSpDef + maxSpeed;
  
  function createStatBarLine(label, current, max) {
    const container = document.createElement("div");
    container.style.marginBottom = "5px";
    const textElem = document.createElement("p");
    textElem.textContent = `${label}: ${current} / ${max}`;
    textElem.style.margin = "0 0 2px 0";
    container.appendChild(textElem);
    const barContainer = document.createElement("div");
    barContainer.style.width = "100%";
    barContainer.style.height = "10px";
    barContainer.style.backgroundColor = "#ddd";
    barContainer.style.borderRadius = "5px";
    barContainer.style.overflow = "hidden";
    const ratio = (current / max) * 100;
    const barFill = document.createElement("div");
    barFill.style.width = ratio + "%";
    barFill.style.height = "100%";
    barFill.style.backgroundColor = "#76c7c0";
    barContainer.appendChild(barFill);
    container.appendChild(barContainer);
    return container;
  }
  
  statBarsDiv.appendChild(createStatBarLine("Total", pokemon.Total, maxTotal));
  statBarsDiv.appendChild(createStatBarLine("HP", pokemon.HP, maxHP));
  statBarsDiv.appendChild(createStatBarLine("Attack", pokemon.Attack, maxAttack));
  statBarsDiv.appendChild(createStatBarLine("Defense", pokemon.Defense, maxDefense));
  statBarsDiv.appendChild(createStatBarLine("Sp. Atk", pokemon.SpAtk, maxSpAtk));
  statBarsDiv.appendChild(createStatBarLine("Sp. Def", pokemon.SpDef, maxSpDef));
  statBarsDiv.appendChild(createStatBarLine("Speed", pokemon.Speed, maxSpeed));
  
  statWrapper.appendChild(statBarsDiv);
  topLeftBox.appendChild(statWrapper);
  
  // BOTTOM LEFT BOX: IV and EV Stats
  const bottomLeftBox = document.createElement("div");
  bottomLeftBox.style.height = "40%";
  bottomLeftBox.style.margin = "5px";
  bottomLeftBox.style.border = "1px solid #ccc";
  bottomLeftBox.style.borderRadius = "5px";
  bottomLeftBox.style.padding = "10px";
  bottomLeftBox.style.overflowY = "auto";
  
  const ivEvContainer = document.createElement("div");
  ivEvContainer.style.display = "flex";
  ivEvContainer.style.flexDirection = "row";
  ivEvContainer.style.justifyContent = "space-between";
  ivEvContainer.style.width = "100%";
  
  const ivTableContainer = document.createElement("div");
  ivTableContainer.style.flex = "1";
  ivTableContainer.style.marginRight = "5px";
  const ivHeading = document.createElement("h4");
  ivHeading.textContent = "IV Stats";
  ivHeading.style.marginTop = "0";
  ivTableContainer.appendChild(ivHeading);
  const ivTable = document.createElement("table");
  ivTable.style.width = "100%";
  ivTable.style.borderCollapse = "collapse";
  const ivStats = [
    { label: "HP", key: "IV_HP" },
    { label: "Attack", key: "IV_Attack" },
    { label: "Defense", key: "IV_Defense" },
    { label: "Sp. Atk", key: "IV_SpAtk" },
    { label: "Sp. Def", key: "IV_SpDef" },
    { label: "Speed", key: "IV_Speed" }
  ];
  ivStats.forEach(stat => {
    const row = document.createElement("tr");
    const cellLabel = document.createElement("td");
    cellLabel.textContent = stat.label;
    cellLabel.style.border = "1px solid #ccc";
    cellLabel.style.padding = "4px";
    const cellValue = document.createElement("td");
    cellValue.textContent = pokemon[stat.key] !== undefined ? pokemon[stat.key] : "0";
    cellValue.style.border = "1px solid #ccc";
    cellValue.style.padding = "4px";
    row.appendChild(cellLabel);
    row.appendChild(cellValue);
    ivTable.appendChild(row);
  });
  ivTableContainer.appendChild(ivTable);
  ivEvContainer.appendChild(ivTableContainer);
  
  const evTableContainer = document.createElement("div");
  evTableContainer.style.flex = "1";
  evTableContainer.style.marginLeft = "5px";
  const evHeading = document.createElement("h4");
  evHeading.textContent = "EV Stats";
  evHeading.style.marginTop = "0";
  evTableContainer.appendChild(evHeading);
  const evTable = document.createElement("table");
  evTable.style.width = "100%";
  evTable.style.borderCollapse = "collapse";
  const evStats = [
    { label: "HP", key: "EV_HP" },
    { label: "Attack", key: "EV_Attack" },
    { label: "Defense", key: "EV_Defense" },
    { label: "Sp. Atk", key: "EV_SpAtk" },
    { label: "Sp. Def", key: "EV_SpDef" },
    { label: "Speed", key: "EV_Speed" }
  ];
  evStats.forEach(stat => {
    const row = document.createElement("tr");
    const cellLabel = document.createElement("td");
    cellLabel.textContent = stat.label;
    cellLabel.style.border = "1px solid #ccc";
    cellLabel.style.padding = "4px";
    const cellValue = document.createElement("td");
    cellValue.textContent = pokemon[stat.key] !== undefined ? pokemon[stat.key] : "0";
    cellValue.style.border = "1px solid #ccc";
    cellValue.style.padding = "4px";
    row.appendChild(cellLabel);
    row.appendChild(cellValue);
    evTable.appendChild(row);
  });
  evTableContainer.appendChild(evTable);
  ivEvContainer.appendChild(evTableContainer);
  
  bottomLeftBox.appendChild(ivEvContainer);
  
  leftContainer.appendChild(topLeftBox);
  leftContainer.appendChild(bottomLeftBox);
  
  // RIGHT SIDE (Team Pokemon Details)
  const rightContainer = document.createElement("div");
  rightContainer.style.flex = "1";
  rightContainer.style.display = "flex";
  rightContainer.style.flexDirection = "column";
  
  const rightTop = document.createElement("div");
  rightTop.style.height = "60%";
  rightTop.style.margin = "5px";
  rightTop.style.border = "1px solid #ccc";
  rightTop.style.borderRadius = "5px";
  rightTop.style.padding = "5px";
  
  const imageContainer = document.createElement("div");
  imageContainer.style.height = "50%";
  imageContainer.style.overflow = "hidden";
  const imageElem = document.createElement("img");
  imageElem.src = pokemon.Pic;
  imageElem.alt = displayName;
  imageElem.style.width = "100%";
  imageElem.style.height = "100%";
  imageElem.style.objectFit = "contain";
  imageContainer.appendChild(imageElem);
  rightTop.appendChild(imageContainer);
  
  // Modified detailsDiv: now the entire box will scroll if needed.
  const detailsDiv = document.createElement("div");
  detailsDiv.style.display = "flex";
  detailsDiv.style.flexDirection = "column";
  detailsDiv.style.height = "45%";
  detailsDiv.style.marginTop = "5px";
  detailsDiv.style.marginBottom = "5px";
  detailsDiv.style.border = "1px solid #ccc";
  detailsDiv.style.borderRadius = "5px";
  detailsDiv.style.padding = "10px";
  detailsDiv.style.boxSizing = "border-box";
  detailsDiv.style.overflowY = "auto"; // Entire box scrolls
  
  // Append basic info directly into detailsDiv
  const nameHeader = document.createElement("p");
  nameHeader.textContent = "Name: " + displayName;
  detailsDiv.appendChild(nameHeader);
  
  let genderVal = pokemon.Gender || "Unknown";
  if (displayName.toLowerCase().includes("mega") && pokemon["Gender Ratio"]) {
    genderVal = pokemon["Gender Ratio"];
  }
  const genderInfoElem = document.createElement("p");
  genderInfoElem.textContent = "Gender: " + genderVal;
  detailsDiv.appendChild(genderInfoElem);
  
  const abilityElem = document.createElement("p");
  abilityElem.textContent = "Ability: " + pokemon.Abilities;
  detailsDiv.appendChild(abilityElem);
  
  const natureElem = document.createElement("p");
  natureElem.textContent = "Nature: " + pokemon.Nature;
  detailsDiv.appendChild(natureElem);
  
  const heightElem = document.createElement("p");
  heightElem.textContent = "Height: " + pokemon.HeightM + " m (" + pokemon.HeightFt + ")";
  detailsDiv.appendChild(heightElem);
  
  let weightLbsClean = String(pokemon.WeightLbs).replace(/lbs/gi, "").trim();
  const weightElem = document.createElement("p");
  weightElem.textContent = "Weight: " + pokemon.WeightKgs + " kg (" + weightLbsClean + " lbs)";
  detailsDiv.appendChild(weightElem);
  
  // Append the info text directly without wrapping it in a separate element
  const infoRowElem = document.createElement("p");
  infoRowElem.textContent = "Info: " + (pokemon.Info || "");
  detailsDiv.appendChild(infoRowElem);
  
  rightTop.appendChild(detailsDiv);
  
  const rightBottom = document.createElement("div");
  rightBottom.style.height = "40%";
  rightBottom.style.margin = "5px";
  rightBottom.style.padding = "5px";
  rightBottom.style.boxSizing = "border-box";
  rightBottom.style.display = "grid";
  rightBottom.style.gridTemplateColumns = "repeat(2, 1fr)";
  rightBottom.style.gridGap = "5px";
  rightBottom.style.border = "1px solid #ccc";
  rightBottom.style.borderRadius = "5px";
  for (let i = 0; i < 4; i++) {
    const moveBtn = document.createElement("button");
    moveBtn.textContent = `Move ${i + 1}: ${pokemon["Move" + (i + 1)] || "—"}`;
    moveBtn.style.padding = "5px";
    moveBtn.style.border = "1px solid #ccc";
    moveBtn.style.borderRadius = "5px";
    moveBtn.style.backgroundColor = "#f8f8f8";
    moveBtn.style.cursor = "pointer";
    rightBottom.appendChild(moveBtn);
  }
  rightContainer.appendChild(rightTop);
  rightContainer.appendChild(rightBottom);
  
  popup.appendChild(leftContainer);
  popup.appendChild(rightContainer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) {
      overlay.remove();
      document.removeEventListener("keydown", handleArrowNavigation);
    }
  });
  
  document.removeEventListener("keydown", handleArrowNavigation);
  document.addEventListener("keydown", handleArrowNavigation);
}
