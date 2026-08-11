const K = 'evandro_app_v02';
const BASE_SALARY = 5500;

// Lista padrão de gastos fixos
const despesasIniciais = [
  { id: 1, nome: "🏠 Financiamento da casa", valor: 550.00, dia: 10, pago: false },
  { id: 2, nome: "🚗 Parcela do carro", valor: 350.00, dia: 10, pago: false },
  { id: 3, nome: "🎓 Faculdade", valor: 160.00, dia: 10, pago: false },
  { id: 4, nome: "🌐 Internet", valor: 130.00, dia: 10, pago: false },
  { id: 5, nome: "📱 Celular", valor: 70.00, dia: 10, pago: false },
  { id: 6, nome: "📺 TV", valor: 130.00, dia: 10, pago: false },
  { id: 7, nome: "🏊 Natação da Luisa", valor: 160.00, dia: 10, pago: false },
  { id: 8, nome: "⛽ Combustível", valor: 250.00, dia: 10, pago: false }
];

let D = JSON.parse(localStorage.getItem(K) || '{"transactions":[],"bills":[]}');
let despesasFixas = JSON.parse(localStorage.getItem('despesasFixas')) || despesasIniciais;

let M = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let visible = true;

const $ = id => document.getElementById(id);

const fmt = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const key = d => {
  let x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
};

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[c]));

const money = s => {
  s = String(s || '').replace(/[R$\s]/g, '');
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  return Number(s) || 0;
};

function save() {
  localStorage.setItem(K, JSON.stringify(D));
  localStorage.setItem('despesasFixas', JSON.stringify(despesasFixas));
}

function open(id) {
  $('backdrop').hidden = false;
  $(id).hidden = false;
}

function close() {
  document.querySelectorAll('.modal').forEach(x => x.hidden = true);
  $('backdrop').hidden = true;
}

function toast(s) {
  $('toast').textContent = s;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 2000);
}

function render() {
  let k = key(M);
  let t = D.transactions.filter(x => key(x.date) === k);

  // Somatório das despesas fixas marcadas como pagas
  let totalFixasPagas = despesasFixas
    .filter(item => item.pago)
    .reduce((acc, item) => acc + item.valor, 0);

  let extraIncome = t
    .filter(x => x.type === 'income')
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  let outVariavel = t
    .filter(x => x.type === 'expense')
    .reduce((a, x) => a + Number(x.amount || 0), 0);

  // Total das despesas = variáveis salvas + fixas pagas
  let out = outVariavel + totalFixasPagas;
  let inc = BASE_SALARY + extraIncome;
  let bal = inc - out;

  $('monthLabel').textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(M);
  $('monthShort').textContent = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(M).replace('.', '').toUpperCase();

  $('balance').textContent = visible ? fmt(bal) : '••••••';
  $('income').textContent = visible ? fmt(inc) : '••••';
  $('expense').textContent = visible ? fmt(out) : '••••';

  $('bar').style.width = inc ? Math.max(0, Math.min(100, (bal / inc) * 100)) + '%' : '0%';

  let list = $('list');
  t.sort((a, b) => b.date.localeCompare(a.date));

  list.innerHTML = t.length ? t.slice(0, 10).map(x => `
    <div class="item">
      <div class="left">
        <div class="ico">${x.type === 'income' ? '↑' : '•'}</div>
        <div>
          <div class="title">${esc(x.description)}</div>
          <div class="meta">${esc(x.category)} • ${x.date.split('-').reverse().join('/')} • ${esc(x.account)}</div>
        </div>
      </div>
      <div>
        <div class="val ${x.type === 'income' ? 'pos' : 'neg'}">${x.type === 'income' ? '+' : '-'}${fmt(x.amount)}</div>
        <button class="del" data-del="${x.id}">Excluir</button>
      </div>
    </div>
  `).join('') : `📝 Nenhum lançamento neste mês<br><small>Adicione sua primeira receita ou despesa.</small>`;

  list.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      D.transactions = D.transactions.filter(x => x.id !== b.dataset.del);
      save();
      render();
      toast('Lançamento excluído.');
    };
  });

  renderizarDespesasFixas();
  renderBills();
}

