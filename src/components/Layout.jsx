import React from "react";
import { isSupabaseConfigured } from "../supabaseClient.js";

export const navItems = [
  ["dashboard", "Dashboard", "DB"],
  ["companies", "Gestão Operacional", "GO"],
  ["analyses", "Análises", "AN"],
  ["diagnostics", "Diagnóstico Inteligente", "DI"],
  ["chemical-inputs", "Controle de Insumos", "CI"],
  ["reports", "Relatórios", "RT"],
  ["financial", "Financeiro", "FI"],
  ["iot-sensors", "Sensores IoT", "SI"],
  ["tickets", "Chamados Técnicos", "CH"],
  ["automations", "Automações", "AU"],
  ["admin", "Administração", "AD"]
];

export function Brand({ onClick, compact = false }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Ir para o início">
      <span className="brand-logo-wrap">
        <img
          src="/images/logo.png"
          alt="Smartefluentes"
          className="brand-logo"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling.style.display = "grid";
          }}
        />
        <span className="brand-mark" style={{ display: "none" }}>S</span>
      </span>
      <span className="brand-copy">
        <b>Smartefluentes</b>
        {!compact && <small>Inteligência operacional para ETEs industriais</small>}
      </span>
    </button>
  );
}

export function Sidebar({ page, setPage, user, companies = [], activeCompanyId, onCompanyChange, onLogout, profile }) {
  return (
    <aside className="sidebar">
      <Brand onClick={() => setPage("dashboard")} />
      <label className="company-switcher">
        Empresa ativa
        <select value={activeCompanyId || ""} onChange={(event) => onCompanyChange(event.target.value)}>
          {!companies.length && <option value="">Nenhuma empresa</option>}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.razao_social}
            </option>
          ))}
        </select>
      </label>
      <nav className="side-nav" aria-label="Navegação principal">
        {navItems.map(([key, label, icon]) => (
          <button
            key={key}
            className={`nav-item ${page === key ? "active" : ""}`}
            onClick={() => setPage(key)}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="btn secondary full" onClick={onLogout}>
        Sair
      </button>
      <div className="sidebar-card">
        <span>{isSupabaseConfigured ? "Supabase conectado" : "Configuração pendente"}</span>
        <strong>{profile?.full_name || user?.email || "Usuário autenticado"}</strong>
        <small>
          {isSupabaseConfigured
            ? "Dados operacionais protegidos por RLS"
            : "Crie o .env com as chaves públicas do Supabase"}
        </small>
      </div>
    </aside>
  );
}

export function MobileTopbar({ page, setPage, companies = [], activeCompanyId, onCompanyChange, onLogout }) {
  return (
    <header className="mobile-topbar">
      <Brand compact onClick={() => setPage("dashboard")} />
      <select value={page} onChange={(event) => setPage(event.target.value)} aria-label="Selecionar módulo">
        {navItems.map(([key, label]) => (
          <option value={key} key={key}>
            {label}
          </option>
        ))}
      </select>
      <select className="mobile-company-select" value={activeCompanyId || ""} onChange={(event) => onCompanyChange(event.target.value)} aria-label="Selecionar empresa ativa">
        {!companies.length && <option value="">Empresa</option>}
        {companies.map((company) => (
          <option value={company.id} key={company.id}>{company.razao_social}</option>
        ))}
      </select>
      <button className="mobile-logout" onClick={onLogout}>
        Sair
      </button>
    </header>
  );
}

export function PageFrame({ title, subtitle, children }) {
  return (
    <section className="page-frame">
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function FormField({ label, name, value, onChange, type = "text", textarea = false, placeholder = "", required = false }) {
  return (
    <label>
      {label}
      {textarea ? (
        <textarea
          value={value || ""}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(name, event.target.value)}
        />
      )}
    </label>
  );
}

export function Toast({ state }) {
  if (!state.message) return null;
  return (
    <div className={`save-toast ${state.type || "success"}`}>
      <strong>{state.type === "error" ? "Falha operacional" : "Registro operacional"}</strong>
      <span>{state.message}</span>
    </div>
  );
}

export function DataTable({ rows, columns, emptyText }) {
  if (!rows.length) {
    return <p className="form-hint">{emptyText}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || JSON.stringify(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LineChart({ rows, field, label }) {
  const values = rows.map((row) => Number(row[field]) || 0);
  if (!values.length) {
    return (
      <div className="line-chart empty-chart">
        <div className="line-chart-meta">
          <strong>{label}</strong>
          <small>Sem dados</small>
        </div>
        <div className="empty-chart-box">Registre dados para gerar o gráfico.</div>
      </div>
    );
  }
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const points = values
    .slice()
    .reverse()
    .map((value, index) => {
      const x = 12 + index * (176 / Math.max(values.length - 1, 1));
      const y = 96 - ((value - min) / range) * 66;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="line-chart">
      <div className="line-chart-meta">
        <strong>{label}</strong>
        <small>{values.length ? `${values[values.length - 1]} → ${values[0]}` : "Sem dados"}</small>
      </div>
      <svg viewBox="0 0 200 112" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`grad-${field}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#16a36a" />
            <stop offset="100%" stopColor="#0e7cc8" />
          </linearGradient>
        </defs>
        <path d="M12 98 H188" className="chart-axis" />
        <polyline points={points} fill="none" stroke={`url(#grad-${field})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(" ").filter(Boolean).map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} r="4.5" className="chart-point" />;
        })}
      </svg>
    </div>
  );
}
