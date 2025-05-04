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
    } catch (error) {
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
        div.innerHTML = `
            <i class="fas fa-${command.children ? 'folder' : 'code'}"></i>
            ${command.name}
        `;

        div.onclick = (e) => {
            e.stopPropagation();
            selectedCommand = command;
            renderProperties(command);
            document.getElementById('deleteBtn').disabled = false;
            Array.from(container.querySelectorAll('.command-node')).forEach(n =>
                n.classList.remove('active')
            );
            div.classList.add('active');
        };

        if (command.children) {
            command.children.forEach(child =>
                div.appendChild(createNode(child, depth + 1))
        }

        return div;
    }

    data.commands.forEach(command => {
        container.appendChild(createNode(command));
    });
}

function renderProperties(command) {
    const editor = document.getElementById('propertyEditor');
    editor.innerHTML = '';

    const fields = {
        name: { type: 'text', label: 'Command Name' },
        description: { type: 'textarea', label: 'Description' },
        context: {
            type: 'select',
            label: 'Context',
            options: ['both', 'server', 'dm']
        },
        ephemeral: { type: 'checkbox', label: 'Ephemeral Response' }
    };

    Object.entries(fields).forEach(([key, config]) => {
        const group = document.createElement('div');
        group.className = 'property-group';

        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = config.label;

        let input;
        switch(config.type) {
            case 'textarea':
                input = document.createElement('textarea');
                input.className = 'property-input';
                input.rows = 3;
                break;
            case 'select':
                input = document.createElement('select');
                input.className = 'property-input';
                config.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    input.appendChild(option);
                });
                break;
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'property-input';
                break;
            default:
                input = document.createElement('input');
                input.className = 'property-input';
                input.type = config.type;
        }

        input.value = command[key] || '';
        if (config.type === 'checkbox') {
            input.checked = !!command[key];
        }

        input.addEventListener('change', (e) => {
            command[key] = config.type === 'checkbox' ?
                e.target.checked :
                e.target.value;
        });

        group.appendChild(label);
        group.appendChild(input);
        editor.appendChild(group);
    });
}

function createNewCommand() {
    const newCommand = {
        name: 'new_command',
        description: 'New command description',
        context: 'both',
        ephemeral: false,
        options: [],
        conditions: [],
        actions: []
    };

    currentData.commands.push(newCommand);
    renderCommandTree(currentData);
}

function deleteCommand() {
    if (selectedCommand && confirm('Delete this command?')) {
        const index = currentData.commands.findIndex(c => c === selectedCommand);
        currentData.commands.splice(index, 1);
        selectedCommand = null;
        renderCommandTree(currentData);
        document.getElementById('propertyEditor').innerHTML = '';
        document.getElementById('deleteBtn').disabled = true;
    }
}

async function saveChanges() {
    try {
        const response = await fetch(`/api/session/${currentCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentData)
        });

        if (response.ok) {
            const command = `/discordbmv applyedits ${currentCode}`;
            prompt('Changes saved! Run this command in-game to apply:', command);
        } else {
            alert('Error saving changes');
        }
    } catch (error) {
        alert('Error saving changes');
    }
}