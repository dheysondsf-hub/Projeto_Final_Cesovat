const express = require('express');
const router = express.Router();
const dados = require('../data/dados.json');

router.get('/empresas', (req, res) => {
  res.json(dados.empresas);
});

router.get('/servicos', (req, res) => {
  res.json(dados.servicos);
});

router.get('/sobre', (req, res) => {
  res.json(dados.sobre);
});

router.get('/contato', (req, res) => {
  res.json(dados.contato);
});

router.get('/all', (req, res) => {
  res.json(dados);
});

module.exports = router;