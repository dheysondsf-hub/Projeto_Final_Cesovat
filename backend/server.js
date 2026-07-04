const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { validarHorarioAgendamento, deveBloquearAlteracaoStatusCliente, normalizarStatusMensagemContato } = require('./agendaUtils');

const app = express();
const PORT = 3000;

// Caminho para o arquivo de dados (simula um banco de dados)
const DATA_PATH = path.join(__dirname, 'data', 'dados.json');

// Função auxiliar para ler os dados do arquivo JSON
function lerDados() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Função auxiliar para salvar os dados no arquivo JSON
function salvarDados(dados) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(dados, null, 2), 'utf-8');
}
function obterContextoAuth(req) {
  const roleHeader = req.headers['x-user-role'];
  const userIdHeader = req.headers['x-user-id'];
  const role = (roleHeader || req.query.role || '').toString().toLowerCase();
  const userId = parseInt(userIdHeader || req.query.userId || req.query.usuarioId || '0', 10);

  return { role, userId };
}

function ehEquipe(role) {
  return role === 'admin' || role === 'colaborador';
}
// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// ROTAS DE AUTENTICAÇÃO (AUTH)
// ============================================================

// POST /api/auth/login — Autenticação de usuário
app.post('/api/auth/login', (req, res) => {
  const { email, senha, role } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  const dados = lerDados();
  const usuario = dados.usuarios.find((u) => {
    const roleDesejada = (role || '').toString().toLowerCase();
    const roleUsuario = (u.role || '').toString().toLowerCase();
    return u.email === email && u.senha === senha && (!roleDesejada || roleDesejada === roleUsuario || (roleDesejada === 'colaborador' && roleUsuario === 'admin'));
  });

  if (!usuario) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  // Retorna os dados do usuário (sem a senha)
  const { senha: _, ...usuarioSemSenha } = usuario;
  res.json({
    mensagem: 'Login realizado com sucesso!',
    usuario: usuarioSemSenha,
  });
});

// POST /api/auth/registro — Cadastro de novo usuário
app.post('/api/auth/registro', (req, res) => {
  const { nome, email, senha, cargo, role: roleSolicitada, criadorRole } = req.body;
  const role = (criadorRole || '').toString().toLowerCase();
  const roleDestino = (roleSolicitada || '').toString().toLowerCase();

  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (!ehEquipe(role)) {
    return res.status(403).json({ erro: 'Apenas colaboradores da CESOVAT podem cadastrar novos usuários.' });
  }

  const dados = lerDados();
  const existente = dados.usuarios.find((u) => u.email === email);

  if (existente) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }

  const novoId =
    dados.usuarios.length > 0
      ? Math.max(...dados.usuarios.map((u) => u.id)) + 1
      : 1;

  const novoUsuario = {
    id: novoId,
    nome,
    email,
    senha,
    cargo,
    role: roleDestino === 'cliente' ? 'cliente' : 'colaborador',
  };

  dados.usuarios.push(novoUsuario);
  salvarDados(dados);

  const { senha: _, ...usuarioSemSenha } = novoUsuario;
  res.status(201).json({
    mensagem: 'Usuário cadastrado com sucesso!',
    usuario: usuarioSemSenha,
  });
});

// ============================================================
// ROTAS DE SERVIÇOS (CRUD completo)
// ============================================================

// GET /api/servicos — Listar todos os serviços
app.get('/api/servicos', (req, res) => {
  const dados = lerDados();

  // Filtro opcional por categoria
  const { categoria } = req.query;
  let servicos = dados.servicos;

  if (categoria) {
    servicos = servicos.filter((s) => s.categoria === categoria);
  }

  res.json(servicos);
});

// GET /api/servicos/:id — Obter um serviço específico
app.get('/api/servicos/:id', (req, res) => {
  const dados = lerDados();
  const servico = dados.servicos.find((s) => s.id === parseInt(req.params.id));

  if (!servico) {
    return res.status(404).json({ erro: 'Serviço não encontrado.' });
  }

  res.json(servico);
});

