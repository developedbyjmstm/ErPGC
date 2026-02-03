// Variáveis globais
let dadosPGC = [];
let contaParaExcluir = null;
let contaParaEditar = null;
let contaPaiParaAdd = null;
let isEditMode = false;

// Função para formatar código com pontos (ex: 1211 -> 1.2.1.1)
function formatarCodigoComPontos(codigo) {
    if (!codigo) return '';
    return codigo.split('').join('.');
}

// Função para sugerir o próximo código disponível
function sugerirProximoCodigo(codigoPai) {
    if (!codigoPai) return '';
    
    const contasFilhas = dadosPGC.filter(conta => 
        conta.CODIGO.startsWith(codigoPai) && 
        conta.CODIGO !== codigoPai
    );
    
    if (contasFilhas.length === 0) {
        return codigoPai + '1';
    }
    
    const numeros = contasFilhas.map(conta => {
        const sufixo = conta.CODIGO.substring(codigoPai.length);
        const match = sufixo.match(/^\d+$/);
        return match ? parseInt(match[0]) : 0;
    });
    
    const maxNumero = Math.max(...numeros);
    return codigoPai + (maxNumero + 1);
}

// Função principal para renderizar os dados do PGC
function renderPGC(data) {
    dadosPGC = data;
    const classes = agruparPorClasse(dadosPGC);
    renderizarClasses(classes);
    
    document.getElementById('filterInput').addEventListener('input', aplicarFiltro);
    document.getElementById('filterInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') aplicarFiltro();
    });
}

// Função para agrupar contas por classe
function agruparPorClasse(contas) {
    const classes = {};
    
    contas.forEach(conta => {
        const classe = conta.CLASSE;
        if (!classes[classe]) {
            classes[classe] = { nome: `Classe ${classe}`, contas: [] };
        }
        classes[classe].contas.push(conta);
    });
    
    return classes;
}

// Função para construir a hierarquia de contas
function construirHierarquia(contas) {
    const contasDaClasse = contas.filter(c => !c.CONTA.startsWith('CLASSE'));
    contasDaClasse.sort((a, b) => parseInt(a.CODIGO) - parseInt(b.CODIGO));
    
    const hierarquia = [];
    const contasMae = contasDaClasse.filter(conta => conta.GRAU === "2");
    
    contasMae.forEach(contaMae => {
        hierarquia.push({ conta: contaMae, nivel: 0, tipo: 'mae' });
        
        const contasFilhas = contasDaClasse.filter(conta => {
            if (conta.CODIGO === contaMae.CODIGO) return false;
            if (conta.CODIGO.startsWith(contaMae.CODIGO)) {
                if (conta.CODIGO.length === contaMae.CODIGO.length + 1) return true;
            }
            return false;
        });
        
        contasFilhas.sort((a, b) => parseInt(a.CODIGO) - parseInt(b.CODIGO));
        
        contasFilhas.forEach(contaFilha => {
            const nivel = contaFilha.CODIGO.length - contaMae.CODIGO.length;
            hierarquia.push({ conta: contaFilha, nivel: nivel, tipo: 'filha', contaMaeCodigo: contaMae.CODIGO });
            
            const subContas = contasDaClasse.filter(conta => {
                if (conta.CODIGO === contaFilha.CODIGO) return false;
                if (conta.CODIGO.startsWith(contaFilha.CODIGO)) {
                    if (conta.CODIGO.length > contaFilha.CODIGO.length) return true;
                }
                return false;
            });
            
            subContas.sort((a, b) => parseInt(a.CODIGO) - parseInt(b.CODIGO));
            
            subContas.forEach(subConta => {
                const subNivel = subConta.CODIGO.length - contaMae.CODIGO.length;
                hierarquia.push({ conta: subConta, nivel: subNivel, tipo: 'subconta', contaMaeCodigo: contaFilha.CODIGO });
            });
        });
    });
    
    return hierarquia;
}

