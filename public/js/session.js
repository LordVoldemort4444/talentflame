document.addEventListener("DOMContentLoaded", function() {
  // Function to handle logout.
  function logoutHandler() {
    localStorage.removeItem("username");
    window.location.href = "/";
  }

  // Check for a logout button element by ID.
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.style.display = "inline-block";
    logoutBtn.addEventListener("click", logoutHandler);
  }
  
  // Also attach the logout handler to any link with href="/logout".
  const logoutLink = document.querySelector("a[href='/logout']");
  if (logoutLink) {
    logoutLink.addEventListener("click", function(e) {
      e.preventDefault();
      logoutHandler();
    });
  }
  
  // Optionally, update any username display if applicable.
  const storedUsername = localStorage.getItem("username");
  if (storedUsername) {
    const displayElem = document.getElementById("usernameDisplay");
    if (displayElem) {
      displayElem.textContent = storedUsername;
    }
  }
});