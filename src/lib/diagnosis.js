function withTechnicalNote(diagnosis, analysis) {
  return {
    ...diagnosis,
    observacao_tecnica: `Diagnóstico gerado a partir dos parâmetros informados em ${analysis.data || "análise sem data"}. Recomenda-se validação com histórico operacional, calibração dos instrumentos e avaliação do responsável técnico.`
  };
}

export function buildDiagnosis(analysis) {
  const ph = Number(analysis.ph);
  const dqo = Number(analysis.dqo);
  const turbidez = Number(analysis.turbidez);
  const vazao = Number(analysis.vazao);
  const oleos = Number(analysis.oleos_graxas);

  if (ph < 6) {
    return withTechnicalNote({
      status_operacional: "Atenção",
      possivel_causa: "Possível carga ácida no afluente, consumo de alcalinidade ou instabilidade na etapa de neutralização.",
      risco_ambiental: "Risco de lançamento fora da faixa de pH e impacto na conformidade ambiental.",
      risco_operacional: "Redução da eficiência biológica, corrosão de componentes e instabilidade da coagulação/floculação.",
      acao_corretiva: "Ajustar alcalinidade com dosagem controlada de alcalinizante e verificar calibração do medidor de pH.",
      acao_preventiva: "Implantar alarme por faixa operacional, revisar equalização e acompanhar alcalinidade do afluente.",
      melhoria_fisico_quimica: "Automatizar neutralização com controle proporcional e validar jar test após correção de pH.",
      melhoria_biologica: "Proteger a biomassa com alimentação gradual e monitoramento de pH no reator biológico."
    }, analysis);
  }

  if (ph > 9) {
    return withTechnicalNote({
      status_operacional: "Atenção",
      possivel_causa: "Possível excesso de alcalinizante ou entrada de efluente com elevada alcalinidade.",
      risco_ambiental: "Risco de não conformidade por pH elevado e alteração da qualidade do efluente tratado.",
      risco_operacional: "Precipitação indesejada, perda de eficiência de coagulação e estresse da etapa biológica.",
      acao_corretiva: "Reduzir dosagem de alcalinizante, confirmar setpoint de automação e avaliar ajuste ácido controlado.",
      acao_preventiva: "Revisar curva de dosagem, calibração de sonda e rotina de validação por amostra composta.",
      melhoria_fisico_quimica: "Criar faixa de controle com bloqueio de dosagem em pH alto e registro de consumo por batelada.",
      melhoria_biologica: "Evitar choque de pH no reator e acompanhar atividade biológica após a correção."
    }, analysis);
  }

  if (dqo > 500) {
    return withTechnicalNote({
      status_operacional: "Atenção",
      possivel_causa: "Possível aumento de carga orgânica, variação de processo industrial ou baixa eficiência de remoção preliminar.",
      risco_ambiental: "Elevação de matéria orgânica no efluente tratado e risco de ultrapassar limites de lançamento.",
      risco_operacional: "Sobrecarga do sistema biológico, aumento de DBO remanescente e maior consumo de oxigênio.",
      acao_corretiva: "Identificar origem da carga, ajustar equalização e revisar aeração, recirculação e dosagem auxiliar.",
      acao_preventiva: "Monitorar carga por turno, criar alerta de DQO e integrar produção industrial com operação da ETE.",
      melhoria_fisico_quimica: "Avaliar pré-tratamento, coagulação otimizada e remoção complementar de sólidos coloidais.",
      melhoria_biologica: "Revisar idade do lodo, oxigênio dissolvido e capacidade de biodegradação da biomassa."
    }, analysis);
  }

  if (turbidez > 50) {
    return withTechnicalNote({
      status_operacional: "Atenção",
      possivel_causa: "Possível falha de coagulação/floculação, formação inadequada de flocos ou arraste de sólidos no clarificador.",
      risco_ambiental: "Aumento de sólidos suspensos e risco de não conformidade visual e analítica no efluente final.",
      risco_operacional: "Arraste de lodo, perda de eficiência de clarificação e elevação do consumo de insumos.",
      acao_corretiva: "Realizar jar test, ajustar coagulante, polímero, pH de coagulação e tempos de mistura.",
      acao_preventiva: "Padronizar ensaios de bancada, revisar ponto de dosagem e acompanhar turbidez por turno.",
      melhoria_fisico_quimica: "Otimizar gradiente de mistura, maturação do floco e dosagem por carga afluente.",
      melhoria_biologica: "Verificar contribuição de sólidos biológicos e condição de sedimentabilidade do lodo."
    }, analysis);
  }

  if (vazao > 48) {
    return withTechnicalNote({
      status_operacional: "Crítico",
      possivel_causa: "Pico hidráulico acima da faixa de projeto da ETE.",
      risco_ambiental: "Risco de lançamento com remoção insuficiente por redução do tempo de tratamento.",
      risco_operacional: "Redução do tempo de detenção hidráulica e aumento do risco de perda de clarificação.",
      acao_corretiva: "Equalizar a vazão de entrada e reduzir descargas concentradas.",
      acao_preventiva: "Programar descargas industriais em janelas operacionais controladas.",
      melhoria_fisico_quimica: "Avaliar tanque de equalização adicional, controle de vazão por inversor e dosagem proporcional.",
      melhoria_biologica: "Proteger o reator biológico contra lavagem de biomassa e oscilações bruscas de carga."
    }, analysis);
  }

  if (oleos > 20) {
    return withTechnicalNote({
      status_operacional: "Atenção",
      possivel_causa: "Possível falha no separador óleo/água, emulsificação do efluente ou descarte concentrado de óleos e graxas.",
      risco_ambiental: "Risco de lançamento com filme oleoso, toxicidade e não conformidade para óleos e graxas.",
      risco_operacional: "Inibição biológica, formação de escuma, perda de transferência de oxigênio e aumento de lodo flotado.",
      acao_corretiva: "Inspecionar separador óleo/água, remover fase oleosa acumulada e avaliar quebra de emulsão.",
      acao_preventiva: "Criar rotina de limpeza do separador, controle de descarte industrial e monitoramento por turno.",
      melhoria_fisico_quimica: "Avaliar desemulsificante, flotação por ar dissolvido e ajuste de pH para remoção de óleos.",
      melhoria_biologica: "Evitar entrada de óleos no reator biológico e acompanhar escuma, OD e atividade da biomassa."
    }, analysis);
  }

  return withTechnicalNote({
    status_operacional: "Normal",
    possivel_causa: "Operação dentro da faixa esperada, sem desvio crítico identificado pelos parâmetros informados.",
    risco_ambiental: "Baixo no momento, com indicadores dentro da condição operacional registrada.",
    risco_operacional: "Baixo no momento, com necessidade de acompanhamento contínuo da clarificação e do consumo químico.",
    acao_corretiva: "Manter a dosagem atual e verificar a formação de flocos no decantador.",
    acao_preventiva: "Padronizar jar test semanal e registrar tendência de consumo de insumos.",
    melhoria_fisico_quimica: "Buscar redução gradual de dosagem com controle de turbidez para economia operacional segura.",
    melhoria_biologica: "Manter monitoramento de DBO, oxigênio dissolvido e sedimentabilidade para preservar estabilidade do processo."
  }, analysis);
}
