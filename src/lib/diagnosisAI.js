import { buildDiagnosis } from "./diagnosis.js";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4.1-mini";

const schemaInstruction = `Retorne exclusivamente JSON válido com as chaves:
status_operacional, possivel_causa, risco_ambiental, risco_operacional,
acao_corretiva, acao_preventiva, melhoria_fisico_quimica, melhoria_biologica,
observacao_tecnica. Use português brasileiro técnico, claro e corporativo.`;

function parseJson(text) {
  const cleaned = text.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function normalizeDiagnosis(result, fallback) {
  return {
    status_operacional: result.status_operacional || fallback.status_operacional,
    possivel_causa: result.possivel_causa || fallback.possivel_causa,
    risco_ambiental: result.risco_ambiental || fallback.risco_ambiental,
    risco_operacional: result.risco_operacional || fallback.risco_operacional,
    acao_corretiva: result.acao_corretiva || fallback.acao_corretiva,
    acao_preventiva: result.acao_preventiva || fallback.acao_preventiva,
    melhoria_fisico_quimica: result.melhoria_fisico_quimica || fallback.melhoria_fisico_quimica,
    melhoria_biologica: result.melhoria_biologica || fallback.melhoria_biologica,
    observacao_tecnica: result.observacao_tecnica || fallback.observacao_tecnica
  };
}

export async function generateDiagnosis(analysisData) {
  const fallback = buildDiagnosis(analysisData);

  if (!OPENAI_API_KEY) {
    return {
      diagnosis: fallback,
      source: "fallback",
      message: "VITE_OPENAI_API_KEY não configurada. Diagnóstico gerado por regras operacionais locais."
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: "Você é um especialista sênior em tratamento de efluentes industriais."
          },
          {
            role: "user",
            content: `${schemaInstruction}\n\nAnalise estes dados operacionais:\n${JSON.stringify(analysisData, null, 2)}`
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || "Erro ao consultar OpenAI API.");
    }

    const outputText = payload.output_text
      || payload.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text
      || "{}";

    return {
      diagnosis: normalizeDiagnosis(parseJson(outputText), fallback),
      source: "openai",
      message: "Diagnóstico gerado com IA e validado pela estrutura técnica da plataforma."
    };
  } catch (error) {
    return {
      diagnosis: fallback,
      source: "fallback",
      message: `${error.message || "Falha ao consultar IA"}. Diagnóstico gerado por regras operacionais locais.`
    };
  }
}
