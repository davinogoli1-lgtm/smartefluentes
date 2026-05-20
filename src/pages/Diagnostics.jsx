import React, { useMemo, useState } from "react";
import { DataTable, PageFrame } from "../components/Layout.jsx";
import { generateDiagnosis } from "../lib/diagnosisAI.js";
import { saveDiagnostic } from "../supabaseClient.js";

const labels = {
  status_operacional: "Status operacional",
  possivel_causa: "Possível causa",
  risco_ambiental: "Risco ambiental",
  risco_operacional: "Risco operacional",
  acao_corretiva: "Ação corretiva",
  acao_preventiva: "Ação preventiva",
  melhoria_fisico_quimica: "Melhoria físico-química",
  melhoria_biologica: "Melhoria biológica",
  observacao_tecnica: "Observação técnica"
};

export default function Diagnostics({ analyses, diagnostics, onSaved, notify }) {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const current = generated || diagnostics[0];
  const selectedAnalysis = useMemo(
    () => analyses.find((analysis) => analysis.id === selectedAnalysisId) || analyses[0],
    [analyses, selectedAnalysisId]
  );

  async function handleGenerate() {
    if (!selectedAnalysis) {
      notify("Registre uma análise antes de gerar diagnóstico com IA.", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await generateDiagnosis(selectedAnalysis);
      const saved = await saveDiagnostic(selectedAnalysis.id, result.diagnosis);
      setGenerated(saved);
      notify(result.message);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível gerar e salvar o diagnóstico.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Diagnóstico Inteligente" subtitle="Análise técnica por IA com fallback operacional local e persistência no Supabase.">
      <div className="form-actions diagnosis-actions">
        <label className="inline-select">
          Análise base
          <select value={selectedAnalysis?.id || ""} onChange={(event) => setSelectedAnalysisId(event.target.value)}>
            {!analyses.length && <option value="">Nenhuma análise registrada</option>}
            {analyses.map((analysis) => (
              <option key={analysis.id} value={analysis.id}>
                {analysis.data} - pH {analysis.ph ?? "s/d"} - DQO {analysis.dqo ?? "s/d"}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" onClick={handleGenerate} disabled={loading || !analyses.length}>
          {loading ? "Gerando diagnóstico..." : "Gerar Diagnóstico com IA"}
        </button>
      </div>

      {!current ? (
        <div className="empty-state">
          <h3>Nenhum diagnóstico salvo</h3>
          <p>Selecione uma análise e clique em “Gerar Diagnóstico com IA”.</p>
        </div>
      ) : (
        <div className="diagnosis-card">
          {Object.entries(labels).map(([key, label]) => (
            <div className="diagnosis-item" key={key}>
              <span>{label}</span>
              <p>{current[key] || "Não informado"}</p>
            </div>
          ))}
        </div>
      )}

      <div className="table-card">
        <h3>Histórico de diagnósticos</h3>
        <DataTable
          rows={diagnostics}
          emptyText="Nenhum diagnóstico registrado para a empresa ativa."
          columns={[
            { key: "created_at", label: "Data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
            { key: "status_operacional", label: "Status" },
            { key: "possivel_causa", label: "Possível causa" },
            { key: "risco_ambiental", label: "Risco ambiental" }
          ]}
        />
      </div>
    </PageFrame>
  );
}
