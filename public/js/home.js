document.addEventListener("DOMContentLoaded", function() {
  // Retrieve username from URL query parameters.
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  if (!username) {
    console.error("Username not found in URL.");
    return;
  }
  console.log("Username retrieved:", username);

  // Fetch the user's team data.
  fetch(`/api/user/team?username=${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(result => {
      console.log("Team data fetched:", result);
      if (result.success && Array.isArray(result.team)) {
        console.log("Team IDs:", result.team);
        const teamIconsDiv = document.getElementById("teamIcons");
        if (!teamIconsDiv) {
          console.error("Team icons container not found.");
          return;
        }
        teamIconsDiv.innerHTML = "";
        // Loop over the 6 team slots.
        result.team.forEach((slotData, index) => {
          console.log(`Team slot ${index + 1}:`, slotData);
          const iconDiv = document.createElement("div");
          iconDiv.className = "team-icon";
          iconDiv.style.width = "50px";
          iconDiv.style.height = "50px";
          iconDiv.style.borderRadius = "50%";
          iconDiv.style.backgroundColor = "#ddd";
          iconDiv.style.overflow = "hidden";
          iconDiv.style.display = "flex";
          iconDiv.style.alignItems = "center";
          iconDiv.style.justifyContent = "center";

          // Function to attach click event for showing the popup.
          const attachClick = (pokemonObj) => {
            iconDiv.addEventListener("click", function() {
              // Call the globally available popup function.
              if (typeof window.displayTeamPokemonPopup === "function") {
                window.displayTeamPokemonPopup(pokemonObj);
              } else {
                console.error("displayTeamPokemonPopup function is not defined.");
              }
            });
          };

          // Case 1: The team slot already holds a full Pokémon object.
          if (slotData && typeof slotData === "object" && slotData.Pic) {
            const img = document.createElement("img");
            img.src = slotData.Pic;
            img.alt = slotData.Name || "Team Pokemon";
            img.style.width = "100%";
            img.style.height = "100%";
            iconDiv.innerHTML = "";
            iconDiv.appendChild(img);
            attachClick(slotData);
          }
          // Case 2: The team slot is a string ID.
          else if (typeof slotData === "string" && slotData.trim() !== "") {
            console.log(`Fetching Pokémon data for team slot ${index + 1} with ID: ${slotData}`);
            fetch(`/api/user/pokemon?username=${encodeURIComponent(username)}&id=${encodeURIComponent(slotData)}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.pokemon && data.pokemon.Pic) {
                  const img = document.createElement("img");
                  img.src = data.pokemon.Pic;
                  img.alt = data.pokemon.Name || "Team Pokemon";
                  img.style.width = "100%";
                  img.style.height = "100%";
                  iconDiv.innerHTML = "";
                  iconDiv.appendChild(img);
                  attachClick(data.pokemon);
                  console.log(`Team slot ${index + 1} populated with Pokémon: ${data.pokemon.Name}`);
                } else {
                  console.warn(`No Pokémon data found for team slot ${index + 1}.`);
                }
              })
              .catch(err => console.error("Error fetching Pokémon data:", err));
          } else {
            console.log(`Team slot ${index + 1} is empty.`);
          }
          teamIconsDiv.appendChild(iconDiv);
        });
      } else {
        console.error("Error fetching team:", result.error);
      }
    })
    .catch(err => {
      console.error("Error in team API call:", err);
    });
});
