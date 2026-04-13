import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { html } from "https://esm.sh/@codemirror/lang-html";
import { EditorState } from "https://esm.sh/@codemirror/state";

let editor;

export function startEditor() {
  initEditor();
  loadFileList();

  const buttonActions = {
    'data-form': showDataForm,
    'answer-form': showAnswerForm,
    'insert-header': insertHeader,
    'insert-table': showTableForm,
    'insert-footer-graded': insertFooterGraded,
    'insert-footer-grade-submitted': insertFooterGradeSubmitted,
    'insert-ul': insertUnorderedList,
    'insert-ol': insertOrderedList,
    'insert-ai-question': showAIQuestionForm,
    'insert-open-ended': showOpenEndedForm,
    'insert-symbol': showSymbolForm,
    'insert-subscript': showSubscriptForm,
    'insert-hidden': insertHidden,
    'insert-dropdown': showDropdownForm,
    'insert-lookup-system': showLookupForm,
    'insert-linear-graph-system': showLinearGraphForm,
    'insert-image': showImageUploadForm
  };

  document.getElementById('file-selector').addEventListener('change', loadSelectedFile);
  document.getElementById('save-file').addEventListener('click', saveFile);
  document.getElementById('new-file').addEventListener('click', createNewFile);
  document.getElementById('commit').addEventListener('click', commit);

  // Call this after you populate the file list
document.getElementById("file-selector").addEventListener("change", () => {
  const selector = document.getElementById("file-selector");
  const selectedValue = selector.value;

  // Enable/disable all buttons based on whether a real file is selected
  const allButtons = document.querySelectorAll("button[data-action], #save-file, #new-file, #commit");
  allButtons.forEach(button => {
    button.disabled = (selectedValue === "" || selectedValue === null);
  });

  // Only load a file if it's not the default option
  if (selectedValue) {
    loadSelectedFile();
  }
});

// Initial check: disable all buttons at start
document.querySelectorAll("button[data-action], #save-file, #new-file, #commit")
  .forEach(button => button.disabled = true);


  document.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;

      if (!buttonActions.hasOwnProperty(action)) {
        console.warn(`No handler for action: ${action}`);
        return;
      }

      try {
        await buttonActions[action](); // call the mapped function
      } catch (err) {
        console.error(`Error executing action ${action}:`, err);
      }
    });
  });






}

function showTableForm() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>
      Headers:
      <input type="checkbox" name="headers" checked>
    </label><br>

    <label>
      Rows:
      <input type="number" name="rows" min="1" value="2" required>
    </label><br>

    <label>
      Columns:
      <input type="number" name="cols" min="1" value="2" required>
    </label><br>

    <button type="submit">Insert Table</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  // Styling to center the form
  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const headers = formData.get("headers") === "on";
    const rows = parseInt(formData.get("rows"));
    const cols = parseInt(formData.get("cols"));

    let tableHTML = "<table border='1'>\n";

    if (headers) {
      tableHTML += "  <thead>\n    <tr>\n";
      for (let c = 0; c < cols; c++) {
        tableHTML += `      <th>Header ${c+1}</th>\n`;
      }
      tableHTML += "    </tr>\n  </thead>\n";
    }

    tableHTML += "  <tbody>\n";
    for (let r = 0; r < rows; r++) {
      tableHTML += "    <tr>\n";
      for (let c = 0; c < cols; c++) {
        tableHTML += "      <td></td>\n";
      }
      tableHTML += "    </tr>\n";
    }
    tableHTML += "  </tbody>\n</table>\n";

    insertTextAtCursor(tableHTML);
    form.remove();
  });
}

let previewTimeout;

