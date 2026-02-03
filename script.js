 // Variável global para armazenar os dados do PGC
        let dadosPGC = [];

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

        // Função para renderizar as classes e contas
        function renderizarClasses(classes) {
            const container = document.getElementById('classesContainer');
            container.innerHTML = '';
            
            let totalContas = 0;
            
            // Ordenar as classes numericamente
            const classesOrdenadas = Object.keys(classes).sort((a, b) => parseInt(a) - parseInt(b));
            
            classesOrdenadas.forEach(classeKey => {
                const classe = classes[classeKey];
                totalContas += classe.contas.length;
                
                // Criar o container da classe
                const classeDiv = document.createElement('div');
                classeDiv.className = 'classe-container';
                
                // Criar o cabeçalho da classe
                const classeHeader = document.createElement('div');
                classeHeader.className = 'classe-header';
                
                // Encontrar o nome da classe principal (a primeira conta que começa com "CLASSE")
                const classePrincipal = classe.contas.find(c => c.CONTA.startsWith('CLASSE'));
                const nomeClasse = classePrincipal ? classePrincipal.CONTA : `Classe ${classeKey}`;
                
                classeHeader.innerHTML = `
                    <div>
                        <div class="classe-title">${nomeClasse}</div>
                        <div class="classe-info">${classe.contas.length} contas nesta classe</div>
                    </div>
                    <div class="classe-info">Classe ${classeKey}</div>
                `;
                
                // Criar a lista de contas
                const contasList = document.createElement('div');
                contasList.className = 'contas-list';
                
                // Ordenar contas pelo código (para melhor visualização)
                const contasOrdenadas = [...classe.contas].sort((a, b) => {
                    // Comparação numérica dos códigos
                    return parseInt(a.CODIGO) - parseInt(b.CODIGO);
                });
                
                contasOrdenadas.forEach(conta => {
                    // Pular a conta que é a própria classe (aquela que começa com "CLASSE")
                    // para evitar duplicação no visual
                    if (conta.CONTA.startsWith('CLASSE')) return;
                    
                    const contaItem = document.createElement('div');
                    contaItem.className = 'conta-item';
                    
                    // Determinar a descrição do acesso
                    const acessoDesc = conta.ACESSO === 'C' ? 'Crédito' : 'Débito';
                    
                    contaItem.innerHTML = `
                        <div class="conta-info">
                            <div>
                                <span class="conta-codigo">${conta.CODIGO}</span>
                                <span class="conta-nome">${conta.CONTA}</span>
                                <span class="acesso-badge acesso-${conta.ACESSO}">${acessoDesc}</span>
                            </div>
                            <div class="conta-detalhes">
                                <span>Nível: <span class="nivel-indicator nivel-${conta.NIVEL}">${conta.NIVEL}</span></span>
                                <span>Grau: ${conta.GRAU}</span>
                                <span> | Conta Mãe: ${conta.CONTAMAE}</span>
                            </div>
                        </div>
                        <div class="conta-actions">
                            <button class="btn btn-edit" data-id="${conta.CODIGO}">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M12.146 2.146a.5.5 0 0 1 .708 0l1 1a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.234.125l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .125-.234l9-9zM12.5 3.5l.5.5L12 5 11 4l.5-.5 1 1zM11 5L10 4 2 12l1 1 1-1 8-8z"/>
                                </svg>
                                Editar
                            </button>
                            <button class="btn btn-delete" data-id="${conta.CODIGO}">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                                Excluir
                            </button>
                        </div>
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
                        alert(`Editar conta:\nCódigo: ${conta.CODIGO}\nNome: ${conta.CONTA}\nClasse: ${conta.CLASSE}\n\nEsta funcionalidade abriria um formulário de edição.`);
                    }
                });
            });
            
            // Botões de excluir
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', function() {
                    const codigo = this.getAttribute('data-id');
                    const conta = dadosPGC.find(c => c.CODIGO === codigo);
                    
                    if (conta && confirm(`Tem certeza que deseja excluir a conta:\n\n${conta.CONTA}\nCódigo: ${conta.CODIGO}\n\nEsta ação não pode ser desfeita.`)) {
                        alert(`Conta ${conta.CONTA} excluída com sucesso!\n\n(Esta é uma demonstração - em um sistema real, a conta seria removida do banco de dados.)`);
                    }
                });
            });
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
                    conta.CONTAMAE.toLowerCase().includes(filtro)
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
            .then(res => res.json())
            .then(data => renderPGC(data))
            .catch(err => {
                console.error('Erro ao carregar o arquivo JSON:', err);
                document.getElementById('classesContainer').innerHTML = `
                    <div class="empty-state">
                        <h3>Erro ao carregar dados</h3>
                        <p>Não foi possível carregar o arquivo pgc.json. Verifique se o arquivo existe e está no formato correto.</p>
                        <p>Erro: ${err.message}</p>
                    </div>
                `;
            });
