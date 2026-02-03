fetch('pgc.json')
.then(res => res.json())
.then(data => renderPGC(data))
.catch(err => console.error(err));

function renderPGC(data) {
  const output = document.getElementById('output');
  let html = '';

  let lastClasse = null;

  data.forEach(item => {
    // adiciona separador quando a CLASSE muda
    if(item.CLASSE !== lastClasse) {
      if(lastClasse !== null) {
        html += `<div class="separator"></div>`;
      }
      lastClasse = item.CLASSE;
    }

    // define a classe de nível para indentação
    let grauNum = item.GRAU.replace('+',''); // remove '+' se existir
    let nivelClass = 'nivel-' + grauNum;

    // define cor pelo ACESSO
    let acessoClass = item.ACESSO === 'C' ? 'acesso-C' : 'acesso-N';

    // nível 0 tem cor especial (magenta)
    if(item.GRAU === '0') acessoClass = 'nivel-0';

    html += `
      <div class="item ${nivelClass} ${acessoClass}">
        ${item.CONTA}
      </div>
    `;
  });

  output.innerHTML = html;
}
