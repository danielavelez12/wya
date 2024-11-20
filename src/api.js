const API_URL = "http://localhost:8400/api";

export async function fetchUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (e) {
    console.error("fetchUsers: error fetching users: ", e);
    return [];
  }
}

export async function updateLastLocation(userID, lat, lon) {
  try {
    console.log({ userID, lat, lon });
    const response = await fetch(`${API_URL}/users/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userID, lat, lon }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (e) {
    console.error("updateLastLocation: error updating location: ", e);
    return false;
  }
}

export async function loginOrSignup(phoneNumber) {
  try {
    const response = await fetch(`${API_URL}/users/phone/${phoneNumber}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const result = await response.json();
    if (!result.exists) return false;
    return { data: result.data, id: result.id };
  } catch (e) {
    console.error("loginOrSignup: error fetching user: ", e);
    return false;
  }
}

export async function createUser(
  phoneNumber,
  firstName,
  lastName,
  email,
  clerkUserID
) {
  try {
    const response = await fetch(`${API_URL}/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        firstName,
        lastName,
        email,
        clerkUserID,
      }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const result = await response.json();
    return result.id;
  } catch (e) {
    console.error("createUser: error creating user: ", e);
    return null;
  }
}

export async function updateShowLocation(userID, showLocation) {
  try {
    const response = await fetch(`${API_URL}/users/${userID}/show-location`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ showLocation }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return true;
  } catch (e) {
    console.error("updateShowLocation: error updating show_location:", e);
    return false;
  }
}

export async function fetchUserById(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (e) {
    console.error("fetchUserById: error fetching user:", e);
    return null;
  }
}

export async function updateUserAvatar(userID, avatarName) {
  try {
    const response = await fetch(`${API_URL}/users/${userID}/avatar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ avatarName }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return true;
  } catch (e) {
    console.error("updateUserAvatar: error updating avatar:", e);
    return false;
  }
}

export async function fetchAllUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (e) {
    console.error("fetchAllUsers: error fetching all users:", e);
    return [];
  }
}

export async function updateShowCity(userID, showCity) {
  try {
    const response = await fetch(`${API_URL}/users/${userID}/show-city`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ showCity }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return true;
  } catch (e) {
    console.error("updateShowCity: error updating show_city:", e);
    return false;
  }
}
