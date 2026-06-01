const projects = {
  "dobrynya-m2": {
    label: "Добрыня М2",
    qr: "./assets/dobrynya-m2.png",
    defaultPackage: "Жилой дом. Утепление 200",
  },
  "ohotnik-3": {
    label: "Охотник 3",
    qr: "./assets/ohotnik-3.png",
    defaultPackage: "Дачный стандарт",
  },
  "dobrynya-5": {
    label: "Добрыня 5",
    qr: "./assets/dobrynya-5.png",
    defaultPackage: "Жилой дом. Утепление 200",
  },
  "vityaz-3": {
    label: "Витязь 3",
    qr: "./assets/vityaz-3.png",
    defaultPackage: "Дачный стандарт",
  },
  "vityaz-m6": {
    label: "Витязь М6",
    qr: "./assets/vityaz-m6.png",
    defaultPackage: "Теплый контур",
  },
  "barn-5": {
    label: "Барн 5",
    qr: "./assets/qr-code.png",
    defaultPackage: "Дачный стандарт",
  },
  "lira-4": {
    label: "Лира 4",
    qr: "./assets/lira-4.png",
    defaultPackage: "Дачный стандарт",
  },
  "akvarel-4": {
    label: "Акварель 4",
    qr: "./assets/akvarel-4.png",
    defaultPackage: "Дачный стандарт",
  },
  "riviera-2": {
    label: "Ривьера 2",
    qr: "./assets/riviera-2.png",
    defaultPackage: "Дачный стандарт",
  },
  "nord-5": {
    label: "Норд 5",
    qr: "./assets/nord-5.png",
    defaultPackage: "Дачный стандарт",
  },
};

const engineeringText = {
  included: "Входит полный пакет инженерных коммуникаций.",
  extra: "Инженерные коммуникации можно заказать дополнительно",
};

let editors = Array.from(document.querySelectorAll("[data-ticket-editor]"));
let tickets = Array.from(document.querySelectorAll("[data-ticket]"));

const editorPanel = document.querySelector(".editor");
const preview = document.querySelector(".preview");
const firstSheet = document.querySelector(".sheet");
const editorTemplate = editors[0].cloneNode(true);
const ticketTemplate = tickets[0].cloneNode(true);
const addTicketButton = document.querySelector("#addTicketButton");
const printButton = document.querySelector("#printButton");
const saveButton = document.querySelector("#saveButton");
const saveListButton = document.querySelector("#saveListButton");
const resetListButton = document.querySelector("#resetListButton");
const panelActions = document.querySelector(".panel-actions");
const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const toast = document.querySelector("#toast");
const storagePrefix = "terem-price-list";
const activeTabKey = `${storagePrefix}:active-tab`;
const defaultProjectQrs = Object.fromEntries(
  Object.entries(projects).map(([key, project]) => [key, project.qr]),
);
let activeTab = localStorage.getItem(activeTabKey) || "salaryevo";
let toastTimer;
let activeTicketIndex = -1;

function getEditorState(editor) {
  return {
    project: editor.querySelector("[data-field='project']").value,
    title: editor.querySelector("[data-field='title']").value,
    projectName: getProjectName(editor),
    tech: editor.querySelector("[data-field='tech']").value,
    packageName: editor.querySelector("[data-field='package']").value,
    price: editor.querySelector("[data-field='price']").value,
    oldPrice: editor.querySelector("[data-field='oldPrice']").value,
    date: editor.querySelector("[data-field='date']").value,
    engineering: editor.querySelector("[data-field='engineering']:checked").value,
  };
}

function setEditorState(editor, state) {
  editor.querySelector("[data-field='project']").value = state.project;
  editor.querySelector("[data-field='title']").value = state.title;
  setProjectName(editor, state.projectName || projects[state.project].label);
  editor.querySelector("[data-field='tech']").value = state.tech;
  editor.querySelector("[data-field='package']").value = state.packageName;
  editor.querySelector("[data-field='price']").value = state.price;
  editor.querySelector("[data-field='oldPrice']").value = state.oldPrice || "";
  editor.querySelector("[data-field='date']").value = state.date;

  const engineering = editor.querySelector(
    `[data-field='engineering'][value='${state.engineering || "extra"}']`,
  );

  if (engineering) {
    engineering.checked = true;
  }
}

