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
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Elementos del DOM
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
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

const deleteModalElement = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
let deleteModal = null;
let gameIdToDelete = null;

if (deleteModalElement && window.bootstrap) {
  deleteModal = new bootstrap.Modal(deleteModalElement);
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

const gamesEmpty = document.getElementById("gamesEmpty");
const gamesCardsContainer = document.getElementById("gamesCards");

const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const showAllBtn = document.getElementById("showAllBtn");

let currentUser = null;
let favoriteIds = [];
let showOnlyFavorites = true;

function getFavoritesKey() {
  if (!currentUser) return "games_favorites_guest";
  return `games_favorites_user_${currentUser.id}`;
}

function loadFavoritesForCurrentUser() {
  try {
    const raw = localStorage.getItem(getFavoritesKey());
    const parsed = raw ? JSON.parse(raw) : [];
    favoriteIds = Array.isArray(parsed) ? parsed : [];
  } catch {
    favoriteIds = [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(getFavoritesKey(), JSON.stringify(favoriteIds));
  } catch {
    // ignorar errores de almacenamiento
  }
}

function isFavorite(id) {
  return favoriteIds.includes(Number(id));
}

function toggleFavorite(id) {
  const numericId = Number(id);
  const index = favoriteIds.indexOf(numericId);
  if (index === -1) {
    favoriteIds.push(numericId);
  } else {
    favoriteIds.splice(index, 1);
  }
  saveFavorites();
}

function updateViewModeButtons() {
  if (!showFavoritesBtn || !showAllBtn) return;
  if (showOnlyFavorites) {
    showFavoritesBtn.classList.add("active");
    showAllBtn.classList.remove("active");
  } else {
    showFavoritesBtn.classList.remove("active");
    showAllBtn.classList.add("active");
  }
  showFavoritesBtn.disabled = !currentUser;
  showAllBtn.disabled = !currentUser;
}

function setAuthState(user) {
  currentUser = user;
  if (user) {
    currentUserSpan.textContent = `Conectado como ${user.username}`;
    logoutBtn.classList.remove("d-none");
    openLoginBtn.classList.add("d-none");
    openRegisterBtn.classList.add("d-none");
    authAlert.classList.add("d-none");
    loadFavoritesForCurrentUser();
    showOnlyFavorites = true;
    updateViewModeButtons();
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
    if (gamesCardsContainer) {
      gamesCardsContainer.innerHTML = "";
    }
    gamesEmpty.classList.add("d-none");
    gameForm.reset();
    gameForm.querySelectorAll("input, select, button").forEach((el) => {
      el.disabled = true;
    });
    applyFiltersBtn.disabled = true;
    favoriteIds = [];
    showOnlyFavorites = true;
    updateViewModeButtons();
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
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
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
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
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

confirmDeleteBtn.addEventListener("click", async () => {
  if (gameIdToDelete) {
    try {
      await apiRequest(`/games/${gameIdToDelete}`, { method: "DELETE" });
      if (deleteModal) deleteModal.hide();
      gameIdToDelete = null;
      await loadGames();
    } catch (err) {
      alert(err.message);
    }
  }
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

if (showFavoritesBtn && showAllBtn) {
  showFavoritesBtn.addEventListener("click", () => {
    showOnlyFavorites = true;
    updateViewModeButtons();
    loadGames();
  });
  showAllBtn.addEventListener("click", () => {
    showOnlyFavorites = false;
    updateViewModeButtons();
    loadGames();
  });
}

async function loadGames() {
  const params = new URLSearchParams();
  if (filterPlatform.value.trim()) params.append("platform", filterPlatform.value.trim());
  if (filterGenre.value.trim()) params.append("genre", filterGenre.value.trim());
  if (filterStatus.value) params.append("status", filterStatus.value);

  try {
    const games = await apiRequest(`/games?${params.toString()}`);
    const toRender =
      showOnlyFavorites && favoriteIds.length
        ? games.filter((g) => isFavorite(g.id))
        : showOnlyFavorites
          ? []
          : games;
    renderGames(toRender);
  } catch (err) {
    alert(err.message);
  }
}

function renderGames(games) {
  if (gamesCardsContainer) {
    gamesCardsContainer.innerHTML = "";
  }
  if (!games.length) {
    gamesEmpty.classList.remove("d-none");
    return;
  }
  gamesEmpty.classList.add("d-none");

  games.forEach((game) => {
    if (gamesCardsContainer) {
      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <div class="card game-card h-100">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="card-title mb-0">${game.title}</h6>
              <button
                class="btn btn-link p-0 favorite-toggle"
                data-id="${game.id}"
                aria-label="Marcar como favorito"
              >
                ${isFavorite(game.id) ? "★" : "☆"}
              </button>
            </div>
            <div class="mb-1">
              <span class="badge bg-light text-dark border platform-badge">${game.platform}</span>
            </div>
            <p class="card-text mb-2"><strong>Género:</strong> ${game.genre}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <button
                class="btn btn-link p-0 status-pill status-${game.status}"
                data-id="${game.id}"
                data-status="${game.status}"
              >
                ${formatStatus(game.status)}
              </button>
              <div class="btn-group btn-group-sm">
                <button
                  class="btn btn-outline-primary"
                  data-action="edit"
                  data-id="${game.id}"
                  data-title="${game.title}"
                  data-platform="${game.platform}"
                  data-genre="${game.genre}"
                  data-status="${game.status}"
                >
                  Editar
                </button>
                <button
                  class="btn btn-outline-danger"
                  data-action="delete"
                  data-id="${game.id}"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      gamesCardsContainer.appendChild(col);
    }
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

if (gamesCardsContainer) {
  gamesCardsContainer.addEventListener("click", async (e) => {
    const target = e.target;
    if (target.matches("button[data-action]")) {
      const action = target.getAttribute("data-action");
      const id = target.getAttribute("data-id");
      if (action === "edit") {
        gameIdInput.value = id;
        titleInput.value = target.getAttribute("data-title") || "";
        platformInput.value = target.getAttribute("data-platform") || "";
        genreInput.value = target.getAttribute("data-genre") || "";
        statusSelect.value = target.getAttribute("data-status") || "pendiente";
        cancelEditBtn.classList.remove("d-none");
      } else if (action === "delete") {
        gameIdToDelete = id;
        if (deleteModal) deleteModal.show();
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
    } else if (target.matches("button.favorite-toggle")) {
      const id = target.getAttribute("data-id");
      toggleFavorite(id);
      loadGames();
    }
  });
}

checkSession();

