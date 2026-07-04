const API = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/api`;

function getAuthHeaders(extra = {}) {
  const headers = { ...(extra || {}) };
  if (loggedUser) {
    headers['x-user-role'] = loggedUser.role;
    headers['x-user-id'] = loggedUser.id;
  }
  return headers;
}

async function apiFetch(endpoint, options = {}) {
  try {
    const headers = getAuthHeaders(options.headers || {});
    const r = await fetch(`${API}/${endpoint}`, { ...options, headers });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) { console.error('API error:', e); return null; }
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="material-icons-outlined">${type === 'success' ? 'check_circle' : 'error'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openConfirmModal({ title, message, confirmText = 'Excluir', onConfirm }) {
  const existing = document.getElementById('custom-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'custom-confirm-modal';
  modal.className = 'custom-modal-backdrop';
  modal.innerHTML = `
    <div class="custom-modal" role="dialog" aria-modal="true" aria-labelledby="custom-confirm-title">
      <div class="custom-modal-icon">
        <span class="material-icons-outlined">delete_outline</span>
      </div>
      <h3 id="custom-confirm-title">${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="custom-modal-actions">
        <button type="button" class="btn-outline btn-modal-cancel">Cancelar</button>
        <button type="button" class="btn-primary btn-modal-confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.btn-modal-cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('.btn-modal-confirm').addEventListener('click', () => {
    modal.remove();
    onConfirm?.();
  });
}

let currentPage = 'home';
let loggedUser = JSON.parse(localStorage.getItem('cesovat_user') || 'null');
let painelAgendFilter = null;

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderPage(page);
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-page]');
  if (link) { e.preventDefault(); navigateTo(link.dataset.page); }
});

const hamburger = document.getElementById('btn-hamburger');
const navMenu = document.getElementById('nav-menu');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');
  });
}

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

function updateAuthUI() {
  const btn = document.getElementById('btn-login-nav');
  if (!btn) return;
  if (loggedUser) {
    btn.innerHTML = `<span class="material-icons-outlined">account_circle</span> ${loggedUser.nome.split(' ')[0]}`;
    btn.dataset.page = 'painel';
  } else {
    btn.innerHTML = `<span class="material-icons-outlined">login</span> Entrar`;
    btn.dataset.page = 'login';
  }
}

async function renderPage(page) {
  const app = document.getElementById('app-content');
  
  app.style.opacity = '0';
  app.style.transform = 'translateY(15px)';
  app.classList.remove('animate-fade-in');
  
  await new Promise(r => setTimeout(r, 150));

  switch (page) {
    case 'home': await renderHome(app); break;
    case 'sobre': await renderSobre(app); break;
    case 'servicos': await renderServicos(app); break;
    case 'empresas': await renderEmpresas(app); break;
    case 'contato': await renderContato(app); break;
    case 'login': renderLogin(app); break;
    case 'painel': await renderPainel(app); break;
    default: renderHome(app);
  }

  app.style.opacity = '';
  app.style.transform = '';
  app.classList.add('animate-fade-in');
  updateAuthUI();
}

async function renderHome(app) {
  const [servicos, stats] = await Promise.all([apiFetch('servicos'), apiFetch('estatisticas')]);
  const top4 = [...(servicos || [])].reverse().slice(0, 4);

  app.innerHTML = `
    <section class="hero">
      <div class="hero-badge">🏥 Referência em Saúde Ocupacional</div>
      <h1>Cuidamos da <span class="highlight">saúde</span> dos seus colaboradores</h1>
      <p class="hero-desc">Exames ocupacionais, programas de SST e laudos técnicos com agilidade, tecnologia e atendimento humanizado em Garanhuns-PE.</p>
      <div class="hero-actions">
        <button class="btn-primary" data-page="contato"><span class="material-icons-outlined">assignment</span> Solicitar Proposta </button>
        <button class="btn-outline" data-page="servicos"><span class="material-icons-outlined">medical_services</span> Nossos Serviços</button>
      </div>
      <div class="hero-image-container">
        <img src="assets/hero-clinic.png" alt="Consulta Médica Ocupacional" class="hero-img-content">
        <div class="shield-card floating-card">
          <span class="material-icons-outlined shield-icon">verified_user</span>
          <p style="font-weight:700;color:var(--primary);margin-bottom:2px">Saúde & Segurança</p>
          <p style="font-size:13px;color:var(--text-light);font-weight:500">Clínica Credenciada</p>
        </div>
      </div>
    </section>

    <section class="services">
      <h2>Nossos Principais <span class="highlight">Serviços</span></h2>
      <p class="services-sub">Soluções completas em medicina ocupacional e segurança do trabalho</p>
      <div class="services-grid">
        ${top4.map(s => `
          <div class="card" data-page="servicos">
            <div class="icon-wrapper">
              <span class="material-icons-outlined">${s.icone}</span>
            </div>
            <h3>${s.titulo}</h3>
            <p>${s.descricao}</p>
          </div>
        `).join('')}
      </div>
      <button class="btn-view-all" data-page="servicos">Ver Todos os Serviços</button>
    </section>

    ${stats ? `
    <section class="stats">
      <div class="stat-box"><span class="stat-num">${stats.anosExperiencia}+</span><span class="stat-label">Anos de Experiência</span></div>
      <div class="stat-box"><span class="stat-num">${stats.empresasAtendidas}+</span><span class="stat-label">Empresas Atendidas</span></div>
      <div class="stat-box"><span class="stat-num">${(stats.examesRealizados/1000).toFixed(0)}k+</span><span class="stat-label">Exames Realizados</span></div>
    </section>` : ''}

    <section class="cta-section">
      <h2>Pronto para cuidar da saúde da sua equipe?</h2>
      <p>Entre em contato e solicite uma proposta personalizada para sua empresa.</p>
      <button class="btn-primary" data-page="contato"><span class="material-icons-outlined">chat</span> Fale Conosco</button>
    </section>
  `;
}