function createDefaultState(index = 0) {
  const project = index === 1 ? "vityaz-3" : "dobrynya-m2";

  return {
    project,
    title: "Одноэтажный коттедж",
    projectName: projects[project].label,
    tech: "Каркас",
    packageName: projects[project].defaultPackage,
    price: "12 116 000",
    oldPrice: "",
    date: "28.05.2026",
    engineering: "extra",
  };
}

function cleanPackage(value) {
  return value.replace(/[«»]/g, "").trim();
}

function formatPrice(value) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatPriceInput(input) {
  input.value = formatPrice(input.value);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}

function renderMultiline(value) {
  return value
    .split(/\r?\n/)
    .map((line) => escapeHtml(line))
    .join("<br>");
}

function makeTwoLineTitle(title, projectLabel) {
  return `${title.trim() || "Одноэтажный коттедж"}\n${projectLabel}`;
}

function getProjectName(editor) {
  const projectSelect = editor.querySelector("[data-field='project']");
  return editor.dataset.projectName || projects[projectSelect.value].label;
}

function setProjectName(editor, name) {
  const projectSelect = editor.querySelector("[data-field='project']");
  const cleanName = name.trim() || projects[projectSelect.value].label;

  editor.dataset.projectName = cleanName;
  projectSelect.selectedOptions[0].textContent = cleanName;
  requestAnimationFrame(() => {
    const width = projectSelect.selectedOptions[0].textContent.length * 7.2;
    editor.style.setProperty("--project-name-width", `${Math.min(width, 150)}px`);
  });
}

function renderTicket(index) {
  const editor = editors[index];
  const ticket = tickets[index];
  const state = getEditorState(editor);
  const project = projects[state.project];

  ticket.querySelector("[data-output='title']").innerHTML = renderMultiline(
    makeTwoLineTitle(state.title, state.projectName || project.label),
  );
  ticket.querySelector("[data-output='tech']").textContent = state.tech;
  ticket.querySelector("[data-output='package']").textContent = `«${cleanPackage(state.packageName)}»`;
  ticket.querySelector("[data-output='price']").textContent = state.price;
  const oldPriceRow = ticket.querySelector("[data-output='old-price-row']");
  ticket.querySelector("[data-output='oldPrice']").textContent = state.oldPrice;
  oldPriceRow.hidden = !state.oldPrice.trim();
  ticket.classList.toggle("has-old-price", Boolean(state.oldPrice.trim()));
  ticket.querySelector("[data-output='date']").textContent = state.date;
  ticket.querySelector("[data-output='engineering']").innerHTML = engineeringText[state.engineering];
  ticket.querySelector("[data-output='qr']").src = project.qr;

  fitText(ticket);
}

function fitText(ticket) {
  requestAnimationFrame(() => {
    [
      { element: ticket.querySelector(".ticket-meta"), max: 15, min: 12 },
      { element: ticket.querySelector(".side-title"), max: 15, min: 10 },
      { element: ticket.querySelector(".engineering-line"), max: 13, min: 9 },
      { element: ticket.querySelector(".date-line"), max: 13, min: 9 },
      { element: ticket.querySelector(".price-line strong"), max: 85, min: 52 },
      { element: ticket.querySelector(".old-price-line strong"), max: 52, min: 32 },
    ].forEach(({ element, max, min }) => {
      if (!element) {
        return;
      }

      element.style.fontSize = `${max}px`;

      while (element.scrollWidth > element.clientWidth && parseFloat(element.style.fontSize) > min) {
        element.style.fontSize = `${parseFloat(element.style.fontSize) - 1}px`;
      }
    });
  });
}

function syncEditableToEditor(index, outputName, value) {
  const editor = editors[index];
  const fieldName = outputName === "package" ? "package" : outputName;
  const input = editor.querySelector(`[data-field='${fieldName}']`);

  if (!input) {
    return;
  }

  if (outputName === "price" || outputName === "oldPrice") {
    input.value = formatPrice(value);
    return;
  }

  input.value = outputName === "package" ? cleanPackage(value) : value.trim();
}

