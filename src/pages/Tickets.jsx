import React, { useState } from "react";
import { DataTable, FormField, PageFrame } from "../components/Layout.jsx";
import { saveSupportTicket, updateSupportTicket } from "../supabaseClient.js";

const initialTicket = {
  titulo: "",
  descricao: "",
  prioridade: "média",
  status: "Aberto",
  resposta_tecnica: ""
};

export default function Tickets({ company, tickets, profile, onSaved, notify }) {
  const [form, setForm] = useState(initialTicket);
  const [loading, setLoading] = useState(false);
  const isAdmin = profile?.role === "admin";

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company) {
      notify("Selecione uma empresa antes de abrir chamados.", "error");
      return;
    }
    setLoading(true);
    try {
      await saveSupportTicket(form, company.id);
      notify("Chamado técnico salvo no Supabase.");
      setForm(initialTicket);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível salvar o chamado.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function closeTicket(ticketId) {
    try {
      await updateSupportTicket(ticketId, { status: "Encerrado" });
      notify("Chamado encerrado.");
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível atualizar o chamado.", "error");
    }
  }

  return (
    <PageFrame title="Chamados Técnicos" subtitle="Abertura, priorização, resposta técnica e histórico de suporte operacional.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <FormField label="Título" name="titulo" value={form.titulo} onChange={update} required />
        <label>Prioridade<select value={form.prioridade} onChange={(event) => update("prioridade", event.target.value)}>
          <option value="baixa">Baixa</option>
          <option value="média">Média</option>
          <option value="alta">Alta</option>
          <option value="crítica">Crítica</option>
        </select></label>
        <FormField label="Descrição" name="descricao" value={form.descricao} onChange={update} textarea required placeholder="Descreva a ocorrência operacional ou demanda técnica." />
        {isAdmin && <FormField label="Resposta técnica" name="resposta_tecnica" value={form.resposta_tecnica} onChange={update} textarea />}
        <div className="form-actions"><button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Abrir chamado"}</button></div>
      </form>
      <div className="table-card">
        <h3>Histórico de chamados</h3>
        <DataTable
          rows={tickets}
          emptyText="Nenhum chamado registrado."
          columns={[
            { key: "created_at", label: "Data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
            { key: "titulo", label: "Título" },
            { key: "prioridade", label: "Prioridade" },
            { key: "status", label: "Status" },
            { key: "resposta_tecnica", label: "Resposta técnica" },
            { key: "acao", label: "Ação", render: (row) => row.status !== "Encerrado" ? <button className="table-action" onClick={() => closeTicket(row.id)}>Encerrar</button> : "Encerrado" }
          ]}
        />
      </div>
    </PageFrame>
  );
}
