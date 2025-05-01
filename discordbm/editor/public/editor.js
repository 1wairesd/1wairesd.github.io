let currentData = null;
let currentCode = null;

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
    
    function createNode(name, data, depth = 0) {
        const div = document.createElement('div');
        div.className = 'command-node';
        div.style.paddingLeft = depth * 15 + 'px';
        div.textContent = name;
        div.onclick = () => renderProperties(data);
        return div;
    }
    
    for (const [key, value] of Object.entries(data)) {
        container.appendChild(createNode(key, value, 0));
    }
}

function renderProperties(data) {
    const editor = document.getElementById('propertyEditor');
    editor.innerHTML = '';
    
    for (const [key, value] of Object.entries(data)) {
        const group = document.createElement('div');
        group.className = 'property-group';
        
        const label = document.createElement('label');
        label.className = 'property-label';
        label.textContent = key;
        
        const input = document.createElement('input');
        input.className = 'property-input';
        input.value = typeof value === 'object' ? JSON.stringify(value) : value;
        
        input.addEventListener('change', (e) => {
            try {
                data[key] = JSON.parse(e.target.value);
            } catch {
                data[key] = e.target.value;
            }
        });
        
        group.appendChild(label);
        group.appendChild(input);
        editor.appendChild(group);
    }
}

function saveChanges() {
    const command = `/discordbmv applyedits ${currentCode}`;
    prompt('Run this command on the server to apply changes:', command);
}