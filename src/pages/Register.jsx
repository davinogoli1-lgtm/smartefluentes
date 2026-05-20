import React, { useState } from "react";
import { Brand } from "../components/Layout.jsx";
import { signUp } from "../supabaseClient.js";

export default function Register({ setPage, notify }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await signUp(form);
      notify("Conta criada. Confirme o e-mail, se essa exigência estiver ativa no Supabase.");
      setPage("login");
    } catch (error) {
      notify(error.message || "Não foi possível criar a conta.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <Brand onClick={() => setPage("login")} />
      <h1>Criar conta</h1>
      <p className="form-hint">Cadastre um usuário para operar a Smartefluentes com autenticação real e dados protegidos por RLS.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Nome completo
          <input
            type="text"
            required
            value={form.fullName}
            placeholder="Nome do responsável"
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </label>
        <label>
          E-mail corporativo
          <input
            type="email"
            required
            value={form.email}
            placeholder="operacao@empresa.com.br"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            minLength="6"
            value={form.password}
            placeholder="Crie uma senha segura"
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        <button className="btn primary full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <div className="login-actions">
        <button type="button" onClick={() => setPage("login")}>Já tenho acesso</button>
      </div>
    </section>
  );
}
