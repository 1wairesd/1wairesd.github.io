// Refactored Command Editor with Minimalist Volumetric Dark Theme

// Inject dark theme styles
const style = document.createElement('style');
style.textContent = `
  body { background: #1e1e2f; color: #e0e0e0; font-family: sans-serif; margin: 0; padding: 20px; }
  .command-node { cursor: pointer; padding: 8px 12px; margin-bottom: 4px; background: #2e2e42; border-radius: 8px; transition: background 0.2s; }
  .command-node.active, .command-node:hover { background: #3f3f5c; }
  #propertyEditor .property-group, #propertyEditor .list-section { background: #2e2e42; border-radius: 8px; padding: 12px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
  label { display: block; font-weight: 500; margin-bottom: 6px; }
  input[type=text], textarea, select { width: 100%; padding: 8px; border: none; border-radius: 6px; background: #3f3f5c; color: #e0e0e0; margin-bottom: 12px; }
  textarea { resize: vertical; }
  button { background: #5c5cff; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: background 0.2s; margin-left: 8px; }
  button:hover { background: #8181ff; }
  .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .list-item input, .list-item select, .list-item textarea { margin-bottom: 8px; }
`;
document.head.append(style);

const FIELD_DEFS = [
  { key: 'name',        type: 'text',     label: 'Command Name' },
  { key: 'description', type: 'textarea', label: 'Description' },
  { key: 'context',     type: 'select',   label: 'Context', options: ['both','server','dm'] },
  { key: 'ephemeral',   type: 'checkbox', label: 'Ephemeral Response' }
];

const LIST_DEFS = [
  {
    key: 'options',
    title: 'Command Options',
    template: (opt, idx) => `
      <div class="item-header">
        <span>Option ${idx + 1}</span>
        <button data-action="remove" data-list="options" data-index="${idx}">✕</button>
      </div>
      <input data-field="name" placeholder="Name" value="${opt.name}" />
      <select data-field="type">
        ${['STRING','INTEGER','BOOLEAN','USER','CHANNEL']
          .map(t => `<option value="${t}"${opt.type===t?' selected':''}>${t}</option>`).join('')}
      </select>
      <textarea data-field="description" placeholder="Description">${opt.description}</textarea>
      <label><input type="checkbox" data-field="required" ${opt.required?'checked':''}/> Required</label>
    `
  },
  {
    key: 'conditions',
    title: 'Conditions',
    template: (cond, idx) => `
      <div class="item-header">
        <span>Condition ${idx + 1}</span>
        <button data-action="remove" data-list="conditions" data-index="${idx}">✕</button>
      </div>
      <select data-field="type">
        ${['permission','role','time']
          .map(t => `<option value="${t}"${cond.type===t?' selected':''}>${t}</option>`).join('')}
      </select>
      <input data-field="value" placeholder="Value" value="${cond.value||cond.role_id||''}" />
    `
  },
  {
    key: 'actions',
    title: 'Actions',
    template: (act, idx) => `
      <div class="item-header">
        <span>Action ${idx + 1}</span>
        <button data-action="remove" data-list="actions" data-index="${idx}">✕</button>
      </div>
      <select data-field="type">
        <option value="send_message"${act.type==='send_message'?' selected':''}>Send Message</option>
        <option value="button"${act.type==='button'?' selected':''}>Button</option>
      </select>
      <input data-field="message" placeholder="Content" value="${act.message||act.content||''}" />
    `
  }
];

let currentData = null;
let currentCode = null;
let selectedCommand = null;

// Entry point
window.addEventListener('DOMContentLoaded', () => {
  currentCode = window.location.pathname.split('/').pop();
  loadSessionData();
  setupGlobalListeners();
});

// Load session data
async function loadSessionData() {
  try {
    const response = await fetch(`/api/session/${currentCode}`);
    currentData = await response.json();
    renderCommandTree();
  } catch {
    alert('Error loading session');
  }
}

// Render command tree in sidebar
function renderCommandTree() {
  const container = document.getElementById('commandTree');
  container.innerHTML = '';
  currentData.commands.forEach(cmd => container.appendChild(createNode(cmd, 0)));
}