function setEditorIndex(editor, index) {
  editor.dataset.ticketEditor = index;

  let head = editor.querySelector(".form-head");
  let heading = editor.querySelector("h1, h2");

  if (!head) {
    head = document.createElement("div");
    head.className = "form-head";

    if (!heading) {
      heading = document.createElement("h2");
    }

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "toggle-ticket-button";
    toggle.setAttribute("aria-label", "Свернуть или развернуть ценник");
    toggle.textContent = "-";
    const actions = document.createElement("div");
    actions.className = "form-actions";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-ticket-button";
    remove.setAttribute("aria-label", "Удалить ценник");
    remove.textContent = "×";
    const summary = document.createElement("span");
    summary.className = "form-summary";

    heading.replaceWith(head);
    actions.append(remove, toggle);
    head.append(heading, summary, actions);

    head.addEventListener("click", (event) => {
      if (event.target.closest(".delete-ticket-button")) {
        return;
      }

      editor.classList.toggle("collapsed");
      updateEditorToggle(editor);

      if (editor.classList.contains("collapsed")) {
        setActiveTicket(-1);
        return;
      }

      setActiveTicket(editors.indexOf(editor));
    });

    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteTicket(editor);
    });
  }

  heading = head.querySelector("h1, h2");
  heading.textContent = `Ценник №${index + 1}`;
  updateEditorSummary(editor);
  updateEditorToggle(editor);

  editor.querySelectorAll("[data-field='engineering']").forEach((input) => {
    input.name = `engineering-${index}`;
  });
}

function updateEditorToggle(editor) {
  const toggle = editor.querySelector(".toggle-ticket-button");

  if (!toggle) {
    return;
  }

  toggle.textContent = editor.classList.contains("collapsed") ? "+" : "-";
}

function setActiveTicket(index) {
  activeTicketIndex = index < 0 ? -1 : Math.max(0, Math.min(index, editors.length - 1));

  editors.forEach((editor, editorIndex) => {
    editor.classList.toggle(
      "is-active",
      editorIndex === activeTicketIndex && !editor.classList.contains("collapsed"),
    );
  });

  tickets.forEach((ticket, ticketIndex) => {
    ticket.classList.toggle("is-active", ticketIndex === activeTicketIndex);
  });
}

function normalizeEditorDividers() {
  editorPanel.querySelectorAll(".divider").forEach((divider) => divider.remove());

  editors.slice(1).forEach((editor) => {
    const divider = document.createElement("div");
    divider.className = "divider";
    editorPanel.insertBefore(divider, editor);
  });
}

function reflowTickets() {
  const neededSheets = Math.ceil(tickets.length / 2);

  while (document.querySelectorAll(".sheet").length < neededSheets) {
    createSheet();
  }

  tickets.forEach((ticket, index) => {
    getSheetForTicket(index).querySelector(".tickets").append(ticket);
  });

  Array.from(document.querySelectorAll(".sheet")).forEach((sheet, index) => {
    if (index >= neededSheets) {
      sheet.remove();
    }
  });
}

function refreshIndexes() {
  editors.forEach((editor, index) => {
    setEditorIndex(editor, index);
    updateEditorToggle(editor);
  });

  tickets.forEach((ticket, index) => {
    ticket.dataset.ticket = index;
  });
}

function deleteTicket(editor) {
  if (editors.length <= 1) {
    return;
  }

  const index = editors.indexOf(editor);

  if (index === -1) {
    return;
  }

  const [ticket] = tickets.splice(index, 1);
  editors.splice(index, 1);
  editor.remove();
  ticket.remove();

  normalizeEditorDividers();
  reflowTickets();
  refreshIndexes();
  setActiveTicket(-1);
  editors.forEach((_, ticketIndex) => renderTicket(ticketIndex));
  updateSheetScale();
}

function updateEditorSummary(editor) {
  const summary = editor.querySelector(".form-summary");
  const projectSelect = editor.querySelector("[data-field='project']");

  if (!summary || !projectSelect) {
    return;
  }

  summary.textContent = getProjectName(editor);
}

function applyProjectDefaultPackage(editor) {
  const projectSelect = editor.querySelector("[data-field='project']");
  const packageInput = editor.querySelector("[data-field='package']");

  if (!projectSelect || !packageInput) {
    return;
  }

  packageInput.value = projects[projectSelect.value].defaultPackage;
}

function applyProjectDefaultName(editor) {
  const projectSelect = editor.querySelector("[data-field='project']");

  if (!projectSelect) {
    return;
  }

  setProjectName(editor, projects[projectSelect.value].label);
}

function getStorageKey(tab = activeTab) {
  return `${storagePrefix}:${tab}`;
}

function getProjectQrs() {
  return Object.fromEntries(
    Object.entries(projects).map(([key, project]) => [key, project.qr]),
  );
}