function updatePreview() {
  clearTimeout(previewTimeout);

  previewTimeout = setTimeout(() => {
    const previewFrame = document.getElementById("preview-frame");
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;

    const blockerScript = `
      <script>
        (function () {
          HTMLFormElement.prototype.requestSubmit = function () {};
          HTMLFormElement.prototype.submit = function () {};
          document.addEventListener("submit", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }, true);
        })();
      <\/script>
    `;

    let html = editor.state.doc.toString();

    // Inject blocker
    html = html.replace(/<head([^>]*)>/i, `<head$1>${blockerScript}`);

    doc.open();
    doc.write(html);
    doc.close();

    const win = previewFrame.contentWindow;

    // Wait for MathJax, then render smoothly
    function waitForMathJax(callback) {
      const check = () => {
        if (win.MathJax && win.MathJax.Hub) {
          callback();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    }

    waitForMathJax(() => {
      try {
        const MJ = win.MathJax.Hub;

        // 🔥 Stop any ongoing processing
        MJ.Cancel();

        // Clear previous math completely
        MJ.Queue(["Reset", MJ]);

        // Now safely typeset
        MJ.Queue(["Reprocess", MJ, win.document.body]);

      } catch (e) {
        console.log("MathJax render error:", e);
      }
    });


  }, 500); // debounce delay
}

/*
function updatePreview() {
  const previewFrame = document.getElementById("preview-frame");
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;

  const blockerScript = `
    <script>
      (function () {
        console.log("Preview mode: autosave disabled");

        HTMLFormElement.prototype.requestSubmit = function () {
          console.log("Blocked requestSubmit");
        };

        HTMLFormElement.prototype.submit = function () {
          console.log("Blocked submit");
        };

        document.addEventListener(
          "submit",
          function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("Blocked submit event");
          },
          true
        );
      })();
    <\/script>
  `;

  let html = editor.state.doc.toString();

  // ✅ Inject right after <head>
  html = html.replace(/<head([^>]*)>/i, `<head$1>${blockerScript}`);

  doc.open();
  doc.write(html);
  doc.close();
}
*/
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

      // Add the default "Select a file" option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a file";
      defaultOption.selected = true;
      defaultOption.disabled = true; // optional: prevent selecting again
      selector.appendChild(defaultOption);

      if (!Array.isArray(files) || files.length === 0) {
        const noFilesOption = document.createElement("option");
        noFilesOption.disabled = true;
        noFilesOption.textContent = "No files found";
        selector.appendChild(noFilesOption);
        return;
      }

      files.forEach(file => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file;
        selector.appendChild(option);
      });

      // Do NOT auto-load the first file anymore
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
    updatePreview();
    selector.value = trimmedFileName;

  } catch (err) {
    alert("Error creating file: " + err.message);
    console.error(err);
  }
}

function commit() {
  // 1. Get the file info from your editor
  const pageName = document.getElementById("file-selector").value;
  
  // 3. Send to your server
  fetch('/commit-to-github', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pageName
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.prUrl) {
      alert(`PR created/updated: ${data.prUrl}`);
    } else {
      alert('File committed successfully!');
    }
  })
  .catch(err => {
    console.error(err);
    alert('Error committing file. Check console.');
  });
}

  async function insertSnippet(name) {
    try {
      const response = await fetch(`/html/${name}.html`);
      if (!response.ok) throw new Error("Failed to load snippet");
      const snippet = await response.text();
      insertTextAtCursor(snippet);
    } catch (err) {
      console.error(`Error inserting snippet ${name}:`, err);
    }
  }

    // Example mapping functions for snippets
  function insertHeader() {
    return insertSnippet('header');
  }

  function insertFooterGraded() {
    return insertSnippet('footer-graded');
  }

  function insertFooterGradeSubmitted() {
    return insertSnippet('footer-grade-submitted');
  }

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
      <input type="checkbox" name="num" checked>
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
    const num = formData.get("num") !== null;
    const id = formData.get("id");
    const formula = formData.get("formula") || "";
    const help = formData.get("help") || "";

    const classList = num ? "num calc" : "calc";
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

function insertUnorderedList() {
  const ulHTML = `<ul>\n  <li>Item 1</li>\n</ul>\n`;
  insertTextAtCursor(ulHTML);
}

function insertOrderedList() {
  const olHTML = `<ol>\n  <li>Item 1</li>\n</ol>\n`;
  insertTextAtCursor(olHTML);
}

function showAIQuestionForm() {
  const form = document.createElement("form");

  form.innerHTML = `
    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <label>Grading criteria:
      <textarea name="criteria" rows="4" cols="40" required></textarea>
    </label><br>

    <label>Maximum score:
      <input type="number" name="max" min="1" value="5" required>
    </label><br>

    <button type="submit">Insert AI Question</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  // Center the form
  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);
  form.querySelector("input[name='id']").focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const id = formData.get("id").trim();
    const criteria = formData.get("criteria").trim();
    const max = formData.get("max").trim();

    if (!id) return alert("ID is required!");

    const aiHTML = `
<textarea 
 class="AI text essay" 
 id="${id}"
 name="${id}"
 data-correct="${criteria}"
 placeholder="Type your answer here...">
</textarea>
<button type="button" id="${id}Button">Submit Answer for Grading and Feedback</button>
<input 
 type="text" 
 class="aiScore" 
 id="${id}AiScore" 
 name="${id}AiScore" 
 readonly> / <div class="aiMax" id="${id}AiMax" name="${id}AiMax">${max}</div>
`;

    insertTextAtCursor(aiHTML);
    form.remove();
  });
}

function showOpenEndedForm() {
  const form = document.createElement("form");

  form.innerHTML = `
    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <button type="submit">Insert Open-Ended Question</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  // Center the form
  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);
  form.querySelector("input[name='id']").focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = form.querySelector("input[name='id']").value.trim();
    if (!id) return alert("ID is required!");

    const openEndedHTML = `<textarea class="text essay" id="${id}" name="${id}"></textarea>\n`;

    insertTextAtCursor(openEndedHTML);
    form.remove();
  });
}