// POST /api/servicos — Criar novo serviço
app.post('/api/servicos', (req, res) => {
  const { role } = obterContextoAuth(req);

  if (!ehEquipe(role)) {
    return res.status(403).json({ erro: 'Somente colaboradores da CESOVAT podem gerenciar serviços.' });
  }

  const { titulo, descricao, icone, categoria, preco, duracao, itens } =
    req.body;

  if (!titulo || !descricao || !categoria) {
    return res
      .status(400)
      .json({ erro: 'Título, descrição e categoria são obrigatórios.' });
  }

  const dados = lerDados();
  const novoId =
    dados.servicos.length > 0
      ? Math.max(...dados.servicos.map((s) => s.id)) + 1
      : 1;

  const novoServico = {
    id: novoId,
    titulo,
    descricao,
    icone: icone || 'medical_services',
    categoria,
    preco: preco || 0,
    duracao: duracao || 'A definir',
    itens: itens || [],
  };

  dados.servicos.push(novoServico);
  salvarDados(dados);

  res.status(201).json({
    mensagem: 'Serviço cadastrado com sucesso!',
    servico: novoServico,
  });
});

// PUT /api/servicos/:id — Atualizar um serviço existente
app.put('/api/servicos/:id', (req, res) => {
  const { role } = obterContextoAuth(req);

  if (!ehEquipe(role)) {
    return res.status(403).json({ erro: 'Somente colaboradores da CESOVAT podem atualizar serviços.' });
  }

  const dados = lerDados();
  const index = dados.servicos.findIndex(
    (s) => s.id === parseInt(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ erro: 'Serviço não encontrado.' });
  }

  const { titulo, descricao, icone, categoria, preco, duracao, itens } =
    req.body;

  dados.servicos[index] = {
    ...dados.servicos[index],
    titulo: titulo || dados.servicos[index].titulo,
    descricao: descricao || dados.servicos[index].descricao,
    icone: icone || dados.servicos[index].icone,
    categoria: categoria || dados.servicos[index].categoria,
    preco: preco !== undefined ? preco : dados.servicos[index].preco,
    duracao: duracao || dados.servicos[index].duracao,
    itens: itens || dados.servicos[index].itens,
  };

  salvarDados(dados);

  res.json({
    mensagem: 'Serviço atualizado com sucesso!',
    servico: dados.servicos[index],
  });
});

// DELETE /api/servicos/:id — Remover um serviço
app.delete('/api/servicos/:id', (req, res) => {
  const { role } = obterContextoAuth(req);

  if (!ehEquipe(role)) {
    return res.status(403).json({ erro: 'Somente colaboradores da CESOVAT podem remover serviços.' });
  }

  const dados = lerDados();
  const index = dados.servicos.findIndex(
    (s) => s.id === parseInt(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ erro: 'Serviço não encontrado.' });
  }

  const removido = dados.servicos.splice(index, 1)[0];
  salvarDados(dados);

  res.json({
    mensagem: 'Serviço removido com sucesso!',
    servico: removido,
  });
});

// ============================================================
// ROTAS DE AGENDAMENTOS (CRUD completo)
// ============================================================

// GET /api/agendamentos — Listar todos os agendamentos
app.get('/api/agendamentos', (req, res) => {
  const dados = lerDados();
  const { role, userId } = obterContextoAuth(req);

  const agendamentosVisiveis = dados.agendamentos.filter((ag) => {
    if (ehEquipe(role)) return true;
    if (role === 'cliente') return ag.clienteId === userId;
    return false;
  });

  // Enriquece cada agendamento com o nome do serviço
  const agendamentosEnriquecidos = agendamentosVisiveis.map((ag) => {
    const servico = dados.servicos.find((s) => s.id === ag.servicoId);
    return {
      ...ag,
      nomeServico: servico ? servico.titulo : 'Serviço não encontrado',
    };
  });

  res.json(agendamentosEnriquecidos);
});

// POST /api/agendamentos — Criar novo agendamento
app.post('/api/agendamentos', (req, res) => {
  const { role, userId } = obterContextoAuth(req);
  const { paciente, empresa, servicoId, data, horario, observacoes, clienteId } = req.body;

  if (!ehEquipe(role) && role !== 'cliente') {
    return res.status(403).json({ erro: 'Faça login para criar agendamentos.' });
  }

  if (!paciente || !empresa || !servicoId || !data || !horario) {
    return res.status(400).json({
      erro: 'Paciente, empresa, serviço, data e horário são obrigatórios.',
    });
  }

  const validacaoHorario = validarHorarioAgendamento(horario);
  if (!validacaoHorario.valido) {
    return res.status(400).json({ erro: validacaoHorario.mensagem });
  }

  const dados = lerDados();
  const novoId =
    dados.agendamentos.length > 0
      ? Math.max(...dados.agendamentos.map((a) => a.id)) + 1
      : 1;

  const novoAgendamento = {
    id: novoId,
    paciente,
    empresa,
    servicoId: parseInt(servicoId),
    data,
    horario,
    status: 'pendente',
    observacoes: observacoes || '',
    clienteId: role === 'cliente' ? userId : clienteId || null,
  };

  dados.agendamentos.push(novoAgendamento);
  salvarDados(dados);

  res.status(201).json({
    mensagem: 'Agendamento criado com sucesso!',
    agendamento: novoAgendamento,
  });
});

