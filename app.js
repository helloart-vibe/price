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
  included: "входит полный пакет <u>инженерных коммуникаций</u>.",
  extra: "<u>инженерные коммуникации</u> можно заказать дополнительно",
};

const editors = Array.from(document.querySelectorAll("[data-ticket-editor]"));
const tickets = Array.from(document.querySelectorAll("[data-ticket]"));
const projectLabels = Array.from(document.querySelectorAll("[data-output='project-label']"));
const printButton = document.querySelector("#printButton");

function getEditorState(editor) {
  return {
    project: editor.querySelector("[data-field='project']").value,
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

function renderTicket(index) {
  const editor = editors[index];
  const ticket = tickets[index];
  const state = getEditorState(editor);
  const project = projects[state.project];

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
  projectLabels[index].textContent = project.label;

  fitText(ticket);
}

function fitText(ticket) {
  requestAnimationFrame(() => {
    [
      { element: ticket.querySelector(".tech-pill"), max: 33, min: 18 },
      { element: ticket.querySelector(".package-pill"), max: 15, min: 10 },
      { element: ticket.querySelector(".engineering-line"), max: 12, min: 7 },
      { element: ticket.querySelector(".date-line"), max: 12, min: 7 },
      { element: ticket.querySelector(".price-line strong"), max: 95, min: 52 },
      { element: ticket.querySelector(".old-price-line strong"), max: 57, min: 32 },
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

  input.value = outputName === "package" ? cleanPackage(value) : value.trim();
}

editors.forEach((editor, index) => {
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
      syncEditableToEditor(index, element.dataset.output, element.textContent);
      renderTicket(index);
    });
  });
});

printButton.addEventListener("click", () => {
  window.print();
});

editors.forEach((_, index) => renderTicket(index));
