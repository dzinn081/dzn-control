import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';
import Auth from './Auth.jsx';
import Transactions from './Transactions.jsx';

const sections = [
  'Visão geral',
  'Lançamentos',
  'Metas',
  'Dívidas',
  'Cofrinhos',
  'Relatórios',
  'DZN LAB',
  'Configurações'
];

function currency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function dateFormat(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function Overview({ userId }) {
  const [data, setData] = useState({
    transactions: [],
    debts: [],
    goals: [],
    pots: [],
    bills: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const tables = [
        ['transactions', 'id, type, description, category, amount, transaction_date, created_at'],
        ['debts', 'id, creditor, total_amount, paid_amount, status, due_date'],
        ['goals', 'id, title, target_amount, saved_amount, target_date'],
        ['savings_pots', 'id, name, balance'],
        ['bills', 'id, description, amount, due_date, status']
      ];

      const results = await Promise.all(
        tables.map(async ([table, columns]) => {
          const result = await supabase
            .from(table)
            .select(columns)
            .eq('user_id', userId);

          return { table, ...result };
        })
      );

      if (!active) return;

      const failed = results.find((item) => item.error);

      if (failed) {
        setError(`Erro ao carregar ${failed.table}: ${failed.error.message}`);
      }

      const next = {};

      results.forEach((item) => {
        next[item.table === 'savings_pots' ? 'pots' : item.table] =
          item.data || [];
      });

      setData((previous) => ({ ...previous, ...next }));
      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [userId]);

  const income = data.transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenses = data.transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = income - expenses;

  const incomeCount = data.transactions.filter(
    (item) => item.type === 'income'
  ).length;

  const expensesCount = data.transactions.filter(
    (item) => item.type === 'expense'
  ).length;

  const debtTotal = data.debts.reduce(
    (sum, item) =>
      sum + Math.max(
        0,
        Number(item.total_amount || 0) - Number(item.paid_amount || 0)
      ),
    0
  );

  const goalsTotal = data.goals.reduce(
    (sum, item) => sum + Number(item.target_amount || 0),
    0
  );

  const goalsSaved = data.goals.reduce(
    (sum, item) => sum + Number(item.saved_amount || 0),
    0
  );

  const potsTotal = data.pots.reduce(
    (sum, item) => sum + Number(item.balance || 0),
    0
  );

  const billsTotal = data.bills.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const recent = [...data.transactions]
    .sort((a, b) => {
      const dateA = `${a.transaction_date || ''} ${a.created_at || ''}`;
      const dateB = `${b.transaction_date || ''} ${b.created_at || ''}`;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  if (loading) {
    return <section className="panel">Carregando seus dados financeiros...</section>;
  }

  return (
    <div>
      {error && (
        <section className="panel">
          <p className="transaction-message">{error}</p>
        </section>
      )}

      <div className="welcome">
        <span>SEU PAINEL FINANCEIRO</span>
        <h2>Seu dinheiro sob controle.</h2>
        <p>Acompanhe suas entradas, despesas e objetivos financeiros.</p>
      </div>

      <div className="cards-grid">
        <article className="stat-card">
          <span>Saldo calculado</span>
          <strong>{currency(balance)}</strong>
          <small>Entradas menos despesas cadastradas</small>
        </article>

        <article className="stat-card">
          <span>Total de entradas</span>
          <strong>{currency(income)}</strong>
          <small>{incomeCount} registros</small>
        </article>

        <article className="stat-card">
          <span>Total de despesas</span>
          <strong>{currency(expenses)}</strong>
          <small>{expensesCount} registros</small>
        </article>

        <article className="stat-card">
          <span>Dívidas restantes</span>
          <strong>{currency(debtTotal)}</strong>
          <small>{data.debts.length} dívidas cadastradas</small>
        </article>
      </div>

      <section className="panel">
        <h3>Seu planejamento</h3>
        <div className="cards-grid">
          <article className="stat-card">
            <span>Metas acumuladas</span>
            <strong>{currency(goalsSaved)}</strong>
            <small>De {currency(goalsTotal)} planejados</small>
          </article>

          <article className="stat-card">
            <span>Cofrinhos</span>
            <strong>{currency(potsTotal)}</strong>
            <small>{data.pots.length} cofrinhos</small>
          </article>

          <article className="stat-card">
            <span>Contas cadastradas</span>
            <strong>{currency(billsTotal)}</strong>
            <small>{data.bills.length} contas</small>
          </article>
        </div>
      </section>

      <section className="panel">
        <h3>Lançamentos recentes</h3>

        {recent.length === 0 ? (
          <p>Nenhum lançamento cadastrado ainda.</p>
        ) : (
          <div className="transaction-items">
            {recent.map((item) => (
              <article className="transaction-item" key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <small>
                    {item.category || 'Sem categoria'} · {dateFormat(item.transaction_date)}
                  </small>
                </div>

                <strong className={
                  item.type === 'income' ? 'income-value' : 'expense-value'
                }>
                  {item.type === 'income' ? '+' : '−'} {currency(item.amount)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState('Visão geral');

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!error) setSession(data.session);
      setChecking(false);
    }

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (mounted) setSession(nextSession);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('Não foi possível sair: ' + error.message);
    }
  }

  if (checking) {
    return (
      <main className="app-shell loading-shell">
        <div className="loading-card">Carregando DZN CONTROL...</div>
      </main>
    );
  }

  if (!session) return <Auth />;

  const userName =
    session.user?.user_metadata?.full_name ||
    session.user?.email ||
    'Usuário';

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <div>
            <strong>DZN CONTROL</strong>
            <small>CONTROLE FINANCEIRO</small>
          </div>
        </div>

        <nav className="nav" aria-label="Menu principal">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className={active === section ? 'nav-item active' : 'nav-item'}
              onClick={() => setActive(section)}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">Seu dinheiro sob controle.</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">PAINEL FINANCEIRO</span>
            <h1>{active}</h1>
          </div>

          <div className="user-area">
            <span>{userName}</span>
            <button type="button" onClick={handleLogout}>Sair</button>
          </div>
        </header>

        {active === 'Visão geral' ? (
          <Overview userId={session.user.id} />
        ) : active === 'Lançamentos' ? (
          <Transactions />
        ) : (
          <section className="panel section-panel">
            <span className="eyebrow">DZN CONTROL</span>
            <h2>{active}</h2>
            <p>Esta área será desenvolvida na próxima etapa.</p>
          </section>
        )}

        <footer className="app-footer">
          DZN CONTROL © 2026 · Seu dinheiro, suas decisões.
        </footer>
      </section>
    </main>
  );
}
