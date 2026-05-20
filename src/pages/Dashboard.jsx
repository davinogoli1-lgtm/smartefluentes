import React from "react";
import { DataTable, LineChart, PageFrame } from "../components/Layout.jsx";

function latest(rows) {
  return rows[0] || {};
}

function format(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Sem dado";
  return `${value}${suffix}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Dashboard({
  activeCompany,
  analyses,
  chemicalInputs,
  diagnostics,
  financial,
  sensors,
  tickets,
  automations,
  setPage
}) {
  const current = latest(analyses);
  const currentDiagnostic = latest(diagnostics);
  const chemicalUse = chemicalInputs.reduce((sum, item) => sum + Number(item.quantidade_usada || 0), 0);
  const chemicalCost = chemicalInputs.reduce((sum, item) => sum + Number(item.custo_mensal || 0), 0);
  const revenue = financial.filter((item) => item.tipo === "receita").reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const expenses = financial.filter((item) => item.tipo !== "receita").reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const openTickets = tickets.filter((ticket) => ticket.status !== "Encerrado").length;
  const sensorAlerts = sensors.filter((sensor) => ["atenção", "crítico", "offline"].includes(sensor.status)).length;
  const activeAutomations = automations.filter((automation) => automation.status === "ativo").length;
  const metrics = [
    { label: "pH", value: format(current.ph), target: "6,0 - 9,0", trend: "Faixa operacional" },
    { label: "DQO", value: format(current.dqo, " mg/L"), target: "Carga orgânica", trend: `${analyses.length} análise(s)` },
    { label: "DBO", value: format(current.dbo, " mg/L"), target: "Biodegradabilidade", trend: "Base analítica real" },
    { label: "Turbidez", value: format(current.turbidez, " NTU"), target: "Clarificação", trend: "Controle físico-químico" },
    { label: "Vazão", value: format(current.vazao, " m³/h"), target: "Carga hidráulica", trend: "Operação da ETE" },
    { label: "Temperatura", value: format(current.temperatura, " °C"), target: "Processo biológico", trend: "Monitoramento operacional" },
    { label: "Custo químico", value: money(chemicalCost), target: `${chemicalUse || 0} unidade(s) consumida(s)`, trend: "Controle de insumos" },
    { label: "Status da ETE", value: currentDiagnostic.status_operacional || "Sem diagnóstico", target: "Normal, Atenção ou Crítico", trend: "Diagnóstico inteligente" },
    { label: "Resultado financeiro", value: money(revenue - expenses), target: `${financial.length} lançamento(s)`, trend: "Receitas menos despesas" },
    { label: "Sensores em alerta", value: String(sensorAlerts), target: `${sensors.length} sensor(es)`, trend: "IoT operacional" },
    { label: "Chamados abertos", value: String(openTickets), target: `${tickets.length} chamado(s)`, trend: "Suporte técnico" },
    { label: "Automações ativas", value: String(activeAutomations), target: `${automations.length} regra(s)`, trend: "Alertas operacionais" }
  ];

  return (
    <PageFrame
      title="Dashboard"
      subtitle="Indicadores reais da empresa ativa, consolidados a partir do Supabase."
    >
      {!activeCompany && (
        <div className="empty-state">
          <h3>Cadastre a primeira unidade operacional</h3>
          <p>O dashboard será preenchido automaticamente após o cadastro da empresa e dos dados operacionais.</p>
          <button className="btn primary" onClick={() => setPage("companies")}>Cadastrar empresa</button>
        </div>
      )}

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
            <footer>
              <small>{metric.target}</small>
              <em>{metric.trend}</em>
            </footer>
          </article>
        ))}
      </section>

      <section className="chart-grid-dashboard">
        <article className="chart-card"><LineChart rows={analyses} field="ph" label="Histórico real de pH" /></article>
        <article className="chart-card"><LineChart rows={analyses} field="dqo" label="DQO por período" /></article>
        <article className="chart-card"><LineChart rows={analyses} field="vazao" label="Vazão diária" /></article>
        <article className="chart-card"><LineChart rows={chemicalInputs} field="custo_mensal" label="Custo químico mensal" /></article>
        <article className="chart-card"><LineChart rows={financial} field="valor" label="Movimentação financeira" /></article>
        <article className="chart-card"><LineChart rows={sensors} field="valor" label="Últimas leituras IoT" /></article>
      </section>

      <div className="two-col align-start">
        <div className="table-card">
          <h3>Análises recentes</h3>
          <DataTable
            rows={analyses.slice(0, 5)}
            emptyText="Nenhuma análise registrada."
            columns={[
              { key: "data", label: "Data" },
              { key: "ph", label: "pH" },
              { key: "dqo", label: "DQO" },
              { key: "turbidez", label: "Turbidez" }
            ]}
          />
        </div>
        <div className="table-card">
          <h3>Alertas operacionais</h3>
          <DataTable
            rows={[
              ...sensors.filter((sensor) => sensor.status !== "online").map((sensor) => ({ id: `sensor-${sensor.id}`, origem: "Sensor IoT", descricao: `${sensor.sensor_nome} - ${sensor.status}` })),
              ...tickets.filter((ticket) => ticket.status !== "Encerrado").map((ticket) => ({ id: `ticket-${ticket.id}`, origem: "Chamado", descricao: `${ticket.prioridade} - ${ticket.titulo}` })),
              ...chemicalInputs.filter((input) => Number(input.estoque_atual || 0) <= 0).map((input) => ({ id: `input-${input.id}`, origem: "Estoque químico", descricao: `${input.nome} sem estoque informado` }))
            ]}
            emptyText="Nenhum alerta operacional ativo."
            columns={[
              { key: "origem", label: "Origem" },
              { key: "descricao", label: "Descrição" }
            ]}
          />
        </div>
      </div>
    </PageFrame>
  );
}
