function renderHistoria(historia) {
  const container = document.querySelector('.historia-text');
  if (!container) return;

  container.innerHTML = historia.map(texto => `
    <p>${texto}</p>
  `).join('');
}

function renderValores(valores) {
  const container = document.querySelector('.flex-3-colunas');
  if (!container) return;

  container.innerHTML = valores.map(valor => `
    <div class="cartao-valor">
      <div class="caixa-icone icone-valor arredondado-total">
        <span class="material-icons-outlined texto-primario">${valor.icone}</span>
      </div>
      <h3>${valor.titulo}</h3>
      <p>${valor.descricao}</p>
    </div>
  `).join('');
}

function renderEquipe(equipe) {
  const container = document.querySelector('.equipe-lista');
  if (!container) return;

  container.innerHTML = equipe.map(item => `
    <li>
      <span class="texto-destaque icone-check">✓</span>
      <span>${item}</span>
    </li>
  `).join('');
}

async function loadSobre() {
  try {
    const response = await fetch('http://localhost:3000/api/sobre');
    const data = await response.json();

    if (data) {

      const tituloElement = document.querySelector('.hero-conteudo h1');
      const descElement = document.querySelector('.hero-conteudo p');
      
      if (tituloElement) tituloElement.textContent = data.titulo;
      if (descElement) descElement.textContent = data.descricao;

      if (data.historia) {
        renderHistoria(data.historia);
      }

      const missaoElement = document.querySelector('.cartao-info:first-child p');
      const visaoElement = document.querySelector('.cartao-info:last-child p');
      
      if (missaoElement) missaoElement.textContent = data.missao;
      if (visaoElement) visaoElement.textContent = data.visao;

      if (data.valores) {
        renderValores(data.valores);
      }

      if (data.equipe) {
        renderEquipe(data.equipe);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados da página Sobre:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadSobre);