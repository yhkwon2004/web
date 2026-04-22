import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const state = {
  role: "visitor",
  sort: "time-desc",
  records: [],
  shelfBooks: []
};

const el = {
  intro: document.getElementById("intro"),
  enterBtn: document.getElementById("enter-btn"),
  app: document.getElementById("library-app"),
  ownerName: document.getElementById("owner-name"),
  career: document.getElementById("career"),
  roleSelect: document.getElementById("role-select"),
  sortSelect: document.getElementById("sort-select"),
  list: document.getElementById("records"),
  addBtn: document.getElementById("add-item-btn"),
  dialog: document.getElementById("editor-dialog"),
  form: document.getElementById("editor-form")
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#020617");
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const library = new THREE.Group();
scene.add(library);
scene.add(new THREE.AmbientLight("#9ecbff", 0.7));
const point = new THREE.PointLight("#fef3c7", 1.2, 30);
point.position.set(0, 4, 0);
scene.add(point);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: "#0f172a" })
);
floor.rotation.x = -Math.PI / 2;
library.add(floor);

const makeShelf = (x) => {
  const shelf = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.8, 0.5),
    new THREE.MeshStandardMaterial({ color: "#3f2d1f" })
  );
  shelf.add(body);
  shelf.position.set(x, 1.4, -3.5);
  library.add(shelf);
  return shelf;
};
const shelves = [makeShelf(-5), makeShelf(0), makeShelf(5)];

const makeBook = () =>
  new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.9, 0.28),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.55, 0.55) })
  );

function rebuildBooks() {
  state.shelfBooks.forEach((m) => m.parent?.remove(m));
  state.shelfBooks = [];
  state.records.forEach((record, index) => {
    const shelf = shelves[index % shelves.length];
    const level = Math.floor((index / shelves.length) % 2);
    const slot = Math.floor(index / (shelves.length * 2));
    const book = makeBook();
    book.position.set(-1.5 + (slot % 9) * 0.35, -0.45 + level * 1.0, 0.32);
    book.userData = { id: record.id };
    shelf.add(book);
    state.shelfBooks.push(book);
  });
}

const orbit = { yaw: 0, pitch: 0.35, radius: 8, dragging: false, prevX: 0, prevY: 0 };
function updateCamera() {
  const x = Math.sin(orbit.yaw) * orbit.radius;
  const z = Math.cos(orbit.yaw) * orbit.radius;
  const y = 2.5 + Math.sin(orbit.pitch) * 1.8;
  camera.position.set(x, y, z);
  camera.lookAt(0, 1.2, -3.2);
}
updateCamera();

const dragTarget = renderer.domElement;
dragTarget.addEventListener("pointerdown", (e) => {
  orbit.dragging = true;
  orbit.prevX = e.clientX;
  orbit.prevY = e.clientY;
});
window.addEventListener("pointerup", () => (orbit.dragging = false));
window.addEventListener("pointermove", (e) => {
  if (!orbit.dragging) return;
  const dx = e.clientX - orbit.prevX;
  const dy = e.clientY - orbit.prevY;
  orbit.prevX = e.clientX;
  orbit.prevY = e.clientY;
  orbit.yaw -= dx * 0.005;
  orbit.pitch = Math.max(-0.5, Math.min(0.9, orbit.pitch - dy * 0.003));
  updateCamera();
});

function sortRecords() {
  const [key, dir] = state.sort.split("-");
  const sign = dir === "asc" ? 1 : -1;
  state.records.sort((a, b) => {
    if (key === "name") return a.title.localeCompare(b.title, "ko") * sign;
    return (new Date(a.date) - new Date(b.date)) * sign;
  });
}

function renderList() {
  el.list.innerHTML = "";
  state.records.forEach((r) => {
    const li = document.createElement("li");
    li.className = "record";
    li.innerHTML = `
      <strong>${r.title}</strong>
      <p>${r.summary}</p>
      <p class="meta">${r.category} · ${r.date}</p>
      <div class="actions ${state.role === "librarian" ? "" : "hidden"}">
        <button data-action="edit" data-id="${r.id}">수정</button>
        <button data-action="delete" data-id="${r.id}">삭제</button>
      </div>
    `;
    el.list.append(li);
  });
  rebuildBooks();
}

function openEditor(record) {
  el.form.reset();
  document.getElementById("editor-title").textContent = record ? "기록 수정" : "기록 추가";
  document.getElementById("record-id").value = record?.id ?? "";
  document.getElementById("record-title").value = record?.title ?? "";
  document.getElementById("record-summary").value = record?.summary ?? "";
  document.getElementById("record-category").value = record?.category ?? "";
  document.getElementById("record-date").value = record?.date ?? new Date().toISOString().slice(0, 10);
  el.dialog.showModal();
}

el.list.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const id = target.dataset.id;
  const action = target.dataset.action;
  if (!id || state.role !== "librarian") return;
  if (action === "delete") {
    state.records = state.records.filter((r) => r.id !== id);
    renderList();
  }
  if (action === "edit") {
    openEditor(state.records.find((r) => r.id === id));
  }
});

el.addBtn.addEventListener("click", () => openEditor());
el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("record-id").value || crypto.randomUUID();
  const payload = {
    id,
    title: document.getElementById("record-title").value,
    summary: document.getElementById("record-summary").value,
    category: document.getElementById("record-category").value,
    date: document.getElementById("record-date").value
  };
  const idx = state.records.findIndex((r) => r.id === id);
  if (idx >= 0) state.records[idx] = payload;
  else state.records.push(payload);
  sortRecords();
  renderList();
  el.dialog.close();
});

el.roleSelect.addEventListener("change", () => {
  state.role = el.roleSelect.value;
  el.addBtn.classList.toggle("hidden", state.role !== "librarian");
  renderList();
});
el.sortSelect.addEventListener("change", () => {
  state.sort = el.sortSelect.value;
  sortRecords();
  renderList();
});

el.enterBtn.addEventListener("click", async () => {
  el.intro.classList.add("open");
  await new Promise((r) => setTimeout(r, 1200));
  el.intro.classList.add("hidden");
  el.app.classList.remove("hidden");
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

async function bootstrap() {
  const data = await fetch("./data/portfolio.json").then((r) => r.json());
  el.ownerName.textContent = data.owner.name;
  el.career.textContent = data.owner.career;
  state.records = data.records;
  sortRecords();
  renderList();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

await bootstrap();
animate();
