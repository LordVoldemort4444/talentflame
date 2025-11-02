async function loginAccount() {
  const maxAttempts = 3;
  let username, password;
  let attempt = 0;

  // Step 1: Prompt for username and verify its existence.
  while (attempt < maxAttempts) {
    username = prompt("Enter your username:");
    if (!username) {
      alert("Login cancelled.");
      return;
    }
    const params = new URLSearchParams();
    params.append("username", username);
    try {
      const res = await fetch("/api/check_username", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });
      const result = await res.json();
      if (result.exists) {
        break;
      } else {
        attempt++;
        alert(`Username not found. Attempts left: ${maxAttempts - attempt}`);
      }
    } catch (error) {
      alert("An error occurred while checking the username.");
      console.error(error);
      return;
    }
  }
  if (attempt === maxAttempts) {
    alert("Too many failed attempts for username. Returning to starter page.");
    return;
  }

  // Step 2: Prompt for password and verify.
  attempt = 0;
  while (attempt < maxAttempts) {
    password = prompt("Enter your password:");
    if (!password) {
      alert("Login cancelled.");
      return;
    }
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem("username", username);
        if (result.tutorial) {
          window.location.href = `/tutorial?username=${encodeURIComponent(username)}`;
        } else {
          window.location.href = `/home?username=${encodeURIComponent(username)}`;
        }
        return;
      } else {
        attempt++;
        alert(`Incorrect password. Attempts left: ${maxAttempts - attempt}`);
      }
    } catch (error) {
      alert("An error occurred during login.");
      console.error(error);
      return;
    }
  }
  if (attempt === maxAttempts) {
    alert("Too many failed attempts for password. Returning to starter page.");
    return;
  }
}
