const API = "/api/videogames";
let deleteTargetId = null;

// --- Star rating ---
function setRating(value) {
    document.getElementById("calification").value = value;
    document.querySelectorAll("#star-rating .star").forEach(s => {
        s.classList.toggle("active", Number(s.dataset.value) <= value);
    });
}

document.querySelectorAll("#star-rating .star").forEach(star => {
    star.addEventListener("click", () => setRating(Number(star.dataset.value)));
});

function renderStars(n) {
    const max = 5;
    let out = "";
    for (let i = 1; i <= max; i++) {
        out += i <= n ? "★" : `<span class="dim">★</span>`;
    }
    return out;
}

let allGames = [];

// --- Cargar juegos ---
async function loadGames() {
    const status = document.getElementById("filter-status").value;
    const url = status ? `${API}?status=${encodeURIComponent(status)}` : API;
    const games = await fetchJSON(url);
    allGames = games || [];
    renderGames();
    loadStats();
}

function renderGames() {
    const query = document.getElementById("search-input").value.trim().toLowerCase();
    const filtered = query
        ? allGames.filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.genre.toLowerCase().includes(query) ||
            g.platform.toLowerCase().includes(query))
        : allGames;

    const list = document.getElementById("games-list");
    const empty = document.getElementById("empty-msg");
    list.innerHTML = "";

    if (filtered.length === 0) {
        empty.textContent = query
            ? `★ SIN RESULTADOS PARA "${query.toUpperCase()}" ★`
            : "★ NO HAY JUEGOS — PRESIONA START ★";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");
    filtered.forEach(g => list.appendChild(createCard(g)));
}

document.getElementById("search-input").addEventListener("input", renderGames);

// --- Estadísticas ---
async function loadStats() {
    const stats = await fetchJSON(`${API}/stats`);
    if (!stats) return;
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-avg").textContent = stats.avg;
}

// --- Crear tarjeta ---
function createCard(game) {
    const card = document.createElement("div");
    card.className = "game-card";

    const badgeClass = "badge-" + game.status.replace(" ", "-");
    card.innerHTML = `
        <span class="rating">${renderStars(game.calification)}</span>
        <h3>${escapeHtml(game.name)}</h3>
        <p class="meta">► ${escapeHtml(game.genre)}</p>
        <p class="meta">■ ${escapeHtml(game.platform)}</p>
        <span class="badge ${badgeClass}">${game.status.toUpperCase()}</span>
        <div class="card-actions" onclick="event.stopPropagation()">
            <button class="btn-edit" onclick="startEdit('${game._id}')">EDITAR</button>
            <button class="btn-delete" onclick="askDelete('${game._id}')">BORRAR</button>
        </div>
    `;
    card.addEventListener("click", () => showDetail(game));
    return card;
}

// --- Detalle ---
function showDetail(game) {
    document.getElementById("modal-name").textContent = game.name;
    document.getElementById("modal-genre").textContent = game.genre;
    document.getElementById("modal-platform").textContent = game.platform;
    document.getElementById("modal-calification").innerHTML = renderStars(game.calification);
    document.getElementById("modal-status").textContent = game.status;
    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

// --- Formulario submit ---
document.getElementById("game-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const calVal = document.getElementById("calification").value;

    if (!calVal) {
        showNotification("Selecciona una calificación (1-5 estrellas)", true);
        return;
    }

    const data = {
        name: document.getElementById("name").value.trim(),
        genre: document.getElementById("genre").value.trim(),
        platform: document.getElementById("platform").value.trim(),
        calification: Number(calVal),
        status: document.getElementById("status").value
    };

    if (data.calification < 1 || data.calification > 5) {
        showNotification("La calificación debe estar entre 1 y 5", true);
        return;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/${id}` : API;
    const res = await fetchJSON(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

    if (res) {
        showNotification(id ? "Juego actualizado ✓" : "Juego guardado ✓");
        resetForm();
        loadGames();
    }
});

// --- Editar ---
async function startEdit(id) {
    const game = await fetchJSON(`${API}/${id}`);
    if (!game) return;
    document.getElementById("edit-id").value = game._id;
    document.getElementById("name").value = game.name;
    document.getElementById("genre").value = game.genre;
    document.getElementById("platform").value = game.platform;
    setRating(game.calification);
    document.getElementById("status").value = game.status;
    document.getElementById("form-title").textContent = "✎ EDITAR JUEGO";
    document.getElementById("btn-cancel").classList.remove("hidden");
    document.getElementById("form-section") || document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    document.getElementById("game-form").reset();
    document.getElementById("edit-id").value = "";
    document.getElementById("calification").value = "";
    document.querySelectorAll("#star-rating .star").forEach(s => s.classList.remove("active"));
    document.getElementById("form-title").textContent = "+ NUEVO JUEGO";
    document.getElementById("btn-cancel").classList.add("hidden");
}

// --- Eliminar ---
function askDelete(id) {
    deleteTargetId = id;
    document.getElementById("confirm-modal").classList.remove("hidden");
}

function closeConfirm() {
    deleteTargetId = null;
    document.getElementById("confirm-modal").classList.add("hidden");
}

document.getElementById("confirm-delete-btn").addEventListener("click", async () => {
    if (!deleteTargetId) return;
    const res = await fetchJSON(`${API}/${deleteTargetId}`, { method: "DELETE" });
    if (res) {
        showNotification("Juego eliminado");
        loadGames();
    }
    closeConfirm();
});

// --- Notificación ---
function showNotification(msg, isError = false) {
    const n = document.getElementById("notification");
    n.textContent = msg;
    n.className = "notification" + (isError ? " error" : "");
    setTimeout(() => n.classList.add("hidden"), 3000);
}

// --- Fetch helper ---
async function fetchJSON(url, options = {}) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showNotification(err.message || "Error en la solicitud", true);
            return null;
        }
        return await res.json();
    } catch {
        showNotification("Error de conexión", true);
        return null;
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

// Cerrar modal al hacer clic fuera
document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal")) closeModal();
});
document.getElementById("confirm-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("confirm-modal")) closeConfirm();
});

loadGames();
