let commands = [];
let editingIndex = null;
let sessionId;

$(document).ready(function() {
    sessionId = window.location.pathname.split('/').pop();

    fetch(`/api/get_config/${sessionId}`)
        .then(response => {
            if (!response.ok) throw new Error('Конфигурация не найдена');
            return response.json();
        })
        .then(data => {
            commands = data || [];
            displayCommands();
        })
        .catch(error => alert('Ошибка загрузки конфигурации: ' + error.message));

    $('#add-command-btn').click(() => openEditorModal());
    $('#save-all-btn').click(saveAll);
    $('#save-command-btn').click(saveCommand);
});

function displayCommands() {
    const list = $('#commands-list');
    list.empty();
    commands.forEach((cmd, index) => {
        list.append(`
            <div class="card mb-2 p-3 bg-dark">
                <h3>${cmd.name}</h3>
                <button class="btn btn-primary me-2" onclick="editCommand(${index})">Edit</button>
                <button class="btn btn-danger" onclick="deleteCommand(${index})">Delete</button>
            </div>
        `);
    });
}

function openEditorModal(cmd = null) {
    editingIndex = cmd ? commands.indexOf(cmd) : null;
    $('#cmd-name').val(cmd ? cmd.name : '');
    $('#cmd-description').val(cmd ? cmd.description : '');
    $('#cmd-context').val(cmd ? cmd.context : 'both');
    $('#options-list, #conditions-list, #actions-list').empty();

    if (cmd) {
        populateOptions(cmd.options || []);
        populateConditions(cmd.conditions || []);
        populateActions(cmd.actions || []);
    }

    $('#editor-modal').modal('show');
}

function addOption() {
    $('#options-list').append(`
        <div class="option mb-2 p-2 border rounded">
            <input type="text" class="form-control mb-1" placeholder="Name" name="name">
            <select class="form-select mb-1" name="type">
                <option>STRING</option>
                <option>INTEGER</option>
                <option>BOOLEAN</option>
                <option>USER</option>
                <option>CHANNEL</option>
                <option>ROLE</option>
            </select>
            <input type="text" class="form-control mb-1" placeholder="Description" name="description">
            <input type="checkbox" name="required"> Required
            <button type="button" class="btn btn-danger mt-1" onclick="$(this).parent().remove()">Remove</button>
        </div>
    `);
}

function addCondition() {
    $('#conditions-list').append(`
        <div class="condition mb-2 p-2 border rounded">
            <select class="form-select mb-1" name="type">
                <option value="permission">Permission</option>
            </select>
            <input type="text" class="form-control mb-1" placeholder="Role" name="role">
            <button type="button" class="btn btn-danger mt-1" onclick="$(this).parent().remove()">Remove</button>
        </div>
    `);
}

function addAction() {
    const actionHtml = `
        <div class="action mb-2 p-2 border rounded">
            <select class="form-select mb-1 action-type" name="type">
                <option value="send_message">Send Message</option>
                <option value="button">Button</option>
            </select>
            <div class="send_message-fields" style="display: none;">
                <textarea class="form-control mb-1" placeholder="Message" name="message"></textarea>
            </div>
            <div class="button-fields" style="display: none;">
                <input type="text" class="form-control mb-1" placeholder="Label" name="label">
                <select class="form-select mb-1" name="style">
                    <option>PRIMARY</option>
                    <option>SECONDARY</option>
                    <option>SUCCESS</option>
                    <option>DANGER</option>
                    <option>LINK</option>
                </select>
                <input type="text" class="form-control mb-1" placeholder="URL (for LINK)" name="url">
                <input type="text" class="form-control mb-1" placeholder="Message (for non-LINK)" name="message">
                <input type="text" class="form-control mb-1" placeholder="Emoji" name="emoji">
                <input type="checkbox" name="disabled"> Disabled
            </div>
            <button type="button" class="btn btn-danger mt-1" onclick="$(this).parent().remove()">Remove</button>
        </div>
    `;
    $('#actions-list').append(actionHtml);
    $('.action-type').last().change(updateActionFields);
}

