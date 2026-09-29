/* MealPlan - Meal & Grocery Planner
   Vanilla JS + LocalStorage. No external libraries. */

const STORAGE_KEY = "mealplan_data";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

let state = loadState();
let mealFilter = { search: "", type: "all" };
let groceryFilter = { search: "", category: "all" };

// ---------- Data ----------
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through */ }
  }
  return seedData();
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function seedData() {
  const data = {
    meals: [
      { id: 1, day: "Monday", type: "Breakfast", name: "Pancakes", ingredients: ["flour", "eggs", "milk", "butter"], notes: "" },
      { id: 2, day: "Monday", type: "Lunch", name: "Chicken Adobo", ingredients: ["chicken", "soy sauce", "vinegar", "garlic", "bay leaf"], notes: "" },
      { id: 3, day: "Monday", type: "Dinner", name: "Spaghetti", ingredients: ["spaghetti noodles", "ground beef", "tomato sauce", "cheese"], notes: "" },
      { id: 4, day: "Tuesday", type: "Breakfast", name: "Fried Rice", ingredients: ["rice", "eggs", "garlic", "green onions"], notes: "" },
      { id: 5, day: "Tuesday", type: "Dinner", name: "Grilled Chicken", ingredients: ["chicken breast", "lemon", "olive oil", "herbs"], notes: "Marinate overnight" },
      { id: 6, day: "Wednesday", type: "Lunch", name: "Vegetable Stir Fry", ingredients: ["broccoli", "carrots", "bell pepper", "soy sauce"], notes: "" },
      { id: 7, day: "Thursday", type: "Breakfast", name: "Beef Tapa", ingredients: ["beef", "soy sauce", "garlic", "rice"], notes: "" }
    ],
    grocery: [
      { id: 1, name: "Chicken Breast", quantity: "1 kg", category: "Meat", purchased: false },
      { id: 2, name: "Eggs", quantity: "1 dozen", category: "Dairy", purchased: true },
      { id: 3, name: "Rice", quantity: "2 kg", category: "Grains", purchased: false },
      { id: 4, name: "Soy Sauce", quantity: "1 bottle", category: "Other", purchased: true },
      { id: 5, name: "Broccoli", quantity: "2 heads", category: "Vegetables", purchased: false },
      { id: 6, name: "Bananas", quantity: "1 bunch", category: "Fruits", purchased: false },
      { id: 7, name: "Milk", quantity: "1 liter", category: "Dairy", purchased: true },
      { id: 8, name: "Bottled Water", quantity: "6 pcs", category: "Drinks", purchased: false }
    ],
    nextMealId: 8,
    nextGroceryId: 9
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = "") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function todayName() {
  const idx = new Date().getDay(); // 0 = Sunday
  const map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return map[idx];
}

// ---------- Rendering: Dashboard ----------
function renderDashboard() {
  document.getElementById("stat-planned").textContent = state.meals.length;
  document.getElementById("stat-week").textContent = state.meals.length; // all planned meals are within "this week" model
  document.getElementById("stat-grocery").textContent = state.grocery.length;
  document.getElementById("stat-purchased").textContent = state.grocery.filter(g => g.purchased).length;

  renderTodayMeals();
  renderGroceryProgress();
}

function renderTodayMeals() {
  const container = document.getElementById("today-meals");
  const today = todayName();
  const rows = ["Breakfast", "Lunch", "Dinner"].map(type => {
    const meal = state.meals.find(m => m.day === today && m.type === type);
    return `
      <div class="today-meal-row">
        <span class="today-meal-type">${type}</span>
        <span class="${meal ? "today-meal-name" : "today-meal-empty"}">${meal ? escapeHtml(meal.name) : "Not planned"}</span>
      </div>
    `;
  }).join("");
  container.innerHTML = rows;
}

function renderGroceryProgress() {
  const total = state.grocery.length;
  const purchased = state.grocery.filter(g => g.purchased).length;
  document.getElementById("grocery-progress-text").textContent = `${purchased} / ${total} items purchased`;
  const pct = total === 0 ? 0 : Math.round((purchased / total) * 100);
  document.getElementById("progress-bar-fill").style.width = pct + "%";
}

// ---------- Rendering: Weekly Planner ----------
function renderWeekGrid() {
  const grid = document.getElementById("week-grid");
  grid.innerHTML = DAYS.map(day => {
    const slots = ["Breakfast", "Lunch", "Dinner", "Snack"].map(type => {
      let meals = state.meals.filter(m => m.day === day && m.type === type);

      // Apply filters
      if (mealFilter.type !== "all") {
        meals = type === mealFilter.type ? meals : [];
      }
      if (mealFilter.search) {
        meals = meals.filter(m => m.name.toLowerCase().includes(mealFilter.search.toLowerCase()));
      }

      if (mealFilter.type !== "all" && mealFilter.type !== type) return "";

      const mealsHtml = meals.length
        ? meals.map(m => `
            <div class="meal-item">
              <div class="meal-item-info">
                <div class="meal-item-name">${escapeHtml(m.name)}</div>
                ${m.ingredients && m.ingredients.length ? `<div class="meal-item-ingredients">${escapeHtml(m.ingredients.join(", "))}</div>` : ""}
                ${m.notes ? `<div class="meal-item-notes">${escapeHtml(m.notes)}</div>` : ""}
              </div>
              <div class="meal-item-actions">
                <button class="icon-btn" data-action="edit-meal" data-id="${m.id}" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
                <button class="icon-btn danger" data-action="delete-meal" data-id="${m.id}" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            </div>
          `).join("")
        : "";

      return `
        <div class="meal-slot">
          <div class="meal-slot-label">${type}</div>
          <div class="meal-slot-content">
            ${mealsHtml || `<button class="add-meal-slot-btn" data-action="add-meal" data-day="${day}" data-type="${type}">+ Add ${type}</button>`}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="day-card">
        <h3>${day}</h3>
        ${slots}
      </div>
    `;
  }).join("");
}

// ---------- Rendering: Grocery List ----------
function renderGroceryList() {
  const container = document.getElementById("grocery-list");
  let items = [...state.grocery];

  if (groceryFilter.category !== "all") {
    items = items.filter(g => g.category === groceryFilter.category);
  }
  if (groceryFilter.search) {
    items = items.filter(g => g.name.toLowerCase().includes(groceryFilter.search.toLowerCase()));
  }

  if (items.length === 0) {
    container.innerHTML = `<p class="empty-msg">No grocery items found.</p>`;
    return;
  }

  container.innerHTML = items.map(g => `
    <div class="grocery-item ${g.purchased ? "purchased" : ""}">
      <input type="checkbox" class="grocery-checkbox" data-id="${g.id}" ${g.purchased ? "checked" : ""}>
      <div class="grocery-item-info">
        <div class="grocery-item-name">${escapeHtml(g.name)}</div>
        <div class="grocery-item-meta"><span class="category-tag">${g.category}</span> &nbsp; Qty: ${escapeHtml(g.quantity)}</div>
      </div>
      <div class="grocery-actions">
        <button class="icon-btn" data-action="edit-grocery" data-id="${g.id}" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn danger" data-action="delete-grocery" data-id="${g.id}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

function renderAll() {
  renderDashboard();
  renderWeekGrid();
  renderGroceryList();
}

// ---------- Meal Actions ----------
function openMealModal(meal = null, presetDay = null, presetType = null) {
  document.getElementById("meal-form").reset();
  document.getElementById("meal-id").value = "";
  document.getElementById("meal-modal-title").textContent = meal ? "Edit Meal" : "Add Meal";
  document.getElementById("save-meal-btn").textContent = meal ? "Update Meal" : "Save Meal";

  if (meal) {
    document.getElementById("meal-id").value = meal.id;
    document.getElementById("meal-day").value = meal.day;
    document.getElementById("meal-type").value = meal.type;
    document.getElementById("meal-name").value = meal.name;
    document.getElementById("meal-ingredients").value = (meal.ingredients || []).join(", ");
    document.getElementById("meal-notes").value = meal.notes || "";
  } else {
    if (presetDay) document.getElementById("meal-day").value = presetDay;
    if (presetType) document.getElementById("meal-type").value = presetType;
  }
  document.getElementById("meal-modal-overlay").classList.add("show");
}

function closeMealModal() { document.getElementById("meal-modal-overlay").classList.remove("show"); }

function saveMealFromForm() {
  const id = document.getElementById("meal-id").value;
  const day = document.getElementById("meal-day").value;
  const type = document.getElementById("meal-type").value;
  const name = document.getElementById("meal-name").value.trim();
  const ingredients = document.getElementById("meal-ingredients").value
    .split(",").map(s => s.trim()).filter(Boolean);
  const notes = document.getElementById("meal-notes").value.trim();

  if (!name) { showToast("Please enter a meal name.", "error"); return; }

  if (id) {
    const meal = state.meals.find(m => m.id === Number(id));
    if (meal) {
      Object.assign(meal, { day, type, name, ingredients, notes });
      showToast(`${name} updated.`, "success");
    }
  } else {
    state.meals.push({ id: state.nextMealId++, day, type, name, ingredients, notes });
    showToast(`${name} added to ${day}.`, "success");
  }
  saveState();
  renderAll();
  closeMealModal();
}

function deleteMeal(id) {
  const meal = state.meals.find(m => m.id === id);
  if (!meal) return;
  if (!confirm(`Delete "${meal.name}" from ${meal.day}?`)) return;
  state.meals = state.meals.filter(m => m.id !== id);
  saveState();
  renderAll();
  showToast(`${meal.name} deleted.`);
}

// ---------- Grocery Actions ----------
function openGroceryModal(item = null) {
  document.getElementById("grocery-form").reset();
  document.getElementById("grocery-id").value = "";
  document.getElementById("grocery-modal-title").textContent = item ? "Edit Grocery Item" : "Add Grocery Item";
  document.getElementById("save-grocery-btn").textContent = item ? "Update Item" : "Save Item";

  if (item) {
    document.getElementById("grocery-id").value = item.id;
    document.getElementById("grocery-name").value = item.name;
    document.getElementById("grocery-quantity").value = item.quantity;
    document.getElementById("grocery-category").value = item.category;
  }
  document.getElementById("grocery-modal-overlay").classList.add("show");
}

function closeGroceryModal() { document.getElementById("grocery-modal-overlay").classList.remove("show"); }

function saveGroceryFromForm() {
  const id = document.getElementById("grocery-id").value;
  const name = document.getElementById("grocery-name").value.trim();
  const quantity = document.getElementById("grocery-quantity").value.trim();
  const category = document.getElementById("grocery-category").value;

  if (!name || !quantity) { showToast("Please fill in all fields.", "error"); return; }

  if (id) {
    const item = state.grocery.find(g => g.id === Number(id));
    if (item) {
      Object.assign(item, { name, quantity, category });
      showToast(`${name} updated.`, "success");
    }
  } else {
    state.grocery.push({ id: state.nextGroceryId++, name, quantity, category, purchased: false });
    showToast(`${name} added to grocery list.`, "success");
  }
  saveState();
  renderAll();
  closeGroceryModal();
}

function deleteGrocery(id) {
  const item = state.grocery.find(g => g.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}" from the grocery list?`)) return;
  state.grocery = state.grocery.filter(g => g.id !== id);
  saveState();
  renderAll();
  showToast(`${item.name} deleted.`);
}

function toggleGroceryPurchased(id, checked) {
  const item = state.grocery.find(g => g.id === id);
  if (!item) return;
  item.purchased = checked;
  saveState();
  renderAll();
}

// ---------- Navigation ----------
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  const pageTitle = document.getElementById("page-title");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      const target = item.dataset.section;
      sections.forEach(s => s.classList.toggle("active", s.id === "section-" + target));
      pageTitle.textContent = item.textContent.trim();
      closeSidebar();
    });
  });
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  setupNavigation();

  document.getElementById("hamburger").addEventListener("click", openSidebar);
  document.getElementById("overlay").addEventListener("click", closeSidebar);

  // Header "Add Meal" button
  document.getElementById("header-add-btn").addEventListener("click", () => openMealModal());

  // Meal modal
  document.getElementById("close-meal-modal").addEventListener("click", closeMealModal);
  document.getElementById("cancel-meal-modal").addEventListener("click", closeMealModal);
  document.getElementById("meal-modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "meal-modal-overlay") closeMealModal();
  });
  document.getElementById("meal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveMealFromForm();
  });

  // Grocery modal
  document.getElementById("open-grocery-modal").addEventListener("click", () => openGroceryModal());
  document.getElementById("close-grocery-modal").addEventListener("click", closeGroceryModal);
  document.getElementById("cancel-grocery-modal").addEventListener("click", closeGroceryModal);
  document.getElementById("grocery-modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "grocery-modal-overlay") closeGroceryModal();
  });
  document.getElementById("grocery-form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveGroceryFromForm();
  });

  // Week grid delegation (add/edit/delete meal)
  document.getElementById("week-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "add-meal") {
      openMealModal(null, btn.dataset.day, btn.dataset.type);
    } else if (action === "edit-meal") {
      const meal = state.meals.find(m => m.id === Number(btn.dataset.id));
      if (meal) openMealModal(meal);
    } else if (action === "delete-meal") {
      deleteMeal(Number(btn.dataset.id));
    }
  });

  // Meal search/filter
  document.getElementById("meal-search").addEventListener("input", (e) => {
    mealFilter.search = e.target.value;
    renderWeekGrid();
  });
  document.getElementById("meal-type-filter").addEventListener("change", (e) => {
    mealFilter.type = e.target.value;
    renderWeekGrid();
  });

  // Grocery list delegation
  document.getElementById("grocery-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "edit-grocery") {
      const item = state.grocery.find(g => g.id === Number(btn.dataset.id));
      if (item) openGroceryModal(item);
    } else if (action === "delete-grocery") {
      deleteGrocery(Number(btn.dataset.id));
    }
  });
  document.getElementById("grocery-list").addEventListener("change", (e) => {
    if (e.target.classList.contains("grocery-checkbox")) {
      toggleGroceryPurchased(Number(e.target.dataset.id), e.target.checked);
    }
  });

  // Grocery search/filter
  document.getElementById("grocery-search").addEventListener("input", (e) => {
    groceryFilter.search = e.target.value;
    renderGroceryList();
  });
  document.getElementById("grocery-category-filter").addEventListener("change", (e) => {
    groceryFilter.category = e.target.value;
    renderGroceryList();
  });
});
