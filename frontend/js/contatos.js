async function loadContato() {
  try {
    const response = await fetch('http://localhost:3000/api/contato');
    const data = await response.json();

    if (data) {

      const tituloElement = document.querySelector('.destaque-conteudo h1');
      const descElement = document.querySelector('.destaque-conteudo p');
      
      if (tituloElement) tituloElement.textContent = data.titulo;
      if (descElement) descElement.textContent = data.descricao;

      const enderecoElement = document.querySelector('.cartao-info-contato:first-child p');
      if (enderecoElement && data.endereco) {
        enderecoElement.innerHTML = `
          ${data.endereco.rua}<br>
          ${data.endereco.bairro} - ${data.endereco.cidade}, ${data.endereco.estado}<br>
          CEP: ${data.endereco.cep}
        `;
      }

      const telefoneElement = document.querySelector('.cartao-info-contato:nth-child(2) p');
      if (telefoneElement && data.telefones) {
        telefoneElement.innerHTML = data.telefones.map(tel => `${tel}<br>`).join('');
      }

      const emailElement = document.querySelector('.cartao-info-contato:nth-child(3) p');
      if (emailElement && data.emails) {
        emailElement.innerHTML = data.emails.map(email => `${email}<br>`).join('');
      }

      const horarioElement = document.querySelector('.cartao-info-contato:last-child p');
      if (horarioElement && data.horario) {
        horarioElement.innerHTML = data.horario.replace('\n', '<br>');
      }

      const whatsappLink = document.querySelector('.btn-whatsapp');
      if (whatsappLink && data.whatsapp) {
        const numero = data.whatsapp.replace(/\D/g, '');
        whatsappLink.href = `https://wa.me/55${numero}`;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados da página Contato:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadContato);