export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const userStr = localStorage.getItem("vial_current_user");
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    return user.isLoggedIn === true;
  } catch {
    return false;
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("vial_current_user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;

  const userStr = localStorage.getItem("vial_current_user");
  if (userStr) {
    const user = JSON.parse(userStr);
    // Keep user info but mark as logged out
    localStorage.setItem(
      "vial_current_user",
      JSON.stringify({
        ...user,
        isLoggedIn: false,
      })
    );
  }
  // Or completely remove:
  // localStorage.removeItem("vial_current_user");
}
