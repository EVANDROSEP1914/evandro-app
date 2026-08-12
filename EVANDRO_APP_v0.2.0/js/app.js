// ==========================================
// ESTRUTURA DE DADOS E ESTADO GLOBAL
// ==========================================

// Recupera as contas cadastradas do localStorage
let contas = JSON.parse(localStorage.getItem('contas_app')) || [];

// Captura a data atual para o seletor de mês/ano
let dataAtual = new Date();
let mesSelecionado = dataAtual.getMonth() + 1; // 1 a 12
let anoSelecionado = dataAtual.getFullYear();

// ==========================================
// FUNÇÕES AUXILIARES DE DATA E CHAVE
// ==========================================

// Gera a chave única do mês atual no formato "ANO-MES" (Ex: "2026-8")
function getChaveMesAtual() {
    return `${anoSelecionado}-${mesSelecionado}`;
}

// Formata o valor numérico para Moeda Brasileira (R$)
function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// LÓGICA PRINCIPAL (ADICIONAR / REMOVER / STATUS)
// ==========================================

// Adiciona uma nova conta
function adicionarConta(descricao, valor) {
    if (!descricao || !valor) return;

    const novaConta = {
        id: Date.now(),
        descricao: descricao,
        valor: parseFloat(valor),
        // Guarda o status de cada mês individualmente
        pagamentosMensais: {} 
    };

    contas.push(novaConta);
    salvarDados();
    renderizarApp();
}

// Alterna o status de pagamento APENAS para o mês e ano selecionados
function alternarStatusPagamento(idConta) {
    const chaveMes = getChaveMesAtual();

    contas = contas.map(conta => {
        if (conta.id === idConta) {
            if (!conta.pagamentosMensais) {
                conta.pagamentosMensais = {};
            }
            // Inverte o status atual daquele mês específico
            conta.pagamentosMensais[chaveMes] = !conta.pagamentosMensais[chaveMes];
        }
        return conta;
    });

    salvarDados();
    renderizarApp();
}

// Remove uma conta permanentemente
function removerConta(idConta) {
    contas = contas.filter(conta => conta.id !== idConta);
    salvarDados();
    renderizarApp();
}

// Salva a lista de contas no LocalStorage
function salvarDados() {
    localStorage.setItem('contas_app', JSON.stringify(contas));
}

// ==========================================
// NAVEGAÇÃO ENTRE MESES
// ==========================================

function alterarMes(delta) {
    mesSelecionado += delta;
    if (mesSelecionado > 12) {
        mesSelecionado = 1;
        anoSelecionado++;
    } else if (mesSelecionado < 1) {
        mesSelecionado = 12;
        anoSelecionado--;
    }
    renderizarApp();
}

// ==========================================
// RENDERIZAÇÃO DA INTERFACE (TELA)
// ==========================================

function renderizarApp() {
    const containerContas = document.getElementById('listaContas');
    const labelMesAno = document.getElementById('labelMesAno');
    const totalPendenteEl = document.getElementById('totalPendente');
    const totalPagoEl = document.getElementById('totalPago');

    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Atualiza o topo com Mês e Ano
    if (labelMesAno) {
        labelMesAno.innerText = `${nomesMeses[mesSelecionado - 1]} de ${anoSelecionado}`;
    }

    const chaveMes = getChaveMesAtual();
    let totalPendente = 0;
    let totalPago = 0;

    if (containerContas) {
        containerContas.innerHTML = '';

        if (contas.length === 0) {
            containerContas.innerHTML = '<p class="sem-contas">Nenhuma conta cadastrada.</p>';
        }

        contas.forEach(conta => {
            // Verifica se a conta está paga NO MÊS SELECIONADO
            const estaPaga = conta.pagamentosMensais && conta.pagamentosMensais[chaveMes] === true;

            if (estaPaga) {
                totalPago += conta.valor;
            } else {
                totalPendente += conta.valor;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = `item-conta ${estaPaga ? 'paga' : 'pendente'}`;
            itemDiv.innerHTML = `
                <div class="info-conta">
                    <input type="checkbox" ${estaPaga ? 'checked' : ''} onchange="alternarStatusPagamento(${conta.id})">
                    <span class="descricao">${conta.descricao}</span>
                    <span class="valor">${formatarMoeda(conta.valor)}</span>
                </div>
                <button class="btn-deletar" onclick="removerConta(${conta.id})">✕</button>
            `;
            containerContas.appendChild(itemDiv);
        });
    }

    // Atualiza os totais na tela
    if (totalPendenteEl) totalPendenteEl.innerText = formatarMoeda(totalPendente);
    if (totalPagoEl) totalPagoEl.innerText = formatarMoeda(totalPago);
}

// Escuta o envio do formulário para adicionar conta
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formConta');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const desc = document.getElementById('descConta').value;
            const valor = document.getElementById('valorConta').value;
            adicionarConta(desc, valor);
            form.reset();
        });
    }
    renderizarApp();
});