const projects = {
  "dobrynya-m2": {
    label: "Добрыня М2",
    qr: "./assets/dobrynya-m2.png",
  },
  "ohotnik-3": {
    label: "Охотник 3",
    qr: "./assets/ohotnik-3.png",
  },
  "dobrynya-5": {
    label: "Добрыня 5",
    qr: "./assets/dobrynya-5.png",
  },
  "vityaz-3": {
    label: "Витязь 3",
    qr: "./assets/vityaz-3.png",
  },
  "vityaz-m6": {
    label: "Витязь М6",
    qr: "./assets/vityaz-m6.png",
  },
};

const engineeringText = {
  included: "Входит полный пакет инженерных коммуникаций.",
  extra: "Инженерные коммуникации можно заказать дополнительно",
};

const editors = Array.from(document.querySelectorAll("[data-ticket-editor]"));
const tickets = Array.from(document.querySelectorAll("[data-ticket]"));
const printButton = document.querySelector("#printButton");

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
  const formatted = formatPrice(input.value);
  input.value = formatted;
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

editors.forEach((editor, index) => {
  editor.querySelectorAll("[data-field='price'], [data-field='oldPrice']").forEach((input) => {
    input.addEventListener("input", () => {
      formatPriceInput(input);
    });
  });

  editor.addEventListener("input", () => renderTicket(index));
  editor.addEventListener("change", () => renderTicket(index));

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
});

tickets.forEach((ticket, index) => {
  ticket.querySelectorAll("[contenteditable='true']").forEach((element) => {
    element.addEventListener("input", () => {
      const value = element.dataset.output === "title" ? element.innerText : element.textContent;
      syncEditableToEditor(index, element.dataset.output, value);
      renderTicket(index);
    });
  });
});

printButton.addEventListener("click", () => {
  window.print();
});

editors.forEach((_, index) => renderTicket(index));