// Função para renderizar as classes e contas
function renderizarClasses(classes) {
    const container = document.getElementById('classesContainer');
    container.innerHTML = '';
    
    let totalContas = 0;
    const classesOrdenadas = Object.keys(classes).sort((a, b) => parseInt(a) - parseInt(b));
    
    classesOrdenadas.forEach(classeKey => {
        const classe = classes[classeKey];
        const classeDiv = document.createElement('div');
        classeDiv.className = 'classe-container';
        
        const classeHeader = document.createElement('div');
        classeHeader.className = 'classe-header';
        const classePrincipal = classe.contas.find(c => c.CONTA.startsWith('CLASSE'));
        const nomeClasse = classePrincipal ? classePrincipal.CONTA : `Classe ${classeKey}`;
        const contasDaClasse = classe.contas.filter(c => !c.CONTA.startsWith('CLASSE'));
        totalContas += contasDaClasse.length;
        
        classeHeader.innerHTML = `
            <div>
                <div class="classe-title">${nomeClasse}</div>
                <div class="classe-info">${contasDaClasse.length} contas nesta classe</div>
            </div>
            <div class="classe-info">Classe ${classeKey}</div>
        `;
        
        const contasList = document.createElement('div');
        contasList.className = 'contas-list';
        const hierarquia = construirHierarquia(classe.contas);
        
        hierarquia.forEach(item => {
            const contaItem = document.createElement('div');
            contaItem.className = 'conta-item clickable';
            const recuo = item.nivel * 30;
            contaItem.style.paddingLeft = `${15 + recuo}px`;
            
            if (item.nivel > 0) {
                contaItem.style.borderLeft = '2px solid #e0e0e0';
                contaItem.style.marginLeft = '10px';
            }
            
            // Determinar se mostra botões (só se ACESSO = "CC")
            const mostrarBotoes = item.conta.ACESSO === 'CC';
            
            // Determinar texto e classe do badge
            let acessoDesc, acessoClasse;
            if (item.conta.ACESSO === 'CC' || item.conta.ACESSO === 'C') {
                acessoDesc = '°';
                acessoClasse = 'C';
            } else if (item.conta.ACESSO === 'N') {
                acessoDesc = '•';
                acessoClasse = 'N';
            } else {
                acessoDesc = item.conta.ACESSO;
                acessoClasse = item.conta.ACESSO;
            }
            
            let tipoDesc = '';
            
            if (item.tipo === 'mae') {
                tipoDesc = `(Conta-mãe - Grau ${item.conta.GRAU})`;
            } else if (item.tipo === 'filha') {
                tipoDesc = `(Conta-filha - Grau ${item.conta.GRAU})`;
            } else {
                tipoDesc = `(Subconta - Grau ${item.conta.GRAU})`;
            }
            
            contaItem.innerHTML = `
                <div class="conta-info">
                    <div>
                        <span class="conta-codigo">${item.conta.CODIGO}</span>
                        <span class="conta-nome">${item.conta.CONTA}</span>
                        <span class="acesso-badge acesso-${acessoClasse}">${acessoDesc}</span>
                        <span style="font-size: 0.8rem; color: #666; margin-left: 10px;">${tipoDesc}</span>
                    </div>
                    <div class="conta-detalhes">
                        <span>Nível: <span class="nivel-indicator nivel-${item.conta.NIVEL}">${item.conta.NIVEL}</span></span>
                        <span>Grau: ${item.conta.GRAU}</span>
                        <span> | Conta Mãe: ${item.conta.CONTAMAE}</span>
                    </div>
                </div>
                ${mostrarBotoes ? `
                <div class="conta-actions">
                    <button class="btn btn-edit" data-id="${item.conta.CODIGO}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.146 2.146a.5.5 0 0 1 .708 0l1 1a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.234.125l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .125-.234l9-9zM12.5 3.5l.5.5L12 5 11 4l.5-.5 1 1zM11 5L10 4 2 12l1 1 1-1 8-8z"/>
                        </svg>
                        Editar
                    </button>
                    <button class="btn btn-delete" data-id="${item.conta.CODIGO}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                        Excluir
                    </button>
                </div>
                ` : ''}
            `;
            
            contasList.appendChild(contaItem);
        });
        
        classeDiv.appendChild(classeHeader);
        classeDiv.appendChild(contasList);
        container.appendChild(classeDiv);
    });
    
    document.getElementById('totalClasses').textContent = classesOrdenadas.length;
    document.getElementById('totalContas').textContent = totalContas;
    adicionarEventListeners();
    adicionarEventosClique();
}

// Função para adicionar event listeners aos botões
function adicionarEventListeners() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const codigo = this.getAttribute('data-id');
            const conta = dadosPGC.find(c => c.CODIGO === codigo);
            if (conta) abrirEditDialog(conta);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const codigo = this.getAttribute('data-id');
            const conta = dadosPGC.find(c => c.CODIGO === codigo);
            if (conta) abrirDeleteDialog(conta);
        });
    });
}

// Função para adicionar eventos de duplo clique/clique longo
function adicionarEventosClique() {
    document.querySelectorAll('.conta-item').forEach(item => {
        let cliqueTimer = null;
        let cliqueCount = 0;
        let cliqueLongoTimer = null;
        let isCliqueLongo = false;
        
        item.addEventListener('click', function(e) {
            cliqueCount++;
            if (cliqueCount === 1) {
                cliqueTimer = setTimeout(() => { cliqueCount = 0; }, 300);
            } else if (cliqueCount === 2) {
                clearTimeout(cliqueTimer);
                cliqueCount = 0;
                if (!isCliqueLongo) {
                    const codigo = this.querySelector('.conta-codigo').textContent;
                    const conta = dadosPGC.find(c => c.CODIGO === codigo);
                    if (conta) abrirAddSubcontaDialog(conta);
                }
                isCliqueLongo = false;
            }
        });
        
        item.addEventListener('touchstart', function(e) {
            const contaItem = this;
            cliqueLongoTimer = setTimeout(() => {
                isCliqueLongo = true;
                const codigo = contaItem.querySelector('.conta-codigo').textContent;
                const conta = dadosPGC.find(c => c.CODIGO === codigo);
                if (conta) {
                    abrirAddSubcontaDialog(conta);
                    e.preventDefault();
                }
            }, 500);
        });
        
        item.addEventListener('touchend', function(e) {
            clearTimeout(cliqueLongoTimer);
        });
        
        item.addEventListener('touchmove', function(e) {
            clearTimeout(cliqueLongoTimer);
        });
        
        item.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    });
}

// Funções para o diálogo de exclusão
function abrirDeleteDialog(conta) {
    contaParaExcluir = conta;
    document.getElementById('deleteMessage').innerHTML = 
        `Tem certeza que deseja eliminar a conta <strong>${conta.CONTA}</strong> (Código: ${conta.CODIGO}) do PGC-NIRF?`;
    document.getElementById('deleteDialog').style.display = 'flex';
}

function fecharDeleteDialog() {
    document.getElementById('deleteDialog').style.display = 'none';
    contaParaExcluir = null;
}

function confirmarExclusao() {
    if (!contaParaExcluir) return;
    const index = dadosPGC.findIndex(c => c.CODIGO === contaParaExcluir.CODIGO);
    if (index !== -1) {
        dadosPGC.splice(index, 1);
        const classes = agruparPorClasse(dadosPGC);
        renderizarClasses(classes);
        fecharDeleteDialog();
        alert(`Conta ${contaParaExcluir.CONTA} excluída com sucesso!`);
    }
}

// Funções para o diálogo de edição
function abrirEditDialog(conta) {
    contaParaEditar = conta;
    isEditMode = true;
    document.getElementById('editDialogTitle').textContent = 'Editar Conta';
    document.getElementById('editCodigo').value = conta.CODIGO;
    const partesConta = conta.CONTA.split('-');
    const codigoParte = partesConta[0] + '-';
    document.getElementById('editConta').value = codigoParte;
    document.getElementById('editDialogErrors').style.display = 'none';
    document.getElementById('editDialogErrors').textContent = '';
    document.getElementById('editDialog').style.display = 'flex';
}

