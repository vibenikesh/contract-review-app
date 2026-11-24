const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const errorEl = document.getElementById('file-error');
const viewer = document.getElementById('pdf-viewer');
const removeBtn = document.getElementById('remove-btn');
const topbarFile = document.getElementById('topbar-file');
const uploadLabel = document.getElementById('upload-label');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const messages = document.getElementById('messages');

const WEBHOOK_URL = 'https://invnikesh.app.n8n.cloud/webhook-test/995a9d5c-de9b-4d4c-ab04-1bbe4f20a5fb';
const sendBtn = form.querySelector('button[type="submit"]');
let currentUrl = null;
let currentFile = null;

function showError(text) {
  errorEl.textContent = text;
  errorEl.hidden = !text;
}

function loadFile(file) {
  if (!file) return;
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    showError('That file is not a PDF. Please choose a .pdf file.');
    return;
  }
  showError('');
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(file);
  currentFile = file;
  viewer.src = currentUrl;
  viewer.hidden = false;
  dropZone.hidden = true;
  removeBtn.hidden = false;
  topbarFile.textContent = file.name;
  topbarFile.title = file.name;
  topbarFile.hidden = false;
  uploadLabel.textContent = 'Replace PDF';
}

function clearFile() {
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = null;
  currentFile = null;
  viewer.removeAttribute('src');
  viewer.hidden = true;
  dropZone.hidden = false;
  removeBtn.hidden = true;
  topbarFile.hidden = true;
  uploadLabel.textContent = 'Upload PDF';
  fileInput.value = '';
}

fileInput.addEventListener('change', () => {
  loadFile(fileInput.files[0]);
  fileInput.value = ''; // allow re-selecting the same file
});
removeBtn.addEventListener('click', clearFile);

// Drag and drop anywhere on the contract panel
const previewPanel = dropZone.closest('.panel');
['dragenter', 'dragover'].forEach(ev =>
  previewPanel.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(ev =>
  previewPanel.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
previewPanel.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));
// Stop the browser from navigating to a PDF dropped outside the panel
['dragover', 'drop'].forEach(ev => window.addEventListener(ev, e => e.preventDefault()));

function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function addTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot typing';
  div.setAttribute('aria-label', 'Assistant is typing');
  div.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  if (!currentFile) {
    addMessage('Please upload a contract PDF first, then ask your question.', 'bot');
    return;
  }
  addMessage(text, 'user');
  input.value = '';
  sendToWebhook(text);
});

async function sendToWebhook(text) {
  const typing = addTyping();
  sendBtn.disabled = true;
  try {
    const body = new FormData();
    body.append('file', currentFile, currentFile.name);
    body.append('message', text);
    const res = await fetch(WEBHOOK_URL, { method: 'POST', body });
    if (!res.ok) throw new Error('Webhook returned status ' + res.status);
    const raw = await res.text();
    let data = JSON.parse(raw);
    if (Array.isArray(data)) data = data[0]; // n8n may wrap the object in an array
    if (!data || typeof data.response !== 'string') throw new Error('Unexpected response format');
    typing.remove();
    addAnswer(data);
  } catch (err) {
    typing.remove();
    addMessage('Sorry, something went wrong getting an answer (' + err.message + '). Please try again.', 'bot error');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function addAnswer({ response, citation, reasoning }) {
  const div = document.createElement('div');
  div.className = 'msg bot answer';

  const main = document.createElement('p');
  main.className = 'answer-text';
  main.textContent = response;
  div.appendChild(main);

  const cites = Array.isArray(citation) ? citation.filter(c => typeof c === 'string' && c.trim()) : [];
  if (cites.length) {
    const h = document.createElement('h3');
    h.textContent = 'Citations';
    div.appendChild(h);
    const ul = document.createElement('ul');
    ul.className = 'citations';
    cites.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c;
      ul.appendChild(li);
    });
    div.appendChild(ul);
  }

  if (typeof reasoning === 'string' && reasoning.trim()) {
    const h = document.createElement('h3');
    h.textContent = 'Reasoning';
    div.appendChild(h);
    const p = document.createElement('p');
    p.className = 'reasoning';
    p.textContent = reasoning;
    div.appendChild(p);
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}
