import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { html } from "https://esm.sh/@codemirror/lang-html";
import { EditorState } from "https://esm.sh/@codemirror/state";

let editor;

export function startEditor() {
  initEditor();
  loadFileList();

  document.getElementById('open-file').addEventListener('click', loadSelectedFile);
  document.getElementById('save-file').addEventListener('click', saveFile);
  document.getElementById('new-file').addEventListener('click', createNewFile);

  document.querySelectorAll("button[id^='insert-']").forEach((button) => {
  button.addEventListener("click", async () => {
    const snippetName = button.id.replace(/^insert-/, ''); // "variable", "div", etc.
    try {
      const response = await fetch(`/html/${snippetName}.html`);
      if (!response.ok) throw new Error("Failed to load snippet");
      const snippet = await response.text();
      insertTextAtCursor(snippet);
    } catch (err) {
      console.error("Error inserting snippet:", err);
    }
  });
});

  document.querySelectorAll("button[id^='form-']").forEach((button) => {
  button.addEventListener("click", () => {
    const formType = button.id.replace(/^form-/, '');
    if (formGenerators.hasOwnProperty(formType)) {
      formGenerators[formType](); // Show appropriate form logic
    } else {
      console.warn(`No form generator for type: ${formType}`);
    }
  });
});

const formGenerators = {
  data: showDataForm,
  answer: showAnswerForm
};

// begin  show data form

function showDataForm() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>Type:
      <select name="type">
        <option value="number" selected>number</option>
        <option value="text">text</option>
      </select>
    </label><br>

    <label>Step:
      <select name="step">
        <option value="any" selected>any</option>
        <option value="1">1</option>
        <option value="0.1">0.1</option>
        <option value="0.01">0.01</option>
        <option value="0.001">0.001</option>
        <option value="0.0001">0.0001</option>
      </select>
    </label><br>

    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <button type="submit">Insert</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  form.style.position = "fixed";
  form.style.top = "20%";
  form.style.left = "50%";
  form.style.transform = "translateX(-50%)";
  form.style.background = "#fff";
  form.style.padding = "1em";
  form.style.border = "1px solid #ccc";
  form.style.zIndex = 1000;

  document.body.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const type = formData.get("type");
    const step = formData.get("step");
    const id = formData.get("id");

    let input = `<input type="${type}"${type === "number" ? ` step="${step}"` : ""} class="num" id="${id}" name="${id}">`;

    insertTextAtCursor(input);
    form.remove();
  });
  form.querySelector("input[name='id']").focus();
}


// end show data form 

// beginning of show answer form
function showAnswerForm() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>Type:
      <select name="type">
        <option value="number" selected>number</option>
        <option value="text">text</option>
      </select>
    </label><br>

    <label>Step:
      <select name="step">
        <option value="any" selected>any</option>
        <option value="1">1</option>
        <option value="0.1">0.1</option>
        <option value="0.01">0.01</option>
        <option value="0.001">0.001</option>
        <option value="0.0001">0.0001</option>
      </select>
    </label><br>

    <label>
      <input type="checkbox" name="calc" checked>
      Used for other answers
    </label><br>

    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <label>Formula:
      <input type="text" name="formula">
    </label><br>

    <label>Help:
      <input type="text" name="help">
    </label><br>

    <button type="submit">Insert</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  form.style.position = "fixed";
  form.style.top = "20%";
  form.style.left = "50%";
  form.style.transform = "translateX(-50%)";
  form.style.background = "#fff";
  form.style.padding = "1em";
  form.style.border = "1px solid #ccc";
  form.style.zIndex = 1000;

  document.body.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const type = formData.get("type");
    const step = formData.get("step");
    const calc = formData.get("calc") !== null;
    const id = formData.get("id");
    const formula = formData.get("formula") || "";
    const help = formData.get("help") || "";

    const classList = calc ? "num calc" : "num";
    let inputHTML = `<input type="${type}" class="${classList}" id="${id}" name="${id}"`;
    if (type === "number") {
      inputHTML += ` step="${step}"`;
    }
    if (formula) {
      inputHTML += ` formula="${formula}"`;
    }
    if (help) {
      inputHTML += ` help="${help}"`;
    }
    inputHTML += ">";

    const feedbackDiv = `<div class="feedback" id="${id}FB" name="${id}FB"></div>`;

    insertTextAtCursor(inputHTML + feedbackDiv);
    form.remove();
  });
  form.querySelector("input[name='id']").focus();
}

