import React, { useMemo, useState } from "https://esm.sh/react@19.1.1";
import { createRoot } from "https://esm.sh/react-dom@19.1.1/client";
import {
  isSupabaseConfigured,
  generateEffluentDiagnosis,
  saveAnalysis,
  saveChemicalProduct,
  saveCompany,
  saveReport,
  saveUser
} from "./supabaseClient.js";

const h = React.createElement;

const navItems = [
  ["landing", "Início", "IN"],
  ["login", "Login", "LG"],
  ["dashboard", "Dashboard", "DB"],
  ["empresa", "Gestão Operacional", "GO"],
  ["analises", "Análises", "AN"],
  ["ia", "Diagnóstico Inteligente", "DI"],
  ["quimicos", "Controle de Insumos", "CI"],
  ["relatorios", "Relatórios", "RT"],
  ["consultoria", "Consultoria Técnica", "CT"]
];

const metricData = [
  { label: "pH", value: "7,1", target: "6,0 - 9,0", trend: "Estável", status: "Normal" },
  { label: "DQO", value: "418 mg/L", target: "< 500", trend: "-8%", status: "Normal" },
  { label: "DBO", value: "146 mg/L", target: "< 180", trend: "-5%", status: "Normal" },
  { label: "Turbidez", value: "36 NTU", target: "< 50", trend: "+3%", status: "Atenção" },
  { label: "Vazão", value: "42 m³/h", target: "35 - 48", trend: "Pico às 14h", status: "Normal" },
  { label: "Temperatura", value: "31 °C", target: "20 - 35", trend: "+1 °C", status: "Normal" },
  { label: "Consumo de insumos químicos", value: "84 kg/dia", target: "< 90", trend: "-12%", status: "Normal" },
  { label: "Status da ETE", value: "Normal", target: "Normal, Atenção ou Crítico", trend: "Sem alarme crítico", status: "Normal" }
];

const analysisHistory = [
  { date: "13/05", ph: 6.8, dqo: 462, dbo: 172, turbidez: 42, vazao: 39, temperatura: 29, ocorrencias: 2 },
  { date: "14/05", ph: 7.0, dqo: 438, dbo: 166, turbidez: 39, vazao: 41, temperatura: 30, ocorrencias: 1 },
  { date: "15/05", ph: 7.4, dqo: 429, dbo: 158, turbidez: 41, vazao: 44, temperatura: 31, ocorrencias: 1 },
  { date: "16/05", ph: 7.2, dqo: 411, dbo: 151, turbidez: 37, vazao: 43, temperatura: 31, ocorrencias: 0 },
  { date: "17/05", ph: 7.1, dqo: 418, dbo: 146, turbidez: 36, vazao: 42, temperatura: 31, ocorrencias: 0 }
];

const chemicalMonthlyData = [
  { date: "Jan", consumo: 2380 },
  { date: "Fev", consumo: 2290 },
  { date: "Mar", consumo: 2170 },
  { date: "Abr", consumo: 2050 },
  { date: "Mai", consumo: 1940 }
];

const chemicalRows = [
  { insumo: "PAC 18%", quantidade: "46 kg", custo: "R$ 322,00", estoque: "720 kg", data: "17/05/2026" },
  { insumo: "Polímero catiônico", quantidade: "4,8 kg", custo: "R$ 288,00", estoque: "86 kg", data: "17/05/2026" },
  { insumo: "Soda cáustica", quantidade: "33 kg", custo: "R$ 198,00", estoque: "510 kg", data: "16/05/2026" }
];

const companyDefaults = {
  "Razão social": "Indústria Horizonte Ltda.",
  CNPJ: "12.345.678/0001-90",
  Responsável: "Marina Costa",
  Telefone: "(11) 98888-2026",
  "E-mail": "operacao@horizonte.com.br",
  "Tipo de efluente": "Efluente industrial misto com carga orgânica",
  Endereço: "Av. Ambiental, 1200 - Distrito Industrial"
};

const chemicalDefaults = {
  "Nome do insumo": "PAC 18%",
  Tipo: "Coagulante",
  "Quantidade usada": "46",
  "Custo operacional (R$)": "322",
  "Custo unitário (R$)": "7",
  "Custo mensal (R$)": "1940",
  "Estoque atual": "720",
  "Data de utilização": "2026-05-17"
};