function fecharEditDialog() {
    document.getElementById('editDialog').style.display = 'none';
    contaParaEditar = null;
    isEditMode = false;
    document.getElementById('editCodigo').value = '';
    document.getElementById('editConta').value = '';
    document.getElementById('editDialogErrors').style.display = 'none';
    document.getElementById('editDialogErrors').textContent = '';
}

function validarFormato(codigo, conta) {
    const errors = [];
    if (!/^\d+$/.test(codigo)) errors.push('O código deve conter apenas números.');
    if (!conta.includes('-')) errors.push('A conta deve estar no formato: código-nome (ex: 1.2.1.1-StandardBank)');
    const codigoDaConta = conta.split('-')[0];
    const codigoFormatado = codigoDaConta.replace(/\./g, '');
    if (codigoFormatado !== codigo) errors.push('O código na conta não corresponde ao código informado.');
    return errors;
}

function verificarExistencia(codigo, conta, codigoOriginal) {
    const errors = [];
    const codigoExistente = dadosPGC.find(c => c.CODIGO === codigo && c.CODIGO !== codigoOriginal);
    if (codigoExistente) errors.push(`O código ${codigo} já existe na conta: ${codigoExistente.CONTA}`);
    const contaExistente = dadosPGC.find(c => c.CONTA === conta && c.CODIGO !== codigoOriginal);
    if (contaExistente) errors.push(`A conta "${conta}" já existe com código: ${contaExistente.CODIGO}`);
    return errors;
}

function salvarConta() {
    const codigo = document.getElementById('editCodigo').value.trim();
    const conta = document.getElementById('editConta').value.trim();
    
    if (!codigo || !conta) {
        mostrarErro('Todos os campos são obrigatórios.');
        return;
    }
    
    const errosFormato = validarFormato(codigo, conta);
    if (errosFormato.length > 0) {
        mostrarErro(errosFormato.join(' '));
        return;
    }
    
    const codigoOriginal = isEditMode ? contaParaEditar.CODIGO : null;
    const errosExistencia = verificarExistencia(codigo, conta, codigoOriginal);
    if (errosExistencia.length > 0) {
        mostrarErro(errosExistencia.join(' '));
        return;
    }
    
    if (isEditMode && contaParaEditar) {
        const index = dadosPGC.findIndex(c => c.CODIGO === contaParaEditar.CODIGO);
        if (index !== -1) {
            dadosPGC[index] = {
                NIVEL: contaParaEditar.NIVEL,
                ACESSO: contaParaEditar.ACESSO,
                CLASSE: contaParaEditar.CLASSE,
                CONTA: conta,
                CONTAMAE: contaParaEditar.CONTAMAE,
                CODIGO: codigo,
                GRAU: contaParaEditar.GRAU,
                CODIGOMAE: contaParaEditar.CODIGOMAE
            };
        }
    } else {
        const novaConta = {
            NIVEL: "1",
            ACESSO: "CC", // ACESSO sempre "CC" para novas contas
            CLASSE: codigo.charAt(0),
            CONTA: conta,
            CONTAMAE: conta,
            CODIGO: codigo,
            GRAU: "3+",
            CODIGOMAE: codigo
        };
        dadosPGC.push(novaConta);
    }
    
    const classes = agruparPorClasse(dadosPGC);
    renderizarClasses(classes);
    fecharEditDialog();
    alert(`Conta ${conta} ${isEditMode ? 'atualizada' : 'adicionada'} com sucesso!`);
}

function mostrarErro(mensagem) {
    const errorDiv = document.getElementById('editDialogErrors');
    errorDiv.textContent = mensagem;
    errorDiv.style.display = 'block';
}

