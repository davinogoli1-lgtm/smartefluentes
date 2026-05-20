const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type AnalysisPayload = {
  Data?: string;
  pH?: string | number;
  DQO?: string | number;
  DBO?: string | number;
  Turbidez?: string | number;
  "Óleos e graxas"?: string | number;
  "Sólidos sedimentáveis"?: string | number;
  Vazão?: string | number;
  Temperatura?: string | number;
  Observações?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY não configurada." }, 500);
    }

    const { analysis } = await request.json() as { analysis: AnalysisPayload };
    if (!analysis) {
      return jsonResponse({ error: "Dados de análise não enviados." }, 400);
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-5.2",
        instructions: [
          "Você é um especialista sênior em tratamento de efluentes industriais.",
          "Gere diagnósticos técnicos objetivos em português do Brasil.",
          "Não invente dados laboratoriais que não foram fornecidos.",
          "Inclua ressalva técnica quando houver incerteza e recomende confirmação por ensaios, jar test ou avaliação operacional quando aplicável."
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analise estes dados de efluente industrial e retorne o diagnóstico estruturado:\n${JSON.stringify(analysis, null, 2)}`
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "effluent_diagnosis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                status_operacional: { type: "string", enum: ["Normal", "Atenção", "Crítico"] },
                possivel_causa: { type: "string" },
                risco_ambiental: { type: "string" },
                risco_operacional: { type: "string" },
                acao_corretiva: { type: "string" },
                acao_preventiva: { type: "string" },
                sugestao_fisico_quimica: { type: "string" },
                sugestao_biologica: { type: "string" },
                nivel_alerta: { type: "string", enum: ["Normal", "Atenção", "Crítico"] },
                confianca: { type: "string", enum: ["Baixa", "Média", "Alta"] }
              },
              required: [
                "status_operacional",
                "possivel_causa",
                "risco_ambiental",
                "risco_operacional",
                "acao_corretiva",
                "acao_preventiva",
                "sugestao_fisico_quimica",
                "sugestao_biologica",
                "nivel_alerta",
                "confianca"
              ]
            }
          }
        },
        max_output_tokens: 900
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      return jsonResponse({ error: payload.error?.message || "Erro ao chamar a OpenAI API." }, response.status);
    }

    const outputText = payload.output_text || extractOutputText(payload);
    const diagnosis = JSON.parse(outputText);

    return jsonResponse(diagnosis, 200);
  } catch (error) {
    return jsonResponse({ error: error.message || "Erro inesperado ao gerar o diagnóstico técnico." }, 500);
  }
});

function extractOutputText(payload: any) {
  return payload.output
    ?.flatMap((item: any) => item.content || [])
    ?.filter((content: any) => content.type === "output_text")
    ?.map((content: any) => content.text)
    ?.join("") || "{}";
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
