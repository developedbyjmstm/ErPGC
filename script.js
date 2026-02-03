fetch('pgc.json')
  .then(res => {
    if (!res.ok) throw new Error('Erro ao carregar JSON: ' + res.status);
    return res.json();
  })
  .then(data => renderHierarchical(data))
  .catch(err => {
    document.getElementById('output').textContent = 'Erro ao carregar dados.';
    console.error(err);
  });

function renderHierarchical(data) {
  const output = document.getElementById('output');

  // Agrupa por CLASSE
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.CLASSE]) grouped[item.CLASSE] = [];
    grouped[item.CLASSE].push(item);
  });

  let html = '';

  // Percorre cada CLASSE
  for (const classe in grouped) {
    html += `<h2>CLASSE ${classe}</h2>`;
    
    grouped[classe].forEach(item => {
      html += `
        <div class="card" style="margin-left: ${item.GRAU === "0" ? 0 : parseInt(item.GRAU) * 10}px;">
          <p><strong>CONTA:</strong> ${item.CONTA}</p>
          <p><strong>CONTAMAE:</strong> ${item.CONTAMAE}</p>
          <p><strong>CODIGO:</strong> ${item.CODIGO}</p>
          <p><strong>CODIGOMAE:</strong> ${item.CODIGOMAE}</p>
        </div>
      `;
    });
  }

  output.innerHTML = html;
}
