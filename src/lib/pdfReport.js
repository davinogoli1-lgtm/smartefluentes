import { jsPDF } from "jspdf";

async function imageToDataUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function periodFromAnalyses(analyses) {
  if (!analyses.length) return "Sem análises registradas";
  const dates = analyses.map((item) => item.data).filter(Boolean).sort();
  return `${dates[0]} a ${dates[dates.length - 1]}`;
}

function writeSection(doc, title, lines, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 16, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const split = doc.splitTextToSize(lines.filter(Boolean).join("\n"), 178);
  doc.text(split, 16, y + 7);
  return y + 12 + split.length * 4;
}

function drawBars(doc, title, rows, field, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, 16, y);
  const values = rows.map((row) => Number(row[field]) || 0);
  const max = Math.max(...values, 1);
  rows.slice(0, 6).forEach((row, index) => {
    const value = Number(row[field]) || 0;
    const barY = y + 8 + index * 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(row.data || row.data_uso || row.created_at || ""), 16, barY + 4);
    doc.setFillColor(22, 163, 106);
    doc.rect(48, barY, (value / max) * 110, 5, "F");
    doc.text(String(value), 164, barY + 4);
  });
  return y + 58;
}

export async function generateTechnicalReportPdf({ company, analyses, diagnostics, chemicalInputs, financial, sensors }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await imageToDataUrl("/images/logo.png");
  const latestDiagnosis = diagnostics[0];
  const periodo = periodFromAnalyses(analyses);
  const chemicalCost = chemicalInputs.reduce((sum, item) => sum + Number(item.custo_mensal || 0), 0);
  const expenses = financial.filter((item) => item.tipo !== "receita").reduce((sum, item) => sum + Number(item.valor || 0), 0);

  doc.setFillColor(6, 43, 50);
  doc.rect(0, 0, 210, 34, "F");
  if (logo) doc.addImage(logo, "PNG", 14, 8, 16, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório Técnico Smartefluentes", 36, 16);
  doc.setFontSize(9);
  doc.text("Inteligência operacional para tratamento de efluentes industriais", 36, 23);
  doc.setTextColor(19, 47, 58);

  let y = 46;
  y = writeSection(doc, "Dados da empresa", [
    `Razão social: ${company.razao_social}`,
    `CNPJ: ${company.cnpj}`,
    `Responsável: ${company.responsavel || "Não informado"}`,
    `Tipo de efluente: ${company.tipo_efluente || "Não informado"}`,
    `Período analisado: ${periodo}`
  ], y);

  y = writeSection(doc, "Resumo operacional", [
    `Análises registradas: ${analyses.length}`,
    `Diagnósticos técnicos: ${diagnostics.length}`,
    `Insumos lançados: ${chemicalInputs.length}`,
    `Custo químico mensal consolidado: ${money(chemicalCost)}`,
    `Despesas financeiras registradas: ${money(expenses)}`,
    `Sensores IoT cadastrados: ${sensors.length}`
  ], y + 2);

  if (analyses.length) {
    y = drawBars(doc, "Gráfico real - DQO por período", analyses, "dqo", y + 2);
    y = drawBars(doc, "Gráfico real - Turbidez por período", analyses, "turbidez", y);
  }

  if (y > 235) {
    doc.addPage();
    y = 24;
  }

  y = writeSection(doc, "Diagnóstico operacional", [
    latestDiagnosis?.status_operacional && `Status: ${latestDiagnosis.status_operacional}`,
    latestDiagnosis?.possivel_causa || "Nenhum diagnóstico registrado para o período.",
    latestDiagnosis?.risco_ambiental,
    latestDiagnosis?.risco_operacional
  ], y + 2);

  y = writeSection(doc, "Recomendações técnicas", [
    latestDiagnosis?.acao_corretiva,
    latestDiagnosis?.acao_preventiva,
    latestDiagnosis?.melhoria_fisico_quimica,
    latestDiagnosis?.melhoria_biologica,
    latestDiagnosis?.observacao_tecnica
  ], y + 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Assinatura técnica", 16, 280);
  doc.setFont("helvetica", "normal");
  doc.text("Smartefluentes - Plataforma SaaS ambiental para ETEs industriais", 16, 286);

  const blob = doc.output("blob");
  const safeName = company.razao_social.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "");
  return {
    blob,
    fileName: `relatorio-tecnico-${safeName || "empresa"}-${Date.now()}.pdf`,
    periodo,
    resumo: `Relatório técnico gerado para ${company.razao_social} com ${analyses.length} análise(s), ${diagnostics.length} diagnóstico(s) e ${chemicalInputs.length} lançamento(s) de insumos.`,
    recomendacoes: latestDiagnosis
      ? [latestDiagnosis.acao_corretiva, latestDiagnosis.acao_preventiva, latestDiagnosis.melhoria_fisico_quimica, latestDiagnosis.melhoria_biologica].filter(Boolean).join(" ")
      : "Registre análises e diagnósticos para consolidar recomendações técnicas."
  };
}
