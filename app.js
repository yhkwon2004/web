import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const STORAGE_KEY = "library-portfolio-v2";

const state = {
  role: "visitor",
  sort: "time-desc",
  category: "all",
  profile: null,
  records: [],
  filteredRecords: [],
  selectedRecordId: null,
  books: []
};

const ui = {
  intro: document.getElementById("intro"),
  enterBtn: document.getElementById("enter-btn"),
  app: document.getElementById("app"),
  ownerName: document.getElementById("owner-name"),
  ownerTitle: document.getElementById("owner-title"),
  ownerCareer: document.getElementById("owner-career"),
  profileSummary: document.getElementById("profile-summary"),
  profileMeta: document.getElementById("profile-meta"),
  skillChips: document.getElementById("skill-chips"),
  roleSelect: document.getElementById("role-select"),
  sortSelect: document.getElementById("sort-select"),
  categoryFilter: document.getElementById("category-filter"),
  records: document.getElementById("records"),
  addBtn: document.getElementById("add-item-btn"),
  dialog: document.getElementById("editor-dialog"),
  form: document.getElementById("editor-form")
};

const canvas = document.getElementById("scene");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#020617");
scene.fog = new THREE.Fog("#020617", 8, 25);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const world = new THREE.Group();
scene.add(world);

const ambient = new THREE.AmbientLight("#bfdcff", 0.45);
const warmLight = new THREE.PointLight("#fcd34d", 1.2, 18);
warmLight.position.set(0, 4.8, -2.8);
const rim = new THREE.DirectionalLight("#93c5fd", 0.7);
rim.position.set(-4, 6, 5);
scene.add(ambient, warmLight, rim);

function buildRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 16),
    new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  world.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.8 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 8), wallMat);
  backWall.position.set(0, 4, -7.2);
  world.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-11, 4, 0);
  world.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.set(11, 4, 0);
  world.add(rightWall);

  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.13, 16, 64, Math.PI),
    new THREE.MeshStandardMaterial({ color: "#5b4636" })
  );
  arch.position.set(0, 3, -6.6);
  world.add(arch);
}

const shelfGroups = [];
function createShelfRow(z) {
  for (let i = -2; i <= 2; i += 1) {
    const shelf = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.8, 0.45),
      new THREE.MeshStandardMaterial({ color: "#4b3326", roughness: 0.8 })
    );
    shelf.add(frame);

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.08, 0.38),
      new THREE.MeshStandardMaterial({ color: "#2b1d15", roughness: 0.9 })
    );
    rail.position.set(0, 0.2, 0.18);
    shelf.add(rail.clone());
    rail.position.y = -0.9;
    shelf.add(rail.clone());

    shelf.position.set(i * 4.2, 1.45, z);
    world.add(shelf);
    shelfGroups.push(shelf);
  }
}

function buildAtmosphere() {
  const points = [];
  for (let i = 0; i < 160; i += 1) {
    points.push((Math.random() - 0.5) * 20, Math.random() * 7, (Math.random() - 0.5) * 16);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: "#93c5fd", size: 0.035, transparent: true, opacity: 0.5 })
  );
  particles.name = "particles";
  world.add(particles);
}

buildRoom();
createShelfRow(-5.5);
createShelfRow(-2.7);
buildAtmosphere();

const orbit = {
  yaw: 0,
  pitch: 0.22,
  radius: 10,
  isDragging: false,
  previousX: 0,
  previousY: 0,
  velocityX: 0,
  velocityY: 0
};

function updateCamera() {
  const x = Math.sin(orbit.yaw) * orbit.radius;
  const z = Math.cos(orbit.yaw) * orbit.radius;
  const y = 2.2 + Math.sin(orbit.pitch) * 2;
  camera.position.set(x, y, z + 1.5);
  camera.lookAt(0, 1.4, -4.2);
}
updateCamera();

canvas.addEventListener("pointerdown", (event) => {
  orbit.isDragging = true;
  orbit.previousX = event.clientX;
  orbit.previousY = event.clientY;
});
window.addEventListener("pointerup", () => {
  orbit.isDragging = false;
});
window.addEventListener("pointermove", (event) => {
  if (!orbit.isDragging) return;
  const dx = event.clientX - orbit.previousX;
  const dy = event.clientY - orbit.previousY;
  orbit.previousX = event.clientX;
  orbit.previousY = event.clientY;

  orbit.velocityX = -dx * 0.0013;
  orbit.velocityY = -dy * 0.001;
  orbit.yaw += orbit.velocityX;
  orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + orbit.velocityY, -0.5, 0.9);
  updateCamera();
});

