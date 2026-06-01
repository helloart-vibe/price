const projects = {
  "dobrynya-m2": {
    label: "Добрыня М2",
    qr: "./assets/dobrynya-m2.png",
    defaultPackage: "Жилой дом. Утепление 200",
    defaultTitle: "Одноэтажный коттедж",
  },
  "ohotnik-3": {
    label: "Охотник 3",
    qr: "./assets/ohotnik-3.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Одноэтажный коттедж",
  },
  "dobrynya-5": {
    label: "Добрыня 5",
    qr: "./assets/dobrynya-5.png",
    defaultPackage: "Жилой дом. Утепление 200",
    defaultTitle: "Одноэтажный коттедж",
  },
  "vityaz-3": {
    label: "Витязь 3",
    qr: "./assets/vityaz-3.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Одноэтажный коттедж",
  },
  "vityaz-m6": {
    label: "Витязь М6",
    qr: "./assets/vityaz-m6.png",
    defaultPackage: "Теплый контур",
    defaultTitle: "Одноэтажный коттедж",
  },
  "barn-5": {
    label: "Барн 5",
    qr: "./assets/barn-5.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Одноэтажный коттедж",
  },
  "lira-4": {
    label: "Лира 4",
    qr: "./assets/lira-4.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Одноэтажный коттедж",
  },
  "akvarel-4": {
    label: "Акварель 4",
    qr: "./assets/akvarel-4.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Одноэтажный коттедж",
  },
  "riviera-2": {
    label: "Ривьера 2",
    qr: "./assets/riviera-2.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Двухэтажный коттедж",
  },
  "nord-5": {
    label: "Норд 5",
    qr: "./assets/nord-5.png",
    defaultPackage: "Дачный стандарт",
    defaultTitle: "Двухэтажный коттедж",
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
const guideButton = document.querySelector("#guideButton");
const printButton = document.querySelector("#printButton");
const saveButton = document.querySelector("#saveButton");
const saveListButton = document.querySelector("#saveListButton");
const resetListButton = document.querySelector("#resetListButton");
const panelActions = document.querySelector(".panel-actions");
const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const toast = document.querySelector("#toast");
const saveGuide = document.querySelector("#saveGuide");
const guideText = saveGuide?.querySelector("[data-guide-text]");
const guideSpotlight = saveGuide?.querySelector("[data-guide-spotlight]");
const guideNextButton = saveGuide?.querySelector("[data-guide-next]");
const guideBackButton = saveGuide?.querySelector("[data-guide-back]");
const guideSkipButton = saveGuide?.querySelector("[data-guide-skip]");
const emptyState = document.createElement("p");
const storagePrefix = "terem-price-list";
const activeTabKey = `${storagePrefix}:active-tab`;
const zyablikovoEmptyMigrationKey = `${storagePrefix}:zyablikovo-empty-v1`;
const guideSeenKey = `${storagePrefix}:guide-seen-v1`;
const defaultProjectQrs = Object.fromEntries(
  Object.entries(projects).map(([key, project]) => [key, project.qr]),
);
let activeTab = localStorage.getItem(activeTabKey) || "salaryevo";
let toastTimer;
let activeTicketIndex = -1;
let guideStepIndex = 0;
let activeGuideTarget = null;

emptyState.className = "empty-state";
emptyState.textContent = "(пока пусто)";

if (!localStorage.getItem(zyablikovoEmptyMigrationKey)) {
  localStorage.removeItem(`${storagePrefix}:zyablikovo`);
  localStorage.setItem(zyablikovoEmptyMigrationKey, "1");
}

const guideSteps = [
  {
    selector: ".location-tabs",
    text: "Выберите ВК, для которого собираете ценники. У каждого ВК может быть свой сохранённый список.",
    card: "right",
  },
  {
    selector: ".ticket-form:first-of-type",
    text: "Ценники в левой панели раскрываются и сворачиваются. В раскрытом ценнике редактируются проект, QR-код, технология, комплектация, цены, дата и инженерка.",
    card: "right",
    prepare: () => {
      const firstEditor = editors[0];

      if (!firstEditor) {
        addTicket();
        return;
      }

      firstEditor.classList.remove("collapsed");
      updateEditorToggle(firstEditor);
      setActiveTicket(0);
    },
  },
  {
    selector: "#addTicketButton",
    text: "Добавьте ещё один ценник. Если ценников больше двух, автоматически появится новый лист A4.",
    card: "right",
  },
  {
    selector: "#saveListButton",
    text: "Сохраняйте список, чтобы в следующий раз не собирать ценники заново.",
    card: "right",
  },
  {
    selector: ".preview-actions",
    text: "Когда всё готово, распечатайте листы или сохраните их в PDF.",
    card: "top",
  },
];

function showSaveGuide(force = false) {
  if (!saveGuide || (!force && localStorage.getItem(guideSeenKey))) {
    return;
  }

  guideStepIndex = 0;
  document.body.classList.add("has-save-guide");
  saveGuide.classList.add("is-visible");
  renderGuideStep();
}

function hideSaveGuide(saveSeen = true) {
  if (!saveGuide) {
    return;
  }

  activeGuideTarget?.classList.remove("guide-target");
  activeGuideTarget = null;
  document.body.classList.remove("has-save-guide");
  saveGuide.classList.remove("is-visible");

  if (saveSeen) {
    localStorage.setItem(guideSeenKey, "1");
  }
}

function renderGuideStep() {
  const step = guideSteps[guideStepIndex];

  if (!step) {
    hideSaveGuide();
    return;
  }

  step.prepare?.();
  requestAnimationFrame(() => {
    const target = document.querySelector(step.selector);

    if (!target) {
      guideStepIndex += 1;
      renderGuideStep();
      return;
    }

    activeGuideTarget?.classList.remove("guide-target");
    activeGuideTarget = target;
    target.classList.add("guide-target");

    const rect = target.getBoundingClientRect();
    const padding = 8;
    const left = Math.max(8, rect.left - padding);
    const top = Math.max(8, rect.top - padding);
    const width = rect.width + padding * 2;
    const height = rect.height + padding * 2;
    const cardLeft = step.card === "right" ? rect.right + 28 : rect.left;
    const cardTop = step.card === "top" ? rect.top - 126 : rect.top + rect.height / 2 - 48;

    saveGuide.style.setProperty("--guide-left", `${left}px`);
    saveGuide.style.setProperty("--guide-top", `${top}px`);
    saveGuide.style.setProperty("--guide-width", `${width}px`);
    saveGuide.style.setProperty("--guide-height", `${height}px`);
    saveGuide.style.setProperty("--guide-radius", target.id === "saveListButton" ? "8px" : "12px");
    saveGuide.style.setProperty("--guide-card-left", `${Math.min(window.innerWidth - 214, Math.max(24, cardLeft))}px`);
    saveGuide.style.setProperty("--guide-card-top", `${Math.min(window.innerHeight - 160, Math.max(24, cardTop))}px`);
    saveGuide.style.setProperty("--guide-arrow-left", `${Math.max(24, rect.left + 20)}px`);
    saveGuide.style.setProperty("--guide-arrow-top", `${Math.max(24, rect.top - 118)}px`);
    saveGuide.style.setProperty("--guide-arrow-transform", "scale(0)");

    guideText.textContent = step.text;
    guideBackButton.hidden = guideStepIndex === 0;
    guideNextButton.textContent = guideStepIndex === guideSteps.length - 1 ? "Готово" : "Дальше";
  });
}

function previousGuideStep() {
  guideStepIndex = Math.max(0, guideStepIndex - 1);
  renderGuideStep();
}

function nextGuideStep() {
  guideStepIndex += 1;

  if (guideStepIndex >= guideSteps.length) {
    hideSaveGuide();
    return;
  }

  renderGuideStep();
}

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
  editor.querySelector("[data-field='title']").value =
    state.title === "Одноэтажный коттедж" && projects[state.project].defaultTitle !== "Одноэтажный коттедж"
      ? projects[state.project].defaultTitle
      : state.title;
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
    title: projects[project].defaultTitle,
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
  const index = editors.indexOf(editor);

  if (index === -1) {
    return;
  }

  const [ticket] = tickets.splice(index, 1);
  editors.splice(index, 1);
  editor.remove();
  ticket.remove();

  normalizeEditorDividers();

  if (!editors.length) {
    preview.querySelectorAll(".sheet").forEach((sheet) => sheet.remove());
    editorPanel.insertBefore(emptyState, panelActions);
    showBlankSheet();
    setActiveTicket(-1);
    updateSheetScale();
    return;
  }

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

function applyProjectDefaultTitle(editor) {
  const projectSelect = editor.querySelector("[data-field='project']");
  const titleInput = editor.querySelector("[data-field='title']");

  if (!projectSelect || !titleInput) {
    return;
  }

  titleInput.value = projects[projectSelect.value].defaultTitle;
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

function getDefaultList(tab = activeTab) {
  if (tab === "zyablikovo") {
    return [];
  }

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
  const defaultTickets = getDefaultList(tab);

  if (!raw) {
    return {
      tickets: defaultTickets,
      qrs: defaultProjectQrs,
    };
  }

  try {
    const data = JSON.parse(raw);

    return {
      tickets: Array.isArray(data.tickets) ? data.tickets : defaultTickets,
      qrs: data.qrs || defaultProjectQrs,
    };
  } catch {
    return {
      tickets: defaultTickets,
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

function showBlankSheet() {
  const sheet = createSheet();
  sheet.classList.add("is-empty");
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
    applyProjectDefaultTitle(editor);
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
  preview.querySelectorAll(".sheet.is-empty").forEach((sheet) => sheet.remove());
  emptyState.remove();

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
  emptyState.remove();
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

  if (!data.tickets.length) {
    editorPanel.insertBefore(emptyState, panelActions);
    showBlankSheet();
  }

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
guideButton.addEventListener("click", () => showSaveGuide(true));
saveListButton.addEventListener("click", () => {
  saveActiveTab();
  hideSaveGuide();
  showToast("Список ценников сохранён. При следующем открытии он восстановится автоматически — добавлять заново не придётся.");
});
resetListButton.addEventListener("click", resetActiveTab);
guideNextButton?.addEventListener("click", nextGuideStep);
guideBackButton?.addEventListener("click", previousGuideStep);
guideSkipButton?.addEventListener("click", () => hideSaveGuide());
saveGuide?.addEventListener("click", (event) => {
  if (event.target === saveGuide) {
    hideSaveGuide();
  }
});
window.addEventListener("resize", () => {
  updateSheetScale();

  if (saveGuide?.classList.contains("is-visible")) {
    renderGuideStep();
  }
});

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
showSaveGuide();