// Funções para o diálogo de adição de subconta
function abrirAddSubcontaDialog(contaClicada) {
    contaPaiParaAdd = contaClicada;
    
    // Usar a conta mãe da conta clicada no título
    const contaMae = contaClicada.CONTAMAE || contaClicada.CONTA;
    document.getElementById('addSubcontaDialogTitle').textContent = `Adicionar Subconta a ${contaMae}`;
    
    const proximoCodigo = sugerirProximoCodigo(contaClicada.CODIGO);
    document.getElementById('addCodigo').value = proximoCodigo;
    const codigoFormatado = formatarCodigoComPontos(proximoCodigo);
    document.getElementById('addConta').value = codigoFormatado + '-';
    document.getElementById('addDialogErrors').style.display = 'none';
    document.getElementById('addDialogErrors').textContent = '';
    
    setTimeout(() => {
        document.getElementById('addConta').focus();
        document.getElementById('addConta').setSelectionRange(
            document.getElementById('addConta').value.length,
            document.getElementById('addConta').value.length
        );
    }, 100);
    
    document.getElementById('addSubcontaDialog').style.display = 'flex';
}

function fecharAddSubcontaDialog() {
    document.getElementById('addSubcontaDialog').style.display = 'none';
    contaPaiParaAdd = null;
    document.getElementById('addCodigo').value = '';
    document.getElementById('addConta').value = '';
    document.getElementById('addDialogErrors').style.display = 'none';
    document.getElementById('addDialogErrors').textContent = '';
}

function validarSubconta(codigo, conta, contaClicada) {
    const errors = [];
    if (!codigo.startsWith(contaClicada.CODIGO)) errors.push(`O código deve começar com ${contaClicada.CODIGO} (código da conta clicada).`);
    if (codigo.length <= contaClicada.CODIGO.length) errors.push(`O código deve ter mais dígitos que o código da conta clicada (${contaClicada.CODIGO}).`);
    if (!/^\d+$/.test(codigo)) errors.push('O código deve conter apenas números.');
    if (!conta.includes('-')) errors.push('A conta deve estar no formato: código-nome (ex: 1.2.1.1.1-Nova Subconta)');
    const codigoDaConta = conta.split('-')[0];
    const codigoFormatado = codigoDaConta.replace(/\./g, '');
    if (codigoFormatado !== codigo) errors.push('O código na conta não corresponde ao código informado.');
    return errors;
}

function verificarSubcontaExistente(codigo, conta) {
    const errors = [];
    const codigoExistente = dadosPGC.find(c => c.CODIGO === codigo);
    if (codigoExistente) errors.push(`O código ${codigo} já existe na conta: ${codigoExistente.CONTA}`);
    const contaExistente = dadosPGC.find(c => c.CONTA === conta);
    if (contaExistente) errors.push(`A conta "${conta}" já existe com código: ${contaExistente.CODIGO}`);
    return errors;
}

function adicionarSubconta() {
    const codigo = document.getElementById('addCodigo').value.trim();
    const conta = document.getElementById('addConta').value.trim();
    
    if (!codigo || !conta) {
        mostrarErroAdd('Código e conta são obrigatórios.');
        return;
    }
    
    const errosValidacao = validarSubconta(codigo, conta, contaPaiParaAdd);
    if (errosValidacao.length > 0) {
        mostrarErroAdd(errosValidacao.join(' '));
        return;
    }
    
    const errosExistencia = verificarSubcontaExistente(codigo, conta);
    if (errosExistencia.length > 0) {
        mostrarErroAdd(errosExistencia.join(' '));
        return;
    }
    
    // Usar os dados da conta clicada: nível, acesso sempre "CC", grau sempre "3+"
    const novaSubconta = {
        NIVEL: contaPaiParaAdd.NIVEL, // Nível da conta clicada
        ACESSO: "CC", // Sempre "CC"
        CLASSE: contaPaiParaAdd.CLASSE,
        CONTA: conta,
        CONTAMAE: contaPaiParaAdd.CONTA, // A conta mãe é a conta clicada
        CODIGO: codigo,
        GRAU: "3+", // Sempre "3+"
        CODIGOMAE: contaPaiParaAdd.CODIGO // O código mãe é o código da conta clicada
    };
    
    dadosPGC.push(novaSubconta);
    dadosPGC.sort((a, b) => parseInt(a.CODIGO) - parseInt(b.CODIGO));
    
    const classes = agruparPorClasse(dadosPGC);
    renderizarClasses(classes);
    fecharAddSubcontaDialog();
    alert(`Subconta ${conta} adicionada com sucesso!`);
}

