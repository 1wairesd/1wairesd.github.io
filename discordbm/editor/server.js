const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const sessions = new Map();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/editor.html');
});

app.post('/api/session/create', (req, res) => {
  const { code, data } = req.body;
  sessions.set(code, { data, created: Date.now() });
  res.sendStatus(200);
});

app.get('/api/session/:code', (req, res) => {
  const session = sessions.get(req.params.code);
  if (!session) return res.sendStatus(404);
  res.json(session.data);
});

app.get('/editor/:code', (req, res) => {
  res.sendFile(__dirname + '/public/editor.html');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
