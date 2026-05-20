import React, { useState } from "react";
import { DataTable, FormField, PageFrame } from "../components/Layout.jsx";
import { saveChemicalInput } from "../supabaseClient.js";

const initialInput = {
  nome: "",
  tipo: "coagulante",
  quantidade_usada: "",
  estoque_atual: "",
  custo_unitario: "",
  custo_mensal: "",
  data_uso: new Date().toISOString().slice(0, 10)
};

export default function ChemicalInputs({ company, chemicalInputs, onSaved, notify }) {
  const [form, setForm] = useState(initialInput);
  const [loading, setLoading] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company) {
      notify("Cadastre uma empresa antes de registrar insumos.", "error");
      return;
    }

    setLoading(true);
    try {
      await saveChemicalInput(form, company.id);
      notify("Consumo de insumo químico salvo com sucesso.");
      setForm(initialInput);
      await onSaved();
    } catch (error) {
      notify(error.message || "Não foi possível salvar o insumo.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Controle de Insumos" subtitle="Gestão de consumo, estoque e custo dos insumos aplicados ao tratamento.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <FormField label="Nome do insumo" name="nome" value={form.nome} onChange={update} placeholder="PAC 18%" />
        <label>
          Tipo
          <select value={form.tipo} onChange={(event) => update("tipo", event.target.value)}>
            <option value="coagulante">Coagulante</option>
            <option value="polimero">Polímero</option>
            <option value="alcalinizante">Alcalinizante</option>
            <option value="acido">Ácido</option>
            <option value="oxidante">Oxidante</option>
            <option value="antiespumante">Antiespumante</option>
          </select>
        </label>
        <FormField label="Quantidade usada" name="quantidade_usada" value={form.quantidade_usada} onChange={update} placeholder="46" />
        <FormField label="Estoque atual" name="estoque_atual" value={form.estoque_atual} onChange={update} placeholder="720" />
        <FormField label="Custo unitário" name="custo_unitario" value={form.custo_unitario} onChange={update} placeholder="7,00" />
        <FormField label="Custo mensal" name="custo_mensal" value={form.custo_mensal} onChange={update} placeholder="1940,00" />
        <FormField label="Data de uso" name="data_uso" type="date" value={form.data_uso} onChange={update} />
        <div className="form-actions">
          <button className="btn primary" disabled={loading}>{loading ? "Salvando..." : "Salvar insumo"}</button>
        </div>
      </form>
      <div className="table-card">
        <h3>Consumo químico</h3>
        <DataTable
          rows={chemicalInputs}
          emptyText="Nenhum consumo químico registrado."
          columns={[
            { key: "data_uso", label: "Data" },
            { key: "nome", label: "Insumo" },
            { key: "tipo", label: "Tipo" },
            { key: "quantidade_usada", label: "Quantidade" },
            { key: "estoque_atual", label: "Estoque" },
            { key: "custo_mensal", label: "Custo mensal", render: (row) => `R$ ${Number(row.custo_mensal || 0).toLocaleString("pt-BR")}` }
          ]}
        />
      </div>
    </PageFrame>
  );
}