function applyProjectQrs(qrs = defaultProjectQrs) {
  Object.entries(projects).forEach(([key, project]) => {
    project.qr = qrs[key] && qrs[key] !== "./assets/qr-code.png" ? qrs[key] : defaultProjectQrs[key];
  });
}

function getDefaultList() {
  return [createDefaultState(0), createDefaultState(1)];
}

function saveActiveTab() {
  const data = {
    tickets: editors.map(getEditorState),
    qrs: getProjectQrs(),
  };

  localStorage.setItem(getStorageKey(), JSON.stringify(data));
  localStorage.setItem(activeTabKey, activeTab);
}

function saveActiveTabFields() {
  const stored = loadStoredTab(activeTab);
  const ticketsToSave = stored.tickets.map((state, index) => {
    if (!editors[index]) {
      return state;
    }

    return getEditorState(editors[index]);
  });

  localStorage.setItem(
    getStorageKey(),
    JSON.stringify({
      tickets: ticketsToSave,
      qrs: getProjectQrs(),
    }),
  );
  localStorage.setItem(activeTabKey, activeTab);
}

function loadStoredTab(tab) {
  const raw = localStorage.getItem(getStorageKey(tab));

  if (!raw) {
    return {
      tickets: getDefaultList(),
      qrs: defaultProjectQrs,
    };
  }

  try {
    const data = JSON.parse(raw);

    return {
      tickets: Array.isArray(data.tickets) && data.tickets.length ? data.tickets : getDefaultList(),
      qrs: data.qrs || defaultProjectQrs,
    };
  } catch {
    return {
      tickets: getDefaultList(),
      qrs: defaultProjectQrs,
    };
  }
}

function setActiveTab(tab) {
  activeTab = tab;
  localStorage.setItem(activeTabKey, activeTab);

  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === activeTab);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function createSheet() {
  const sheet = document.createElement("article");
  sheet.className = "sheet";
  sheet.setAttribute("aria-label", "Лист A4 с двумя ценниками");
  sheet.innerHTML = `
    <div class="sheet-art">
      <section class="tickets">
        <img class="cut-mark" src="./assets/cut-mark.svg" alt="" aria-hidden="true" />
      </section>
    </div>
  `;
  preview.insertBefore(sheet, document.querySelector(".preview-actions"));
  return sheet;
}

function getSheetForTicket(index) {
  const sheetIndex = Math.floor(index / 2);
  const sheets = Array.from(document.querySelectorAll(".sheet"));

  while (sheets.length <= sheetIndex) {
    sheets.push(createSheet());
  }

  return sheets[sheetIndex];
}

function updateSheetScale() {
  const sheetCount = document.querySelectorAll(".sheet").length;
  const mmToPx = 96 / 25.4;
  const baseSheetWidth = 297 * mmToPx;
  const maxSheetsPerRow = 2;
  const sheetsInRow = Math.min(sheetCount, maxSheetsPerRow);
  const rowCount = Math.ceil(sheetCount / maxSheetsPerRow);
  const columnGap = 24;
  const availableWidth = window.innerWidth - editorPanel.offsetWidth - 96;
  const rowScale = (availableWidth - columnGap * Math.max(0, sheetsInRow - 1)) / (baseSheetWidth * sheetsInRow);
  const maxScale = sheetCount === 1 ? 0.8 : 0.56;
  const scale = Math.max(0.42, Math.min(maxScale, rowScale));

  preview.style.setProperty("--sheet-scale", scale.toFixed(3));
  preview.style.setProperty("--sheet-columns", String(sheetsInRow || 1));
  preview.style.setProperty("--preview-align-content", rowCount <= 1 ? "center" : "start");
}

