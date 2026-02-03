fetch('pgc.json')
  .then(res => {
    if (!res.ok) throw new Error('Erro ao carregar JSON: ' + res.status);
    return res.json();
  })
  .then(data => renderData(data))
  .catch(err => {
    document.getElementById('output').textContent = 'Erro ao carregar dados.';
    console.error(err);
  });

function renderData(data) {
  const output = document.getElementById('output');
  
  let html = '';

  data.forEach(item => {
    html += `
      <div class="card">
        <p><strong>CLASSE:</strong> ${item.CLASSE}</p>
        <p><strong>CONTA:</strong> ${item.CONTA}</p>
        <p><strong>CONTAMAE:</strong> ${item.CONTAMAE}</p>
        <p><strong>CODIGO:</strong> ${item.CODIGO}</p>
        <p><strong>CODIGOMAE:</strong> ${item.CODIGOMAE}</p>
        <p><strong>GRAU:</strong> ${item.GRAU}</p>
      </div>
      <hr>
    `;
  });

  output.innerHTML = html;
}