function mostrarErroAdd(mensagem) {
    const errorDiv = document.getElementById('addDialogErrors');
    errorDiv.textContent = mensagem;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Função de filtro
function aplicarFiltro() {
    const filtro = document.getElementById('filterInput').value.toLowerCase();
    
    if (!filtro.trim()) {
        const classes = agruparPorClasse(dadosPGC);
        renderizarClasses(classes);
        return;
    }
    
    const contasFiltradas = dadosPGC.filter(conta => {
        return (
            conta.CONTA.toLowerCase().includes(filtro) ||
            conta.CODIGO.toLowerCase().includes(filtro) ||
            conta.CLASSE.toLowerCase().includes(filtro) ||
            conta.CONTAMAE.toLowerCase().includes(filtro) ||
            conta.GRAU.toLowerCase().includes(filtro)
        );
    });
    
    if (contasFiltradas.length === 0) {
        document.getElementById('classesContainer').innerHTML = `
            <div class="empty-state">
                <h3>Nenhuma conta encontrada</h3>
                <p>Nenhuma conta corresponde ao filtro: "${filtro}"</p>
            </div>
        `;
        document.getElementById('totalClasses').textContent = '0';
        document.getElementById('totalContas').textContent = '0';
        return;
    }
    
    const classes = agruparPorClasse(contasFiltradas);
    renderizarClasses(classes);
}

// Configuração de sincronização entre código e conta
function configurarSincronizacaoCodigoConta() {
    const codigoInput = document.getElementById('addCodigo');
    const contaInput = document.getElementById('addConta');
    
    codigoInput.addEventListener('input', function() {
        const codigo = this.value.trim();
        if (codigo && /^\d+$/.test(codigo)) {
            const partesConta = contaInput.value.split('-');
            if (partesConta.length > 1) {
                const nomeConta = partesConta.slice(1).join('-');
                const codigoFormatado = formatarCodigoComPontos(codigo);
                contaInput.value = codigoFormatado + '-' + nomeConta;
            } else {
                const codigoFormatado = formatarCodigoComPontos(codigo);
                contaInput.value = codigoFormatado + '-';
            }
        }
    });
    
    contaInput.addEventListener('input', function() {
        const conta = this.value.trim();
        if (conta.includes('-')) {
            const codigoDaConta = conta.split('-')[0];
            const codigoNumerico = codigoDaConta.replace(/\./g, '');
            if (/^\d+$/.test(codigoNumerico) && codigoNumerico !== codigoInput.value) {
                codigoInput.value = codigoNumerico;
            }
        }
    });
}

// Carregar os dados do arquivo JSON
fetch('pgc.json')
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (!Array.isArray(data)) throw new Error('O arquivo JSON não contém um array de dados');
        renderPGC(data);
    })
    .catch(err => {
        console.error('Erro ao carregar o arquivo JSON:', err);
        document.getElementById('classesContainer').innerHTML = `
            <div class="empty-state">
                <h3>Erro ao carregar dados</h3>
                <p>Não foi possível carregar o arquivo pgc.json. Verifique se o arquivo existe e está no formato correto.</p>
                <p>Erro: ${err.message}</p>
                <p>Verifique se o arquivo pgc.json está na mesma pasta que este arquivo HTML.</p>
            </div>
        `;
    });

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    configurarSincronizacaoCodigoConta();
});
