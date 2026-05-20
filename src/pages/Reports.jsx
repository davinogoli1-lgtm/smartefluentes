import React, { useState } from "react";
import { DataTable, PageFrame } from "../components/Layout.jsx";
import { generateTechnicalReportPdf } from "../lib/pdfReport.js";
import { saveReport, uploadReportPdf } from "../supabaseClient.js";

export default function Reports({ user, company, analyses, diagnostics, chemicalInputs, financial, sensors, reports, onSaved, notify }) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!company) {
      notify("Cadastre ou selecione uma empresa antes de gerar relatórios.", "error");
      return;
    }

    setLoading(true);
    try {
      const pdf = await generateTechnicalReportPdf({ company, analyses, diagnostics, chemicalInputs, financial, sensors });
      const pdfUrl = await uploadReportPdf({
        userId: user.id,
        companyId: company.id,
        fileName: pdf.fileName,
        blob: pdf.blob
      });
      await saveReport({
        periodo: pdf.periodo,
        resumo: pdf.resumo,
        recomendacoes: pdf.recomendacoes,
        pdf_url: pdfUrl
      }, company.id);
      notify("Relatório técnico PDF gerado, enviado ao Supabase Storage e salvo no banco.");
      await onSaved();
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      notify(error.message || "Não foi possível gerar o relatório PDF.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Relatórios" subtitle="Geração real de relatório técnico PDF com dados operacionais da empresa ativa.">
      <button className="btn primary" onClick={handleGenerate} disabled={loading}>
        {loading ? "Gerando PDF..." : "Gerar Relatório Técnico PDF"}
      </button>
      <section className="report-preview">
        <h3>Dados incluídos no próximo relatório</h3>
        <div className="report-grid">
          <article><span>Empresa</span><p>{company?.razao_social || "Empresa não selecionada"}</p></article>
          <article><span>Análises reais</span><p>{analyses.length} registro(s)</p></article>
          <article><span>Diagnósticos reais</span><p>{diagnostics.length} registro(s)</p></article>
          <article><span>Insumos químicos</span><p>{chemicalInputs.length} lançamento(s)</p></article>
          <article><span>Financeiro</span><p>{financial.length} lançamento(s)</p></article>
          <article><span>Sensores IoT</span><p>{sensors.length} leitura(s)</p></article>
        </div>
      </section>
      <div className="table-card">
        <h3>Relatórios gerados</h3>
        <DataTable
          rows={reports}
          emptyText="Nenhum relatório salvo para a empresa ativa."
          columns={[
            { key: "created_at", label: "Data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
            { key: "periodo", label: "Período" },
            { key: "resumo", label: "Resumo" },
            {
              key: "pdf_url",
              label: "PDF",
              render: (row) => row.pdf_url ? <a href={row.pdf_url} target="_blank" rel="noreferrer">Abrir PDF</a> : "Sem arquivo"
            }
          ]}
        />
      </div>
    </PageFrame>
  );
}