const categoryColors = {
  프로젝트: "#38bdf8",
  경험: "#f97316",
  활동: "#22c55e",
  default: "#a78bfa"
};

function toDateValue(record) {
  return new Date(record.date).getTime();
}

function sortRecords(items) {
  const [key, direction] = state.sort.split("-");
  const sign = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (key === "name") {
      return a.title.localeCompare(b.title, "ko") * sign;
    }
    return (toDateValue(a) - toDateValue(b)) * sign;
  });
}

function normalizeRecord(raw) {
  return {
    id: raw.id || crypto.randomUUID(),
    title: raw.title || "제목 없음",
    summary: raw.summary || "설명 없음",
    category: raw.category || "기타",
    date: raw.date || new Date().toISOString().slice(0, 10),
    impact: raw.impact || "성과 미기입",
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : String(raw.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
  };
}

function saveLocal() {
  const payload = { profile: state.profile, records: state.records };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function applyFilters() {
  const byCategory =
    state.category === "all" ? state.records : state.records.filter((record) => record.category === state.category);
  state.filteredRecords = sortRecords(byCategory);
}

function renderCategoryFilter() {
  const categories = [...new Set(state.records.map((record) => record.category))];
  ui.categoryFilter.innerHTML = '<option value="all">전체</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (state.category === category) option.selected = true;
    ui.categoryFilter.append(option);
  });
}

function renderProfile() {
  const profile = state.profile;
  ui.ownerName.textContent = profile.name;
  ui.ownerTitle.textContent = profile.title;
  ui.ownerCareer.textContent = `경력 ${profile.experienceYears}년`;
  ui.profileSummary.textContent = profile.summary;

  ui.profileMeta.innerHTML = "";
  [
    `위치: ${profile.location}`,
    `이메일: ${profile.email}`,
    `링크: ${profile.links.map((link) => link.label).join(" · ")}`
  ].forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ui.profileMeta.append(li);
  });

  ui.skillChips.innerHTML = "";
  profile.skills.forEach((skill) => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = skill;
    ui.skillChips.append(span);
  });
}

function clearBooks() {
  state.books.forEach(({ mesh }) => mesh.parent?.remove(mesh));
  state.books = [];
}

function renderBooks() {
  clearBooks();
  state.filteredRecords.forEach((record, index) => {
    const shelf = shelfGroups[index % shelfGroups.length];
    const slot = Math.floor(index / shelfGroups.length);
    const level = slot % 2;
    const column = Math.floor(slot / 2) % 8;

    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.95, 0.25),
      new THREE.MeshStandardMaterial({
        color: categoryColors[record.category] || categoryColors.default,
        emissive: "#0b1120",
        roughness: 0.52
      })
    );
    book.position.set(-1.25 + column * 0.33, -0.95 + level * 1.12, 0.3);
    book.userData.recordId = record.id;
    shelf.add(book);

    state.books.push({ mesh: book, baseY: book.position.y, recordId: record.id });
  });
}

function renderRecords() {
  ui.records.innerHTML = "";
  state.filteredRecords.forEach((record) => {
    const li = document.createElement("li");
    li.className = `record ${state.selectedRecordId === record.id ? "active" : ""}`;
    li.dataset.id = record.id;
    li.innerHTML = `
      <h3>${record.title}</h3>
      <p>${record.summary}</p>
      <p class="meta">${record.category} · ${record.date} · ${record.impact}</p>
      <div class="tags">${record.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      <div class="actions ${state.role === "librarian" ? "" : "hidden"}">
        <button class="action-btn" data-action="edit" data-id="${record.id}">수정</button>
        <button class="action-btn" data-action="delete" data-id="${record.id}">삭제</button>
      </div>
    `;
    ui.records.append(li);
  });
}

function refresh() {
  applyFilters();
  renderCategoryFilter();
  renderRecords();
  renderBooks();
}

