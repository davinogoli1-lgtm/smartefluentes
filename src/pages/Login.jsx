import React, { useState } from "react";
import { Brand } from "../components/Layout.jsx";
import { resetPassword, signIn } from "../supabaseClient.js";

export default function Login({ setPage, onAuthenticated, notify }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await signIn(form.email, form.password);
      notify("Login realizado com sucesso.");
      onAuthenticated(data.session);
    } catch (error) {
      notify(error.message || "Não foi possível acessar a plataforma.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!form.email) {
      notify("Informe o e-mail para receber a recuperação de senha.", "error");
      return;
    }
    setResetting(true);
    try {
      await resetPassword(form.email);
      notify("E-mail de recuperação enviado pelo Supabase Auth.");
    } catch (error) {
      notify(error.message || "Não foi possível enviar a recuperação de senha.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="auth-card">
      <Brand onClick={() => setPage("login")} />
      <h1>Acesso à plataforma</h1>
      <p className="form-hint">Entre para acessar dashboard, análises, insumos, diagnósticos, relatórios e módulos operacionais.</p>
      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            required
            value={form.email}
            placeholder="nome@empresa.com.br"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            value={form.password}
            placeholder="Digite sua senha"
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        <button className="btn primary full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <div className="login-actions">
        <button type="button" onClick={() => setPage("register")}>Criar conta</button>
        <button type="button" disabled={resetting} onClick={handleResetPassword}>
          {resetting ? "Enviando..." : "Esqueci minha senha"}
        </button>
      </div>
    </section>
  );
}
