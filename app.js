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
  books: [],
  activeHistoryId: null
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
  form: document.getElementById("editor-form"),
  historyBook: document.getElementById("history-book"),
  historyTitle: document.getElementById("history-title"),
  historyImage: document.getElementById("history-image"),
  historySummary: document.getElementById("history-summary"),
  historyTimeline: document.getElementById("history-timeline"),
  historyClose: document.getElementById("history-close"),
  moveLeft: document.getElementById("move-left"),
  moveRight: document.getElementById("move-right")
};

const canvas = document.getElementById("scene");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#030712");
scene.fog = new THREE.Fog("#030712", 9, 30);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const world = new THREE.Group();
scene.add(world);

const ambient = new THREE.HemisphereLight("#bfdbfe", "#1e1b4b", 0.75);
const warmLight = new THREE.PointLight("#fde68a", 1.8, 22);
warmLight.position.set(0, 4.8, -2.8);
const rim = new THREE.DirectionalLight("#c4b5fd", 1.1);
rim.position.set(-4, 6, 5);
const spotlight = new THREE.SpotLight("#cbd5e1", 1.5, 36, Math.PI / 7, 0.35, 1.2);
spotlight.position.set(0, 7, 4);
spotlight.target.position.set(0, 1.2, -3.5);
scene.add(ambient, warmLight, rim, spotlight, spotlight.target);

function buildRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 16),
    new THREE.MeshPhysicalMaterial({ color: "#0f172a", roughness: 0.76, metalness: 0.05, clearcoat: 0.15 })
  );
  floor.rotation.x = -Math.PI / 2;
  world.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.52, metalness: 0.12 });
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
const shelfSpacing = 4.2;
const shelfWrapDistance = shelfSpacing * 9;
function createShelfRow(z) {
  for (let i = -4; i <= 4; i += 1) {
    const shelf = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.8, 0.45),
      new THREE.MeshStandardMaterial({ color: "#4b3326", roughness: 0.62, metalness: 0.06 })
    );
    shelf.add(frame);

    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(3.45, 0.18, 0.48),
      new THREE.MeshStandardMaterial({ color: "#6b4a34", roughness: 0.58 })
    );
    crown.position.set(0, 1.45, 0.02);
    shelf.add(crown);

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.08, 0.38),
      new THREE.MeshStandardMaterial({ color: "#2a1d16", roughness: 0.36, metalness: 0.14 })
    );
    rail.position.set(0, 0.2, 0.18);
    shelf.add(rail.clone());
    rail.position.y = -0.9;
    shelf.add(rail.clone());

    shelf.position.set(i * shelfSpacing, 1.45, z);
    shelf.userData.baseX = i * shelfSpacing;
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
    new THREE.PointsMaterial({ color: "#c4b5fd", size: 0.028, transparent: true, opacity: 0.35 })
  );
  particles.name = "particles";
  world.add(particles);
}

buildRoom();
createShelfRow(-5.5);
createShelfRow(-2.7);
buildAtmosphere();

const controls = {
  yaw: 0,
  pitch: 0.34,
  isDragging: false,
  previousX: 0,
  previousY: 0,
  moveDirection: 0,
  teleportTargetX: null
};

const player = {
  body: null,
  velocity: new THREE.Vector3(),
  position: new THREE.Vector3(0, 0, 2.5),
  speed: 2.5
};

function buildPlayer() {
  const avatar = new THREE.Group();
  const hoodie = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.78, 12, 24),
    new THREE.MeshStandardMaterial({ color: "#05070b", roughness: 0.78, metalness: 0.02 })
  );
  hoodie.position.y = 1.05;
  avatar.add(hoodie);

  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 28, 28),
    new THREE.MeshStandardMaterial({ color: "#080b12", roughness: 0.82 })
  );
  hood.position.set(0, 1.62, 0.06);
  avatar.add(hood);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 24, 24),
    new THREE.MeshStandardMaterial({ color: "#efc8b1", roughness: 0.58 })
  );
  face.position.set(0, 1.55, 0.13);
  avatar.add(face);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58),
    new THREE.MeshStandardMaterial({ color: "#111315", roughness: 0.95 })
  );
  hair.position.set(0, 1.64, 0.07);
  avatar.add(hair);

  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.36, 0.14),
    new THREE.MeshStandardMaterial({ color: "#101828", roughness: 0.7 })
  );
  backpack.position.set(0, 1.02, -0.2);
  avatar.add(backpack);

  const legGeometry = new THREE.CapsuleGeometry(0.06, 0.45, 8, 14);
  const legMaterial = new THREE.MeshStandardMaterial({ color: "#111827" });
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.09, 0.3, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.09;
  avatar.add(leftLeg, rightLeg);

  avatar.position.copy(player.position);
  world.add(avatar);
  player.body = avatar;
}
buildPlayer();

canvas.addEventListener("pointerdown", (event) => {
  controls.isDragging = true;
  controls.previousX = event.clientX;
  controls.previousY = event.clientY;
});
window.addEventListener("pointerup", () => {
  controls.isDragging = false;
});
window.addEventListener("pointermove", (event) => {
  if (!controls.isDragging) return;
  const dx = event.clientX - controls.previousX;
  const dy = event.clientY - controls.previousY;
  controls.previousX = event.clientX;
  controls.previousY = event.clientY;

  controls.yaw -= dx * 0.0023;
  controls.pitch = THREE.MathUtils.clamp(controls.pitch - dy * 0.0016, 0.12, 0.9);
});

