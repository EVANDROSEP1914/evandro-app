// ==========================================
// ESTRUTURA DE DADOS E MIGRAÇÃO
// ==========================================

let dataAtual = new Date();
let mesSelecionado = dataAtual.getMonth() + 1; // 1 a 12
let anoSelecionado = dataAtual.getFullYear();

// Função para garantir que a chave do mês fique no formato padrão "AAAA-MM" (Ex: "2026-08")
function getChaveMesAtual() {
    const mesFormatado = String(mesSelecionado).padStart(2, '0');
    return `${anoSelecionado}-${mesFormatado}`;
}

// Carrega as contas e aplica a MIGRAÇÃO AUTOMÁTICA
function carregarEConvertContas() {
    let contasSalvas = JSON.parse(localStorage.getItem('contas_app')) || [];

    // Migra contas antigas que não possuem a propriedade pagamentosMensais
    contasSalvas = contasSalvas.map(conta => {
        if (!conta.pagamentosMensais) {
            conta.pagamentosMensais = {};
            
            // Se a conta antiga tinha o status de "paga", define APENAS para o mês atual
            if (conta.paga === true) {
                const chaveAtual = getChaveMesAtual();
                conta.pagamentosMensais[chaveAtual] = true;
            }
            delete conta.paga; // Remove a propriedade antiga
        }
        return conta;
    });

    localStorage.setItem('contas_app', JSON.stringify(contasSalvas));
    return contasSalvas;
}

let contas = carregarEConvertContas();

// Formata o valor numérico para R$
function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// FUNÇÕES DE AÇÃO (ADICIONAR / ALTERAR / REMOVER)
// ==========================================

function adicionarConta(descricao, valor) {
    if (!descricao || !valor) return;

    const novaConta = {
        id: Date.now(),
        descricao: descricao,
        valor: parseFloat(valor),
        pagamentosMensais: {} // Objeto vazio: nasce pendente em todos os meses
    };

    contas.push(novaConta);
    salvarDados();
    renderizarApp();
}

function alternarStatusPagamento(idConta) {
    const chaveMes = getChaveMesAtual();

    contas = contas.map(conta => {
        if (conta.id === idConta) {
            if (!conta.pagamentosMensais) {
                conta.pagamentosMensais = {};
            }
            // Inverte OBRIGATORIAMENTE o status APENAS do mês selecionado
            const statusAtual = conta.pagamentosMensais[chaveMes] === true;
            conta.pagamentosMensais[chaveMes] = !statusAtual;
        }
        return conta;
    });

    salvarDados();
    renderizarApp();
}

function removerConta(idConta) {
    contas = contas.filter(conta => conta.id !== idConta);
    salvarDados();
    renderizarApp();
}

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
// RENDERIZAÇÃO DA TELA
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
            // Checa EXCLUSIVAMENTE o mês atual
            const estaPagaNoMes = conta.pagamentosMensais && conta.pagamentosMensais[chaveMes] === true;

            if (estaPagaNoMes) {
                totalPago += conta.valor;
            } else {
                totalPendente += conta.valor;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = `item-conta ${estaPagaNoMes ? 'paga' : 'pendente'}`;
            itemDiv.innerHTML = `
                <div class="info-conta">
                    <input type="checkbox" ${estaPagaNoMes ? 'checked' : ''} onchange="alternarStatusPagamento(${conta.id})">
                    <span class="descricao">${conta.descricao}</span>
                    <span class="valor">${formatarMoeda(conta.valor)}</span>
                </div>
                <button class="btn-deletar" onclick="removerConta(${conta.id})">✕</button>
            `;
            containerContas.appendChild(itemDiv);
        });
    }

    if (totalPendenteEl) totalPendenteEl.innerText = formatarMoeda(totalPendente);
    if (totalPagoEl) totalPagoEl.innerText = formatarMoeda(totalPago);
}

// Evento Inicial
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