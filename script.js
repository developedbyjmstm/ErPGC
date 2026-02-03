// Variável global para armazenar os dados do PGC
let dadosPGC = [];
let contaParaExcluir = null;
let contaParaEditar = null;
let isEditMode = false;

// Função principal para renderizar os dados do PGC
function renderPGC(data) {
    // Armazenar os dados na variável global
    dadosPGC = data;
    
    // Agrupar e renderizar as classes
    const classes = agruparPorClasse(dadosPGC);
    renderizarClasses(classes);
    
    // Adicionar event listener para o campo de filtro
    document.getElementById('filterInput').addEventListener('input', aplicarFiltro);
    
    // Adicionar event listener para a tecla Enter no campo de filtro
    document.getElementById('filterInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            aplicarFiltro();
        }
    });
}

// Função para agrupar contas por classe
function agruparPorClasse(contas) {
    const classes = {};
    
    contas.forEach(conta => {
        const classe = conta.CLASSE;
        if (!classes[classe]) {
            classes[classe] = {
                nome: `Classe ${classe}`,
                contas: []
            };
        }
        
        // Adicionar a conta à classe correspondente
        classes[classe].contas.push(conta);
    });
    
    return classes;
}

// Função para construir a hierarquia de contas
function construirHierarquia(contas) {
    // Filtrar apenas contas que não são da própria classe
    const contasDaClasse = contas.filter(c => !c.CONTA.startsWith('CLASSE'));
    
    // Ordenar contas por código para garantir ordem correta
    contasDaClasse.sort((a, b) => {
        // Comparação numérica dos códigos
        return parseInt(a.CODIGO) - parseInt(b.CODIGO);
    });
    
    // Criar estrutura para agrupar contas por nível e hierarquia
    const hierarquia = [];
    
    // Primeiro, adicionar as contas-mãe (grau 2)
    const contasMae = contasDaClasse.filter(conta => conta.GRAU === "2");
    
    contasMae.forEach(contaMae => {
        // Adicionar a conta-mãe
        hierarquia.push({
            conta: contaMae,
            nivel: 0,
            tipo: 'mae'
        });
        
        // Encontrar contas-filhas diretas desta conta-mãe
        // São contas cujo código começa com o código da conta-mãe
        // mas têm um código mais longo
        const contasFilhas = contasDaClasse.filter(conta => {
            // Verificar se o código começa com o código da conta-mãe
            // mas não é a própria conta-mãe
            if (conta.CODIGO === contaMae.CODIGO) return false;
            
            // Verificar se é uma conta-filha direta
            // O código da conta mãe deve ser um prefixo do código da conta
            // E a diferença no comprimento deve ser de 1 dígito para filhos diretos
            // ou mais para netos, etc.
            if (conta.CODIGO.startsWith(contaMae.CODIGO)) {
                // Para filhos diretos (1 nível abaixo), o código deve ter
                // exatamente +1 dígito (ex: 11 -> 111)
                if (conta.CODIGO.length === contaMae.CODIGO.length + 1) {
                    return true;
                }
                // Para netos (2 níveis abaixo), exibir com recuo adicional
                // ex: 11 -> 1121 (isso será tratado na renderização)
            }
            return false;
        });
        
        // Ordenar contas-filhas por código
        contasFilhas.sort((a, b) => parseInt(a.CODIGO) - parseInt(b.CODIGO));
        
        // Adicionar contas-filhas
        contasFilhas.forEach(contaFilha => {
            // Determinar o nível baseado no comprimento do código
            const nivel = contaFilha.CODIGO.length - contaMae.CODIGO.length;
            
            hierarquia.push({
                conta: contaFilha,
                nivel: nivel,
                tipo: 'filha',
                contaMaeCodigo: contaMae.CODIGO
            });
            
            // Agora encontrar subcontas (netos) desta conta-filha
            const subContas = contasDaClasse.filter(conta => {
                if (conta.CODIGO === contaFilha.CODIGO) return false;
                
                // Verificar se é uma subconta da conta-filha
                if (conta.CODIGO.startsWith(contaFilha.CODIGO)) {
                    // Deve ter pelo menos +1 dígito
                    if (conta.CODIGO.length > contaFilha.CODIGO.length) {
                        return true;
                    }
                }
                return false;
            });
            
            // Ordenar subcontas por código
            subContas.sort((a, b) => parseInt(a.CODIGO) - parseInt(b.CODIGO));
            
            // Adicionar subcontas
            subContas.forEach(subConta => {
                const subNivel = subConta.CODIGO.length - contaMae.CODIGO.length;
                
                hierarquia.push({
                    conta: subConta,
                    nivel: subNivel,
                    tipo: 'subconta',
                    contaMaeCodigo: contaFilha.CODIGO
                });
            });
        });
    });
    
    return hierarquia;
}

