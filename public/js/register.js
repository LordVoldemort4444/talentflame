async function registerAccount() {
  const maxAttempts = 3;
  let username, password;
  let attempt = 0;

  // Step 1: Get a valid username (check via API)
  while (attempt < maxAttempts) {
    username = prompt("Enter your intended username:");
    if (!username) {
      alert("Registration cancelled.");
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
        attempt++;
        alert(`This username is already taken. Attempts left: ${maxAttempts - attempt}`);
      } else {
        break;
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

  // Step 2: Get a valid password.
  attempt = 0;
  while (attempt < maxAttempts) {
    password = prompt("Enter your intended password (at least 8 characters):");
    if (!password) {
      alert("Registration cancelled.");
      return;
    }
    if (password.length < 8) {
      attempt++;
      alert(`Password must be at least 8 characters. Attempts left: ${maxAttempts - attempt}`);
    } else {
      const confirmPassword = confirm(`This is your password: "${password}". Do you wish to continue?`);
      if (confirmPassword) {
        break;
      } else {
        attempt++;
        alert(`Password confirmation declined. Attempts left: ${maxAttempts - attempt}`);
      }
    }
  }
  if (attempt === maxAttempts) {
    alert("Too many failed attempts for password. Returning to starter page.");
    return;
  }

  // Step 3: Send registration data.
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      alert("Account created successfully! You can now log in.");
    } else {
      alert("Error during registration: " + result.error);
    }
  } catch (error) {
    alert("An error occurred during registration.");
    console.error(error);
  }
}
