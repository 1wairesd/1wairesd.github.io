const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const sessions = new Map();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.post('/api/session/create', (req, res) => {
  const { code, data } = req.body;
  sessions.set(code, { data, created: Date.now() });
  res.sendStatus(200);
});

app.put('/api/session/:code', (req, res) => {
  const session = sessions.get(req.params.code);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.data = req.body;
  session.created = Date.now();
  res.sendStatus(200);
});

app.get('/api/session/:code', (req, res) => {
  const session = sessions.get(req.params.code);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.set('Content-Type', 'application/json');
  res.json(session.data);
});

app.get('/editor/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [code, session] of sessions.entries()) {
    if (now - session.created > 3600000) {
      sessions.delete(code);
    }
  }
}, 60000);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