function App() {
  const [page, setPage] = useState("landing");
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(companyDefaults);
  const [companyId, setCompanyId] = useState(null);
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });
  const [analysis, setAnalysis] = useState({
    Data: "2026-05-19",
    pH: "7.1",
    DQO: "418",
    DBO: "146",
    Turbidez: "36",
    "Óleos e graxas": "8",
    "Sólidos sedimentáveis": "0.7",
    Vazão: "42",
    Temperatura: "31",
    Observações: "Operação estável, com leve aumento de turbidez após a etapa de equalização."
  });
  const [chemical, setChemical] = useState(chemicalDefaults);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [aiState, setAiState] = useState({ status: "idle", message: "" });
  const localDiagnosis = useMemo(() => buildDiagnosis(analysis), [analysis]);
  const diagnosis = aiDiagnosis || localDiagnosis;

  async function persist(action, successMessage) {
    setSaveState({ status: "saving", message: "Registrando informações operacionais..." });
    try {
      const result = await action();
      setSaveState({
        status: result.offline ? "offline" : "success",
        message: result.offline
          ? "Supabase ainda não configurado. Registro mantido em modo demonstração."
          : successMessage
      });
      return result.data;
    } catch (error) {
      setSaveState({ status: "error", message: error.message || "Não foi possível registrar as informações." });
      return null;
    }
  }

  return h(
    "div",
    { className: "platform-shell" },
    h(Sidebar, { page, setPage }),
    h("div", { className: "workspace" },
      h(MobileTopbar, { page, setPage }),
      h("main", { className: page === "landing" ? "main main-landing" : "main" },
        page === "landing" && h(LandingPage, { setPage }),
        page === "login" && h(LoginPage, { setPage, setCurrentUser, persist }),
        page === "dashboard" && h(DashboardPage),
        page === "empresa" && h(CompanyPage, { company, setCompany, companyId, setCompanyId, currentUser, persist }),
        page === "analises" && h(AnalysisPage, { analysis, setAnalysis, companyId, persist }),
        page === "ia" && h(AiPage, { analysis, setAnalysis, diagnosis, aiState, setAiState, setAiDiagnosis }),
        page === "quimicos" && h(ChemicalsPage, { chemical, setChemical, companyId, persist }),
        page === "relatorios" && h(ReportsPage, { diagnosis, company, companyId, persist }),
        page === "consultoria" && h(ConsultingPage)
      ),
      h(SaveToast, { state: saveState })
    )
  );
}

function Sidebar({ page, setPage }) {
  return h(
    "aside",
    { className: "sidebar" },
    h(Brand, { onClick: () => setPage("landing"), compact: false }),
    h("nav", { className: "side-nav", "aria-label": "Navegação principal" },
      navItems.map(([key, label, icon]) =>
        h("button", {
          key,
          className: `nav-item ${page === key ? "active" : ""}`,
          onClick: () => setPage(key)
        }, h("span", { className: "nav-icon" }, icon), h("span", null, label))
      )
    ),
    h("div", { className: "sidebar-card" },
      h("span", null, isSupabaseConfigured ? "Supabase conectado" : "Modo demonstração"),
      h("strong", null, "Profissional"),
      h("small", null, isSupabaseConfigured ? "Dados operacionais persistidos na nuvem" : "Configure o .env para persistência em nuvem")
    )
  );
}

function MobileTopbar({ page, setPage }) {
  return h(
    "header",
    { className: "mobile-topbar" },
    h(Brand, { onClick: () => setPage("landing"), compact: true }),
    h("select", {
      value: page,
      onChange: (event) => setPage(event.target.value),
      "aria-label": "Selecionar módulo"
    },
      navItems.map(([key, label]) => h("option", { value: key, key }, label))
    )
  );
}

function Brand({ onClick, compact }) {
  return h("button", { className: "brand", onClick, "aria-label": "Ir para o início" },
    h("span", { className: "brand-logo-wrap" },
      h("img", {
        src: "/images/logo.png",
        alt: "Smartefluentes",
        className: "brand-logo",
        onError: (event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextSibling.style.display = "grid";
        }
      }),
      h("span", { className: "brand-mark", style: { display: "none" } }, "S")
    ),
    h("span", { className: "brand-copy" },
      h("b", null, "Smartefluentes"),
      !compact && h("small", null, "Comunique • Aprenda • Transforme")
    )
  );
}

function LandingPage({ setPage }) {
  const stats = [
    ["88%", "eficiência operacional estimada"],
    ["-12%", "redução simulada no consumo de insumos"],
    ["24h", "visão contínua da condição da ETE"],
    ["5", "coletas consolidadas no histórico técnico"]
  ];
  const benefits = [
    ["Gestão Operacional", "Centralize dados da unidade industrial, perfil do efluente, responsáveis técnicos e rastreabilidade ambiental."],
    ["Diagnóstico Inteligente", "Aplique IA para identificar causas prováveis, risco operacional e ações corretivas com linguagem técnica."],
    ["Controle de Insumos", "Acompanhe consumo, estoque e custo operacional de coagulantes, alcalinizantes, polímeros e insumos auxiliares."],
    ["Relatórios Técnicos", "Consolide histórico analítico, indicadores gráficos, diagnóstico e recomendações para tomada de decisão."]
  ];
  const modules = [
    ["Dashboard", "Indicadores críticos, status da ETE, tendências operacionais e leitura executiva em tempo real."],
    ["Análises", "Registro de pH, DQO, DBO, turbidez, óleos e graxas, sólidos sedimentáveis, vazão e temperatura."],
    ["Diagnóstico Inteligente", "Interpretação técnica com causas prováveis, riscos ambientais e ações de controle."],
    ["Controle de Insumos", "Gestão de coagulantes, polímeros, alcalinizantes, ácidos, oxidantes e antiespumantes."],
    ["Relatórios", "Prévia técnica com período analisado, gráficos, ocorrências e recomendações ambientais."],
    ["Consultoria Técnica", "Solicitações para otimização físico-química, biológica, custos, lodo e adequação ambiental."]
  ];
  const steps = ["Cadastre a unidade industrial e a ETE", "Registre análises laboratoriais e consumo de insumos", "Receba diagnósticos e recomendações técnicas", "Gere relatórios para gestão e conformidade ambiental"];
  return h(
    React.Fragment,
    null,
    h("section", { className: "hero" },
      h("div", { className: "hero-banner-wrap" },
        h("img", {
          src: "/images/banner.png",
          alt: "Banner Smartefluentes",
          className: "hero-banner",
          onError: (event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextSibling.style.display = "grid";
          }
        }),
        h("div", { className: "hero-banner-fallback", style: { display: "none" } },
          h("span", null, "Smartefluentes"),
          h("strong", null, "Gestão inteligente para Estações de Tratamento de Efluentes")
        )
      ),
      h("div", { className: "hero-content" },
        h("p", { className: "eyebrow" }, "SaaS ambiental para indústrias"),
        h("h1", { className: "hero-brand-title" },
          h("span", { className: "brand-blue" }, "Smart"),
          h("span", { className: "brand-green" }, "efluentes")
        ),
        h("p", { className: "hero-subtitle" }, "Inteligência operacional, controle técnico e eficiência no tratamento de efluentes industriais"),
        h("div", { className: "hero-proof" },
          h("span", null, "Diagnóstico inteligente"),
          h("span", null, "Relatórios técnicos"),
          h("span", null, "Gestão de custos operacionais")
        ),
        h("div", { className: "hero-actions" },
          h("button", { className: "btn primary", onClick: () => setPage("dashboard") }, "Entrar na Plataforma"),
          h("button", { className: "btn secondary light", onClick: () => setPage("consultoria") }, "Solicitar Consultoria")
        )
      ),
      h("div", { className: "hero-panel" },
        h("div", { className: "panel-topline" },
          h("div", { className: "status-pill good" }, "ETE em condição normal"),
          h("small", null, "Atualizado em tempo real")
        ),
        h(MiniGauge, { label: "Eficiência global estimada", value: 88 }),
        h(LineChart, { field: "dqo", label: "DQO em queda", compact: true }),
        h("div", { className: "hero-grid" },
          h("span", null, "pH 7,1"),
          h("span", null, "DQO -8%"),
          h("span", null, "Vazão 42 m³/h"),
          h("span", null, "Insumos -12%")
        )
      )
    ),
    h("section", { className: "landing-stats" },
      stats.map(([value, label]) => h("article", { className: "stat-card", key: label }, h("strong", null, value), h("span", null, label)))
    ),
    h("section", { className: "section premium-section" },
      h("div", { className: "section-heading" },
        h("span", null, "Plataforma ambiental inteligente"),
        h("h2", null, "Controle técnico para operações de efluentes mais eficientes"),
        h("p", null, "A Smartefluentes combina indicadores operacionais, histórico analítico, inteligência artificial e consultoria técnica para apoiar decisões ambientais com rastreabilidade.")
      ),
      h("div", { className: "feature-grid premium-benefits" }, benefits.map(([title, text]) => h(FeatureCard, { key: title, title, text })))
    ),
    h("section", { className: "analytics-showcase" },
      h("div", { className: "showcase-copy" },
        h("span", null, "Command center ambiental"),
        h("h2", null, "Indicadores, alertas e tendências em uma visão executiva"),
        h("p", null, "Visualize DQO, DBO, turbidez, vazão, consumo de insumos e status da ETE com gráficos animados e leitura operacional imediata."),
        h("button", { className: "btn primary", onClick: () => setPage("dashboard") }, "Explorar Dashboard")
      ),
      h("div", { className: "showcase-glass" },
        h("div", { className: "panel-topline" },
          h("div", { className: "status-pill good" }, "Operação sob controle"),
          h("small", null, "Tendência favorável")
        ),
        h(LineChart, { field: "dqo", label: "DQO - evolução operacional" }),
        h("div", { className: "mini-metric-row" },
          h("span", null, "pH 7,1"),
          h("span", null, "DBO -5%"),
          h("span", null, "Turbidez 36 NTU")
        )
      )
    ),
    h("section", { className: "section band" },
      h("h2", null, "Como funciona"),
      h("div", { className: "steps" }, steps.map((step, index) => h("div", { className: "step", key: step }, h("b", null, `0${index + 1}`), h("span", null, step))))
    ),
    h("section", { className: "section modules-section" },
      h("div", { className: "section-heading" },
        h("span", null, "Módulos da plataforma"),
        h("h2", null, "Uma suíte operacional para gestão ambiental industrial"),
        h("p", null, "Do lançamento analítico ao relatório técnico, a plataforma organiza a rotina da ETE com linguagem corporativa, rastreabilidade e visão de melhoria contínua.")
      ),
      h("div", { className: "modules-grid" }, modules.map(([title, text]) => h(FeatureCard, { key: title, title, text })))
    ),
    h("section", { className: "section" },
      h("h2", null, "Planos corporativos"),
      h("div", { className: "plans" },
        ["Operacional", "Profissional", "Consultivo"].map((plan, index) =>
          h("article", { className: "plan-card", key: plan },
            h("h3", null, plan),
            h("p", null, index === 0 ? "Monitoramento essencial de parâmetros críticos." : index === 1 ? "Indicadores, IA e relatórios técnicos integrados." : "Acompanhamento especializado para otimização de processos."),
            h("strong", null, index === 0 ? "Essencial" : index === 1 ? "Escalável" : "Sob consulta")
          )
        )
      )
    ),
    h("section", { className: "section consultoria-highlight" },
      h("div", null,
        h("span", null, "Consultoria técnica"),
        h("h2", null, "Especialistas para otimização físico-química, biológica e redução de custos"),
        h("p", null, "Solicite apoio para avaliação da ETE, adequação ambiental, treinamento operacional e melhoria de indicadores de processo.")
      ),
      h("button", { className: "btn secondary light", onClick: () => setPage("consultoria") }, "Solicitar avaliação técnica")
    ),
    h("section", { className: "section contact" },
      h("h2", null, "Contato"),
      h("p", null, "Solicite uma avaliação técnica para transformar dados operacionais em decisões ambientais mais seguras e eficientes."),
      h("button", { className: "btn primary", onClick: () => setPage("consultoria") }, "Falar com um especialista")
    )
  );
}

function LoginPage({ setPage, setCurrentUser, persist }) {
  const [credentials, setCredentials] = useState({ email: "operacao@horizonte.com.br", password: "12345678" });

  async function handleLogin() {
    const user = await persist(
      () => saveUser(credentials),
      "Usuário autenticado e registrado no Supabase."
    );
    if (user) {
      setCurrentUser(user);
      setPage("dashboard");
    }
  }

  return h("section", { className: "auth-card" },
    h(Brand, { onClick: () => setPage("landing"), compact: false }),
    h("h1", null, "Acesso à plataforma"),
    h("p", { className: "form-hint" }, "Acesse o ambiente operacional para acompanhar indicadores, análises e recomendações técnicas da ETE."),
    h("label", null, "E-mail", h("input", {
      type: "email",
      value: credentials.email,
      onChange: (event) => setCredentials({ ...credentials, email: event.target.value }),
      placeholder: "nome@empresa.com.br"
    })),
    h("label", null, "Senha", h("input", {
      type: "password",
      value: credentials.password,
      onChange: (event) => setCredentials({ ...credentials, password: event.target.value }),
      placeholder: "Digite sua senha"
    })),
    h("button", { className: "btn primary full", onClick: handleLogin }, "Entrar"),
    h("div", { className: "login-actions" },
      h("button", { type: "button", onClick: () => setPage("login") }, "Criar conta"),
      h("button", { type: "button", onClick: () => setPage("login") }, "Esqueci minha senha")
    )
  );
}

function DashboardPage() {
  return h(PageFrame, { title: "Dashboard", subtitle: "Visão consolidada dos indicadores críticos da Estação de Tratamento de Efluentes." },
    h("section", { className: "ops-overview" },
      h("article", { className: "command-card featured" },
        h("div", null, h("span", null, "Saúde operacional"), h("h2", null, "88%")),
        h("p", null, "ETE operando dentro das faixas de controle, com oportunidade de ajuste fino na etapa de clarificação."),
        h("div", { className: "confidence-bar" }, h("i", { style: { width: "88%" } }))
      ),
      h("article", { className: "command-card" },
        h("span", null, "Tendência de DQO"),
        h(LineChart, { field: "dqo", label: "Últimas coletas" })
      ),
      h("article", { className: "command-card" },
        h("span", null, "Fluxo de processo"),
        h(ProcessTimeline)
      )
    ),
    h("div", { className: "status-row" },
      h("div", { className: "status-card good" }, h("span", null, "Status da ETE"), h("strong", null, "Normal"), h("small", null, "Sem não conformidades críticas nas últimas 24h")),
      h("div", { className: "status-card attention" }, h("span", null, "Ponto de atenção"), h("strong", null, "Turbidez"), h("small", null, "Acompanhar desempenho da etapa de clarificação"))
    ),
    h("div", { className: "metric-grid" }, metricData.map((metric) => h(MetricCard, { key: metric.label, metric }))),
    h("div", { className: "chart-grid-dashboard" },
      h(ChartCard, { title: "Histórico de pH", field: "ph", suffix: "" }),
      h(ChartCard, { title: "DQO por período", field: "dqo", suffix: " mg/L" }),
      h(ChartCard, { title: "Consumo químico mensal", field: "consumo", suffix: " kg", data: chemicalMonthlyData }),
      h(ChartCard, { title: "Vazão diária", field: "vazao", suffix: " m³/h" }),
      h(ChartCard, { title: "Ocorrências operacionais", field: "ocorrencias", suffix: "", className: "wide-chart" })
    )
  );
}

function CompanyPage({ company, setCompany, companyId, setCompanyId, currentUser, persist }) {
  async function handleSave() {
    const saved = await persist(
      () => saveCompany(company, currentUser?.id),
      "Unidade operacional registrada no Supabase."
    );
    if (saved?.id) setCompanyId(saved.id);
  }

  return h(PageFrame, { title: "Gestão Operacional", subtitle: "Cadastro da unidade industrial, responsável técnico e perfil do efluente para rastreabilidade ambiental." },
    h("form", { className: "form-grid" },
      Object.entries(company).map(([label, value]) => h(FormField, {
        key: label,
        label,
        value,
        onChange: (next) => setCompany({ ...company, [label]: next })
      }))
    ),
    h("div", { className: "form-actions" },
      h("button", { type: "button", className: "btn primary", onClick: handleSave }, companyId ? "Atualizar cadastro operacional" : "Salvar unidade operacional"),
      companyId && h("span", { className: "record-id" }, `ID: ${companyId}`)
    )
  );
}

function AnalysisPage({ analysis, setAnalysis, companyId, persist }) {
  async function handleSave() {
    await persist(
      () => saveAnalysis(analysis, companyId),
      "Análise laboratorial registrada no Supabase."
    );
  }

  return h(PageFrame, { title: "Análises", subtitle: "Registro de parâmetros físico-químicos, vazão e observações operacionais do efluente tratado." },
    h("form", { className: "form-grid" },
      Object.entries(analysis).map(([label, value]) => h(FormField, {
        key: label,
        label,
        value,
        type: label === "Data" ? "date" : "text",
        textarea: label === "Observações",
        onChange: (next) => setAnalysis({ ...analysis, [label]: next })
      }))
    ),
    h("div", { className: "form-actions" },
      h("button", { type: "button", className: "btn primary", onClick: handleSave }, "Registrar análise"),
      !companyId && h("span", { className: "record-id" }, "Recomendação: salve a unidade operacional antes de vincular a análise.")
    ),
    h("div", { className: "table-card" },
      h("h3", null, "Histórico de análises"),
      h(DataTable, { rows: analysisHistory })
    )
  );
}

function AiPage({ analysis, setAnalysis, diagnosis, aiState, setAiState, setAiDiagnosis }) {
  async function handleGenerateDiagnosis() {
    setAiState({ status: "saving", message: "Gerando diagnóstico técnico com OpenAI..." });
    try {
      const result = await generateEffluentDiagnosis(analysis);

      if (result.offline || !result.data) {
        setAiDiagnosis(null);
        setAiState({
          status: "offline",
          message: "Supabase/OpenAI ainda não configurados. Exibindo diagnóstico técnico local."
        });
        return;
      }

      setAiDiagnosis({
        "Status operacional": result.data.status_operacional || result.data.nivel_alerta || "Atenção técnica",
        "Possível causa": result.data.possivel_causa,
        "Risco ambiental": result.data.risco_ambiental || result.data.risco_operacional,
        "Risco operacional": result.data.risco_operacional,
        "Ação corretiva": result.data.acao_corretiva,
        "Ação preventiva": result.data.acao_preventiva,
        "Sugestão de melhoria físico-química": result.data.sugestao_fisico_quimica || result.data.sugestao_melhoria,
        "Sugestão de melhoria biológica": result.data.sugestao_biologica || result.data.sugestao_melhoria,
        "Nível de alerta": result.data.nivel_alerta,
        Confiança: result.data.confianca
      });
      setAiState({ status: "success", message: "Diagnóstico inteligente gerado pela OpenAI API." });
    } catch (error) {
      setAiDiagnosis(null);
      setAiState({
        status: "error",
        message: error.message || "Não foi possível gerar o diagnóstico inteligente."
      });
    }
  }

  return h(PageFrame, { title: "Diagnóstico Inteligente", subtitle: "Interpretação técnica dos dados analíticos com apoio de inteligência artificial e critérios operacionais da ETE." },
    h("div", { className: "two-col align-start" },
      h("form", { className: "form-grid compact" },
        ["pH", "DQO", "DBO", "Turbidez", "Vazão", "Temperatura", "Óleos e graxas", "Sólidos sedimentáveis"].map((label) =>
          h(FormField, { key: label, label, value: analysis[label], onChange: (next) => setAnalysis({ ...analysis, [label]: next }) })
        ),
        h("button", { type: "button", className: "btn primary full", onClick: handleGenerateDiagnosis }, "Gerar diagnóstico inteligente"),
        aiState.status !== "idle" && h("p", { className: `inline-status ${aiState.status}` }, aiState.message)
      ),
      h("div", { className: "diagnosis-card" },
        Object.entries(diagnosis).map(([label, text]) =>
          h("div", { className: "diagnosis-item", key: label }, h("span", null, label), h("p", null, text))
        )
      )
    )
  );
}

function ChemicalsPage({ chemical, setChemical, companyId, persist }) {
  async function handleSave() {
    await persist(
      () => saveChemicalProduct(chemical, companyId),
      "Insumo químico registrado no Supabase."
    );
  }

  return h(PageFrame, { title: "Controle de Insumos", subtitle: "Gestão do consumo, custo e estoque de insumos aplicados ao tratamento físico-químico e biológico." },
    h("form", { className: "form-grid" },
      Object.entries(chemical).map(([label, value]) => h(FormField, {
        key: label,
        label,
        value,
        type: label.includes("Data") ? "date" : "text",
        onChange: (next) => setChemical({ ...chemical, [label]: next })
      }))
    ),
    h("div", { className: "form-actions" },
      h("button", { type: "button", className: "btn primary", onClick: handleSave }, "Registrar insumo")
    ),
    h("div", { className: "table-card" },
      h("h3", null, "Histórico de utilização"),
      h(DataTable, { rows: chemicalRows })
    )
  );
}

function ReportsPage({ diagnosis, company, companyId, persist }) {
  const [generated, setGenerated] = useState(false);
  const reportRecommendations = [
    diagnosis["Ação corretiva"],
    diagnosis["Ação preventiva"],
    diagnosis["Sugestão de melhoria físico-química"],
    diagnosis["Sugestão de melhoria biológica"]
  ].filter(Boolean);

  async function handleGenerate() {
    setGenerated(true);
    await persist(
      () => saveReport({
        title: "Relatório Técnico Smartefluentes",
        company,
        period: "13/05/2026 a 17/05/2026",
        analysisHistory,
        monitoredParameters: ["pH", "DQO", "DBO", "Turbidez", "Vazão", "Temperatura", "Ocorrências operacionais"],
        charts: {
          ph: analysisHistory.map((item) => item.ph),
          dqo: analysisHistory.map((item) => item.dqo),
          turbidez: analysisHistory.map((item) => item.turbidez),
          vazao: analysisHistory.map((item) => item.vazao)
        },
        diagnosis,
        occurrences: analysisHistory.reduce((total, item) => total + item.ocorrencias, 0),
        recommendations: reportRecommendations,
        signature: "Smartefluentes - Inteligência operacional para tratamento de efluentes"
      }, companyId),
      "Relatório técnico registrado no Supabase."
    );
  }

  return h(PageFrame, { title: "Relatórios", subtitle: "Consolidação técnica de dados operacionais, histórico analítico, diagnóstico e recomendações ambientais." },
    h("button", { className: "btn primary", onClick: handleGenerate }, "Gerar Relatório Técnico"),
    generated && h("section", { className: "report-preview" },
      h("h3", null, "Relatório Técnico Smartefluentes"),
      h("div", { className: "report-grid" },
        h("article", null, h("span", null, "Dados da unidade operacional"), h("p", null, `${company["Razão social"]} - ${company.CNPJ}`)),
        h("article", null, h("span", null, "Período analisado"), h("p", null, "13/05/2026 a 17/05/2026")),
        h("article", null, h("span", null, "Parâmetros monitorados"), h("p", null, "pH, DQO, DBO, turbidez, vazão, temperatura e ocorrências.")),
        h("article", null, h("span", null, "Histórico analítico"), h("p", null, "5 coletas recentes com pH estável e redução gradual de DQO.")),
        h("article", null, h("span", null, "Indicadores gráficos"), h("p", null, "DQO, DBO, turbidez e vazão consolidados por período.")),
        h("article", null, h("span", null, "Diagnóstico operacional"), h("p", null, diagnosis["Possível causa"])),
        h("article", null, h("span", null, "Ocorrências"), h("p", null, "4 ocorrências operacionais registradas no período, sem criticidade recorrente.")),
        h("article", null, h("span", null, "Recomendações técnicas"), h("p", null, reportRecommendations.join(" "))),
        h("article", null, h("span", null, "Assinatura"), h("p", null, "Smartefluentes - Inteligência operacional para tratamento de efluentes."))
      ),
      h(ChartCard, { title: "Tendência de DQO para relatório", field: "dqo", suffix: " mg/L" })
    )
  );
}

function SaveToast({ state }) {
  if (state.status === "idle") return null;

  return h("div", { className: `save-toast ${state.status}` },
    h("strong", null, state.status === "saving" ? "Processando" : state.status === "error" ? "Falha no registro" : "Registro operacional"),
    h("span", null, state.message)
  );
}

function ConsultingPage() {
  const options = ["Avaliação de ETE", "Redução de custo químico", "Melhoria físico-química", "Melhoria biológica", "Redução de geração de lodo", "Adequação ambiental", "Treinamento operacional"];
  return h(PageFrame, { title: "Consultoria Técnica", subtitle: "Solicite apoio especializado para diagnóstico, otimização de processos e adequação ambiental da operação." },
    h("form", { className: "consulting-form" },
      h("div", { className: "check-grid" }, options.map((option) => h("label", { key: option, className: "check-card" }, h("input", { type: "checkbox" }), h("span", null, option)))),
      h("label", null, "Descrição da demanda técnica", h("textarea", { placeholder: "Descreva a ocorrência operacional, meta de melhoria ou necessidade de adequação ambiental." })),
      h("button", { type: "button", className: "btn primary" }, "Solicitar consultoria técnica")
    )
  );
}

function PageFrame({ title, subtitle, children }) {
  return h("section", { className: "page-frame" }, h("div", { className: "page-heading" }, h("h1", null, title), h("p", null, subtitle)), children);
}

function MetricCard({ metric }) {
  return h("article", { className: `metric-card ${metric.status === "Atenção" ? "is-attention" : "is-normal"}` },
    h("div", null, h("span", null, metric.label), h("strong", null, metric.value)),
    h("div", { className: "sparkline" },
      [42, 52, 47, 62, 55, 70, 66].map((height, index) => h("i", { key: index, style: { height: `${height}%` } }))
    ),
    h("footer", null, h("small", null, metric.target), h("em", null, metric.trend))
  );
}

function FeatureCard({ title, text }) {
  const fallback = "Indicadores técnicos para decisão operacional, conformidade ambiental e melhoria contínua.";
  return h("article", { className: "feature-card" }, h("span", null, ""), h("h3", null, title), h("p", null, text || fallback));
}

function FormField({ label, value = "", type = "text", textarea = false, onChange }) {
  const props = onChange
    ? { value, placeholder: label, onChange: (event) => onChange(event.target.value) }
    : { defaultValue: value, placeholder: label };
  return h("label", null, label, textarea ? h("textarea", props) : h("input", { ...props, type }));
}

function DataTable({ rows }) {
  const headers = Object.keys(rows[0]);
  return h("div", { className: "table-wrap" },
    h("table", null,
      h("thead", null, h("tr", null, headers.map((head) => h("th", { key: head }, formatTableHeader(head))))),
      h("tbody", null, rows.map((row, index) => h("tr", { key: index }, headers.map((head) => h("td", { key: head }, row[head])))))
    )
  );
}

function formatTableHeader(header) {
  const labels = {
    date: "Data",
    ph: "pH",
    dqo: "DQO",
    dbo: "DBO",
    turbidez: "Turbidez",
    insumo: "Insumo químico",
    quantidade: "Quantidade aplicada",
    custo: "Custo",
    estoque: "Estoque atual",
    data: "Data"
  };

  return labels[header] || header;
}

function ChartCard({ title, field, suffix, data = analysisHistory, className = "" }) {
  const values = data.map((item) => Number(item[field]) || 0);
  const max = Math.max(...values, 1);
  return h("article", { className: `chart-card ${className}` },
    h("div", { className: "chart-heading" }, h("h3", null, title), h("span", null, `${data.length} registros`)),
    h(LineChart, { field, label: title, data }),
    h("div", { className: "bar-chart" },
      data.map((item) =>
        h("div", { className: "bar-row", key: item.date },
          h("span", null, item.date),
          h("div", { className: "bar-track" }, h("i", { style: { width: `${(item[field] / max) * 100}%` } })),
          h("b", null, `${item[field]}${suffix}`)
        )
      )
    )
  );
}

function LineChart({ field, label, compact = false, data = analysisHistory }) {
  const values = data.map((item) => Number(item[field]) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = 12 + index * 44;
      const y = 96 - ((value - min) / range) * 66;
      return `${x},${y}`;
    })
    .join(" ");

  return h("div", { className: `line-chart ${compact ? "compact" : ""}` },
    h("div", { className: "line-chart-meta" },
      h("strong", null, label),
      h("small", null, `${values[0]} -> ${values[values.length - 1]}`)
    ),
    h("svg", { viewBox: "0 0 200 112", role: "img", "aria-label": label },
      h("defs", null,
        h("linearGradient", { id: `grad-${field}-${compact ? "mini" : "full"}`, x1: "0", x2: "1", y1: "0", y2: "0" },
          h("stop", { offset: "0%", stopColor: "#16a36a" }),
          h("stop", { offset: "100%", stopColor: "#0e7cc8" })
        )
      ),
      h("path", { d: "M12 98 H188", className: "chart-axis" }),
      h("polyline", { points, fill: "none", stroke: `url(#grad-${field}-${compact ? "mini" : "full"})`, strokeWidth: "5", strokeLinecap: "round", strokeLinejoin: "round" }),
      values.map((value, index) => {
        const cx = 12 + index * 44;
        const cy = 96 - ((value - min) / range) * 66;
        return h("circle", { key: index, cx, cy, r: "4.5", className: "chart-point" });
      })
    )
  );
}

function ProcessTimeline() {
  return h("div", { className: "process-timeline" },
    ["Equalização", "Físico-químico", "Biológico", "Clarificação"].map((step, index) =>
      h("div", { className: "process-step", key: step },
        h("b", null, `0${index + 1}`),
        h("span", null, step)
      )
    )
  );
}

function MiniGauge({ label, value }) {
  return h("div", { className: "mini-gauge" },
    h("div", { className: "gauge-circle", style: { "--value": `${value}%` } }, h("strong", null, `${value}%`)),
    h("span", null, label)
  );
}

function buildDiagnosis(analysis) {
  const ph = Number(analysis.pH);
  const dqo = Number(analysis.DQO);
  const turbidity = Number(analysis.Turbidez);
  const flow = Number(analysis.Vazão);
  const status = (label) => ({
    "Status operacional": label
  });

  if (ph < 6) {
    return {
      ...status("Atenção"),
      "Possível causa": "Possível carga ácida no afluente, consumo de alcalinidade ou instabilidade na etapa de neutralização.",
      "Risco ambiental": "Maior probabilidade de lançamento fora da faixa de pH e impacto na conformidade ambiental.",
      "Risco operacional": "Redução da eficiência biológica, corrosão de componentes e instabilidade da coagulação/floculação.",
      "Ação corretiva": "Ajustar alcalinidade com dosagem controlada de alcalinizante e verificar calibração do medidor de pH.",
      "Ação preventiva": "Implantar alarme por faixa operacional, revisar equalização e acompanhar alcalinidade do afluente.",
      "Sugestão de melhoria físico-química": "Automatizar neutralização com controle proporcional e validar jar test após correção de pH.",
      "Sugestão de melhoria biológica": "Proteger a biomassa com alimentação gradual e monitoramento de pH no reator biológico."
    };
  }

  if (ph > 9) {
    return {
      ...status("Atenção"),
      "Possível causa": "Possível excesso de alcalinizante ou entrada de efluente com elevada alcalinidade.",
      "Risco ambiental": "Risco de não conformidade por pH elevado e alteração da qualidade do efluente tratado.",
      "Risco operacional": "Precipitação indesejada, perda de eficiência de coagulação e estresse da etapa biológica.",
      "Ação corretiva": "Reduzir dosagem de alcalinizante, confirmar setpoint de automação e avaliar necessidade de ajuste ácido controlado.",
      "Ação preventiva": "Revisar curva de dosagem, calibração de sonda e rotina de validação por amostra composta.",
      "Sugestão de melhoria físico-química": "Criar faixa de controle com bloqueio de dosagem em pH alto e registro de consumo por batelada.",
      "Sugestão de melhoria biológica": "Evitar choque de pH no reator e acompanhar atividade biológica após a correção."
    };
  }

  if (dqo > 500) {
    return {
      ...status("Atenção"),
      "Possível causa": "Possível aumento de carga orgânica, variação de processo industrial ou baixa eficiência de remoção preliminar.",
      "Risco ambiental": "Elevação de matéria orgânica no efluente tratado e risco de ultrapassar limites de lançamento.",
      "Risco operacional": "Sobrecarga do sistema biológico, aumento de DBO remanescente e maior consumo de oxigênio.",
      "Ação corretiva": "Identificar origem da carga, ajustar equalização e revisar aeração, recirculação e dosagem auxiliar.",
      "Ação preventiva": "Monitorar carga por turno, criar alerta de DQO e integrar produção industrial com operação da ETE.",
      "Sugestão de melhoria físico-química": "Avaliar pré-tratamento, coagulação otimizada e remoção complementar de sólidos coloidais.",
      "Sugestão de melhoria biológica": "Revisar idade do lodo, oxigênio dissolvido e capacidade de biodegradação da biomassa."
    };
  }

  if (turbidity > 50) {
    return {
      ...status("Atenção"),
      "Possível causa": "Possível falha de coagulação/floculação, formação inadequada de flocos ou arraste de sólidos no clarificador.",
      "Risco ambiental": "Aumento de sólidos suspensos e risco de não conformidade visual e analítica no efluente final.",
      "Risco operacional": "Arraste de lodo, perda de eficiência de clarificação e elevação do consumo de insumos.",
      "Ação corretiva": "Realizar jar test, ajustar coagulante, polímero, pH de coagulação e tempos de mistura.",
      "Ação preventiva": "Padronizar ensaios de bancada, revisar ponto de dosagem e acompanhar turbidez por turno.",
      "Sugestão de melhoria físico-química": "Otimizar gradiente de mistura, maturação do floco e dosagem por carga afluente.",
      "Sugestão de melhoria biológica": "Verificar contribuição de sólidos biológicos e condição de sedimentabilidade do lodo."
    };
  }

  if (flow > 48) {
    return {
      ...status("Crítico"),
      "Possível causa": "Pico hidráulico acima da faixa de projeto da ETE.",
      "Risco ambiental": "Risco de lançamento com remoção insuficiente por redução do tempo de tratamento.",
      "Risco operacional": "Redução do tempo de detenção hidráulica e aumento do risco de perda de clarificação.",
      "Ação corretiva": "Equalizar a vazão de entrada e reduzir descargas concentradas.",
      "Ação preventiva": "Programar descargas industriais em janelas operacionais controladas.",
      "Sugestão de melhoria físico-química": "Avaliar tanque de equalização adicional, controle de vazão por inversor e dosagem proporcional.",
      "Sugestão de melhoria biológica": "Proteger o reator biológico contra lavagem de biomassa e oscilações bruscas de carga."
    };
  }

  return {
    ...status("Normal"),
    "Possível causa": "Operação dentro da faixa esperada, com leve oscilação de turbidez.",
    "Risco ambiental": "Baixo no momento, com indicadores dentro da condição operacional simulada.",
    "Risco operacional": "Baixo no momento, com necessidade de acompanhamento da etapa de clarificação.",
    "Ação corretiva": "Manter a dosagem atual e verificar a formação de flocos no decantador.",
    "Ação preventiva": "Padronizar jar test semanal e registrar tendência de consumo de insumos.",
    "Sugestão de melhoria físico-química": "Reduzir a dosagem gradualmente, com controle de turbidez, para buscar economia operacional segura.",
    "Sugestão de melhoria biológica": "Manter monitoramento de DBO, oxigênio dissolvido e sedimentabilidade para preservar estabilidade do processo."
  };
}

createRoot(document.getElementById("root")).render(h(App));
