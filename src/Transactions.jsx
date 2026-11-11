import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';
function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}
export default function Transactions() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('income');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function loadTransactions() {
    setLoading(true);
    setMessage('');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setItems([]);
      setLoading(false);
      setMessage('Sua sessão expirou. Faça login novamente.');
      return;
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('id, type, description, category, amount, transaction_date, created_at')
      .eq('user_id', userData.user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      setMessage('Não foi possível carregar os lançamentos: ' + error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }
  useEffect(() => {
    loadTransactions();
  }, []);
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const numericAmount = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage('Informe um valor maior que zero.');
      return;
    }
    if (!['income', 'expense'].includes(type)) {
      setMessage('Selecione um tipo de lançamento válido.');
      return;
    }
    setSaving(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setMessage('Sua sessão expirou. Entre novamente na sua conta.');
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('transactions').insert({
      user_id: userData.user.id,
      type,
      description: description.trim(),
      category: category.trim(),
      amount: numericAmount,
      transaction_date: transactionDate
    });
    if (error) {
      setMessage('Não foi possível salvar: ' + error.message);
    } else {
      setDescription('');
      setCategory('');
      setAmount('');
      setTransactionDate(getToday());
      setMessage('Lançamento salvo com sucesso!');
      await loadTransactions();
    }
    setSaving(false);
  }
  return (
    <div className="transactions-page">
      <section className="panel">
        <h3>Novo lançamento</h3>
        <form className="transaction-form" onSubmit={handleSubmit}>
          <label>
            Tipo
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="income">Entrada</option>
              <option value="expense">Despesa</option>
            </select>
          </label>
          <label>
            Descrição
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: salário, mercado, corrida..."
              required
            />
          </label>
          <label>
            Categoria
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ex.: trabalho, alimentação..."
              required
            />
          </label>
          <label>
            Valor (R$)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              required
            />
          </label>
          <label>
            Data da transação
            <input
              type="date"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar lançamento'}
          </button>
        </form>
        {message && <p className="transaction-message">{message}</p>}
      </section>
      <section className="panel transaction-list">
        <h3>Histórico de lançamentos</h3>
        {loading ? (
          <p>Carregando lançamentos...</p>
        ) : items.length === 0 ? (
          <p>Nenhum lançamento cadastrado ainda.</p>
        ) : (
          <div className="transaction-items">
            {items.map((item) => (
              <article className="transaction-item" key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <small>
                    {item.category || 'Sem categoria'} · {formatDate(item.transaction_date)}
                  </small>
                </div>
                <strong className={item.type === 'income' ? 'income-value' : 'expense-value'}>
                  {item.type === 'income' ? '+' : '−'} {formatCurrency(item.amount)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
