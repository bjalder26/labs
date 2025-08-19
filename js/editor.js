import { startEditor } from "./editor-main.js";

async function handleLogin() {
  const password = document.getElementById('password-input').value;
  if (password === 'nwchem') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('editor-container').style.display = 'flex';
    startEditor();
  } else {
    alert('Incorrect password.');
  }
}

document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('password-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('password-input').focus();
});

function updatePreview() {
  const previewFrame = document.getElementById("preview-frame");
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  doc.open();
  doc.write(editor.state.doc.toString());
  doc.close();
}
