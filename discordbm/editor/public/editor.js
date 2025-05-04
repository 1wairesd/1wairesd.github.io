let currentData = null;
let currentCode = null;
let selectedCommand = null;

document.addEventListener('DOMContentLoaded', () => {
  currentCode = window.location.pathname.split('/').pop();
  loadSessionData();
});

async function loadSessionData() {
  try {
    const response = await fetch(`/api/session/${currentCode}`);
    currentData = await response.json();
    renderCommandTree(currentData);
  } catch {
    alert('Error loading session');
  }
}

function renderCommandTree(data) {
  const container = document.getElementById('commandTree');
  container.innerHTML = '';

  function createNode(command, depth = 0) {
    const div = document.createElement('div');
    div.className = `command-node ${selectedCommand === command ? 'active' : ''}`;
    div.style.paddingLeft = depth * 20 + 'px';
    div.innerHTML = `<i class="fas fa-${command.children ? 'folder' : 'code'}"></i>${command.name}`;

    div.onclick = e => {
      e.stopPropagation();
      selectedCommand = command;
      renderProperties(command);
      document.getElementById('deleteBtn').disabled = false;
      container.querySelectorAll('.command-node').forEach(n => n.classList.remove('active'));
      div.classList.add('active');
    };

    if (command.children) {
      command.children.forEach(child => div.appendChild(createNode(child, depth + 1)));
    }

    return div;
  }

  data.commands.forEach(cmd => container.appendChild(createNode(cmd)));
}

function renderProperties(command) {
  const editor = document.getElementById('propertyEditor');
  editor.innerHTML = '';

  const fields = {
    name: { type: 'text', label: 'Command Name' },
    description: { type: 'textarea', label: 'Description' },
    context: { type: 'select', label: 'Context', options: ['both', 'server', 'dm'] },
    ephemeral: { type: 'checkbox', label: 'Ephemeral Response' }
  };

  Object.entries(fields).forEach(([key, cfg]) => {
    const group = document.createElement('div');
    group.className = 'property-group';

    const label = document.createElement('label');
    label.className = 'property-label';
    label.textContent = cfg.label;

    let input;
    if (cfg.type === 'textarea') {
      input = document.createElement('textarea'); input.rows = 3;
    } else if (cfg.type === 'select') {
      input = document.createElement('select');
      cfg.options.forEach(opt => {
        const optEl = document.createElement('option'); optEl.value = opt; optEl.textContent = opt;
        input.appendChild(optEl);
      });
    } else {
      input = document.createElement('input'); input.type = cfg.type;
    }
    input.className = 'property-input';
    if (cfg.type === 'checkbox') input.checked = !!command[key];
    else input.value = command[key] || '';

    input.onchange = e => {
      command[key] = cfg.type === 'checkbox' ? e.target.checked : e.target.value;
    };

    group.append(label, input);
    editor.appendChild(group);
  });

  const optionsHeader = document.createElement('div');
  optionsHeader.className = 'property-group';
  optionsHeader.innerHTML = `
    <h3>Command Options
      <button onclick="addNewOption()" class="btn small">
        <i class="fas fa-plus"></i>
      </button>
    </h3>`;
  editor.appendChild(optionsHeader);

  (command.options || []).forEach((opt, idx) => {
    const optDiv = document.createElement('div');
    optDiv.className = 'property-group';
    optDiv.innerHTML = `
      <div class="option-header">
        <label>Option ${idx + 1}</label>
        <button onclick="removeOption(${idx})" class="btn small danger">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <input type="text" class="property-input" placeholder="Name" value="${opt.name}" onchange="updateOption('name', ${idx}, this.value)">
      <select class="property-input" onchange="updateOption('type', ${idx}, this.value)">
        ${['STRING','INTEGER','BOOLEAN','USER','CHANNEL']
          .map(t => `<option value="${t}"${opt.type===t?' selected':''}>${t}</option>`) .join('')}
      </select>
      <textarea class="property-input" placeholder="Description" onchange="updateOption('description', ${idx}, this.value)">${opt.description||''}</textarea>
      <label class="checkbox"><input type="checkbox"${opt.required?' checked':''} onchange="updateOption('required', ${idx}, this.checked)"> Required</label>
    `;
    editor.appendChild(optDiv);
  });
}

function addNewOption() {
  if (!selectedCommand) return;
  selectedCommand.options = selectedCommand.options||[];
  selectedCommand.options.push({ name: 'new_option', type: 'STRING', description: '', required: false });
  renderProperties(selectedCommand);
}

function removeOption(index) {
  if (!selectedCommand?.options) return;
  selectedCommand.options.splice(index,1);
  renderProperties(selectedCommand);
}

function updateOption(field, index, value) {
  if (!selectedCommand?.options) return;
  selectedCommand.options[index][field] = value;
  renderCommandTree({ commands: currentData.commands });
}

function createNewCommand() {
  currentData.commands.push({ name: 'new_command', description: '', context: 'both', ephemeral: false, options: [], conditions: [], actions: [] });
  renderCommandTree(currentData);
}

function deleteCommand() {
  if (selectedCommand && confirm('Delete this command?')) {
    const i = currentData.commands.indexOf(selectedCommand);
    if (i>=0) currentData.commands.splice(i,1);
    selectedCommand = null;
    document.getElementById('deleteBtn').disabled = true;
    document.getElementById('propertyEditor').innerHTML = '';
    renderCommandTree(currentData);
  }
}

async function saveChanges() {
  try {
    const resp = await fetch(`/api/session/${currentCode}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(currentData) });
    if (resp.ok) {
      prompt('Changes saved! Run this command in-game:', `/discordbmv applyedits ${currentCode}`);
    } else alert('Error saving changes');
  } catch {
    alert('Error saving changes');
  }
}