function showSymbolForm() {
  const form = document.createElement("form");

  form.innerHTML = `
    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <label>Formula:
      <input type="text" name="formula" placeholder="e.g., 12C+">
    </label><br>

    <label>Help:
      <input type="text" name="help" placeholder="Type instructions for students">
    </label><br>

    <button type="submit">Insert Symbol</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);
  form.querySelector("input[name='id']").focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = form.querySelector("input[name='id']").value.trim();
    const formula = form.querySelector("input[name='formula']").value.trim();
    const help = form.querySelector("input[name='help']").value.trim();

    if (!id) return alert("ID is required!");

    const inputHTML = `<input type="text" class="calc symbol" id="${id}" name="${id}"` +
                      `${formula ? ` formula="${formula}"` : ""}` +
                      `${help ? ` help="${help}"` : ""} />\n` +
                      `<div id="${id}DIV"></div>\n`;

    insertTextAtCursor(inputHTML);
    form.remove();
  });
}

function showSubscriptForm() {
  const form = document.createElement("form");

  form.innerHTML = `
    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <label>Formula:
      <input type="text" name="formula" placeholder="e.g., H2O">
    </label><br>

    <label>Help:
      <input type="text" name="help" placeholder="Instructions for students">
    </label><br>

    <button type="submit">Insert Subscript Input</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);
  form.querySelector("input[name='id']").focus();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = form.querySelector("input[name='id']").value.trim();
    const formula = form.querySelector("input[name='formula']").value.trim();
    const help = form.querySelector("input[name='help']").value.trim();

    if (!id) return alert("ID is required!");

    const inputHTML = `<input type="text" step="any" class="calc sub" id="${id}" name="${id}"` +
                      `${formula ? ` formula="${formula}"` : ""}` +
                      `${help ? ` help="${help}"` : ""} />\n` +
                      `<div id="${id}DIV"></div>\n` +
                      `<div class="feedback" id="${id}FB" name="${id}FB"></div>\n`;

    insertTextAtCursor(inputHTML);
    form.remove();
  });
}

function insertHidden() {
  const hiddenHTML = `<div style="display: none" class="hidden">Put your hidden text here</div>`;
  insertTextAtCursor(hiddenHTML);
}

function showDropdownForm() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>ID:
      <input type="text" name="id" required>
    </label><br>

    <label>Formula:
      <input type="text" name="formula">
    </label><br>

    <label>Help:
      <input type="text" name="help">
    </label><br>

    <button type="submit">Insert Dropdown</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  Object.assign(form.style, {
    position: "fixed",
    top: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fff",
    padding: "1em",
    border: "1px solid #ccc",
    zIndex: 1000
  });

  document.body.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const id = formData.get("id");
    const formula = formData.get("formula") || "";
    const help = formData.get("help") || "";

    const dropdownHTML = `
<select id="${id}" name="${id}" class="calc" formula="${formula}" help="${help}">
  <option value="">Choose an option</option>
  <option value="Choice1">Choice1</option>
</select>
<div class="feedback" id="${id}FB" name="${id}FB"></div>
`;

    insertTextAtCursor(dropdownHTML);
    form.remove();
  });

  form.querySelector("input[name='id']").focus();
}

function showLookupForm() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>
      Base ID:
      <input type="text" name="baseId" placeholder="e.g., labTemp" required>
    </label><br>

    <label>
      Table ID:
      <input type="text" name="tableId" placeholder="e.g., Density of Water Table" required>
    </label><br>

    <label>
      Headers:
      <input type="checkbox" name="headers" checked>
    </label><br>

    <label>
      Rows:
      <input type="number" name="rows" min="1" value="3" required>
    </label><br>

    <button type="submit">Insert Lookup System</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  // Same styling as your table form
  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const baseId = formData.get("baseId").trim();
    const tableId = formData.get("tableId").trim();
    const headers = formData.get("headers") === "on";
    const rows = parseInt(formData.get("rows"));

    if (!baseId || !tableId) {
      alert("Please fill out all fields.");
      return;
    }

    // Build table (ALWAYS 2 columns)
    let tableHTML = `<table id="${tableId}" name="${tableId}">\n`;

    if (headers) {
      tableHTML += "  <thead>\n    <tr>\n";
      tableHTML += "      <th>X Value</th>\n";
      tableHTML += "      <th>Y Value</th>\n";
      tableHTML += "    </tr>\n  </thead>\n";
    }

    tableHTML += "  <tbody>\n";
    for (let r = 0; r < rows; r++) {
      tableHTML += "    <tr>\n";
      tableHTML += "      <td></td>\n";
      tableHTML += "      <td></td>\n";
      tableHTML += "    </tr>\n";
    }
    tableHTML += "  </tbody>\n</table>\n";

    // Full system HTML
    const fullHTML = `
<!-- Lookup Input -->
<input
  type="number"
  class="lookup num"
  id="${baseId}"
  name="${baseId}"
/>

<!-- Lookup Value -->
<input
  type="number"
  step="any"
  class="lookupValue"
  id="${baseId}LV"
  name="${baseId}LV"
  tableID="${tableId}"
/>

<!-- Calculated Answer -->
<input
  type="number"
  step="any"
  class="calc num"
  id="${baseId}Calc"
  name="${baseId}Calc"
  formula="\${${baseId}LV}"
  help="Use the table to find the correct value."
/>

<div
  class="feedback"
  id="${baseId}CalcFB"
  name="${baseId}CalcFB"
></div>

${tableHTML}
`;

    insertTextAtCursor(fullHTML);
    form.remove();
  });
}

