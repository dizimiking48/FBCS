/* =========================
   🔐 SHARED AUTHENTICATION
========================= */

let token = localStorage.getItem("adminToken") || "";

async function checkAuth() {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/login/verify", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem("adminToken");
      token = "";
      redirectToLogin();
    }
  } catch (err) {
    console.error("Auth check error:", err);
    redirectToLogin();
  }
}

function redirectToLogin() {
  window.location.href = "/admin";
}

// Check authentication on page load
window.addEventListener("load", checkAuth);
