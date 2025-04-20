const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Папка с HTML, CSS, JS

const sessions = new Map();
const applyCodes = new Map();

app.post('/api/create_session', (req, res) => {
    const sessionId = uuidv4();
    sessions.set(sessionId, req.body);
    res.json({ sessionId });
});

app.get('/api/get_config/:sessionId', (req, res) => {
    const config = sessions.get(req.params.sessionId);
    if (config) {
        res.json(config);
    } else {
        res.status(404).json({ error: 'Сессия не найдена' });
    }
});

app.post('/api/save_config/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (!sessions.has(sessionId)) {
        return res.status(404).json({ error: 'Сессия не найдена' });
    }
    const applyCode = uuidv4();
    applyCodes.set(applyCode, req.body);
    sessions.delete(sessionId); // Очищаем сессию после сохранения
    res.json({ applyCode });
});

app.get('/api/apply/:applyCode', (req, res) => {
    const editedConfig = applyCodes.get(req.params.applyCode);
    if (editedConfig) {
        res.json(editedConfig);
        applyCodes.delete(req.params.applyCode); // Удаляем после использования
    } else {
        res.status(404).json({ error: 'Код применения не найден' });
    }
});

app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});