// Função para renderizar as classes e contas de forma hierárquica
function renderizarClasses(classes) {
    const container = document.getElementById('classesContainer');
    container.innerHTML = '';
    
    let totalContas = 0;
    
    // Ordenar as classes numericamente
    const classesOrdenadas = Object.keys(classes).sort((a, b) => parseInt(a) - parseInt(b));
    
    classesOrdenadas.forEach(classeKey => {
        const classe = classes[classeKey];
        
        // Criar o container da classe
        const classeDiv = document.createElement('div');
        classeDiv.className = 'classe-container';
        
        // Criar o cabeçalho da classe
        const classeHeader = document.createElement('div');
        classeHeader.className = 'classe-header';
        
        // Encontrar o nome da classe principal (a primeira conta que começa com "CLASSE")
        const classePrincipal = classe.contas.find(c => c.CONTA.startsWith('CLASSE'));
        const nomeClasse = classePrincipal ? classePrincipal.CONTA : `Classe ${classeKey}`;
        
        // Filtrar contas que não são da própria classe
        const contasDaClasse = classe.contas.filter(c => !c.CONTA.startsWith('CLASSE'));
        totalContas += contasDaClasse.length;
        
        classeHeader.innerHTML = `
            <div>
                <div class="classe-title">${nomeClasse}</div>
                <div class="classe-info">${contasDaClasse.length} contas nesta classe</div>
            </div>
            <div class="classe-info">Classe ${classeKey}</div>
        `;
        
        // Criar a lista de contas
        const contasList = document.createElement('div');
        contasList.className = 'contas-list';
        
        // Construir hierarquia para esta classe
        const hierarquia = construirHierarquia(classe.contas);
        
        // Renderizar a hierarquia
        hierarquia.forEach(item => {
            const contaItem = document.createElement('div');
            contaItem.className = 'conta-item';
            
            // Calcular recuo baseado no nível
            const recuo = item.nivel * 30; // 30px por nível
            contaItem.style.paddingLeft = `${15 + recuo}px`;
            
            // Adicionar borda esquerda para níveis mais profundos
            if (item.nivel > 0) {
                contaItem.style.borderLeft = '2px solid #e0e0e0';
                contaItem.style.marginLeft = '10px';
            }
            
            // Determinar se mostra botões (só se ACESSO = "C")
            const mostrarBotoes = item.conta.ACESSO === 'C';
            const acessoDesc = item.conta.ACESSO === 'C' ? 'Crédito' : 'Débito';
            
            // Determinar o tipo de conta para exibição
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
                        <span class="acesso-badge acesso-${item.conta.ACESSO}">${acessoDesc}</span>
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
        
        // Montar a classe
        classeDiv.appendChild(classeHeader);
        classeDiv.appendChild(contasList);
        container.appendChild(classeDiv);
    });
    
    // Atualizar os totais no rodapé
    document.getElementById('totalClasses').textContent = classesOrdenadas.length;
    document.getElementById('totalContas').textContent = totalContas;
    
    // Adicionar event listeners aos botões
    adicionarEventListeners();
}

// Função para adicionar event listeners aos botões
function adicionarEventListeners() {
    // Botões de editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const codigo = this.getAttribute('data-id');
            const conta = dadosPGC.find(c => c.CODIGO === codigo);
            
            if (conta) {
                abrirEditDialog(conta);
            }
        });
    });
    
    // Botões de excluir
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const codigo = this.getAttribute('data-id');
            const conta = dadosPGC.find(c => c.CODIGO === codigo);
            
            if (conta) {
                abrirDeleteDialog(conta);
            }
        });
    });
}

