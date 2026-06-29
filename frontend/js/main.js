const API_URL = 'http://localhost:3000/api';

async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return null;
  }
}

async function loadPageData(page) {
  const data = await fetchData(page);
  return data;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchData, loadPageData };
}