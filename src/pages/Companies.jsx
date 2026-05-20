import React, { useEffect, useState } from "react";
import { DataTable, FormField, PageFrame } from "../components/Layout.jsx";
import { saveCompany } from "../supabaseClient.js";

const initialCompany = {
  razao_social: "",
  cnpj: "",
  responsavel: "",
  telefone: "",
  email: "",
  tipo_efluente: "",
  endereco: ""
};

export default function Companies({ user, companies, activeCompanyId, onCompanyChange, onSaved, notify }) {
  const [form, setForm] = useState(initialCompany);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selected = companies.find((company) => company.id === activeCompanyId);
    if (selected) setForm(selected);
  }, [activeCompanyId, companies]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleNewCompany() {
    setForm(initialCompany);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const saved = await saveCompany(form, user.id);
      notify("Empresa salva com sucesso no Supabase.");
      onCompanyChange(saved.id);
      await onSaved(saved.id);
    } catch (error) {
      notify(error.message || "Não foi possível salvar a empresa.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Gestão Operacional" subtitle="Cadastro multiempresa, responsável técnico e perfil do efluente industrial.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <FormField label="Razão social" name="razao_social" value={form.razao_social} onChange={update} placeholder="Indústria Exemplo Ltda." required />
        <FormField label="CNPJ" name="cnpj" value={form.cnpj} onChange={update} placeholder="00.000.000/0001-00" required />
        <FormField label="Responsável" name="responsavel" value={form.responsavel} onChange={update} placeholder="Nome do responsável técnico" />
        <FormField label="Telefone" name="telefone" value={form.telefone} onChange={update} placeholder="(00) 00000-0000" />
        <FormField label="E-mail" name="email" type="email" value={form.email} onChange={update} placeholder="ambiental@empresa.com.br" />
        <FormField label="Tipo de efluente" name="tipo_efluente" value={form.tipo_efluente} onChange={update} placeholder="Industrial misto, sanitário, alimentício..." />
        <FormField label="Endereço" name="endereco" value={form.endereco} onChange={update} placeholder="Endereço da unidade operacional" />
        <div className="form-actions">
          <button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Salvar empresa"}</button>
          <button className="btn secondary" type="button" onClick={handleNewCompany}>Nova empresa</button>
        </div>
      </form>
      <div className="table-card">
        <h3>Empresas cadastradas</h3>
        <DataTable
          rows={companies}
          emptyText="Nenhuma empresa cadastrada para este usuário."
          columns={[
            { key: "razao_social", label: "Razão social" },
            { key: "cnpj", label: "CNPJ" },
            { key: "tipo_efluente", label: "Tipo de efluente" },
            { key: "responsavel", label: "Responsável" },
            {
              key: "acao",
              label: "Ação",
              render: (row) => (
                <button className="table-action" onClick={() => onCompanyChange(row.id)}>
                  {row.id === activeCompanyId ? "Ativa" : "Selecionar"}
                </button>
              )
            }
          ]}
        />
      </div>
    </PageFrame>
  );
}
