import React, { useState } from "react";
import { DataTable, FormField, PageFrame } from "../components/Layout.jsx";
import { saveAutomation } from "../supabaseClient.js";

const initialAutomation = {
  nome: "",
  condicao: "",
  acao: "",
  status: "ativo"
};

export default function Automations({ company, automations, onSaved, notify }) {
  const [form, setForm] = useState(initialAutomation);
  const [loading, setLoading] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company) {
      notify("Selecione uma empresa antes de criar automações.", "error");
      return;
    }
    setLoading(true);
    try {
      await saveAutomation(form, company.id);
      notify("Regra de automação operacional salva no Supabase.");
      setForm(initialAutomation);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível salvar a automação.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Automações" subtitle="Regras para alertas operacionais, risco ambiental, estoque químico e notificações futuras.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <FormField label="Nome da regra" name="nome" value={form.nome} onChange={update} placeholder="Alerta de pH crítico" required />
        <FormField label="Condição" name="condicao" value={form.condicao} onChange={update} textarea placeholder="Ex.: pH menor que 6 ou estoque de PAC menor que 50 kg" required />
        <FormField label="Ação" name="acao" value={form.acao} onChange={update} textarea placeholder="Ex.: abrir chamado técnico e notificar operação" required />
        <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}>
          <option value="ativo">Ativo</option>
          <option value="pausado">Pausado</option>
        </select></label>
        <div className="form-actions"><button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Salvar automação"}</button></div>
      </form>
      <div className="table-card">
        <h3>Regras operacionais</h3>
        <DataTable
          rows={automations}
          emptyText="Nenhuma automação operacional cadastrada."
          columns={[
            { key: "nome", label: "Regra" },
            { key: "condicao", label: "Condição" },
            { key: "acao", label: "Ação" },
            { key: "status", label: "Status" }
          ]}
        />
      </div>
    </PageFrame>
  );
}
