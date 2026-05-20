import React, { useState } from "react";
import { DataTable, FormField, LineChart, PageFrame } from "../components/Layout.jsx";
import { saveFinancialEntry } from "../supabaseClient.js";

const initialEntry = {
  tipo: "despesa",
  descricao: "",
  valor: "",
  vencimento: new Date().toISOString().slice(0, 10),
  status: "pendente"
};

export default function Financial({ company, financial, onSaved, notify }) {
  const [form, setForm] = useState(initialEntry);
  const [loading, setLoading] = useState(false);
  const revenue = financial.filter((item) => item.tipo === "receita").reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const expenses = financial.filter((item) => item.tipo !== "receita").reduce((sum, item) => sum + Number(item.valor || 0), 0);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company) {
      notify("Selecione uma empresa antes de registrar lançamentos financeiros.", "error");
      return;
    }
    setLoading(true);
    try {
      await saveFinancialEntry(form, company.id);
      notify("Lançamento financeiro salvo no Supabase.");
      setForm(initialEntry);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível salvar o lançamento financeiro.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Financeiro" subtitle="Receitas, despesas, custos químicos, mensalidades e status financeiro por empresa.">
      <section className="metric-grid">
        <article className="metric-card"><span>Receitas</span><strong>{revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></article>
        <article className="metric-card"><span>Despesas</span><strong>{expenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></article>
        <article className="metric-card"><span>Resultado</span><strong>{(revenue - expenses).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></article>
      </section>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>Tipo<select value={form.tipo} onChange={(event) => update("tipo", event.target.value)}>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
          <option value="custo_quimico">Custo químico</option>
          <option value="mensalidade">Mensalidade</option>
        </select></label>
        <FormField label="Descrição" name="descricao" value={form.descricao} onChange={update} required />
        <FormField label="Valor" name="valor" value={form.valor} onChange={update} placeholder="1500,00" required />
        <FormField label="Vencimento" name="vencimento" type="date" value={form.vencimento} onChange={update} />
        <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </select></label>
        <div className="form-actions"><button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Salvar lançamento"}</button></div>
      </form>
      <div className="chart-card"><LineChart rows={financial} field="valor" label="Gráfico financeiro real" /></div>
      <div className="table-card">
        <h3>Lançamentos financeiros</h3>
        <DataTable
          rows={financial}
          emptyText="Nenhum lançamento financeiro registrado."
          columns={[
            { key: "vencimento", label: "Vencimento" },
            { key: "tipo", label: "Tipo" },
            { key: "descricao", label: "Descrição" },
            { key: "valor", label: "Valor", render: (row) => Number(row.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
            { key: "status", label: "Status" }
          ]}
        />
      </div>
    </PageFrame>
  );
}
