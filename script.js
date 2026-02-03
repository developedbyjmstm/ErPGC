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
    <p><strong>Nome:</strong> ${data.name}</p>
    <p><strong>País:</strong> ${data.country}</p>
    <p><strong>Premium:</strong> ${data.premium}</p>
  `;
}