// Função para abrir diálogo de exclusão
function abrirDeleteDialog(conta) {
    contaParaExcluir = conta;
    
    // Atualizar a mensagem do diálogo
    document.getElementById('deleteMessage').innerHTML = 
        `Tem certeza que deseja eliminar a conta <strong>${conta.CONTA}</strong> (Código: ${conta.CODIGO}) do PGC-NIRF?`;
    
    // Mostrar o diálogo
    document.getElementById('deleteDialog').style.display = 'flex';
}

// Função para fechar diálogo de exclusão
function fecharDeleteDialog() {
    document.getElementById('deleteDialog').style.display = 'none';
    contaParaExcluir = null;
}

// Função para confirmar exclusão
function confirmarExclusao() {
    if (!contaParaExcluir) return;
    
    // Encontrar o índice da conta no array
    const index = dadosPGC.findIndex(c => c.CODIGO === contaParaExcluir.CODIGO);
    
    if (index !== -1) {
        // Remover a conta do array
        dadosPGC.splice(index, 1);
        
        // Atualizar a visualização
        const classes = agruparPorClasse(dadosPGC);
        renderizarClasses(classes);
        
        // Fechar o diálogo
        fecharDeleteDialog();
        
        // Mostrar mensagem de sucesso
        alert(`Conta ${contaParaExcluir.CONTA} excluída com sucesso!`);
    }
}

// Função para abrir diálogo de edição
function abrirEditDialog(conta) {
    contaParaEditar = conta;
    isEditMode = true;
    
    // Configurar o título do diálogo
    document.getElementById('editDialogTitle').textContent = 'Editar Conta';
    
    // Preencher os campos
    document.getElementById('editCodigo').value = conta.CODIGO;
    
    // Extrair apenas a parte do código da conta (ex: "1.2.1.1-" de "1.2.1.1-Banco de Moçambique")
    const partesConta = conta.CONTA.split('-');
    const codigoParte = partesConta[0] + '-';
    document.getElementById('editConta').value = codigoParte;
    
    // Limpar mensagens de erro
    document.getElementById('editDialogErrors').style.display = 'none';
    document.getElementById('editDialogErrors').textContent = '';
    
    // Mostrar o diálogo
    document.getElementById('editDialog').style.display = 'flex';
}

// Função para fechar diálogo de edição
function fecharEditDialog() {
    document.getElementById('editDialog').style.display = 'none';
    contaParaEditar = null;
    isEditMode = false;
    
    // Limpar campos
    document.getElementById('editCodigo').value = '';
    document.getElementById('editConta').value = '';
    document.getElementById('editDialogErrors').style.display = 'none';
    document.getElementById('editDialogErrors').textContent = '';
}

// Função para validar o formato do código e conta
function validarFormato(codigo, conta) {
    const errors = [];
    
    // Validar código (deve conter apenas números)
    if (!/^\d+$/.test(codigo)) {
        errors.push('O código deve conter apenas números.');
    }
    
    // Validar formato da conta (deve seguir o padrão: código-nome)
    if (!conta.includes('-')) {
        errors.push('A conta deve estar no formato: código-nome (ex: 1.2.1.1-StandardBank)');
    }
    
    // Verificar se a parte do código na conta corresponde ao código informado
    const codigoDaConta = conta.split('-')[0];
    const codigoFormatado = codigoDaConta.replace(/\./g, '');
    
    if (codigoFormatado !== codigo) {
        errors.push('O código na conta não corresponde ao código informado.');
    }
    
    return errors;
}

