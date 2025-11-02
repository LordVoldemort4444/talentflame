document.addEventListener("DOMContentLoaded", () => {
  async function fetchAndDisplayPokemonByName(inputName) {
    try {
      // Normalize input and build query.
      const normalizedInput = normalizePokemonName(inputName.trim());
      const nameQuery = "name=" + encodeURIComponent(normalizedInput);
      
      // Fetch stats from the server.
      const statsRes = await fetch("/api/pokemon/stats?" + nameQuery);
      const statsData = await statsRes.json();
      if (statsData.error) {
        alert("Error fetching Pokémon stats: " + statsData.error);
        return;
      }
      
      let stats;
      if (Array.isArray(statsData.stats)) {
        // Prompt user to select a form if multiple documents are returned.
        const formsList = statsData.stats
          .map((s, index) => `${index + 1}: ${s.form && s.form !== "Standard" ? s.form : s.name}`)
          .join("\n");
        const choice = prompt(`Multiple forms found for ${normalizedInput}:\n${formsList}\nEnter the number of the form you want:`);
        if (!choice) {
          alert("Operation cancelled.");
          return;
        }
        const index = parseInt(choice, 10) - 1;
        if (isNaN(index) || index < 0 || index >= statsData.stats.length) {
          alert("Invalid choice.");
          return;
        }
        stats = statsData.stats[index];
      } else {
        stats = statsData.stats;
      }
      
      // Use the universal name for subsequent queries and store universalId.
      const universalName = stats.name;
      const baseNameQuery = "name=" + encodeURIComponent(universalName);
      let formQuery = "";
      if (stats.form && stats.form !== "Standard") {
        formQuery = "&form=" + encodeURIComponent(stats.form);
      }
      const baseQuery = baseNameQuery + formQuery;
      
      // Assemble the Pokémon object.
      const pokemon = {};
      pokemon.universalId = stats.id;  // Save universal id for navigation.
      pokemon.Name = stats.name;
      pokemon.DisplayName = (stats.form && stats.form !== "Standard") ? stats.form : stats.name;
      
      if (stats.type) {
        if (Array.isArray(stats.type)) {
          pokemon.Type = stats.type.filter(t => t && t.trim() !== "").join(", ");
        } else {
          pokemon.Type = stats.type;
        }
      } else {
        pokemon.Type = "";
      }
      
      // Fetch additional endpoints concurrently.
      const endpoints = [
        fetch("/api/dimensions?" + baseQuery).then(r => r.json()),
        fetch("/api/abilities?" + baseQuery).then(r => r.json()),
        fetch("/api/gender?" + baseQuery).then(r => r.json()),
        fetch("/api/pic?" + baseQuery).then(r => r.json())
      ];
      const [dimensionsData, abilitiesData, genderData, picData] = await Promise.all(endpoints);
      if (dimensionsData.error) {
        alert("Error fetching dimensions: " + dimensionsData.error);
        return;
      }
      if (abilitiesData.error) {
        alert("Error fetching abilities: " + abilitiesData.error);
        return;
      }
      if (genderData.error) {
        alert("Error fetching gender ratio: " + genderData.error);
        return;
      }
      if (picData.error) {
        alert("Error fetching picture: " + picData.error);
        return;
      }
      
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
      pokemon.Ability1 = abilitiesData.abilities.ability1 || "N/A";
      pokemon.Ability2 = abilitiesData.abilities.ability2 || "";
      pokemon.HiddenAbility = abilitiesData.abilities.hidden || "";
      pokemon.Pic = (picData.pic && picData.pic.picUrl) ? picData.pic.picUrl : "";
      
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
      
      pokemon.Total = stats.Total;
      pokemon.HP = stats.HP;
      pokemon.Attack = stats.Attack;
      pokemon.Defense = stats.Defense;
      pokemon.SpAtk = stats.SpAtk;
      pokemon.SpDef = stats.SpDef;
      pokemon.Speed = stats.Speed;
      
      // Fetch evolution info using the universal name.
      const evoRes = await fetch("/api/evolution?" + baseNameQuery);
      const evoData = await evoRes.json();
      pokemon.Info = evoData.evolutionInfo || "";
      console.log("fetchAndDisplayPokemonByName fetched evolution info:", pokemon.Info);
      
      displayPokemonCard(pokemon);
    } catch (error) {
      console.error("Error in fetchAndDisplayPokemonByName:", error);
      alert("An error occurred while fetching Pokémon data for Pokedex.");
    }
  }
  
  window.fetchAndDisplayPokemonByName = fetchAndDisplayPokemonByName;
  
  const pokedex2Btn = document.getElementById("pokedex2Btn");
  if (pokedex2Btn) {
    pokedex2Btn.addEventListener("click", async () => {
      const input = prompt("Enter Pokémon name for Pokedex:");
      if (!input) {
        alert("Operation cancelled.");
        return;
      }
      fetchAndDisplayPokemonByName(input);
    });
  }
  
  // New event listener for "Your Pokedex" button.
  const yourPokedexBtn = document.getElementById("yourPokedexBtn");
  if (yourPokedexBtn) {
    yourPokedexBtn.addEventListener("click", () => {
      displayYourPokedexPopup();
    });
  }
});
