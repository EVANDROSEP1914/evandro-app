// ==========================================
// ESTADO GLOBAL E DATAS
// ==========================================
var dataAtual = new Date();
var mesSelecionado = dataAtual.getMonth() + 1; // 1 a 12
var anoSelecionado = dataAtual.getFullYear();

// Formato da chave: "2026-08"
function getChaveMesAtual() {
    var m = mesSelecionado < 10 ? '0' + mesSelecionado : mesSelecionado;
    return anoSelecionado + '-' + m;
}

// Carregar contas do localStorage com migração segura
function carregarContas() {
    try {
        var dados = localStorage.getItem('contas_app');
        var contasSalvas = dados ? JSON.parse(dados) : [];

        // Garante que cada conta tenha a estrutura de pagamentosMensais
        for (var i = 0; i < contasSalvas.length; i++) {
            if (!contasSalvas[i].pagamentosMensais) {
                contasSalvas[i].pagamentosMensais = {};
                if (contasSalvas[i].paga === true) {
                    var chave = getChaveMesAtual();
                    contasSalvas[i].pagamentosMensais[chave] = true;
                }
                delete contasSalvas[i].paga;
            }
        }
        return contasSalvas;
    } catch (e) {
        console.error("Erro ao carregar contas:", e);
        return [];
    }
}

var contas = carregarContas();

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function salvarDados() {
    localStorage.setItem('contas_app', JSON.stringify(contas));
}

// ==========================================
// ACOES
// ==========================================
function adicionarConta(descricao, valor) {
    if (!descricao || !valor) return;

    var novaConta = {
        id: Date.now(),
        descricao: descricao,
        valor: parseFloat(valor),
        pagamentosMensais: {}
    };

    contas.push(novaConta);
    salvarDados();
    renderizarApp();
}

function alternarStatusPagamento(idConta) {
    var chave = getChaveMesAtual();
    for (var i = 0; i < contas.length; i++) {
        if (contas[i].id === idConta) {
            if (!contas[i].pagamentosMensais) {
                contas[i].pagamentosMensais = {};
            }
            var statusAtual = contas[i].pagamentosMensais[chave] === true;
            contas[i].pagamentosMensais[chave] = !statusAtual;
        }
    }
    salvarDados();
    renderizarApp();
}

function removerConta(idConta) {
    contas = contas.filter(function(c) { return c.id !== idConta; });
    salvarDados();
    renderizarApp();
}

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
// RENDERIZAÇÃO NA TELA
// ==========================================
function renderizarApp() {
    var containerContas = document.getElementById('listaContas');
    var labelMesAno = document.getElementById('labelMesAno');
    var totalPendenteEl = document.getElementById('totalPendente');
    var totalPagoEl = document.getElementById('totalPago');

    var nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    if (labelMesAno) {
        labelMesAno.innerText = nomesMeses[mesSelecionado - 1] + ' de ' + anoSelecionado;
    }

    var chave = getChaveMesAtual();
    var totalPendente = 0;
    var totalPago = 0;

    if (containerContas) {
        containerContas.innerHTML = '';

        if (contas.length === 0) {
            containerContas.innerHTML = '<p class="sem-contas">Nenhuma conta cadastrada.</p>';
        } else {
            contas.forEach(function(conta) {
                var estaPaga = conta.pagamentosMensais && conta.pagamentosMensais[chave] === true;

                if (estaPaga) {
                    totalPago += conta.valor;
                } else {
                    totalPendente += conta.valor;
                }

                var itemDiv = document.createElement('div');
                itemDiv.className = 'item-conta ' + (estaPaga ? 'paga' : 'pendente');
                
                var checkedAttr = estaPaga ? 'checked' : '';
                
                itemDiv.innerHTML = 
                    '<div class="info-conta">' +
                        '<input type="checkbox" ' + checkedAttr + ' onchange="alternarStatusPagamento(' + conta.id + ')">' +
                        '<span class="descricao">' + conta.descricao + '</span>' +
                        '<span class="valor">' + formatarMoeda(conta.valor) + '</span>' +
                    '</div>' +
                    '<button class="btn-deletar" onclick="removerConta(' + conta.id + ')">✕</button>';

                containerContas.appendChild(itemDiv);
            });
        }
    }

    if (totalPendenteEl) totalPendenteEl.innerText = formatarMoeda(totalPendente);
    if (totalPagoEl) totalPagoEl.innerText = formatarMoeda(totalPago);
}

// Executa ao carregar a página
window.onload = function() {
    var form = document.getElementById('formConta');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var desc = document.getElementById('descConta').value;
            var valor = document.getElementById('valorConta').value;
            adicionarConta(desc, valor);
            form.reset();
        });
    }
    renderizarApp();
};