function attachEditor(editor, index) {
  setEditorIndex(editor, index);
  editor.classList.toggle("collapsed", index > 0);
  updateEditorToggle(editor);
  applyProjectDefaultPackage(editor);

  editor.querySelectorAll("[data-field='price'], [data-field='oldPrice']").forEach((input) => {
    input.addEventListener("input", () => {
      formatPriceInput(input);
    });
  });

  editor.addEventListener("input", () => {
    if (!editor.classList.contains("collapsed")) {
      setActiveTicket(editors.indexOf(editor));
    }

    renderTicket(editors.indexOf(editor));
    saveActiveTabFields();
  });
  editor.addEventListener("change", () => {
    if (!editor.classList.contains("collapsed")) {
      setActiveTicket(editors.indexOf(editor));
    }

    updateEditorSummary(editor);
    renderTicket(editors.indexOf(editor));
    saveActiveTabFields();
  });
  editor.addEventListener("click", () => {
    if (!editor.classList.contains("collapsed")) {
      setActiveTicket(editors.indexOf(editor));
    }
  });
  editor.addEventListener("focusin", () => {
    if (!editor.classList.contains("collapsed")) {
      setActiveTicket(editors.indexOf(editor));
    }
  });

  editor.querySelector("[data-field='project']").addEventListener("change", () => {
    applyProjectDefaultName(editor);
    applyProjectDefaultPackage(editor);
    updateEditorSummary(editor);
    renderTicket(editors.indexOf(editor));
    saveActiveTabFields();
  });

  editor.querySelector("[data-action='edit-project-name']").addEventListener("click", () => {
    const nextName = window.prompt("Название проекта", getProjectName(editor));

    if (nextName === null) {
      return;
    }

    setProjectName(editor, nextName);
    updateEditorSummary(editor);
    renderTicket(editors.indexOf(editor));
    saveActiveTabFields();
  });

  editor.querySelector("[data-action='pick-qr']").addEventListener("click", () => {
    editor.querySelector("[data-field='qr']").click();
  });

  editor.querySelector("[data-field='qr']").addEventListener("change", (event) => {
    const [file] = event.target.files;

    if (!file) {
      return;
    }

    const selectedProject = editor.querySelector("[data-field='project']").value;
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      projects[selectedProject].qr = reader.result;
      editors.forEach((_, ticketIndex) => renderTicket(ticketIndex));
      saveActiveTabFields();
    });

    reader.readAsDataURL(file);
  });
}

function attachTicket(ticket, index) {
  ticket.dataset.ticket = index;

  ticket.querySelectorAll("[contenteditable='true']").forEach((element) => {
    element.addEventListener("input", () => {
      const currentIndex = tickets.indexOf(ticket);
      const value = element.dataset.output === "title" ? element.innerText : element.textContent;
      syncEditableToEditor(currentIndex, element.dataset.output, value);
      renderTicket(currentIndex);
      saveActiveTabFields();
    });
  });
}

function addDividerBeforeControls() {
  const divider = document.createElement("div");
  divider.className = "divider";
  editorPanel.insertBefore(divider, panelActions);
}

function createTicketFromState(state, collapsed = true) {
  const index = editors.length;
  const editor = editorTemplate.cloneNode(true);
  const ticket = ticketTemplate.cloneNode(true);
  const sheet = getSheetForTicket(index);

  if (editors.length) {
    addDividerBeforeControls();
  }

  editorPanel.insertBefore(editor, panelActions);
  sheet.querySelector(".tickets").append(ticket);

  editors.push(editor);
  tickets.push(ticket);

  attachEditor(editor, index);
  setEditorState(editor, state);
  editor.classList.toggle("collapsed", collapsed);
  updateEditorToggle(editor);
  updateEditorSummary(editor);
  attachTicket(ticket, index);
  renderTicket(index);
  updateSheetScale();
}

function clearCurrentList() {
  editorPanel.querySelectorAll(".ticket-form, .divider").forEach((node) => node.remove());
  preview.querySelectorAll(".sheet").forEach((sheet) => sheet.remove());
  editors = [];
  tickets = [];
}

function loadTab(tab) {
  setActiveTab(tab);
  const data = loadStoredTab(tab);

  applyProjectQrs(data.qrs);
  clearCurrentList();
  data.tickets.forEach((state, index) => {
    createTicketFromState(state, true);
  });
  setActiveTicket(-1);
  updateSheetScale();
}

function resetActiveTab() {
  localStorage.removeItem(getStorageKey());
  loadTab(activeTab);
}

function addTicket() {
  createTicketFromState(createDefaultState(editors.length), true);
}

addTicketButton.addEventListener("click", addTicket);
saveListButton.addEventListener("click", () => {
  saveActiveTab();
  showToast("Список ценников сохранён. При следующем открытии он восстановится автоматически — добавлять заново не придётся.");
});
resetListButton.addEventListener("click", resetActiveTab);
window.addEventListener("resize", updateSheetScale);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.tab === activeTab) {
      return;
    }

    loadTab(button.dataset.tab);
  });
});

printButton.addEventListener("click", () => {
  window.print();
});

saveButton.addEventListener("click", () => {
  window.print();
});

loadTab(activeTab);
