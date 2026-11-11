
import { useState } from 'react';
import { supabase } from './lib/supabase.js';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Confira seu e-mail para confirmar a conta.');
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível realizar a operação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span>◆</span>
          <strong>DZN CONTROL</strong>
          <small>SEU DINHEIRO, SUAS DECISÕES</small>
        </div>

        <h1>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
        <p className="auth-description">
          {isLogin
            ? 'Entre para acessar seu controle financeiro.'
            : 'Comece a organizar seu dinheiro hoje.'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <label>
              Nome completo
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Seu nome"
                required
              />
            </label>
          )}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading
              ? 'Aguarde...'
              : isLogin
                ? 'Entrar'
                : 'Criar minha conta'}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-switch">
          {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
          {' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
          >
            {isLogin ? 'Cadastre-se' : 'Fazer login'}
          </button>
        </p>
      </section>
    </main>
  );
}
