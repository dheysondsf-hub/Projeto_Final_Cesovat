const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

const routes = require('./routes');

app.use('/api', routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '../frontend', `${page}.html`);
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Pressione Ctrl+C para parar o servidor');
});