function showLinearGraphForm() {
  const form = document.createElement("form");
  form.innerHTML = `
    <label>
      Base ID:
      <input type="text" name="baseId" placeholder="e.g., borax" required>
    </label><br>

    <label>
      X-Axis Label:
      <input type="text" name="xLabel" placeholder="e.g., 1/T" required>
    </label><br>

    <label>
      Y-Axis Label:
      <input type="text" name="yLabel" placeholder="e.g., ln(Ksp)" required>
    </label><br>

    <label>
      Number of Rows:
      <input type="number" name="rows" min="2" value="4" required>
    </label><br>

    <label>
      Order:
      <select name="order">
        <option value="desc" selected>Descending (n → 1)</option>
        <option value="asc">Ascending (1 → n)</option>
      </select>
    </label><br>

    <label>
      Graph Title:
      <input type="text" name="title" placeholder="e.g., Natural log of Ksp vs 1/T" required>
    </label><br>

    <button type="submit">Insert Graph</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 1000
  });

  document.body.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const baseId = formData.get("baseId").trim();
    const xLabel = formData.get("xLabel");
    const yLabel = formData.get("yLabel");
    const rows = parseInt(formData.get("rows"));
    const order = formData.get("order");
    const title = formData.get("title");

    if (!baseId || !xLabel || !yLabel || !title) {
      alert("Please fill out all fields.");
      return;
    }

    let rowHTML = "";

    for (let i = 0; i < rows; i++) {
      const index = order === "desc" ? (rows - i) : (i + 1);

      rowHTML += `
    <tr>
      <td>
        <input type="number" step="any" class="${baseId} graph num" id="x${index}" name="x${index}">
      </td>
      <td>
        <input type="number" step="any" class="${baseId} graph num" id="y${index}" name="y${index}">
      </td>
    </tr>`;
    }

    const html = `
<table>
  <tr>
    <th><label id="${baseId} x-axis">${xLabel}</label></th>
    <th><label id="${baseId} y-axis">${yLabel}</label></th>
  </tr>
  ${rowHTML}
</table>

<div class="canvas centered">
  <canvas id="${baseId} graph" onclick="updateGraph('${baseId} graph')" title="${title}"></canvas>
</div><br>

<div class="centered">
  Formula for the best fit line: y =&nbsp;
  <div class="num" id="${baseId} slope"></div>
  x&nbsp;<label class="${baseId} plus">&nbsp;+&nbsp;</label>
  <div class="num" id="${baseId} intercept"></div>
</div><br>
`;

    insertTextAtCursor(html);
    form.remove();
  });
}

function showImageUploadForm() {
  const form = document.createElement("form");

  form.innerHTML = `
    <label>
      Select Image:
      <input type="file" name="image" accept="image/*" required>
    </label><br>

    <label>
      File Name:
      <input type="text" name="fileName" placeholder="Leave blank to use original name">
    </label><br>

    <button type="submit">Upload</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;

  Object.assign(form.style, {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '1em',
    border: '1px solid #ccc',
    zIndex: 2000
  });

  document.body.appendChild(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    let res = await fetch('/upload-editor-image', {
      method: 'POST',
      body: formData
    });

    let data = await res.json();

    // ⚠️ file exists → ask before overwrite
    if (data.exists) {
      const confirmOverwrite = confirm(`${data.fileName} already exists. Overwrite it?`);
      if (!confirmOverwrite) return;

      formData.append("overwrite", "true");

      res = await fetch('/upload-editor-image', {
        method: 'POST',
        body: formData
      });

      data = await res.json();
    }

    if (data.success) {
      const imgTag = `<img src="/images/${data.fileName}">\n`;
      insertTextAtCursor(imgTag);
      form.remove();
    } else {
      alert(data.message || "Upload failed");
    }
  });
}