fetch('pgc.json')
  .then(res => {
    if (!res.ok) throw new Error('Erro ao carregar JSON: ' + res.status);
    return res.json();
  })
  .then(data => {
    console.log(data); // conferir no console os dados
    renderData(data);
  })
  .catch(err => {
    document.getElementById('output').textContent = 'Erro ao carregar dados.';
    console.error(err);
  });

function renderData(data) {
  const output = document.getElementById('output');

  // Se for um objeto com propriedades
  output.innerHTML = `
    <p><strong>CONTAMAE:</strong> ${data.CONTAMAE ?? '-'}</p>
    <p><strong>CODIGOMAE:</strong> ${data.CODIGOMAE ?? '-'}</p>
    <p><strong>CONTA:</strong> ${data.CONTA ?? '-'}</p>
    <p><strong>CODIGO:</strong> ${data.CODIGO ?? '-'}</p>
  `;
}
