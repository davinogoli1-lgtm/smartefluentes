import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.");
  }
  return supabase;
}

function assertError(error) {
  if (error) throw error;
}

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  return Number(String(value).replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
}

async function selectRows(table, queryBuilder) {
  const client = requireSupabase();
  const query = queryBuilder ? queryBuilder(client.from(table)) : client.from(table).select("*");
  const { data, error } = await query;
  assertError(error);
  return data || [];
}

export async function getSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  assertError(error);
  return data.session;
}

export function onAuthStateChange(callback) {
  const client = requireSupabase();
  return client.auth.onAuthStateChange((_event, session) => callback(session));
}

export async function signIn(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assertError(error);
  return data;
}

export async function signUp({ email, password, fullName }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  assertError(error);
  return data;
}

export async function resetPassword(email) {
  const client = requireSupabase();
  const { data, error } = await client.auth.resetPasswordForEmail(email);
  assertError(error);
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  assertError(error);
}

export async function fetchProfile(userId) {
  if (!userId) return null;
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  assertError(error);
  return data;
}

export async function fetchCompanies() {
  return selectRows("companies", (table) => table.select("*").order("created_at", { ascending: false }));
}

export async function saveCompany(company, userId) {
  const client = requireSupabase();
  const payload = {
    user_id: userId,
    razao_social: company.razao_social,
    cnpj: company.cnpj,
    responsavel: company.responsavel,
    telefone: company.telefone,
    email: company.email,
    tipo_efluente: company.tipo_efluente,
    endereco: company.endereco
  };
  const { data, error } = await client
    .from("companies")
    .upsert(company.id ? { ...payload, id: company.id } : payload)
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchAnalyses(companyId) {
  if (!companyId) return [];
  return selectRows("analyses", (table) =>
    table.select("*").eq("company_id", companyId).order("data", { ascending: false })
  );
}

export async function saveAnalysis(analysis, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("analyses")
    .insert({
      company_id: companyId,
      data: analysis.data,
      ph: toNumber(analysis.ph),
      dqo: toNumber(analysis.dqo),
      dbo: toNumber(analysis.dbo),
      turbidez: toNumber(analysis.turbidez),
      oleos_graxas: toNumber(analysis.oleos_graxas),
      solidos_sedimentaveis: toNumber(analysis.solidos_sedimentaveis),
      vazao: toNumber(analysis.vazao),
      temperatura: toNumber(analysis.temperatura),
      observacoes: analysis.observacoes
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchDiagnostics(companyId) {
  if (!companyId) return [];
  return selectRows("diagnostics", (table) =>
    table
      .select("*, analyses!inner(company_id, data)")
      .eq("analyses.company_id", companyId)
      .order("created_at", { ascending: false })
  );
}

export async function saveDiagnostic(analysisId, diagnosis) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("diagnostics")
    .insert({
      analysis_id: analysisId,
      status_operacional: diagnosis.status_operacional,
      possivel_causa: diagnosis.possivel_causa,
      risco_ambiental: diagnosis.risco_ambiental,
      risco_operacional: diagnosis.risco_operacional,
      acao_corretiva: diagnosis.acao_corretiva,
      acao_preventiva: diagnosis.acao_preventiva,
      melhoria_fisico_quimica: diagnosis.melhoria_fisico_quimica,
      melhoria_biologica: diagnosis.melhoria_biologica,
      observacao_tecnica: diagnosis.observacao_tecnica
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchChemicalInputs(companyId) {
  if (!companyId) return [];
  return selectRows("chemical_inputs", (table) =>
    table.select("*").eq("company_id", companyId).order("data_uso", { ascending: false })
  );
}

export async function saveChemicalInput(input, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("chemical_inputs")
    .insert({
      company_id: companyId,
      nome: input.nome,
      tipo: input.tipo,
      quantidade_usada: toNumber(input.quantidade_usada),
      estoque_atual: toNumber(input.estoque_atual),
      custo_unitario: toNumber(input.custo_unitario),
      custo_mensal: toNumber(input.custo_mensal),
      data_uso: input.data_uso
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchReports(companyId) {
  if (!companyId) return [];
  return selectRows("reports", (table) =>
    table.select("*").eq("company_id", companyId).order("created_at", { ascending: false })
  );
}

export async function saveReport(report, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("reports")
    .insert({
      company_id: companyId,
      periodo: report.periodo,
      resumo: report.resumo,
      recomendacoes: report.recomendacoes,
      pdf_url: report.pdf_url
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function uploadReportPdf({ userId, companyId, fileName, blob }) {
  const client = requireSupabase();
  const path = `${userId}/${companyId}/${fileName}`;
  const { error } = await client.storage.from("reports").upload(path, blob, {
    contentType: "application/pdf",
    upsert: true
  });
  assertError(error);
  const { data } = client.storage.from("reports").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchFinancial(companyId) {
  if (!companyId) return [];
  return selectRows("financial", (table) =>
    table.select("*").eq("company_id", companyId).order("vencimento", { ascending: false })
  );
}

export async function saveFinancialEntry(entry, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("financial")
    .insert({
      company_id: companyId,
      tipo: entry.tipo,
      descricao: entry.descricao,
      valor: toNumber(entry.valor),
      vencimento: entry.vencimento,
      status: entry.status
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchIotSensors(companyId) {
  if (!companyId) return [];
  return selectRows("iot_sensors", (table) =>
    table.select("*").eq("company_id", companyId).order("ultima_leitura", { ascending: false })
  );
}

export async function saveIotSensor(sensor, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("iot_sensors")
    .insert({
      company_id: companyId,
      sensor_nome: sensor.sensor_nome,
      parametro: sensor.parametro,
      valor: toNumber(sensor.valor),
      unidade: sensor.unidade,
      status: sensor.status,
      ultima_leitura: sensor.ultima_leitura
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchSupportTickets(companyId) {
  if (!companyId) return [];
  return selectRows("support_tickets", (table) =>
    table.select("*").eq("company_id", companyId).order("created_at", { ascending: false })
  );
}

export async function saveSupportTicket(ticket, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("support_tickets")
    .insert({
      company_id: companyId,
      titulo: ticket.titulo,
      descricao: ticket.descricao,
      prioridade: ticket.prioridade,
      status: ticket.status || "Aberto",
      resposta_tecnica: ticket.resposta_tecnica
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function updateSupportTicket(ticketId, values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("support_tickets")
    .update(values)
    .eq("id", ticketId)
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchAutomations(companyId) {
  if (!companyId) return [];
  return selectRows("operational_automations", (table) =>
    table.select("*").eq("company_id", companyId).order("created_at", { ascending: false })
  );
}

export async function saveAutomation(automation, companyId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("operational_automations")
    .insert({
      company_id: companyId,
      nome: automation.nome,
      condicao: automation.condicao,
      acao: automation.acao,
      status: automation.status
    })
    .select()
    .single();
  assertError(error);
  return data;
}

export async function fetchAdminData() {
  const client = requireSupabase();
  const [profiles, companies, tickets, sensors, reports] = await Promise.all([
    client.from("profiles").select("*").order("created_at", { ascending: false }),
    client.from("companies").select("*").order("created_at", { ascending: false }),
    client.from("support_tickets").select("*").order("created_at", { ascending: false }),
    client.from("iot_sensors").select("*").order("created_at", { ascending: false }),
    client.from("reports").select("*").order("created_at", { ascending: false })
  ]);

  [profiles, companies, tickets, sensors, reports].forEach((result) => assertError(result.error));

  return {
    profiles: profiles.data || [],
    companies: companies.data || [],
    tickets: tickets.data || [],
    sensors: sensors.data || [],
    reports: reports.data || []
  };
}