function updateActionFields() {
    const actionDiv = $(this).closest('.action');
    const type = $(this).val();
    actionDiv.find('.send_message-fields, .button-fields').hide();
    if (type === 'send_message') actionDiv.find('.send_message-fields').show();
    else if (type === 'button') actionDiv.find('.button-fields').show();
}

$(document).on('change', '.action-type', updateActionFields);

function populateOptions(options) {
    options.forEach(opt => {
        addOption();
        const $opt = $('#options-list .option').last();
        $opt.find('[name="name"]').val(opt.name);
        $opt.find('[name="type"]').val(opt.type);
        $opt.find('[name="description"]').val(opt.description);
        $opt.find('[name="required"]').prop('checked', opt.required);
    });
}

function populateConditions(conditions) {
    conditions.forEach(cond => {
        addCondition();
        const $cond = $('#conditions-list .condition').last();
        $cond.find('[name="type"]').val(cond.type);
        $cond.find('[name="role"]').val(cond.role);
    });
}

function populateActions(actions) {
    actions.forEach(act => {
        addAction();
        const $act = $('#actions-list .action').last();
        $act.find('[name="type"]').val(act.type).trigger('change');
        if (act.type === 'send_message') {
            $act.find('.send_message-fields [name="message"]').val(act.message);
        } else if (act.type === 'button') {
            $act.find('[name="label"]').val(act.label);
            $act.find('[name="style"]').val(act.style);
            $act.find('[name="url"]').val(act.url);
            $act.find('[name="message"]').val(act.message);
            $act.find('[name="emoji"]').val(act.emoji);
            $act.find('[name="disabled"]').prop('checked', act.disabled);
        }
    });
}

function saveCommand() {
    const cmd = {
        name: $('#cmd-name').val(),
        description: $('#cmd-description').val(),
        context: $('#cmd-context').val(),
        options: [],
        conditions: [],
        actions: []
    };

    if (!cmd.name || !cmd.description) {
        alert('Name and Description are required!');
        return;
    }

    $('#options-list .option').each(function() {
        cmd.options.push({
            name: $(this).find('[name="name"]').val(),
            type: $(this).find('[name="type"]').val(),
            description: $(this).find('[name="description"]').val(),
            required: $(this).find('[name="required"]').is(':checked')
        });
    });

    $('#conditions-list .condition').each(function() {
        cmd.conditions.push({
            type: $(this).find('[name="type"]').val(),
            role: $(this).find('[name="role"]').val()
        });
    });

    $('#actions-list .action').each(function() {
        const type = $(this).find('[name="type"]').val();
        if (type === 'send_message') {
            cmd.actions.push({
                type: 'send_message',
                message: $(this).find('.send_message-fields [name="message"]').val()
            });
        } else if (type === 'button') {
            cmd.actions.push({
                type: 'button',
                label: $(this).find('[name="label"]').val(),
                style: $(this).find('[name="style"]').val(),
                url: $(this).find('[name="url"]').val(),
                message: $(this).find('[name="message"]').val(),
                emoji: $(this).find('[name="emoji"]').val(),
                disabled: $(this).find('[name="disabled"]').is(':checked')
            });
        }
    });

    if (editingIndex !== null) commands[editingIndex] = cmd;
    else commands.push(cmd);

    $('#editor-modal').modal('hide');
    displayCommands();
}

function editCommand(index) {
    openEditorModal(commands[index]);
}

function deleteCommand(index) {
    if (confirm('Are you sure you want to delete this command?')) {
        commands.splice(index, 1);
        displayCommands();
    }
}

function saveAll() {
    const data = { commands };
    fetch(`/api/save_config/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка сохранения');
        return response.json();
    })
    .then(result => {
        const applyCode = result.applyCode;
        alert(`Конфигурация сохранена. Вставьте эту команду на сервере: /discordBMV apply ${applyCode}`);
        $('#yaml-output').val(`/discordBMV apply ${applyCode}`);
    })
    .catch(error => alert('Ошибка сохранения конфигурации: ' + error.message));
}