function renderizarDespesasFixas() {
  const tbody = $('lista-despesas-fixas');
  if (!tbody) return;

  tbody.innerHTML = '';
  let total = 0;
  let temPendente = false;

  despesasFixas.forEach(item => {
    total += item.valor;
    if (!item.pago) temPendente = true;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
      <td>
        <button class="btn-status ${item.pago ? 'status-pago' : 'status-pendente'}" onclick="alternarStatusFixo(${item.id})">
          ${item.pago ? '✓ Pago' : '⏳ Pendente'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $('total-fixo').innerHTML = `<strong>R$ ${total.toFixed(2).replace('.', ',')}</strong>`;

  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const painelAlerta = $('painel-alerta');

  if (painelAlerta) {
    if (temPendente && diaAtual <= 10) {
      painelAlerta.style.display = 'block';
    } else {
      painelAlerta.style.display = 'none';
    }
  }
}

function alternarStatusFixo(id) {
  despesasFixas = despesasFixas.map(item => {
    if (item.id === id) item.pago = !item.pago;
    return item;
  });
  save();
  render();
}

function renderBills() {
  let a = D.bills
    .filter(x => x.date >= iso(new Date()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  $('bills').innerHTML = a.length ? a.map(x => `
    <div class="item">
      <div class="left">
        <div class="ico">📅</div>
        <div>
          <div class="title">${esc(x.description)}</div>
          <div class="meta">Vence ${x.date.split('-').reverse().join('/')}</div>
        </div>
      </div>
      <div>
        <div class="val neg">${fmt(x.amount)}</div>
        <button class="del" data-bill="${x.id}">Excluir</button>
      </div>
    </div>
  `).join('') : `📅 Nenhum vencimento<br><small>Cadastre uma conta para acompanhar.</small>`;

  document.querySelectorAll('[data-bill]').forEach(b => {
    b.onclick = () => {
      D.bills = D.bills.filter(x => x.id !== b.dataset.bill);
      save();
      renderBills();
      toast('Vencimento excluído.');
    };
  });
}

function tx(type) {
  $('form').reset();
  $('type').value = type;
  $('modalTitle').textContent = type === 'income' ? 'Nova receita' : 'Nova despesa';
  $('modalSmall').textContent = type === 'income' ? 'Entrada de dinheiro' : 'Saída de dinheiro';
  $('kindLabel').hidden = type === 'income';
  $('date').value = iso(new Date());
  $('cat').value = type === 'income' ? 'Receita extra' : 'Mercado';
  open('modal');
}

$('addIncome').onclick = () => tx('income');
$('addExpense').onclick = () => tx('expense');
$('navAdd').onclick = () => tx('expense');
$('close').onclick = close;
$('backdrop').onclick = close;
document.querySelectorAll('.closeAny').forEach(b => b.onclick = close);

$('eye').onclick = () => {
  visible = !visible;
  render();
};

$('prev').onclick = () => {
  M.setMonth(M.getMonth() - 1);
  render();
};

$('next').onclick = () => {
  M.setMonth(M.getMonth() + 1);
  render();
};

$('config').onclick = () => open('configModal');
$('navConfig').onclick = () => open('configModal');

$('calendar').onclick = $('navCalendar').onclick = () => {
  $('billDate').value = iso(new Date());
  open('billModal');
};

$('report').onclick = $('navReport').onclick = () => {
  let t = D.transactions.filter(x => key(x.date) === key(M));
  let extra = t.filter(x => x.type === 'income').reduce((a, x) => a + Number(x.amount || 0), 0);
  let oVariavel = t.filter(x => x.type === 'expense').reduce((a, x) => a + Number(x.amount || 0), 0);
  
  let totalFixasPagas = despesasFixas.filter(item => item.pago).reduce((acc, item) => acc + item.valor, 0);
  let oTotal = oVariavel + totalFixasPagas;

  let totalIncome = BASE_SALARY + extra;
  let balance = totalIncome - oTotal;

  $('reportBody').innerHTML = `
    <div class="reportBox">Salário fixo <b>${fmt(BASE_SALARY)}</b></div>
    <div class="reportLine"><span>Receitas extras</span><b class="pos">${fmt(extra)}</b></div>
    <div class="reportLine"><span>Receitas totais</span><b class="pos">${fmt(totalIncome)}</b></div>
    <div class="reportLine"><span>Despesas totais</span><b class="neg">${fmt(oTotal)}</b></div>
    <div class="reportBox">Saldo do mês <b>${fmt(balance)}</b></div>
    <div class="reportLine"><span>Lançamentos</span><b>${t.length}</b></div>
  `;
  open('reportModal');
};

$('form').onsubmit = e => {
  e.preventDefault();
  let a = money($('amount').value);
  if (!a) return toast('Digite um valor válido.');

  D.transactions.push({
    id: Date.now().toString(),
    type: $('type').value,
    description: $('desc').value.trim(),
    amount: a,
    date: $('date').value,
    category: $('cat').value,
    account: $('account').value,
    kind: $('kind').value
  });

  save();
  close();
  render();
  toast('Lançamento salvo! 💚');
};

$('billForm').onsubmit = e => {
  e.preventDefault();
  let a = money($('billAmount').value);
  if (!a) return toast('Digite um valor válido.');

  D.bills.push({
    id: Date.now().toString(),
    description: $('billDesc').value.trim(),
    amount: a,
    date: $('billDate').value
  });

  save();
  $('billForm').reset();
  renderBills();
  toast('Vencimento salvo!');
};

$('clear').onclick = () => {
  if (confirm('Apagar todos os lançamentos e vencimentos deste aparelho?')) {
    D = { transactions: [], bills: [] };
    despesasFixas = despesasIniciais;
    save();
    close();
    render();
    toast('Dados apagados.');
  }
};

let hour = new Date().getHours();
$('greeting').textContent = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

render();