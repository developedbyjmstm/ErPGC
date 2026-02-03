fetch('pgc.json')
  .then(res => res.json())
  .then(data => {
    renderData(data);
  })
  .catch(err => console.error(err));

function renderData(data) {
  const output = document.getElementById('output');

  // Se for um objeto simples
  output.innerHTML = `
    <p><strong>CONTAMAE:</strong> ${data.CONTAMAE}</p>
    <p><strong>CODIGOMAE:</strong> ${data.CODIGOMAE}</p>
    <p><strong>CONTA:</strong> ${data.CONTA}</p>
    <p><strong>CODIGO:</strong> ${data.CODIGO}</p>
  `;
}
