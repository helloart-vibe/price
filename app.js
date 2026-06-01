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

function getEditorState(editor) {
  return {
    project: editor.querySelector("[data-field='project']").value,
    title: editor.querySelector("[data-field='title']").value,
    tech: editor.querySelector("[data-field='tech']").value,
    packageName: editor.querySelector("[data-field='package']").value,
    price: editor.querySelector("[data-field='price']").value,
    oldPrice: editor.querySelector("[data-field='oldPrice']").value,
    date: editor.querySelector("[data-field='date']").value,
    engineering: editor.querySelector("[data-field='engineering']:checked").value,
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

function renderTicket(index) {
  const editor = editors[index];
  const ticket = tickets[index];
  const state = getEditorState(editor);
  const project = projects[state.project];

  ticket.querySelector("[data-output='title']").innerHTML = renderMultiline(
    makeTwoLineTitle(state.title, project.label),
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
  editors.forEach((_, ticketIndex) => renderTicket(ticketIndex));
  updateSheetScale();
}

function updateEditorSummary(editor) {
  const summary = editor.querySelector(".form-summary");
  const projectSelect = editor.querySelector("[data-field='project']");

  if (!summary || !projectSelect) {
    return;
  }

  summary.textContent = projects[projectSelect.value].label;
}

function applyProjectDefaultPackage(editor) {
  const projectSelect = editor.querySelector("[data-field='project']");
  const packageInput = editor.querySelector("[data-field='package']");

  if (!projectSelect || !packageInput) {
    return;
  }

  packageInput.value = projects[projectSelect.value].defaultPackage;
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
  preview.append(sheet);
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
  const baseSheetHeight = 210 * mmToPx;
  const maxSheetsPerRow = 2;
  const sheetsInRow = Math.min(sheetCount, maxSheetsPerRow);
  const rowCount = Math.ceil(sheetCount / maxSheetsPerRow);
  const columnGap = 24;
  const rowGap = 42;
  const availableHeight = window.innerHeight - 126;
  const availableWidth = window.innerWidth - editorPanel.offsetWidth - 96;
  const rowScale = (availableWidth - columnGap * Math.max(0, sheetsInRow - 1)) / (baseSheetWidth * sheetsInRow);
  const heightScale = (availableHeight - rowGap * Math.max(0, rowCount - 1)) / (baseSheetHeight * rowCount);
  const maxScale = sheetCount === 1 ? 0.8 : 0.56;
  const scale = Math.max(0.28, Math.min(maxScale, rowScale, heightScale));

  preview.style.setProperty("--sheet-scale", scale.toFixed(3));
  preview.style.setProperty("--preview-justify", sheetCount === 1 ? "center" : "flex-start");
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

  editor.addEventListener("input", () => renderTicket(editors.indexOf(editor)));
  editor.addEventListener("change", () => {
    updateEditorSummary(editor);
    renderTicket(editors.indexOf(editor));
  });

  editor.querySelector("[data-field='project']").addEventListener("change", () => {
    applyProjectDefaultPackage(editor);
    updateEditorSummary(editor);
    renderTicket(editors.indexOf(editor));
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
    });
  });
}

function addDividerBeforeControls() {
  const divider = document.createElement("div");
  divider.className = "divider";
  editorPanel.insertBefore(divider, addTicketButton);
}

function addTicket() {
  const index = editors.length;
  const editor = editorTemplate.cloneNode(true);
  const ticket = ticketTemplate.cloneNode(true);
  const sheet = getSheetForTicket(index);

  addDividerBeforeControls();
  editorPanel.insertBefore(editor, addTicketButton);
  sheet.querySelector(".tickets").append(ticket);

  editors.push(editor);
  tickets.push(ticket);

  attachEditor(editor, index);
  editor.classList.add("collapsed");
  updateEditorToggle(editor);
  attachTicket(ticket, index);
  renderTicket(index);
  updateSheetScale();
}

editors.forEach((editor, index) => attachEditor(editor, index));
tickets.forEach((ticket, index) => attachTicket(ticket, index));

addTicketButton.addEventListener("click", addTicket);
window.addEventListener("resize", updateSheetScale);

printButton.addEventListener("click", () => {
  window.print();
});

saveButton.addEventListener("click", () => {
  window.print();
});

editors.forEach((_, index) => renderTicket(index));
updateSheetScale();
