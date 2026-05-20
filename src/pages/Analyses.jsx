import React, { useState } from "react";
import { DataTable, FormField, PageFrame } from "../components/Layout.jsx";
import { saveAnalysis } from "../supabaseClient.js";

const initialAnalysis = {
  data: new Date().toISOString().slice(0, 10),
  ph: "",
  dqo: "",
  dbo: "",
  turbidez: "",
  oleos_graxas: "",
  solidos_sedimentaveis: "",
  vazao: "",
  temperatura: "",
  observacoes: ""
};

export default function Analyses({ company, analyses, onSaved, notify }) {
  const [form, setForm] = useState(initialAnalysis);
  const [loading, setLoading] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company) {
      notify("Cadastre ou selecione uma empresa antes de registrar análises.", "error");
      return;
    }

    setLoading(true);
    try {
      await saveAnalysis(form, company.id);
      notify("Análise operacional salva no Supabase.");
      setForm(initialAnalysis);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível salvar a análise.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Análises" subtitle="Registro dos parâmetros físico-químicos e operacionais do efluente industrial.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <FormField label="Data" name="data" type="date" value={form.data} onChange={update} required />
        <FormField label="pH" name="ph" value={form.ph} onChange={update} placeholder="7,1" />
        <FormField label="DQO" name="dqo" value={form.dqo} onChange={update} placeholder="418" />
        <FormField label="DBO" name="dbo" value={form.dbo} onChange={update} placeholder="146" />
        <FormField label="Turbidez" name="turbidez" value={form.turbidez} onChange={update} placeholder="36" />
        <FormField label="Óleos e graxas" name="oleos_graxas" value={form.oleos_graxas} onChange={update} placeholder="8" />
        <FormField label="Sólidos sedimentáveis" name="solidos_sedimentaveis" value={form.solidos_sedimentaveis} onChange={update} placeholder="0,7" />
        <FormField label="Vazão" name="vazao" value={form.vazao} onChange={update} placeholder="42" />
        <FormField label="Temperatura" name="temperatura" value={form.temperatura} onChange={update} placeholder="31" />
        <FormField label="Observações" name="observacoes" value={form.observacoes} onChange={update} textarea placeholder="Descreva ocorrências, ajustes operacionais ou não conformidades observadas." />
        <div className="form-actions">
          <button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Salvar análise"}</button>
        </div>
      </form>
      <div className="table-card">
        <h3>Histórico de análises</h3>
        <DataTable
          rows={analyses}
          emptyText="Nenhuma análise registrada para esta empresa."
          columns={[
            { key: "data", label: "Data" },
            { key: "ph", label: "pH" },
            { key: "dqo", label: "DQO" },
            { key: "dbo", label: "DBO" },
            { key: "turbidez", label: "Turbidez" },
            { key: "vazao", label: "Vazão" },
            { key: "temperatura", label: "Temperatura" }
          ]}
        />
      </div>
    </PageFrame>
  );
}
