let token = localStorage.getItem("adminToken") || "";
let chartInstance = null;

/* =========================
   🔐 AUTHENTICATION CHECK
========================= */
async function checkAuth() {
  if (!token) {
    showLogin();
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/login/verify", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      showDashboard();
      loadData();
    } else {
      localStorage.removeItem("adminToken");
      token = "";
      showLogin();
    }
  } catch (err) {
    console.error("Auth check error:", err);
    showLogin();
  }
}

function clearLoginFields() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
}

function showLogin() {
  clearLoginFields();
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
}

function showDashboard() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
}

/* =========================
   🔐 LOGIN SYSTEM
========================= */
async function login() {
  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    token = data.token;
    localStorage.setItem("adminToken", token);

    clearLoginFields();
    showDashboard();
    loadData();

  } catch (err) {
    console.error("Login error:", err);
    alert("Server not reachable. Is backend running?");
  }
}

async function changePassword() {
  const oldPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!oldPassword || !newPassword || !confirmPassword) {
    alert("All password fields are required.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("New password and confirmation must match.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/login/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
        confirmPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Password change failed.");
      return;
    }

    alert("Password changed successfully. Please log in again.");
    logout();
  } catch (err) {
    console.error("Password change error:", err);
    alert("Unable to change password. Check backend status.");
  }
}


/* =========================
   📩 CONTACTS
========================= */
async function loadContacts() {
  try {
    const res = await fetch("http://localhost:5000/api/contact", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    const table = document.getElementById("contactTable");
    table.innerHTML = "";

    if (!data || data.length === 0) {
      table.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No messages yet</td></tr>";
      return;
    }

    const rows = data.map(c => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.message)}</td>
        <td>${new Date(c.date).toLocaleDateString()}</td>
      </tr>
    `).join("");
    table.innerHTML = rows;
  } catch (err) {
    console.error("Error loading contacts:", err);
  }
}


/* =========================
   🎓 ENROLLMENTS
========================= */
async function loadEnrollments() {
  try {
    const res = await fetch("http://localhost:5000/api/enroll", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    const table = document.getElementById("enrollTable");
    table.innerHTML = "";

    if (!data || data.length === 0) {
      table.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No enrollments yet</td></tr>";
      return;
    }

    const rows = data.map(e => `
      <tr>
        <td>${escapeHtml(e.name)}</td>
        <td>${escapeHtml(e.email)}</td>
        <td>${escapeHtml(e.course)}</td>
        <td>${new Date(e.date).toLocaleDateString()}</td>
      </tr>
    `).join("");
    table.innerHTML = rows;
  } catch (err) {
    console.error("Error loading enrollments:", err);
  }
}


/* =========================
   📊 DASHBOARD DATA
========================= */
async function loadData() {
  const search = document.getElementById("search")?.value || "";
  const category = document.getElementById("category")?.value || "";

  try {
    const res = await fetch(
      `http://localhost:5000/api/data?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        logout();
        alert("Session expired or unauthorized. Please log in again.");
        return;
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to load dashboard data");
    }

    const data = await res.json();
    renderEnrollmentTable(data.enrollments || []);
    renderContactTable(data.contacts || []);
    renderChart(data.enrollments || []);
  } catch (err) {
    console.error("Error loading dashboard data:", err);
    alert("Unable to load dashboard data. Check backend status and login credentials.");
  }
}


/* =========================
   📋 TABLE RENDER
========================= */
function renderEnrollmentTable(data) {
  const tableBody = document.getElementById("enrollTable");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No enrollments available</td></tr>";
    return;
  }

  const rows = data.map(item => `
    <tr>
      <td>${escapeHtml(item.name || "")}</td>
      <td>${escapeHtml(item.email || "")}</td>
      <td>${escapeHtml(item.course || item.category || "")}</td>
      <td>${new Date(item.date).toLocaleDateString()}</td>
    </tr>
  `).join("");
  tableBody.innerHTML = rows;
}

function renderContactTable(data) {
  const tableBody = document.getElementById("contactTable");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No messages yet</td></tr>";
    return;
  }

  const rows = data.map(item => `
    <tr>
      <td>${escapeHtml(item.name || "")}</td>
      <td>${escapeHtml(item.email || "")}</td>
      <td>${escapeHtml(item.message || "")}</td>
      <td>${new Date(item.date).toLocaleDateString()}</td>
    </tr>
  `).join("");
  tableBody.innerHTML = rows;
}


/* =========================
   📊 CHART (Chart.js)
========================= */
function renderChart(data) {
  const ctx = document.getElementById("chart");
  if (!ctx) return;

  if (!data || data.length === 0) {
    ctx.style.display = "none";
    return;
  }
  ctx.style.display = "block";

  const labels = data.slice(0, 10).map((d, index) => d.course || d.name || `Record ${index + 1}`);
  const values = data.slice(0, 10).map(() => 1);

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Records",
        data: values,
        backgroundColor: "rgba(56, 189, 248, 0.5)",
        borderColor: "rgba(56, 189, 248, 1)",
        borderWidth: 2,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          },
          ticks: {
            color: "#e2e8f0"
          }
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          },
          ticks: {
            color: "#e2e8f0"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#e2e8f0"
          }
        }
      }
    }
  });
}


/* =========================
   📁 EXPORT CSV
========================= */
function exportCSV() {
  try {
    let rows = [];
    const enrollTable = document.getElementById("enrollTable");
    const contactTable = document.getElementById("contactTable");

    // Export Enrollments
    if (enrollTable && enrollTable.rows.length > 0) {
      rows.push(["=== ENROLLMENTS ==="]);
      rows.push(["Name", "Email", "Course", "Date"]);
      enrollTable.querySelectorAll("tr").forEach(tr => {
        let row = [];
        tr.querySelectorAll("td").forEach(td => row.push('"' + td.innerText.replace(/"/g, '""') + '"'));
        rows.push(row);
      });
      rows.push([]);
    }

    // Export Contacts
    if (contactTable && contactTable.rows.length > 0) {
      rows.push(["=== MESSAGES ==="]);
      rows.push(["Name", "Email", "Message", "Date"]);
      contactTable.querySelectorAll("tr").forEach(tr => {
        let row = [];
        tr.querySelectorAll("td").forEach(td => row.push('"' + td.innerText.replace(/"/g, '""') + '"'));
        rows.push(row);
      });
    }

    if (rows.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Export error:", err);
    alert("Error exporting data");
  }
}


/* =========================
   🚀 INIT (AUTO LOAD)
========================= */
function escapeHtml(text) {
  text = String(text || "");
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function logout() {
  token = "";
  localStorage.removeItem("adminToken");
  
  // Clear all password fields
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  
  showLogin();
}

window.addEventListener("load", checkAuth);