const API_BASE = "/api";

async function apiRequest(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!res.ok) {
    let msg = "Error en la petición";
    try {
      const data = await res.json();
      if (data.message) msg = data.message;
    } catch (_) {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Elementos del DOM
const authForm = document.getElementById("authForm");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const authAlert = document.getElementById("authAlert");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserSpan = document.getElementById("currentUser");
const openLoginBtn = document.getElementById("openLoginBtn");
const openRegisterBtn = document.getElementById("openRegisterBtn");
const authModalElement = document.getElementById("authModal");
const authModalLabel = document.getElementById("authModalLabel");
let authModal = null;

if (authModalElement && window.bootstrap) {
  authModal = new bootstrap.Modal(authModalElement);
}

const gameForm = document.getElementById("gameForm");
const gameIdInput = document.getElementById("gameId");
const titleInput = document.getElementById("title");
const platformInput = document.getElementById("platform");
const genreInput = document.getElementById("genre");
const statusSelect = document.getElementById("status");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const filterPlatform = document.getElementById("filterPlatform");
const filterGenre = document.getElementById("filterGenre");
const filterStatus = document.getElementById("filterStatus");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");

const gamesTableBody = document.querySelector("#gamesTable tbody");
const gamesEmpty = document.getElementById("gamesEmpty");

let currentUser = null;

function setAuthState(user) {
  currentUser = user;
  if (user) {
    currentUserSpan.textContent = `Conectado como ${user.username}`;
    logoutBtn.classList.remove("d-none");
    openLoginBtn.classList.add("d-none");
    openRegisterBtn.classList.add("d-none");
    authAlert.classList.add("d-none");
    gameForm.querySelectorAll("input, select, button").forEach((el) => {
      el.disabled = false;
    });
    applyFiltersBtn.disabled = false;
    loadGames();
  } else {
    currentUserSpan.textContent = "";
    logoutBtn.classList.add("d-none");
    openLoginBtn.classList.remove("d-none");
    openRegisterBtn.classList.remove("d-none");
    gamesTableBody.innerHTML = "";
    gamesEmpty.classList.add("d-none");
    gameForm.reset();
    gameForm.querySelectorAll("input, select, button").forEach((el) => {
      el.disabled = true;
    });
    applyFiltersBtn.disabled = true;
  }
}

async function checkSession() {
  try {
    const user = await apiRequest("/auth/me");
    setAuthState(user);
  } catch {
    setAuthState(null);
  }
}

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  authAlert.classList.add("d-none");
  try {
    const user = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setAuthState(user);
    if (authModal) authModal.hide();
  } catch (err) {
    authAlert.textContent = err.message;
    authAlert.classList.remove("d-none");
  }
});

registerBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  authAlert.classList.add("d-none");
  if (!username || !password) {
    authAlert.textContent = "Usuario y contraseña son obligatorios";
    authAlert.classList.remove("d-none");
    return;
  }
  try {
    const user = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setAuthState(user);
    if (authModal) authModal.hide();
  } catch (err) {
    authAlert.textContent = err.message;
    authAlert.classList.remove("d-none");
  }
});

openLoginBtn.addEventListener("click", () => {
  authAlert.classList.add("d-none");
  authForm.reset();
  if (authModalLabel) authModalLabel.textContent = "Iniciar sesión";
  if (authModal) authModal.show();
});

openRegisterBtn.addEventListener("click", () => {
  authAlert.classList.add("d-none");
  authForm.reset();
  if (authModalLabel) authModalLabel.textContent = "Registrarse";
  if (authModal) authModal.show();
});

logoutBtn.addEventListener("click", async () => {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // ignorar errores de logout
  }
  setAuthState(null);
});

gameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = gameIdInput.value;
  const payload = {
    title: titleInput.value.trim(),
    platform: platformInput.value.trim(),
    genre: genreInput.value.trim(),
    status: statusSelect.value,
  };
  try {
    if (id) {
      await apiRequest(`/games/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiRequest("/games", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    gameForm.reset();
    gameIdInput.value = "";
    cancelEditBtn.classList.add("d-none");
    await loadGames();
  } catch (err) {
    alert(err.message);
  }
});

cancelEditBtn.addEventListener("click", () => {
  gameForm.reset();
  gameIdInput.value = "";
  cancelEditBtn.classList.add("d-none");
});

applyFiltersBtn.addEventListener("click", () => {
  loadGames();
});

async function loadGames() {
  const params = new URLSearchParams();
  if (filterPlatform.value.trim()) params.append("platform", filterPlatform.value.trim());
  if (filterGenre.value.trim()) params.append("genre", filterGenre.value.trim());
  if (filterStatus.value) params.append("status", filterStatus.value);

  try {
    const games = await apiRequest(`/games?${params.toString()}`);
    renderGames(games);
  } catch (err) {
    alert(err.message);
  }
}

function renderGames(games) {
  gamesTableBody.innerHTML = "";
  if (!games.length) {
    gamesEmpty.classList.remove("d-none");
    return;
  }
  gamesEmpty.classList.add("d-none");

  games.forEach((game) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${game.title}</td>
      <td>${game.platform}</td>
      <td>${game.genre}</td>
      <td>
        <button class="btn btn-link p-0 status-pill status-${game.status}" data-id="${game.id}" data-status="${game.status}">
          ${formatStatus(game.status)}
        </button>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-2" data-action="edit" data-id="${game.id}">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${game.id}">Eliminar</button>
      </td>
    `;
    gamesTableBody.appendChild(tr);
  });
}

function formatStatus(status) {
  switch (status) {
    case "pendiente":
      return "Pendiente";
    case "en_progreso":
      return "En progreso";
    case "completado":
      return "Completado";
    default:
      return status;
  }
}

gamesTableBody.addEventListener("click", async (e) => {
  const target = e.target;
  if (target.matches("button[data-action]")) {
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (action === "edit") {
      const row = target.closest("tr");
      gameIdInput.value = id;
      titleInput.value = row.children[0].textContent;
      platformInput.value = row.children[1].textContent;
      genreInput.value = row.children[2].textContent;
      statusSelect.value = target
        .closest("tr")
        .querySelector("button.status-pill")
        .getAttribute("data-status");
      cancelEditBtn.classList.remove("d-none");
    } else if (action === "delete") {
      if (confirm("¿Eliminar este videojuego?")) {
        try {
          await apiRequest(`/games/${id}`, { method: "DELETE" });
          await loadGames();
        } catch (err) {
          alert(err.message);
        }
      }
    }
  } else if (target.matches("button.status-pill")) {
    const id = target.getAttribute("data-id");
    const currentStatus = target.getAttribute("data-status");
    const nextStatus =
      currentStatus === "pendiente"
        ? "en_progreso"
        : currentStatus === "en_progreso"
        ? "completado"
        : "pendiente";
    try {
      await apiRequest(`/games/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadGames();
    } catch (err) {
      alert(err.message);
    }
  }
});

// Inicializar
checkSession();