function bindMoveButton(button, direction) {
  button.addEventListener("click", () => {
    controls.teleportTargetX = player.position.x + direction * 3.1;
    controls.moveDirection = direction;
  });
}
bindMoveButton(ui.moveLeft, -1);
bindMoveButton(ui.moveRight, 1);

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
          .filter(Boolean),
    image: raw.image || `https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80`,
    history: Array.isArray(raw.history)
      ? raw.history
      : [
          `${raw.date || new Date().toISOString().slice(0, 10)} · ${raw.summary || "설명 없음"}`,
          `성과: ${raw.impact || "성과 미기입"}`
        ]
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
      new THREE.MeshPhysicalMaterial({
        color: categoryColors[record.category] || categoryColors.default,
        emissive: "#0b1120",
        roughness: 0.42,
        metalness: 0.08,
        clearcoat: 0.2
      })
    );
    book.position.set(-1.25 + column * 0.33, -0.95 + level * 1.12, 0.3);
    book.userData.recordId = record.id;
    shelf.add(book);

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.9, 0.255),
      new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.35 })
    );
    spine.position.x = 0.13;
    book.add(spine);

    const worldPosition = new THREE.Vector3();
    book.getWorldPosition(worldPosition);
    state.books.push({ mesh: book, baseY: book.position.y, recordId: record.id, worldPosition });
  });
}

function renderRecords() {
  ui.records.innerHTML = "";
  state.filteredRecords.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `record-btn ${state.selectedRecordId === record.id ? "active" : ""}`;
    button.dataset.id = record.id;
    button.innerHTML = `
      <strong>${record.title}</strong>
      <small>${record.category} · ${record.date}</small>
    `;
    ui.records.append(button);
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
  document.querySelectorAll(".record-btn").forEach((node) => {
    node.classList.toggle("active", node.dataset.id === id);
  });
}

function openHistoryBook(recordId) {
  const target = state.records.find((record) => record.id === recordId);
  if (!target) return;
  state.activeHistoryId = target.id;
  setSelectedRecord(target.id);
  ui.historyTitle.textContent = target.title;
  ui.historySummary.textContent = target.summary;
  ui.historyImage.src = target.image;
  ui.historyTimeline.innerHTML = "";
  target.history.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ui.historyTimeline.append(li);
  });
  ui.historyBook.classList.remove("hidden");
}

function closeHistoryBook() {
  state.activeHistoryId = null;
  ui.historyBook.classList.add("hidden");
}

ui.historyClose.addEventListener("click", closeHistoryBook);

ui.records.addEventListener("click", (event) => {
  const button = event.target.closest(".record-btn");
  if (!(button instanceof HTMLElement)) return;
  const targetBook = state.books.find((book) => book.recordId === button.dataset.id);
  if (targetBook) {
    targetBook.mesh.getWorldPosition(targetBook.worldPosition);
    player.position.x = targetBook.worldPosition.x;
    player.position.z = 2.5;
    player.body.position.copy(player.position);
    controls.teleportTargetX = null;
  }
  openHistoryBook(button.dataset.id);
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
  openHistoryBook(recordId);
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
const cameraOffset = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();

function updatePlayer(delta, elapsed) {
  let movement = controls.moveDirection * player.speed;
  if (typeof controls.teleportTargetX === "number") {
    const distance = controls.teleportTargetX - player.position.x;
    const step = THREE.MathUtils.clamp(distance, -8 * delta, 8 * delta);
    player.position.x += step;
    movement = step / Math.max(delta, 0.0001);
    if (Math.abs(distance) < 0.03) {
      player.position.x = controls.teleportTargetX;
      controls.teleportTargetX = null;
      controls.moveDirection = 0;
      movement = 0;
    }
  } else {
    controls.moveDirection = 0;
  }

  player.velocity.set(movement, 0, 0);
  player.position.z = 2.5;
  if (movement !== 0) player.body.rotation.y = movement > 0 ? Math.PI / 2 : -Math.PI / 2;

  player.body.position.copy(player.position);
  const stride = Math.sin(elapsed * (Math.abs(movement) > 0 ? 12 : 2)) * 0.04;
  player.body.children[5].position.z = stride;
  player.body.children[6].position.z = -stride;
}

function updateCamera() {
  const horizontalDistance = 2.9;
  const verticalDistance = 1.9 + controls.pitch * 0.9;
  cameraOffset.set(Math.sin(controls.yaw + Math.PI) * horizontalDistance, verticalDistance, Math.cos(controls.yaw + Math.PI) * horizontalDistance);
  camera.position.copy(player.position).add(cameraOffset);
  lookAtTarget.copy(player.position).add(new THREE.Vector3(0, 1.25, 0));
  camera.lookAt(lookAtTarget);
}

function checkNearbyRecords() {
  const near = state.books.find((book) => {
    book.mesh.getWorldPosition(book.worldPosition);
    return book.worldPosition.distanceTo(player.position) < 1.2;
  });
  if (near && state.activeHistoryId !== near.recordId) {
    openHistoryBook(near.recordId);
  }
}

function wrapShelvesAroundPlayer() {
  shelfGroups.forEach((shelf) => {
    const diff = shelf.position.x - player.position.x;
    if (diff > shelfWrapDistance) shelf.position.x -= shelfWrapDistance * 2;
    if (diff < -shelfWrapDistance) shelf.position.x += shelfWrapDistance * 2;
  });
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  updatePlayer(delta, elapsed);
  wrapShelvesAroundPlayer();
  updateCamera();
  checkNearbyRecords();

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