async function renderSobre(app) {
  const data = await apiFetch('sobre');
  if (!data) { app.innerHTML = '<p style="padding:4rem;text-align:center">Erro ao carregar dados.</p>'; return; }

  app.innerHTML = `
    <section class="page-hero">
      <h1>${data.titulo}</h1>
      <p>${data.descricao}</p>
    </section>

    <section class="section-content">
      <div class="content-block">
        <h2><span class="material-icons-outlined">history</span> Nossa História</h2>
        <div class="historia-text">${data.historia.map(t => `<p>${t}</p>`).join('')}</div>
      </div>

      <div class="missao-visao-grid">
        <div class="info-card">
          <span class="material-icons-outlined card-icon">flag</span>
          <h3>Missão</h3>
          <p>${data.missao}</p>
        </div>
        <div class="info-card">
          <span class="material-icons-outlined card-icon">visibility</span>
          <h3>Visão</h3>
          <p>${data.visao}</p>
        </div>
      </div>

      <h2 class="section-title">Nossos Valores</h2>
      <div class="valores-grid">
        ${data.valores.map(v => `
          <div class="valor-card">
            <div class="icon-wrapper lg"><span class="material-icons-outlined">${v.icone}</span></div>
            <h3>${v.titulo}</h3>
            <p>${v.descricao}</p>
          </div>
        `).join('')}
      </div>

      <h2 class="section-title">Nossa Equipe</h2>
      <ul class="equipe-list">
        ${data.equipe.map(e => `<li><span class="material-icons-outlined">check_circle</span> ${e}</li>`).join('')}
      </ul>
    </section>
  `;
}