function setSelectedRecord(id) {
  state.selectedRecordId = id;
  document.querySelectorAll(".record").forEach((node) => {
    node.classList.toggle("active", node.dataset.id === id);
  });
}

ui.records.addEventListener("click", (event) => {
  const button = event.target;
  if (!(button instanceof HTMLButtonElement)) return;
  if (state.role !== "librarian") return;

  const { action, id } = button.dataset;
  if (!id) return;
  if (action === "delete") {
    state.records = state.records.filter((record) => record.id !== id);
    saveLocal();
    refresh();
  }
  if (action === "edit") {
    openEditor(state.records.find((record) => record.id === id));
  }
});

ui.records.addEventListener("pointerdown", (event) => {
  const card = event.target.closest(".record");
  if (!(card instanceof HTMLElement)) return;
  setSelectedRecord(card.dataset.id);
});

function openEditor(record) {
  ui.form.reset();
  document.getElementById("editor-title").textContent = record ? "기록 수정" : "기록 추가";
  document.getElementById("record-id").value = record?.id || "";
  document.getElementById("record-title").value = record?.title || "";
  document.getElementById("record-summary").value = record?.summary || "";
  document.getElementById("record-category").value = record?.category || "";
  document.getElementById("record-date").value = record?.date || new Date().toISOString().slice(0, 10);
  document.getElementById("record-impact").value = record?.impact || "";
  document.getElementById("record-tags").value = record?.tags?.join(", ") || "";
  ui.dialog.showModal();
}

ui.addBtn.addEventListener("click", () => openEditor());
ui.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = normalizeRecord({
    id: document.getElementById("record-id").value,
    title: document.getElementById("record-title").value,
    summary: document.getElementById("record-summary").value,
    category: document.getElementById("record-category").value,
    date: document.getElementById("record-date").value,
    impact: document.getElementById("record-impact").value,
    tags: document.getElementById("record-tags").value
  });

  const targetIndex = state.records.findIndex((record) => record.id === payload.id);
  if (targetIndex >= 0) state.records[targetIndex] = payload;
  else state.records.push(payload);

  state.category = "all";
  saveLocal();
  refresh();
  ui.dialog.close();
});

ui.roleSelect.addEventListener("change", () => {
  state.role = ui.roleSelect.value;
  ui.addBtn.classList.toggle("hidden", state.role !== "librarian");
  renderRecords();
});
ui.sortSelect.addEventListener("change", () => {
  state.sort = ui.sortSelect.value;
  refresh();
});
ui.categoryFilter.addEventListener("change", () => {
  state.category = ui.categoryFilter.value;
  refresh();
});

ui.enterBtn.addEventListener("click", async () => {
  ui.intro.classList.add("open");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  ui.intro.classList.add("hidden");
  ui.app.classList.remove("hidden");
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(state.books.map((book) => book.mesh));
  if (!intersects.length) return;

  const recordId = intersects[0].object.userData.recordId;
  setSelectedRecord(recordId);
  document.querySelector(`[data-id="${recordId}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

async function loadPortfolio() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    const data = JSON.parse(cached);
    state.profile = data.profile;
    state.records = data.records.map(normalizeRecord);
    return;
  }

  const data = await fetch("./data/portfolio.json").then((response) => response.json());
  state.profile = data.profile;
  state.records = data.records.map(normalizeRecord);
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  if (!orbit.isDragging) {
    orbit.velocityX *= 0.92;
    orbit.velocityY *= 0.9;
    if (Math.abs(orbit.velocityX) > 0.00001) {
      orbit.yaw += orbit.velocityX;
      orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + orbit.velocityY, -0.5, 0.9);
      updateCamera();
    }
  }

  const particleCloud = world.getObjectByName("particles");
  if (particleCloud) particleCloud.rotation.y += delta * 0.03;

  state.books.forEach((book, index) => {
    const selected = state.selectedRecordId === book.recordId;
    book.mesh.position.y = book.baseY + Math.sin(elapsed * 1.5 + index * 0.5) * 0.014;
    book.mesh.scale.setScalar(selected ? 1.07 : 1);
    book.mesh.material.emissive.set(selected ? "#164e63" : "#0b1120");
  });

  renderer.render(scene, camera);
}

await loadPortfolio();
renderProfile();
refresh();
animate();