function createNode(command, depth) {
  const div = document.createElement('div');
  div.className = `command-node ${selectedCommand === command ? 'active' : ''}`;
  div.style.paddingLeft = `${depth * 12}px`;
  div.textContent = command.name;
  div.addEventListener('click', e => {
    e.stopPropagation();
    selectedCommand = command;
    renderProperties();
    document.getElementById('deleteBtn').disabled = false;
    document.querySelectorAll('.command-node').forEach(n => n.classList.remove('active'));
    div.classList.add('active');
  });
  if (command.children) {
    command.children.forEach(child => div.appendChild(createNode(child, depth + 1)));
  }
  return div;
}

// Render property editor and list sections
function renderProperties() {
  const editor = document.getElementById('propertyEditor');
  editor.innerHTML = '';

  // Basic fields
  FIELD_DEFS.forEach(def => {
    const group = document.createElement('div');
    group.className = 'property-group';
    const label = document.createElement('label');
    label.textContent = def.label;
    let input;

    if (def.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
      input.value = selectedCommand[def.key] || '';
    } else if (def.type === 'select') {
      input = document.createElement('select');
      def.options.forEach(opt => {
        const optEl = new Option(opt, opt, selectedCommand[def.key] === opt, selectedCommand[def.key] === opt);
        input.add(optEl);
      });
    } else {
      input = document.createElement('input');
      input.type = def.type;
      if (def.type === 'checkbox') input.checked = !!selectedCommand[def.key];
      else input.value = selectedCommand[def.key] || '';
    }

    input.dataset.key = def.key;
    group.append(label, input);
    editor.append(group);
  });

  // List sections (options, conditions, actions)
  LIST_DEFS.forEach(listDef => {
    const section = document.createElement('div');
    section.className = 'list-section';
    const header = document.createElement('h3');
    header.textContent = listDef.title;
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.dataset.action = 'add';
    addBtn.dataset.list = listDef.key;
    header.append(addBtn);
    section.append(header);

    const items = selectedCommand[listDef.key] || (selectedCommand[listDef.key] = []);
    items.forEach((item, idx) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'list-item';
      itemDiv.dataset.list = listDef.key;
      itemDiv.dataset.index = idx;
      itemDiv.innerHTML = listDef.template(item, idx);
      section.append(itemDiv);
    });

    editor.append(section);
  });
}

// Delegated event listeners for editor
function setupGlobalListeners() {
  const editor = document.getElementById('propertyEditor');

  // Handle changes to fields and list items
  editor.addEventListener('change', e => {
    const tgt = e.target;
    const listKey = tgt.closest('.list-item')?.dataset.list;
    const idx     = tgt.closest('.list-item')?.dataset.index;
    const field   = tgt.dataset.field || tgt.dataset.key;

    if (tgt.dataset.key) {
      selectedCommand[field] = tgt.type === 'checkbox' ? tgt.checked : tgt.value;
    } else if (listKey != null) {
      const arr = selectedCommand[listKey];
      arr[idx][field] = tgt.type === 'checkbox' ? tgt.checked : tgt.value;
    }
    renderCommandTree();
  });

  // Handle add/remove buttons in lists
  editor.addEventListener('click', e => {
    const tgt    = e.target;
    const action = tgt.dataset.action;
    const list   = tgt.dataset.list;
    const idx    = tgt.dataset.index;
    if (!action || !list) return;

    if (action === 'add') {
      let tpl;
      if (list === 'options') tpl = { name: '', type: 'STRING', description: '', required: false };
      if (list === 'conditions') tpl = { type: 'permission', value: '' };
      if (list === 'actions') tpl = { type: 'send_message', message: '' };
      selectedCommand[list].push(tpl);
    } else if (action === 'remove') {
      selectedCommand[list].splice(idx, 1);
    }
    renderProperties();
  });

  // Create new command
  document.getElementById('createBtn').addEventListener('click', () => {
    currentData.commands.push({
      name: 'new_command',
      description: '',
      context: 'both',
      ephemeral: false,
      options: [],
      conditions: [],
      actions: []
    });
    renderCommandTree();
  });

  // Delete selected command
  document.getElementById('deleteBtn').addEventListener('click', () => {
    if (!selectedCommand) return;
    currentData.commands = currentData.commands.filter(c => c !== selectedCommand);
    selectedCommand = null;
    renderCommandTree();
    document.getElementById('deleteBtn').disabled = true;
    document.getElementById('propertyEditor').innerHTML = '';
  });

  // Save changes to server
  document.getElementById('saveBtn').addEventListener('click', async () => {
    try {
      const resp = await fetch(`/api/session/${currentCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
      alert(resp.ok ? 'Changes saved!' : 'Error saving changes');
    } catch {
      alert('Error saving changes');
    }
  });
}
