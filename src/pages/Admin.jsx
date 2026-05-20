import React, { useEffect, useState } from "react";
import { DataTable, PageFrame } from "../components/Layout.jsx";
import { fetchAdminData } from "../supabaseClient.js";

export default function Admin({ profile, notify }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ profiles: [], companies: [], tickets: [], sensors: [], reports: [] });
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    async function load() {
      if (!isAdmin) return;
      setLoading(true);
      try {
        setData(await fetchAdminData());
      } catch (error) {
        notify(error.message || "Não foi possível carregar a área administrativa.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin, notify]);

  if (!isAdmin) {
    return (
      <PageFrame title="Administração" subtitle="Área restrita a usuários administradores.">
        <div className="empty-state">
          <h3>Acesso administrativo indisponível</h3>
          <p>Seu perfil atual não possui permissão de administrador.</p>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Administração" subtitle="Gestão global de usuários, empresas, planos, chamados e indicadores operacionais.">
      {loading && <p className="inline-status saving">Carregando visão administrativa...</p>}
      <section className="metric-grid">
        <article className="metric-card"><span>Usuários</span><strong>{data.profiles.length}</strong></article>
        <article className="metric-card"><span>Empresas</span><strong>{data.companies.length}</strong></article>
        <article className="metric-card"><span>Chamados</span><strong>{data.tickets.length}</strong></article>
        <article className="metric-card"><span>Relatórios</span><strong>{data.reports.length}</strong></article>
      </section>
      <div className="two-col align-start">
        <div className="table-card">
          <h3>Usuários</h3>
          <DataTable
            rows={data.profiles}
            emptyText="Nenhum usuário encontrado."
            columns={[
              { key: "full_name", label: "Nome" },
              { key: "email", label: "E-mail" },
              { key: "role", label: "Perfil" }
            ]}
          />
        </div>
        <div className="table-card">
          <h3>Empresas</h3>
          <DataTable
            rows={data.companies}
            emptyText="Nenhuma empresa encontrada."
            columns={[
              { key: "razao_social", label: "Razão social" },
              { key: "cnpj", label: "CNPJ" },
              { key: "tipo_efluente", label: "Tipo de efluente" }
            ]}
          />
        </div>
      </div>
    </PageFrame>
  );
}