// end of show answer form

  function insertTextAtCursor(text) {
  const transaction = editor.state.update({
    changes: {
      from: editor.state.selection.main.from,
      to: editor.state.selection.main.to,
      insert: text
    }
  });
  editor.dispatch(transaction);
  editor.focus(); // Optional: re-focus the editor
}
}


function updatePreview() {
  const previewFrame = document.getElementById("preview-frame");
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  doc.open();
  doc.write(editor.state.doc.toString());
  doc.close();
}

function initEditor() {
  try {
    const editorElement = document.getElementById("editor");

    editor = new EditorView({
      state: EditorState.create({
        doc: "<!-- Your HTML here -->",
        extensions: [
          basicSetup,
          html(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              updatePreview();
            }
          })
        ]
      }),
      parent: editorElement
    });

    // Initial preview
    updatePreview();

  } catch (error) {
    console.error(error);
  }
}

function getLabFileList() {
  return fetch('/api/lab-files')
    .then(async res => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Server did not return valid JSON:", text);
        throw new Error("Invalid JSON from server");
      }
    });
}

function loadFileList() {
  getLabFileList()
    .then(files => {
      const selector = document.getElementById("file-selector");
      selector.innerHTML = '';

      if (!Array.isArray(files) || files.length === 0) {
        selector.innerHTML = '<option disabled selected>No files found</option>';
        return;
      }

      files.forEach(file => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file;
        selector.appendChild(option);
      });

      selector.selectedIndex = 0;
      loadSelectedFile(); // Load first file automatically
    })
    .catch(err => {
      alert("Failed to load file list.");
      console.error(err);
    });
}

function loadSelectedFile() {
  const filename = document.getElementById("file-selector").value;
  fetch(`/lab/${filename}`)
    .then(res => res.text())
    .then(content => {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: content }
      });
    })
    .catch(err => {
      alert("Failed to load file content.");
      console.error(err);
    });
}

function saveFile() {
  const filename = document.getElementById("file-selector").value;
  const content = editor.state.doc.toString();

  fetch('/api/save-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content })
  })
    .then(res => {
      if (!res.ok) throw new Error("Save failed");
      alert("File saved!");
    })
    .catch(err => {
      alert("Failed to save file.");
      console.error(err);
    });
}

// may want to update to fetch current list of 
async function createNewFile() {
  const newFileName = prompt("Enter name for the new file (e.g., example.html):");
  if (!newFileName || !newFileName.trim()) return;

  const trimmedFileName = newFileName.trim();

  try {
    const existingFiles = await getLabFileList();  // ← use existing function here
    if (existingFiles.includes(trimmedFileName)) {
      alert("A file with that name already exists.");
      return;
    }
console.log(trimmedFileName);
    // Create the file on the server
    const res = await fetch('/api/create-lab-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: trimmedFileName })
    });

    if (!res.ok) throw new Error("Failed to create file on server");

    // Add to dropdown
    const selector = document.getElementById("file-selector");
    const option = document.createElement("option");
    option.value = trimmedFileName;
    option.textContent = trimmedFileName;
    option.selected = true;
    selector.appendChild(option);

    // Clear editor and update preview
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: "" }
    });
    updatePreview("");
    selector.value = trimmedFileName;

  } catch (err) {
    alert("Error creating file: " + err.message);
    console.error(err);
  }
}