async function renderServicos(app) {
  const servicos = await apiFetch('servicos');
  if (!servicos) { app.innerHTML = '<p style="padding:4rem;text-align:center">Erro ao carregar.</p>'; return; }
  const ocup = servicos.filter(s => s.categoria === 'ocupacional');
  const comp = servicos.filter(s => s.categoria === 'complementar');

  app.innerHTML = `
    <section class="page-hero">
      <h1>Nossos <span class="highlight">Serviços</span></h1>
      <p>Exames ocupacionais e complementares com qualidade e agilidade</p>
    </section>

    <section class="section-content">
      <h2 class="section-title"><span class="material-icons-outlined">medical_services</span> Exames Ocupacionais</h2>
      <div class="servicos-ocup-grid">
        ${ocup.map(s => `
          <div class="servico-card">
            <div class="servico-header">
              <div class="icon-wrapper"><span class="material-icons-outlined">${s.icone}</span></div>
              <div><h3>${s.titulo}</h3><span class="servico-meta">${s.duracao} · R$ ${s.preco.toFixed(2)}</span></div>
            </div>
            <p>${s.descricao}</p>
            ${s.itens.length ? `<ul class="servico-itens">${s.itens.map(i => `<li><span class="material-icons-outlined">check</span>${i}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
      </div>

      <h2 class="section-title"><span class="material-icons-outlined">biotech</span> Exames Complementares</h2>
      <div class="complementares-grid">
        ${comp.map(s => `
          <div class="comp-card">
            <div class="icon-wrapper sm"><span class="material-icons-outlined">${s.icone}</span></div>
            <h3>${s.titulo}</h3>
            <p>${s.descricao}</p>
            <span class="comp-meta">${s.duracao} · R$ ${s.preco.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

async function renderEmpresas(app) {
  const data = await apiFetch('empresas');
  if (!data) { app.innerHTML = '<p style="padding:4rem;text-align:center">Erro ao carregar.</p>'; return; }

  app.innerHTML = `
    <section class="page-hero">
      <h1>${data.titulo}</h1>
      <p>${data.subtitulo}</p>
    </section>

    <section class="section-content">
      <div class="empresas-intro-section">
        <div class="empresas-intro-text">
          <h2>Adequação às Normas Regulamentadoras (PGR e PCMSO)</h2>
          <p>O <strong>PCMSO (NR-7)</strong> e o <strong>PGR (NR-1)</strong> são cruciais para mapear os riscos do ambiente corporativo e prescrever exames laboratoriais, clínicos e de imagem adequados para os colaboradores de cada setor.</p>
          <p>Oferecemos a elaboração completa de laudos, consultoria técnica contínua para engenharia de segurança do trabalho e suporte integrado para o envio de eventos de SST no eSocial.</p>
          <button class="btn-primary" data-page="contato"><span class="material-icons-outlined">assignment</span> Solicitar Proposta</button>
        </div>
        <div class="empresas-intro-image">
          <img src="assets/safety-pcmso.png" alt="PGR PCMSO Segurança do Trabalho">
        </div>
      </div>

      <h2 class="section-title">Programas e Laudos</h2>
      <div class="programas-grid">
        ${data.programas.map(p => `
          <div class="programa-card">
            <div class="programa-top">
              <div class="icon-wrapper"><span class="material-icons-outlined">${p.icone}</span></div>
              <h3>${p.titulo}</h3>
              <span class="programa-nome">${p.nomeCompleto}</span>
              <p>${p.descricao}</p>
            </div>
            <ul class="programa-beneficios">
              ${p.beneficios.map(b => `<li><span class="material-icons-outlined">check_circle</span>${b}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <h2 class="section-title">Diferenciais</h2>
      <div class="diferenciais-grid">
        ${data.diferenciais.map(d => `
          <div class="diferencial-card">
            <div class="icon-wrapper"><span class="material-icons-outlined">${d.icone}</span></div>
            <h3>${d.titulo}</h3>
            <p>${d.descricao}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

async function renderContato(app) {
  const data = await apiFetch('contato');
  if (!data) { app.innerHTML = '<p style="padding:4rem;text-align:center">Erro ao carregar.</p>'; return; }
  const whatsNum = data.whatsapp.replace(/\D/g, '');

  app.innerHTML = `
    <section class="page-hero">
      <h1>${data.titulo}</h1>
      <p>${data.descricao}</p>
    </section>

    <section class="section-content">
      <div class="contato-grid">
        <div class="contato-info">
          <div class="contato-card"><span class="material-icons-outlined">location_on</span><div><h4>Endereço</h4><p>${data.endereco.rua}<br>${data.endereco.bairro} - ${data.endereco.cidade}, ${data.endereco.estado}<br>CEP: ${data.endereco.cep}</p></div></div>
          <div class="contato-card"><span class="material-icons-outlined">call</span><div><h4>Telefone</h4><p>${data.telefones.join('<br>')}</p></div></div>
          <div class="contato-card"><span class="material-icons-outlined">mail</span><div><h4>E-mail</h4><p>${data.emails.join('<br>')}</p></div></div>
          <div class="contato-card"><span class="material-icons-outlined">schedule</span><div><h4>Horário</h4><p>${data.horario.replace('\\n', '<br>')}</p></div></div>
          <a href="https://wa.me/55${whatsNum}" target="_blank" class="btn-whatsapp"><span class="material-icons-outlined">chat</span> WhatsApp</a>
        </div>

        <form class="contato-form" id="contato-form">
          <h3>Envie uma Mensagem</h3>
          <input type="text" name="nome" placeholder="Seu nome *" required>
          <input type="email" name="email" placeholder="Seu e-mail *" required>
          <input type="tel" name="telefone" placeholder="Telefone *" required>
          <input type="text" name="empresa" placeholder="Empresa">
          <input type="text" name="assunto" placeholder="Assunto *" required>
          <textarea name="mensagem" placeholder="Sua mensagem *" rows="4" required></textarea>
          <button type="submit" class="btn-primary">Enviar Mensagem</button>
        </form>
      </div>
    </section>
  `;

  document.getElementById('contato-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    try {
      const r = await fetch(`${API}/contato/mensagem`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok) { showToast(d.mensagem); e.target.reset(); } else { showToast(d.erro, 'error'); }
    } catch { showToast('Erro ao enviar mensagem.', 'error'); }
  });
}

function renderLogin(app) {
  if (loggedUser) { navigateTo('painel'); return; }

  app.innerHTML = `
    <section class="login-section">
      <div class="login-card">
        <div class="login-header">
          <span class="material-icons-outlined">local_hospital</span>
          <h2>Acesso ao Sistema</h2>
          <p>Entre com suas credenciais</p>
        </div>
        <form id="login-form">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="login-perfil" style="display:block; margin-bottom:6px; font-weight:600;">Tipo de acesso</label>
            <select id="login-perfil" name="perfil" class="form-control" required>
              <option value="">Selecione</option>
              <option value="cliente">Cliente</option>
              <option value="colaborador">Colaborador CESOVAT</option>
            </select>
          </div>
          <input type="email" name="email" placeholder="E-mail" required>
          <input type="password" name="senha" placeholder="Senha" required>
          <button type="submit" class="btn-primary full">Entrar</button>
        </form>
      </div>
    </section>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd);

    if (payload.perfil === 'cliente') {
      payload.role = 'cliente';
    } else if (payload.perfil === 'colaborador') {
      payload.role = 'colaborador';
    }

    try {
      const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) {
        loggedUser = d.usuario;
        localStorage.setItem('cesovat_user', JSON.stringify(loggedUser));
        showToast(d.mensagem);
        navigateTo('painel');
      } else {
        showToast(d.erro, 'error');
      }
    } catch { showToast('Erro de conexão.', 'error'); }
  });
}

async function renderPainel(app) {
  if (!loggedUser) { navigateTo('login'); return; }

  const isStaff = loggedUser.role === 'admin' || loggedUser.role === 'colaborador';
  const isClient = loggedUser.role === 'cliente';
  
  const [agendamentos, servicos, contatoMensagens] = await Promise.all([
    apiFetch('agendamentos').then(d => d || []),
    apiFetch('servicos').then(d => d || []),
    apiFetch('contato/mensagens').then(d => d || [])
  ]);

  const agendamentosSorted = (agendamentos || []).slice().sort((a, b) => {
    const ta = new Date(`${a.data}T${a.horario}`);
    const tb = new Date(`${b.data}T${b.horario}`);
    return tb - ta;
  });

  let agendamentosFiltered = agendamentosSorted;
  if (isClient) {
    agendamentosFiltered = agendamentosFiltered.filter(a => a.clienteId === loggedUser.id);
  }
  if (painelAgendFilter) {
    agendamentosFiltered = agendamentosFiltered.filter(a => a.status === painelAgendFilter);
  }

  const storageKey = `cesovat_seen_${loggedUser.id || 'anon'}`;
  const seenObj = JSON.parse(localStorage.getItem(storageKey) || '{}');
  const lastSeenAgId = seenObj.lastAgendamentoIdSeen || 0;
  const lastSeenMsgId = seenObj.lastMensagemIdSeen || 0;
  const maxAgId = (agendamentos || []).reduce((m, a) => Math.max(m, a.id || 0), 0);
  const maxMsgId = (contatoMensagens || []).reduce((m, x) => Math.max(m, x.id || 0), 0);
  const unreadAgCount = isStaff ? (agendamentos || []).filter(a => (a.id || 0) > lastSeenAgId).length : 0;
  const unreadMsgCount = isStaff ? (contatoMensagens || []).filter(m => (m.id || 0) > lastSeenMsgId).length : 0;

  function markSeen(type) {
    const cur = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (type === 'agendamentos') cur.lastAgendamentoIdSeen = maxAgId;
    if (type === 'contatos') cur.lastMensagemIdSeen = maxMsgId;
    localStorage.setItem(storageKey, JSON.stringify(cur));
    const tb = document.getElementById('tab-btn-agendamentos');
    if (tb) {
      const b = tb.querySelector('.tab-badge'); if (b) b.remove();
    }
    const tm = document.getElementById('tab-btn-contatos');
    if (tm) {
      const b2 = tm.querySelector('.tab-badge'); if (b2) b2.remove();
    }
  }

  app.innerHTML = `
    <section class="painel-section">
      <div class="painel-header">
        <div>
          <h1>Olá, ${loggedUser.nome.split(' ')[0]}!</h1>
          <p>Cargo: ${loggedUser.cargo} · ${loggedUser.role === 'admin' ? 'Administrador' : loggedUser.role === 'colaborador' ? 'Colaborador CESOVAT' : 'Cliente'}</p>
        </div>
        <button class="btn-outline" id="btn-logout"><span class="material-icons-outlined">logout</span> Sair</button>
      </div>

      ${isStaff ? `` : ''}

      ${isClient ? `
      <div class="form-card" style="margin-bottom: 24px;">
        <h3><span class="material-icons-outlined">event_available</span> Meus Agendamentos</h3>
        <p style="margin-top: 8px; color: var(--text-light);">Você visualiza e gerencia apenas os exames vinculados ao seu perfil.</p>
      </div>
      ` : ''}

      ${isStaff ? `
      <div class="painel-tabs">
        <button class="painel-tab-btn active" id="tab-btn-agendamentos">
          <span class="material-icons-outlined">event</span> Agendamentos ${unreadAgCount ? `<span class="tab-badge">${unreadAgCount}</span>` : ''}
        </button>
        <button class="painel-tab-btn" id="tab-btn-servicos">
          <span class="material-icons-outlined">medical_services</span> Gerenciar Serviços
        </button>
        <button class="painel-tab-btn" id="tab-btn-usuarios">
          <span class="material-icons-outlined">person_add</span> Usuários
        </button>
        <button class="painel-tab-btn" id="tab-btn-contatos">
          <span class="material-icons-outlined">mail</span> Mensagens ${unreadMsgCount ? `<span class="tab-badge">${unreadMsgCount}</span>` : ''}
        </button>
      </div>
      ` : ''}
      <div class="tab-content active" id="tab-content-agendamentos">
        <div class="painel-actions">
          <h2 class="section-title" style="margin: 0">${isStaff ? 'Lista de Agendamentos' : 'Meus Agendamentos'}</h2>
          <button class="btn-primary" id="btn-add-agendamento">
            <span class="material-icons-outlined">calendar_month</span> ${isStaff ? 'Agendar Exame' : 'Novo Agendamento'}
          </button>
        </div>

        <div class="painel-cards" id="agendamentos-stats-cards">
          <div class="painel-stat ${!painelAgendFilter ? 'active' : ''}" data-status="all"><span class="material-icons-outlined">event</span><div><span class="stat-num">${agendamentos.length}</span><span class="stat-label">Agendamentos</span></div></div>
          <div class="painel-stat ${painelAgendFilter === 'pendente' ? 'active' : ''}" data-status="pendente"><span class="material-icons-outlined">pending</span><div><span class="stat-num">${agendamentos.filter(a => a.status === 'pendente').length}</span><span class="stat-label">Pendentes</span></div></div>
          <div class="painel-stat ${painelAgendFilter === 'confirmado' ? 'active' : ''}" data-status="confirmado"><span class="material-icons-outlined">check_circle</span><div><span class="stat-num">${agendamentos.filter(a => a.status === 'confirmado').length}</span><span class="stat-label">Confirmados</span></div></div>
          <div class="painel-stat ${painelAgendFilter === 'cancelado' ? 'active' : ''}" data-status="cancelado"><span class="material-icons-outlined">cancel</span><div><span class="stat-num">${agendamentos.filter(a => a.status === 'cancelado').length}</span><span class="stat-label">Cancelados</span></div></div>
          <div class="painel-stat ${painelAgendFilter === 'realizado' ? 'active' : ''}" data-status="realizado"><span class="material-icons-outlined">done_all</span><div><span class="stat-num">${agendamentos.filter(a => a.status === 'realizado').length}</span><span class="stat-label">Realizados</span></div></div>
        </div>
        <div id="agendamento-form-container" style="display: none; margin-bottom: 30px;">
          <div class="form-card">
            <h3 id="agendamento-form-title"><span class="material-icons-outlined">add_box</span> Agendar Exame</h3>
            <form id="agendamento-form">
              <input type="hidden" id="agendamento-id" name="id">
              
              <div class="form-row">
                <div class="form-group">
                  <label for="agendamento-paciente">Nome do Paciente *</label>
                  <input type="text" class="form-control" id="agendamento-paciente" name="paciente" placeholder="Nome completo do paciente" required>
                </div>
                <div class="form-group">
                  <label for="agendamento-empresa">Empresa *</label>
                  <input type="text" class="form-control" id="agendamento-empresa" name="empresa" placeholder="Empresa do colaborador" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="agendamento-servicoId">Serviço Ocupacional *</label>
                  <select class="form-control" id="agendamento-servicoId" name="servicoId" required>
                    <option value="">Selecione um serviço...</option>
                    ${servicos.map(s => `<option value="${s.id}">${s.titulo} (${s.categoria})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label for="agendamento-data">Data *</label>
                  <input type="date" class="form-control" id="agendamento-data" name="data" required>
                </div>
                <div class="form-group">
                  <label for="agendamento-horario">Horário *</label>
                  <input type="time" class="form-control" id="agendamento-horario" name="horario" required>
                </div>
              </div>

              <div class="form-group">
                <label for="agendamento-status">Status *</label>
                <select class="form-control" id="agendamento-status" name="status" required>
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="realizado">Realizado</option>
                </select>
              </div>

              <div class="form-group">
                <label for="agendamento-observacoes">Observações</label>
                <textarea class="form-control" id="agendamento-observacoes" name="observacoes" rows="2" placeholder="Observações internas..."></textarea>
              </div>

              <div class="btn-group">
                <button type="button" class="btn-outline" id="btn-cancel-agendamento">Cancelar</button>
                <button type="submit" class="btn-primary" id="btn-save-agendamento">Salvar Agendamento</button>
                <button type="button" class="btn-outline" id="btn-back-agendamento" style="display:none">Voltar</button>
              </div>
            </form>
          </div>
        </div>

        <div id="agendamentos-table-wrapper" class="table-wrapper">
          ${agendamentosFiltered.length ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Empresa</th>
                <th>Serviço</th>
                <th>Data/Hora</th>
                <th>Status</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${agendamentosFiltered.map(a => `
                <tr>
                  <td><strong>${a.paciente}</strong></td>
                  <td>${a.empresa}</td>
                  <td>${a.nomeServico}</td>
                      <td>${a.data} às ${a.horario}</td>
                  <td><span class="badge badge-${a.status}">${a.status}</span></td>
                  <td style="font-size: 13px; color: var(--text-light); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${a.observacoes || ''}">
                    ${a.observacoes || '<span style="color:var(--text-muted)">-</span>'}
                  </td>
                  <td>
                    <div class="actions-cell">
                      ${a.status === 'pendente' ? `
                        <button class="btn-action confirm" data-id="${a.id}" title="Confirmar Agendamento">
                          <span class="material-icons-outlined">check</span>
                        </button>
                        <button class="btn-action cancel" data-id="${a.id}" title="Cancelar Agendamento">
                          <span class="material-icons-outlined">close</span>
                        </button>
                      ` : ''}
                      <button class="btn-action edit" data-id="${a.id}" title="${a.status === 'realizado' ? 'Visualizar Agendamento' : 'Editar Agendamento'}">
                        <span class="material-icons-outlined">${a.status === 'realizado' ? 'visibility' : 'edit'}</span>
                      </button>
                      <button class="btn-action delete" data-id="${a.id}" title="Excluir Agendamento">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : '<p style="text-align:center;padding:2rem;color:#666">Nenhum agendamento encontrado.</p>'}
        </div>
      </div>

      ${isStaff ? `
      <div class="tab-content" id="tab-content-servicos">
        <div class="painel-actions">
          <h2 class="section-title" style="margin: 0">Serviços Cadastrados</h2>
          <button class="btn-primary" id="btn-add-servico">
            <span class="material-icons-outlined">add</span> Cadastrar Novo Serviço
          </button>
        </div>
        <div id="service-form-container" style="display: none; margin-bottom: 30px;">
          <div class="form-card">
            <h3 id="form-title"><span class="material-icons-outlined">add_box</span> Novo Serviço</h3>
            <form id="service-form">
              <input type="hidden" id="service-id" name="id">
              
              <div class="form-row">
                <div class="form-group">
                  <label for="service-titulo">Título *</label>
                  <input type="text" class="form-control" id="service-titulo" name="titulo" placeholder="Ex: Exame Admissional" required>
                </div>
                <div class="form-group">
                  <label for="service-categoria">Categoria *</label>
                  <select class="form-control" id="service-categoria" name="categoria" required>
                    <option value="ocupacional">Ocupacional</option>
                    <option value="complementar">Complementar</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="service-descricao">Descrição *</label>
                <textarea class="form-control" id="service-descricao" name="descricao" rows="3" placeholder="Insira uma breve descrição sobre o serviço..." required></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="service-preco">Preço (R$) *</label>
                  <input type="number" step="0.01" class="form-control" id="service-preco" name="preco" placeholder="Ex: 120.00" required>
                </div>
                <div class="form-group">
                  <label for="service-duracao">Duração *</label>
                  <input type="text" class="form-control" id="service-duracao" name="duracao" placeholder="Ex: 45 min" required>
                </div>
                <div class="form-group">
                  <label for="service-icone">Ícone (Material Icons) *</label>
                  <select class="form-control" id="service-icone" name="icone" required>
                    <option value="medical_services">Maleta Médica (medical_services)</option>
                    <option value="person_add">Adicionar Pessoa (person_add)</option>
                    <option value="sync">Sincronizar/Periódico (sync)</option>
                    <option value="person_remove">Remover Pessoa (person_remove)</option>
                    <option value="swap_horiz">Troca de Função (swap_horiz)</option>
                    <option value="healing">Recuperação (healing)</option>
                    <option value="hearing">Audição/Audiometria (hearing)</option>
                    <option value="visibility">Visão/Acuidade (visibility)</option>
                    <option value="biotech">Laboratório (biotech)</option>
                    <option value="shield">Escudo (shield)</option>
                    <option value="article">Laudo (article)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="service-itens">Itens Inclusos / Detalhes (separados por vírgula)</label>
                <input type="text" class="form-control" id="service-itens" name="itens" placeholder="Ex: Anamnese ocupacional, Exame clínico completo, Emissão de ASO">
              </div>

              <div class="btn-group">
                <button type="button" class="btn-outline" id="btn-cancel-service">Cancelar</button>
                <button type="submit" class="btn-primary" id="btn-save-service">Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>

        <div id="services-table-wrapper" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ícone</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Duração</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${servicos.length ? servicos.map(s => `
                <tr>
                  <td><span class="material-icons-outlined" style="color:var(--primary)">${s.icone}</span></td>
                  <td><strong>${s.titulo}</strong></td>
                  <td><span class="badge" style="background:var(--primary-light);color:var(--primary)">${s.categoria}</span></td>
                  <td>R$ ${(s.preco || 0).toFixed(2)}</td>
                  <td>${s.duracao || 'A definir'}</td>
                  <td>
                    <div class="actions-cell">
                      <button class="btn-action edit" data-id="${s.id}" title="Editar Serviço">
                        <span class="material-icons-outlined">edit</span>
                      </button>
                      <button class="btn-action delete" data-id="${s.id}" title="Excluir Serviço">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align:center;padding:2rem;color:#666">Nenhum serviço cadastrado.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
      <div class="tab-content" id="tab-content-usuarios">
        <div class="painel-actions">
          <h2 class="section-title" style="margin: 0">Cadastrar Novo Usuário</h2>
        </div>
        <div class="form-card" style="margin-top:12px;">
          <p style="margin-top: 8px; color: var(--text-light);">Somente administradores podem criar contas para novos colaboradores.</p>
          <form id="usuario-form">
            <div class="form-row">
              <div class="form-group">
                <label for="usuario-nome">Nome completo *</label>
                <input type="text" class="form-control" id="usuario-nome" name="nome" placeholder="Nome do usuário" required>
              </div>
              <div class="form-group">
                <label for="usuario-email">E-mail *</label>
                <input type="email" class="form-control" id="usuario-email" name="email" placeholder="usuario@empresa.com.br" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="usuario-senha">Senha *</label>
                <input type="password" class="form-control" id="usuario-senha" name="senha" placeholder="Defina uma senha" required>
              </div>
              <div class="form-group">
                <label for="usuario-cargo">Cargo *</label>
                <input type="text" class="form-control" id="usuario-cargo" name="cargo" placeholder="Ex.: Assistente Administrativo" required>
              </div>
            </div>

            <div class="form-group">
              <label for="usuario-role">Tipo de usuário *</label>
              <select class="form-control" id="usuario-role" name="role" required>
                <option value="">Selecione</option>
                <option value="cliente">Cliente</option>
                <option value="colaborador">Colaborador CESOVAT</option>
              </select>
            </div>

            <div class="btn-group">
              <button type="submit" class="btn-primary">Cadastrar Usuário</button>
            </div>
          </form>
        </div>
      </div>
      ` : ''}
    </section>
  `;

  const tabBtnAgendamentos = document.getElementById('tab-btn-agendamentos');
  const tabBtnServicos = document.getElementById('tab-btn-servicos');
  const tabBtnUsuarios = document.getElementById('tab-btn-usuarios');
  const tabContentAgendamentos = document.getElementById('tab-content-agendamentos');
  const tabContentServicos = document.getElementById('tab-content-servicos');
  const tabContentUsuarios = document.getElementById('tab-content-usuarios');

  const btnAddServico = document.getElementById('btn-add-servico');
  const btnCancelService = document.getElementById('btn-cancel-service');
  const serviceFormContainer = document.getElementById('service-form-container');
  const servicesTableWrapper = document.getElementById('services-table-wrapper');
  const serviceForm = document.getElementById('service-form');
  const usuarioForm = document.getElementById('usuario-form');

  const tabBtnContatos = document.getElementById('tab-btn-contatos');
  let tabContentContatos = document.getElementById('tab-content-contatos');
  if (tabBtnContatos && isStaff) {
    if (!tabContentContatos) {
      tabContentContatos = document.createElement('div');
      tabContentContatos.className = 'tab-content';
      tabContentContatos.id = 'tab-content-contatos';
      tabContentContatos.innerHTML = `
        <div class="painel-actions">
          <h2 class="section-title" style="margin: 0">Mensagens de Contato</h2>
        </div>
        <div id="mensagem-detalhes" class="form-card" style="display:none; margin-bottom:16px;"></div>
        <div id="contatos-table-wrapper" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Empresa</th>
                <th>Assunto</th>
                <th>Mensagem</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${contatoMensagens.length ? contatoMensagens.map(m => `
                <tr>
                  <td><strong>${escapeHtml(m.nome)}</strong></td>
                  <td>${escapeHtml(m.email)}</td>
                  <td>${escapeHtml(m.telefone)}</td>
                  <td>${m.empresa ? escapeHtml(m.empresa) : '<span style="color:var(--text-muted)">-</span>'}</td>
                  <td>${escapeHtml(m.assunto)}</td>
                  <td style="max-width:320px; white-space:pre-wrap; word-break:break-word;">${escapeHtml(m.mensagem).replace(/\n/g, '<br>')}</td>
                  <td><span class="badge badge-${(m.status || 'pendente') === 'contatado' ? 'confirmado' : 'pendente'}">${(m.status || 'pendente') === 'contatado' ? 'Contatado' : 'Pendente'}</span></td>
                  <td><div class="actions-cell">
                    <button class="btn-action view-contato" data-id="${m.id}" title="Visualizar mensagem"><span class="material-icons-outlined">visibility</span></button>
                    <button class="btn-action contact-contato" data-id="${m.id}" title="Marcar como contatado"><span class="material-icons-outlined">check_circle</span></button>
                    <button class="btn-action delete-contato" data-id="${m.id}" title="Excluir Mensagem"><span class="material-icons-outlined">delete</span></button>
                  </div></td>
                </tr>
              `).join('') : `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#666">Nenhuma mensagem recebida.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;

      const servicosTab = document.getElementById('tab-content-servicos');
      if (servicosTab && servicosTab.parentNode) servicosTab.parentNode.insertBefore(tabContentContatos, servicosTab.nextSibling);
      else {
        const section = document.querySelector('.painel-section');
        if (section) section.appendChild(tabContentContatos);
      }
    }
  }

  const btnAddAgendamento = document.getElementById('btn-add-agendamento');
  const btnCancelAgendamento = document.getElementById('btn-cancel-agendamento');
  const agendamentoFormContainer = document.getElementById('agendamento-form-container');
  const agendamentosTableWrapper = document.getElementById('agendamentos-table-wrapper');
  const agendamentosStatsCards = document.getElementById('agendamentos-stats-cards');
  const agendamentoForm = document.getElementById('agendamento-form');
  const agendamentoHorarioInput = document.getElementById('agendamento-horario');
  const agendamentoStatusField = document.getElementById('agendamento-status');
  const agendamentoEmpresaInput = document.getElementById('agendamento-empresa');
  const btnSaveAgendamento = document.getElementById('btn-save-agendamento');
  const btnBackAgendamento = document.getElementById('btn-back-agendamento');

  function activateTab(name) {
    const btns = {
      agendamentos: tabBtnAgendamentos,
      servicos: tabBtnServicos,
      usuarios: tabBtnUsuarios,
      contatos: tabBtnContatos
    };
    const contents = {
      agendamentos: tabContentAgendamentos,
      servicos: tabContentServicos,
      usuarios: tabContentUsuarios,
      contatos: document.getElementById('tab-content-contatos')
    };

    Object.keys(btns).forEach(k => { if (btns[k]) btns[k].classList.toggle('active', k === name); });
    Object.keys(contents).forEach(k => { if (contents[k]) contents[k].classList.toggle('active', k === name); });
  }

  if (tabBtnAgendamentos) tabBtnAgendamentos.addEventListener('click', () => { activateTab('agendamentos'); markSeen('agendamentos'); });
  if (tabBtnServicos) tabBtnServicos.addEventListener('click', () => activateTab('servicos'));
  if (tabBtnUsuarios) tabBtnUsuarios.addEventListener('click', () => activateTab('usuarios'));
  if (tabBtnContatos) tabBtnContatos.addEventListener('click', () => { activateTab('contatos'); markSeen('contatos'); });

  if (!isStaff) {
    document.querySelectorAll('#tab-content-agendamentos .btn-action.confirm, #tab-content-agendamentos .btn-action.cancel, #tab-content-agendamentos .btn-action.delete, #tab-content-servicos .btn-action.edit, #tab-content-servicos .btn-action.delete').forEach(btn => {
      btn.style.display = 'none';
    });

    if (agendamentoStatusField) {
      agendamentoStatusField.disabled = true;
      agendamentoStatusField.value = 'pendente';
      const statusGroup = agendamentoStatusField.closest('.form-group');
      if (statusGroup) statusGroup.style.display = 'none';
    }

    if (agendamentoHorarioInput) {
      agendamentoHorarioInput.setAttribute('min', '07:00');
      agendamentoHorarioInput.setAttribute('max', '18:00');
    }
  }

  const agendamentosTab = document.getElementById('tab-content-agendamentos');
  if (agendamentosTab) {
    agendamentosTab.addEventListener('click', async (event) => {
      const btn = event.target.closest('.btn-action');
      if (!btn) return;

      const id = btn.dataset.id;
      if (!id) return;

      if (btn.classList.contains('confirm')) {
        event.preventDefault();
        try {
          const r = await fetch(`${API}/agendamentos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ status: 'confirmado' })
          });
          if (r.ok) {
            showToast('Agendamento confirmado com sucesso!');
            await renderPainel(app);
          } else {
            const err = await r.json();
            showToast(err.erro || 'Erro ao confirmar agendamento.', 'error');
          }
        } catch {
          showToast('Erro de conexão.', 'error');
        }
        return;
      }

      if (btn.classList.contains('cancel')) {
        event.preventDefault();
        try {
          const r = await fetch(`${API}/agendamentos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ status: 'cancelado' })
          });
          if (r.ok) {
            showToast('Agendamento cancelado.');
            await renderPainel(app);
          } else {
            const err = await r.json();
            showToast(err.erro || 'Erro ao cancelar agendamento.', 'error');
          }
        } catch {
          showToast('Erro de conexão.', 'error');
        }
        return;
      }

      if (btn.classList.contains('edit')) {
        event.preventDefault();
        const agend = agendamentos.find(a => a.id === parseInt(id));
        if (!agend) return;

        document.getElementById('agendamento-form-title').innerHTML = '<span class="material-icons-outlined">edit</span> Editar Agendamento';
        document.getElementById('agendamento-id').value = agend.id;
        document.getElementById('agendamento-paciente').value = agend.paciente;
        document.getElementById('agendamento-empresa').value = agend.empresa;
        document.getElementById('agendamento-servicoId').value = agend.servicoId;
        document.getElementById('agendamento-data').value = agend.data;
        document.getElementById('agendamento-horario').value = agend.horario;
        document.getElementById('agendamento-status').value = isStaff ? agend.status : 'pendente';
        document.getElementById('agendamento-observacoes').value = agend.observacoes || '';
        if (!isStaff && agendamentoStatusField) {
          agendamentoStatusField.disabled = true;
        }

        if (agend.status === 'realizado') {
          if (btnSaveAgendamento) btnSaveAgendamento.style.display = 'none';
          if (btnCancelAgendamento) btnCancelAgendamento.style.display = 'none';
          if (btnBackAgendamento) btnBackAgendamento.style.display = 'inline-flex';
          agendamentoForm.querySelectorAll('input,select,textarea').forEach(el => el.disabled = true);
        } else {
          if (btnSaveAgendamento) btnSaveAgendamento.style.display = '';
          if (btnCancelAgendamento) btnCancelAgendamento.style.display = 'inline-flex';
          if (btnBackAgendamento) btnBackAgendamento.style.display = 'none';
          agendamentoForm.querySelectorAll('input,select,textarea').forEach(el => el.disabled = false);
          if (!isStaff && agendamentoStatusField) agendamentoStatusField.disabled = true;
        }

        agendamentoFormContainer.style.display = 'block';
        agendamentosTableWrapper.style.display = 'none';
        agendamentosStatsCards.style.display = 'none';
        return;
      }

      if (btn.classList.contains('delete')) {
        event.preventDefault();
        openConfirmModal({
          title: 'Excluir Agendamento',
          message: 'Deseja realmente excluir este agendamento? Esta ação não pode ser desfeita.',
          onConfirm: async () => {
            try {
              const r = await fetch(`${API}/agendamentos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
              const d = await r.json();
              if (r.ok) {
                showToast(d.mensagem || 'Agendamento excluído com sucesso.');
                await renderPainel(app);
              } else {
                showToast(d.erro || 'Erro ao excluir agendamento.', 'error');
              }
            } catch {
              showToast('Erro de conexão.', 'error');
            }
          }
        });
        return;
      }
    });
  }

  if (!isStaff) {
    if (btnAddAgendamento) btnAddAgendamento.style.display = 'inline-flex';
  }

  btnAddAgendamento.addEventListener('click', () => {
    document.getElementById('agendamento-form-title').innerHTML = '<span class="material-icons-outlined">add_box</span> Novo Agendamento';
    agendamentoForm.reset();
    document.getElementById('agendamento-id').value = '';
    if (agendamentoStatusField) {
      agendamentoStatusField.value = 'pendente';
      if (!isStaff) {
        agendamentoStatusField.disabled = true;
      }
    }
    if (btnSaveAgendamento) btnSaveAgendamento.style.display = '';
    if (btnCancelAgendamento) btnCancelAgendamento.style.display = 'inline-flex';
    if (btnBackAgendamento) btnBackAgendamento.style.display = 'none';

    agendamentoForm.querySelectorAll('input,select,textarea').forEach(el => el.disabled = false);

    agendamentoFormContainer.style.display = 'block';
    agendamentosTableWrapper.style.display = 'none';
    agendamentosStatsCards.style.display = 'none';
  });

    const statCards = document.querySelectorAll('#agendamentos-stats-cards .painel-stat');
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        const s = card.dataset.status;
        painelAgendFilter = (s === 'all') ? null : s;
        renderPainel(app);
      });
    });

  if (isClient && agendamentoEmpresaInput) {
    btnAddAgendamento.addEventListener('click', () => {
      const prev = agendamentos.find(a => a.clienteId === loggedUser.id && a.empresa);
      if (prev) {
        agendamentoEmpresaInput.value = prev.empresa;
        return;
      }

      const email = (loggedUser && loggedUser.email) ? loggedUser.email : '';
      const domain = email.split('@')[1];
      if (domain) {
        const comp = domain.split('.')[0].replace(/[-.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        agendamentoEmpresaInput.value = comp;
      }
    });
  }

  btnCancelAgendamento.addEventListener('click', () => {
    agendamentoFormContainer.style.display = 'none';
    agendamentosTableWrapper.style.display = 'block';
    agendamentosStatsCards.style.display = 'grid';
  });

  if (btnBackAgendamento) {
    btnBackAgendamento.addEventListener('click', () => {
      agendamentoFormContainer.style.display = 'none';
      agendamentosTableWrapper.style.display = 'block';
      agendamentosStatsCards.style.display = 'grid';
    });
  }

  agendamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('agendamento-id').value;
    const paciente = document.getElementById('agendamento-paciente').value;
    const empresa = document.getElementById('agendamento-empresa').value;
    const servicoId = parseInt(document.getElementById('agendamento-servicoId').value);
    const data = document.getElementById('agendamento-data').value;
    const horario = document.getElementById('agendamento-horario').value;
    const status = document.getElementById('agendamento-status').value;
    const observacoes = document.getElementById('agendamento-observacoes').value;

    if (!isStaff && horario && (horario < '07:00' || horario > '18:00')) {
      showToast('O horário do agendamento deve estar entre 07:00 e 18:00.', 'error');
      return;
    }

    const body = { paciente, empresa, servicoId, data, horario, status: isStaff ? status : 'pendente', observacoes };

    try {
      let r;
      if (id) {
        r = await fetch(`${API}/agendamentos/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(body)
        });
      } else {
        r = await fetch(`${API}/agendamentos`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(body)
        });
      }

      const d = await r.json();
      if (r.ok) {
        showToast(d.mensagem || 'Agendamento salvo com sucesso!');
        agendamentoFormContainer.style.display = 'none';
        agendamentosTableWrapper.style.display = 'block';
        agendamentosStatsCards.style.display = 'grid';
        await renderPainel(app);
      } else {
        showToast(d.erro || 'Erro ao salvar agendamento.', 'error');
      }
    } catch {
      showToast('Erro de conexão.', 'error');
    }
  });

  document.querySelectorAll('#tab-content-contatos .btn-action.view-contato').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const msg = contatoMensagens.find((m) => m.id === id);
      const detalhes = document.getElementById('mensagem-detalhes');
      if (!msg || !detalhes) return;

      detalhes.style.display = 'block';
      detalhes.innerHTML = `
        <h3 style="margin-bottom:8px;"><span class="material-icons-outlined">mail</span> Detalhes da mensagem</h3>
        <p><strong>Nome:</strong> ${escapeHtml(msg.nome)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(msg.email)}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(msg.telefone)}</p>
        <p><strong>Empresa:</strong> ${escapeHtml(msg.empresa || '-')}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(msg.assunto)}</p>
        <p><strong>Mensagem:</strong><br>${escapeHtml(msg.mensagem).replace(/\n/g, '<br>')}</p>
        <p><strong>Recebida em:</strong> ${new Date(msg.criadoEm).toLocaleString('pt-BR')}</p>
        <p><strong>Status:</strong> ${(msg.status || 'pendente') === 'contatado' ? 'Contatado' : 'Pendente'}</p>
      `;
      detalhes.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('#tab-content-contatos .btn-action.contact-contato').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const r = await fetch(`${API}/contato/mensagens/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status: 'contatado' })
        });
        const d = await r.json();
        if (r.ok) {
          showToast('Contato com o cliente marcado como realizado.');
          await renderPainel(app);
        } else {
          showToast(d.erro || 'Erro ao atualizar mensagem.', 'error');
        }
      } catch {
        showToast('Erro de conexão.', 'error');
      }
    });
  });

  document.querySelectorAll('#tab-content-contatos .btn-action.delete-contato').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      openConfirmModal({
        title: 'Excluir mensagem',
        message: 'Deseja realmente excluir esta mensagem de contato?',
        onConfirm: async () => {
          try {
            const r = await fetch(`${API}/contato/mensagens/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            const d = await r.json();
            if (r.ok) {
              showToast(d.mensagem || 'Mensagem removida.');
              await renderPainel(app);
            } else {
              showToast(d.erro || 'Erro ao remover mensagem.', 'error');
            }
          } catch {
            showToast('Erro de conexão.', 'error');
          }
        }
      });
    });
  });

  if (!isStaff && btnAddServico) {
    btnAddServico.style.display = 'none';
  }

  if (btnAddServico && btnCancelService && serviceFormContainer && servicesTableWrapper && serviceForm) {
    btnAddServico.addEventListener('click', () => {
      document.getElementById('form-title').innerHTML = '<span class="material-icons-outlined">add_box</span> Novo Serviço';
      serviceForm.reset();
      document.getElementById('service-id').value = '';
      serviceFormContainer.style.display = 'block';
      servicesTableWrapper.style.display = 'none';
    });

    btnCancelService.addEventListener('click', () => {
      serviceFormContainer.style.display = 'none';
      servicesTableWrapper.style.display = 'block';
    });

    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('service-id').value;
      const titulo = document.getElementById('service-titulo').value;
      const categoria = document.getElementById('service-categoria').value;
      const descricao = document.getElementById('service-descricao').value;
      const preco = parseFloat(document.getElementById('service-preco').value);
      const duracao = document.getElementById('service-duracao').value;
      const icone = document.getElementById('service-icone').value;
      const itensInput = document.getElementById('service-itens').value;

      const itens = itensInput ? itensInput.split(',').map(i => i.trim()).filter(i => i.length > 0) : [];
      const body = { titulo, categoria, descricao, preco, duracao, icone, itens };

      try {
        let r;
        if (id) {
          r = await fetch(`${API}/servicos/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body)
          });
        } else {
          r = await fetch(`${API}/servicos`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body)
          });
        }

        const d = await r.json();
        if (r.ok) {
          showToast(d.mensagem || 'Serviço salvo com sucesso!');
          serviceFormContainer.style.display = 'none';
          servicesTableWrapper.style.display = 'block';
          await renderPainel(app);
          document.getElementById('tab-btn-servicos').click();
        } else {
          showToast(d.erro || 'Erro ao salvar serviço.', 'error');
        }
      } catch {
        showToast('Erro de conexão.', 'error');
      }
    });
  }

  document.querySelectorAll('#tab-content-servicos .btn-action.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const serv = servicos.find(s => s.id === id);
      if (!serv) return;

      document.getElementById('form-title').innerHTML = '<span class="material-icons-outlined">edit</span> Editar Serviço';
      document.getElementById('service-id').value = serv.id;
      document.getElementById('service-titulo').value = serv.titulo;
      document.getElementById('service-categoria').value = serv.categoria;
      document.getElementById('service-descricao').value = serv.descricao;
      document.getElementById('service-preco').value = serv.preco || 0;
      document.getElementById('service-duracao').value = serv.duracao || '';
      document.getElementById('service-icone').value = serv.icone || 'medical_services';
      document.getElementById('service-itens').value = (serv.itens || []).join(', ');

      serviceFormContainer.style.display = 'block';
      servicesTableWrapper.style.display = 'none';
    });
  });

  document.querySelectorAll('#tab-content-servicos .btn-action.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openConfirmModal({
        title: 'Excluir serviço',
        message: 'Deseja realmente excluir este serviço? Esta ação não pode ser desfeita.',
        onConfirm: async () => {
          try {
            const r = await fetch(`${API}/servicos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            const d = await r.json();
            if (r.ok) {
              showToast(d.mensagem || 'Serviço excluído.');
              await renderPainel(app);
              document.getElementById('tab-btn-servicos').click();
            } else {
              showToast(d.erro || 'Erro ao excluir serviço.', 'error');
            }
          } catch {
            showToast('Erro de conexão.', 'error');
          }
        }
      });
    });
  });

  if (usuarioForm) {
    usuarioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd);

      try {
        const r = await fetch(`${API}/auth/registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, criadorRole: loggedUser.role })
        });
        const d = await r.json();

        if (r.ok) {
          showToast(d.mensagem || 'Usuário cadastrado com sucesso!');
          e.target.reset();
        } else {
          showToast(d.erro || 'Não foi possível cadastrar o usuário.', 'error');
        }
      } catch {
        showToast('Erro de conexão ao cadastrar usuário.', 'error');
      }
    });
  }

  document.getElementById('btn-logout').addEventListener('click', () => {
    loggedUser = null; 
    localStorage.removeItem('cesovat_user');
    showToast('Logout realizado!'); 
    navigateTo('home');
  });
}

updateAuthUI();
renderPage('home');
