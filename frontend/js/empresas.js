function renderProgramas(programas) {
  const container = document.querySelector('.grade-programas');
  if (!container) return;

  container.innerHTML = programas.map(programa => `
    <div class="cartao-programa">
      <div class="programa-info">
        <div class="flex-topo">
          <div class="caixa-icone fundo-primario-claro">
            <span class="material-icons-outlined texto-primario">${programa.icone}</span>
          </div>
          <div class="texto-programa">
            <h3>${programa.titulo}</h3>
            <span class="nome-completo">${programa.nomeCompleto}</span>
            <p>${programa.descricao}</p>
          </div>
        </div>
      </div>
      <div class="programa-beneficios fundo-branco-puro">
        <h4>Benefícios</h4>
        <ul class="lista-beneficios">
          ${programa.beneficios.map(beneficio => `
            <li><span class="texto-destaque">✓</span> ${beneficio}</li>
          `).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

function renderDiferenciais(diferenciais) {
  const container = document.querySelector('.grade-diferenciais');
  if (!container) return;

  container.innerHTML = diferenciais.map(diferencial => `
    <div class="cartao-diferencial">
      <div class="caixa-icone fundo-destaque-claro">
        <span class="material-icons-outlined texto-destaque">${diferencial.icone}</span>
      </div>
      <h3>${diferencial.titulo}</h3>
      <p>${diferencial.descricao}</p>
    </div>
  `).join('');
}

function renderPassos(passos) {
  const container = document.querySelector('.grade-passos');
  if (!container) return;

  const descricoes = [
    'Entre em contato e agende uma reunião',
    'Análise das necessidades da sua empresa',
    'Elaboração de proposta personalizada',
    'Início dos serviços e acompanhamento'
  ];

  container.innerHTML = passos.map((passo, index) => `
    <div class="cartao-passo">
      <div class="numero-passo">${index + 1}</div>
      <h3>${passo}</h3>
      <p>${descricoes[index] || ''}</p>
    </div>
  `).join('');
}

async function loadEmpresas() {
  try {
    const response = await fetch('http://localhost:3000/api/empresas');
    const data = await response.json();

    if (data) {

      const tituloElement = document.querySelector('.destaque-conteudo h1');
      const descElement = document.querySelector('.destaque-conteudo p');
      
      if (tituloElement) tituloElement.textContent = data.titulo;
      if (descElement) descElement.textContent = data.subtitulo;

      if (data.programas) {
        renderProgramas(data.programas);
      }

      if (data.diferenciais) {
        renderDiferenciais(data.diferenciais);
      }

      if (data.passos) {
        renderPassos(data.passos);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados da página Empresas:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadEmpresas);