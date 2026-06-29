function renderOcupacionais(ocupacionais) {
  const container = document.querySelector('.grade-flex');
  if (!container) return;

  container.innerHTML = ocupacionais.map(servico => `
    <div class="coluna-2 cartao-ocupacional">
      <div class="cartao-ocupacional-header">
        <div class="caixa-icone fundo-primario-claro">
          <span class="material-icons-outlined texto-primario">${servico.icone}</span>
        </div>
        <div>
          <h3>${servico.titulo}</h3>
          <p>${servico.descricao}</p>
        </div>
      </div>
      <ul class="lista-exame">
        ${servico.itens.map(item => `
          <li><span class="texto-destaque">✓</span> <span>${item}</span></li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

function renderComplementares(complementares) {
  const secaoComplementares = document.querySelector('.py-16.fundo-cinza .grade-flex');
  if (!secaoComplementares) return;

  secaoComplementares.innerHTML = complementares.map(exame => `
    <div class="coluna-4 cartao-complementar">
      <div class="caixa-icone icone-pequeno fundo-destaque-claro">
        <span class="material-icons-outlined texto-destaque">${exame.icone}</span>
      </div>
      <h3>${exame.titulo}</h3>
      <p>${exame.descricao}</p>
    </div>
  `).join('');
}

function renderDiferenciais(diferenciais) {
  const container = document.querySelector('.diferenciais-lista-itens');
  if (!container) return;

  container.innerHTML = diferenciais.map(item => `
    <li>
      <span class="texto-destaque">✓</span>
      <span>${item}</span>
    </li>
  `).join('');
}

async function loadServicos() {
  try {
    const response = await fetch('http://localhost:3000/api/servicos');
    const data = await response.json();

    if (data) {
      const tituloElement = document.querySelector('.servicos-destaque h1');
      const descElement = document.querySelector('.servicos-destaque p');
      
      if (tituloElement) tituloElement.textContent = data.titulo;
      if (descElement) descElement.textContent = data.descricao;

      if (data.ocupacionais) {
        renderOcupacionais(data.ocupacionais);
      }

      if (data.complementares) {
        renderComplementares(data.complementares);
      }

      if (data.diferenciais) {
        renderDiferenciais(data.diferenciais);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados da página Serviços:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadServicos);