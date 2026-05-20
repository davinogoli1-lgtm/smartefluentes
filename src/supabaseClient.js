import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = import.meta.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || window.SMARTEFLUENTES_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || window.SMARTEFLUENTES_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function offlineResult(table, payload) {
  console.info(`[Smartefluentes] Supabase não configurado. Registro em modo demonstração em ${table}:`, payload);
  return {
    data: { ...payload, id: `local-${table}-${Date.now()}` },
    offline: true
  };
}

async function insertRow(table, payload) {
  if (!supabase) return offlineResult(table, payload);

  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return { data, offline: false };
}

export async function saveUser({ email, password }) {
  if (!supabase) return offlineResult("auth.users", { email });

  let { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error && error.message?.toLowerCase().includes("already")) {
    ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
  }

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: data.user.email
      });

    if (profileError) {
      console.warn("[Smartefluentes] Usuário criado no Auth, mas o perfil operacional não foi atualizado:", profileError.message);
    }
  }

  return { data: data.user, offline: false };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  return Number(String(value).replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
}

export async function saveCompany(company, userId) {
  return insertRow("companies", {
    user_id: userId || null,
    legal_name: company["Razão social"],
    cnpj: company.CNPJ,
    responsible_name: company.Responsável,
    phone: company.Telefone,
    email: company["E-mail"],
    effluent_type: company["Tipo de efluente"],
    address: company.Endereço
  });
}

export async function saveAnalysis(analysis, companyId) {
  return insertRow("analyses", {
    company_id: companyId || null,
    sampled_at: analysis.Data,
    ph: toNumber(analysis.pH),
    dqo: toNumber(analysis.DQO),
    dbo: toNumber(analysis.DBO),
    turbidity: toNumber(analysis.Turbidez),
    oils_and_greases: toNumber(analysis["Óleos e graxas"]),
    settleable_solids: toNumber(analysis["Sólidos sedimentáveis"]),
    flow_rate: toNumber(analysis.Vazão),
    temperature: toNumber(analysis.Temperatura),
    observations: analysis.Observações
  });
}

export async function saveChemicalProduct(product, companyId) {
  return insertRow("chemical_products", {
    company_id: companyId || null,
    product_name: product["Nome do insumo"],
    product_type: product.Tipo,
    quantity_used: toNumber(product["Quantidade usada"]),
    cost: toNumber(product["Custo operacional (R$)"]),
    unit_cost: toNumber(product["Custo unitário (R$)"]),
    monthly_cost: toNumber(product["Custo mensal (R$)"]),
    current_stock: toNumber(product["Estoque atual"]),
    used_at: product["Data de utilização"]
  });
}

export async function saveReport(report, companyId) {
  return insertRow("reports", {
    company_id: companyId || null,
    title: report.title,
    company_snapshot: report.company,
    analysis_history: report.analysisHistory,
    charts: report.charts,
    diagnosis: report.diagnosis,
    technical_recommendations: report.recommendations
  });
}

export async function generateEffluentDiagnosis(analysis) {
  if (!supabase) {
    return {
      data: null,
      offline: true
    };
  }

  const { data, error } = await supabase.functions.invoke("generate-diagnosis", {
    body: { analysis }
  });

  if (error) throw error;
  return { data, offline: false };
}
