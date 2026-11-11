
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

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState('Visão geral');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (checking) {
    return <main className="app"><p>Carregando DZN CONTROL...</p></main>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="diamond">◆</span>
          <div>
            <strong>DZN CONTROL</strong>
            <small>CONTROLE FINANCEIRO</small>
          </div>
        </div>

        <nav>
          {sections.map(section => (
            <button
              key={section}
              className={active === section ? 'nav-item active' : 'nav-item'}
              onClick={() => setActive(section)}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          Seu dinheiro sob controle.
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">PAINEL FINANCEIRO</span>
            <h1>{active}</h1>
          </div>

          <div className="user-area">
            <span>{session.user.email}</span>
            <button onClick={handleLogout}>Sair</button>
          </div>
        </header>

        {active === 'Visão geral' ? (
          <>
            <div className="welcome">
              <span>SEJA BEM-VINDO AO DZN CONTROL</span>
              <h2>Organize seu dinheiro.<br />Construa seu futuro.</h2>
              <p>Tenha seus ganhos, gastos e objetivos em um só lugar.</p>
            </div>

            <div className="cards">
              <article className="stat-card">
                <span>Saldo atual</span>
                <strong>R$ 0,00</strong>
                <small>Seu saldo disponível</small>
              </article>

              <article className="stat-card">
                <span>Entradas</span>
                <strong>R$ 0,00</strong>
                <small>Total recebido</small>
              </article>

              <article className="stat-card">
                <span>Despesas</span>
                <strong>R$ 0,00</strong>
                <small>Total gasto</small>
              </article>

              <article className="stat-card">
                <span>Metas</span>
                <strong>0</strong>
                <small>Objetivos cadastrados</small>
              </article>
            </div>

            <section className="panel">
              <h3>Ações rápidas</h3>
              <div className="actions">
                <button onClick={() => setActive('Lançamentos')}>+ Adicionar ganho</button>
                <button onClick={() => setActive('Lançamentos')}>− Registrar gasto</button>
                <button onClick={() => setActive('Metas')}>◎ Criar meta</button>
                <button onClick={() => setActive('Dívidas')}>↗ Registrar pagamento</button>
              </div>
            </section>
          </>
        ) : active === 'Lançamentos' ? (
          <Transactions />
        ) : (
          <section className="panel section-panel">
            <span className="eyebrow">DZN CONTROL</span>
            <h2>{active}</h2>
            <p>Esta área será desenvolvida na próxima etapa do projeto.</p>
          </section>
        )}

        <footer>DZN CONTROL © 2026 · Seu dinheiro, suas decisões.</footer>
      </section>
    </main>
  );
}