// Função para verificar se código ou conta já existem
function verificarExistencia(codigo, conta, codigoOriginal) {
    const errors = [];
    
    // Verificar se o código já existe (exceto se for a mesma conta sendo editada)
    const codigoExistente = dadosPGC.find(c => c.CODIGO === codigo && c.CODIGO !== codigoOriginal);
    if (codigoExistente) {
        errors.push(`O código ${codigo} já existe na conta: ${codigoExistente.CONTA}`);
    }
    
    // Verificar se a conta já existe (exceto se for a mesma conta sendo editada)
    const contaExistente = dadosPGC.find(c => c.CONTA === conta && c.CODIGO !== codigoOriginal);
    if (contaExistente) {
        errors.push(`A conta "${conta}" já existe com código: ${contaExistente.CODIGO}`);
    }
    
    return errors;
}

// Função para salvar conta (editar ou adicionar)
function salvarConta() {
    const codigo = document.getElementById('editCodigo').value.trim();
    const conta = document.getElementById('editConta').value.trim();
    
    // Validar campos obrigatórios
    if (!codigo || !conta) {
        mostrarErro('Todos os campos são obrigatórios.');
        return;
    }
    
    // Validar formato
    const errosFormato = validarFormato(codigo, conta);
    if (errosFormato.length > 0) {
        mostrarErro(errosFormato.join(' '));
        return;
    }
    
    // Verificar se já existe
    const codigoOriginal = isEditMode ? contaParaEditar.CODIGO : null;
    const errosExistencia = verificarExistencia(codigo, conta, codigoOriginal);
    if (errosExistencia.length > 0) {
        mostrarErro(errosExistencia.join(' '));
        return;
    }
    
    if (isEditMode && contaParaEditar) {
        // Modo edição: atualizar conta existente
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
        // Modo adição: criar nova conta
        // Aqui você precisaria determinar a classe, nível, grau, etc.
        // Como exemplo, vou usar valores padrão
        const novaConta = {
            NIVEL: "1", // Você pode ajustar conforme necessário
            ACESSO: "C", // Padrão para contas editáveis
            CLASSE: codigo.charAt(0), // A classe é o primeiro dígito do código
            CONTA: conta,
            CONTAMAE: conta, // Neste exemplo, a conta mãe é ela mesma
            CODIGO: codigo,
            GRAU: "3+", // Você pode ajustar conforme necessário
            CODIGOMAE: codigo // Neste exemplo, o código mãe é o próprio código
        };
        
        dadosPGC.push(novaConta);
    }
    
    // Atualizar a visualização
    const classes = agruparPorClasse(dadosPGC);
    renderizarClasses(classes);
    
    // Fechar o diálogo
    fecharEditDialog();
    
    // Mostrar mensagem de sucesso
    alert(`Conta ${conta} ${isEditMode ? 'atualizada' : 'adicionada'} com sucesso!`);
}

// Função para mostrar erros no diálogo
function mostrarErro(mensagem) {
    const errorDiv = document.getElementById('editDialogErrors');
    errorDiv.textContent = mensagem;
    errorDiv.style.display = 'block';
}

// Função de filtro
function aplicarFiltro() {
    const filtro = document.getElementById('filterInput').value.toLowerCase();
    
    if (!filtro.trim()) {
        // Se o filtro estiver vazio, mostrar todas as classes
        const classes = agruparPorClasse(dadosPGC);
        renderizarClasses(classes);
        return;
    }
    
    // Filtrar contas
    const contasFiltradas = dadosPGC.filter(conta => {
        return (
            conta.CONTA.toLowerCase().includes(filtro) ||
            conta.CODIGO.toLowerCase().includes(filtro) ||
            conta.CLASSE.toLowerCase().includes(filtro) ||
            conta.CONTAMAE.toLowerCase().includes(filtro) ||
            conta.GRAU.toLowerCase().includes(filtro)
        );
    });
    
    // Se não houver resultados
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
    
    // Agrupar e renderizar as contas filtradas
    const classes = agruparPorClasse(contasFiltradas);
    renderizarClasses(classes);
}

// Carregar os dados do arquivo JSON
fetch('pgc.json')
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error('O arquivo JSON não contém um array de dados');
        }
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