// PUT /api/agendamentos/:id — Atualizar status de um agendamento
app.put('/api/agendamentos/:id', (req, res) => {
  const dados = lerDados();
  const { role, userId } = obterContextoAuth(req);
  const index = dados.agendamentos.findIndex(
    (a) => a.id === parseInt(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  }

  const agendamentoAtual = dados.agendamentos[index];
  if (!ehEquipe(role) && role === 'cliente' && agendamentoAtual.clienteId !== userId) {
    return res.status(403).json({ erro: 'Você só pode alterar seus próprios agendamentos.' });
  }

  const { paciente, empresa, servicoId, data, horario, status, observacoes, clienteId } =
    req.body;

  if (deveBloquearAlteracaoStatusCliente(role, status, agendamentoAtual)) {
    return res.status(403).json({ erro: 'Clientes não podem alterar o status do agendamento.' });
  }

  const validacaoHorario = horario ? validarHorarioAgendamento(horario) : { valido: true };
  if (!validacaoHorario.valido) {
    return res.status(400).json({ erro: validacaoHorario.mensagem });
  }

  dados.agendamentos[index] = {
    ...dados.agendamentos[index],
    paciente: paciente || dados.agendamentos[index].paciente,
    empresa: empresa || dados.agendamentos[index].empresa,
    servicoId: servicoId
      ? parseInt(servicoId)
      : dados.agendamentos[index].servicoId,
    data: data || dados.agendamentos[index].data,
    horario: horario || dados.agendamentos[index].horario,
    status: status || dados.agendamentos[index].status,
    observacoes:
      observacoes !== undefined
        ? observacoes
        : dados.agendamentos[index].observacoes,
    clienteId: role === 'cliente' ? userId : clienteId || dados.agendamentos[index].clienteId,
  };

  salvarDados(dados);

  res.json({
    mensagem: 'Agendamento atualizado com sucesso!',
    agendamento: dados.agendamentos[index],
  });
});

// DELETE /api/agendamentos/:id — Remover um agendamento
app.delete('/api/agendamentos/:id', (req, res) => {
  const { role } = obterContextoAuth(req);
  const dados = lerDados();
  const index = dados.agendamentos.findIndex(
    (a) => a.id === parseInt(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  }

  if (!ehEquipe(role)) {
    return res.status(403).json({ erro: 'Somente colaboradores da CESOVAT podem excluir agendamentos.' });
  }

  const removido = dados.agendamentos.splice(index, 1)[0];
  salvarDados(dados);

  res.json({
    mensagem: 'Agendamento removido com sucesso!',
    agendamento: removido,
  });
});

// ============================================================
// ROTAS DE DADOS INSTITUCIONAIS (somente leitura)
// ============================================================

// GET /api/empresas — Dados da página de empresas
app.get('/api/empresas', (req, res) => {
  const dados = lerDados();
  res.json(dados.empresas);
});

// GET /api/sobre — Dados da página sobre
app.get('/api/sobre', (req, res) => {
  const dados = lerDados();
  res.json(dados.sobre);
});

// GET /api/contato — Dados de contato
app.get('/api/contato', (req, res) => {
  const dados = lerDados();
  res.json(dados.contato);
});

// GET /api/estatisticas — Números/Estatísticas da clínica
app.get('/api/estatisticas', (req, res) => {
  const dados = lerDados();
  res.json(dados.estatisticas);
});

// POST /api/contato/mensagem — Enviar mensagem de contato
app.post('/api/contato/mensagem', (req, res) => {
  const { nome, email, telefone, empresa, assunto, mensagem } = req.body;

  if (!nome || !email || !telefone || !assunto || !mensagem) {
    return res
      .status(400)
      .json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  // Salvar a mensagem no arquivo de dados para que colaboradores possam visualizar
  const dados = lerDados();
  if (!Array.isArray(dados.contatoMensagens)) dados.contatoMensagens = [];

  const novoId = dados.contatoMensagens.length > 0 ? Math.max(...dados.contatoMensagens.map(m => m.id)) + 1 : 1;
  const item = {
    id: novoId,
    nome,
    email,
    telefone,
    empresa: empresa || '',
    assunto,
    mensagem,
    status: 'pendente',
    criadoEm: new Date().toISOString()
  };
  dados.contatoMensagens.push(item);
  salvarDados(dados);

  res.status(201).json({
    mensagem: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
    mensagemId: novoId
  });
});

// GET /api/contato/mensagens — Listar mensagens de contato (colaboradores vêem todas)
app.get('/api/contato/mensagens', (req, res) => {
  const dados = lerDados();
  const { role, userId } = obterContextoAuth(req);
  const msgs = Array.isArray(dados.contatoMensagens) ? dados.contatoMensagens.slice() : [];
  const sortedMsgs = msgs
    .map((m) => ({
      ...m,
      status: normalizarStatusMensagemContato(m.status),
    }))
    .sort((a, b) => {
      const ta = Date.parse(b.criadoEm) || 0;
      const tb = Date.parse(a.criadoEm) || 0;
      return ta - tb;
    });

  if (ehEquipe(role)) {
    return res.json(sortedMsgs);
  }

  // Clientes só veem mensagens enviadas por seu e-mail (se autenticado)
  const usuario = dados.usuarios.find(u => u.id === userId);
  if (usuario) {
    return res.json(sortedMsgs.filter(m => (m.email || '').toLowerCase() === (usuario.email || '').toLowerCase()));
  }

  // Usuários não autenticados não recebem mensagens
  res.status(403).json({ erro: 'Acesso negado.' });
});

// PUT /api/contato/mensagens/:id — Atualizar status da mensagem (apenas equipe)
app.put('/api/contato/mensagens/:id', (req, res) => {
  const { role } = obterContextoAuth(req);
  if (!ehEquipe(role)) return res.status(403).json({ erro: 'Somente colaboradores podem atualizar mensagens.' });

  const dados = lerDados();
  if (!Array.isArray(dados.contatoMensagens)) dados.contatoMensagens = [];

  const idx = dados.contatoMensagens.findIndex((m) => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Mensagem não encontrada.' });

  const { status } = req.body;
  dados.contatoMensagens[idx] = {
    ...dados.contatoMensagens[idx],
    status: normalizarStatusMensagemContato(status),
    contatadoEm: status === 'contatado' ? new Date().toISOString() : dados.contatoMensagens[idx].contatadoEm,
  };
  salvarDados(dados);

  res.json({ mensagem: 'Status atualizado.', mensagem: dados.contatoMensagens[idx] });
});

// DELETE /api/contato/mensagens/:id — Remover mensagem (apenas equipe)
app.delete('/api/contato/mensagens/:id', (req, res) => {
  const { role } = obterContextoAuth(req);
  if (!ehEquipe(role)) return res.status(403).json({ erro: 'Somente colaboradores podem remover mensagens.' });

  const dados = lerDados();
  if (!Array.isArray(dados.contatoMensagens)) dados.contatoMensagens = [];

  const idx = dados.contatoMensagens.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ erro: 'Mensagem não encontrada.' });

  const removido = dados.contatoMensagens.splice(idx, 1)[0];
  salvarDados(dados);
  res.json({ mensagem: 'Mensagem removida.', mensagem: removido });
});

// ============================================================
// ROTA PRINCIPAL — Servir o frontend
// ============================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Fallback — redireciona para o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================================
// INICIAR O SERVIDOR
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🏥 CESOVAT - Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 API disponível em http://localhost:${PORT}/api`);
  console.log('\nRotas disponíveis:');
  console.log('  POST   /api/auth/login          - Login');
  console.log('  POST   /api/auth/registro        - Registro');
  console.log('  GET    /api/servicos             - Listar serviços');
  console.log('  GET    /api/servicos/:id         - Buscar serviço');
  console.log('  POST   /api/servicos             - Criar serviço');
  console.log('  PUT    /api/servicos/:id         - Atualizar serviço');
  console.log('  DELETE /api/servicos/:id         - Remover serviço');
  console.log('  GET    /api/agendamentos         - Listar agendamentos');
  console.log('  POST   /api/agendamentos         - Criar agendamento');
  console.log('  PUT    /api/agendamentos/:id     - Atualizar agendamento');
  console.log('  DELETE /api/agendamentos/:id     - Remover agendamento');
  console.log('  GET    /api/empresas             - Dados empresas');
  console.log('  GET    /api/sobre                - Dados sobre');
  console.log('  GET    /api/contato              - Dados contato');
  console.log('  GET    /api/estatisticas         - Estatísticas');
  console.log('  POST   /api/contato/mensagem     - Enviar mensagem');
  console.log('\nPressione Ctrl+C para parar o servidor.');
});
