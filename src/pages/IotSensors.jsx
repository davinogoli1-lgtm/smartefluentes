import React, { useState } from "react";
import { DataTable, FormField, LineChart, PageFrame } from "../components/Layout.jsx";
import { saveIotSensor } from "../supabaseClient.js";

const initialSensor = {
  sensor_nome: "",
  parametro: "pH online",
  valor: "",
  unidade: "",
  status: "online",
  ultima_leitura: new Date().toISOString().slice(0, 16)
};

export default function IotSensors({ company, sensors, onSaved, notify }) {
  const [form, setForm] = useState(initialSensor);
  const [loading, setLoading] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company) {
      notify("Selecione uma empresa antes de registrar sensores.", "error");
      return;
    }
    setLoading(true);
    try {
      await saveIotSensor(form, company.id);
      notify("Leitura de sensor IoT salva no Supabase.");
      setForm(initialSensor);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível salvar a leitura IoT.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Sensores IoT" subtitle="Estrutura funcional para leituras online, webhooks e alertas automáticos de processo.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <FormField label="Nome do sensor" name="sensor_nome" value={form.sensor_nome} onChange={update} placeholder="Sensor pH Tanque 01" required />
        <label>Parâmetro<select value={form.parametro} onChange={(event) => update("parametro", event.target.value)}>
          <option>pH online</option>
          <option>Vazão</option>
          <option>Turbidez</option>
          <option>Temperatura</option>
          <option>Condutividade</option>
        </select></label>
        <FormField label="Valor" name="valor" value={form.valor} onChange={update} placeholder="7,2" />
        <FormField label="Unidade" name="unidade" value={form.unidade} onChange={update} placeholder="pH, m³/h, NTU, °C, µS/cm" />
        <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}>
          <option value="online">Online</option>
          <option value="atenção">Atenção</option>
          <option value="offline">Offline</option>
          <option value="crítico">Crítico</option>
        </select></label>
        <FormField label="Última leitura" name="ultima_leitura" type="datetime-local" value={form.ultima_leitura} onChange={update} />
        <div className="form-actions"><button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Salvar leitura IoT"}</button></div>
      </form>
      <div className="chart-card"><LineChart rows={sensors} field="valor" label="Leituras IoT reais" /></div>
      <div className="table-card">
        <h3>Sensores cadastrados</h3>
        <DataTable
          rows={sensors}
          emptyText="Nenhum sensor ou leitura IoT registrada."
          columns={[
            { key: "ultima_leitura", label: "Última leitura", render: (row) => row.ultima_leitura ? new Date(row.ultima_leitura).toLocaleString("pt-BR") : "" },
            { key: "sensor_nome", label: "Sensor" },
            { key: "parametro", label: "Parâmetro" },
            { key: "valor", label: "Valor" },
            { key: "unidade", label: "Unidade" },
            { key: "status", label: "Status" }
          ]}
        />
      </div>
    </PageFrame>
  );
}
