import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MobileTopbar, PageFrame, Sidebar, Toast } from "./components/Layout.jsx";
import Admin from "./pages/Admin.jsx";
import Analyses from "./pages/Analyses.jsx";
import Automations from "./pages/Automations.jsx";
import ChemicalInputs from "./pages/ChemicalInputs.jsx";
import Companies from "./pages/Companies.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Diagnostics from "./pages/Diagnostics.jsx";
import Financial from "./pages/Financial.jsx";
import IotSensors from "./pages/IotSensors.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Reports from "./pages/Reports.jsx";
import Tickets from "./pages/Tickets.jsx";
import {
  fetchAnalyses,
  fetchAutomations,
  fetchChemicalInputs,
  fetchCompanies,
  fetchDiagnostics,
  fetchFinancial,
  fetchIotSensors,
  fetchProfile,
  fetchReports,
  fetchSupportTickets,
  getActiveCompany,
  getSession,
  isSupabaseConfigured,
  onAuthStateChange,
  signOut
} from "./supabaseClient.js";

const publicPages = ["login", "register"];
const companyRequiredPages = ["analyses", "diagnostics", "chemical-inputs", "reports", "financial", "iot-sensors", "tickets", "automations"];

export default function App() {
  const [page, setPageState] = useState("login");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
  const [analyses, setAnalyses] = useState([]);
  const [chemicalInputs, setChemicalInputs] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [reports, setReports] = useState([]);
  const [financial, setFinancial] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [automations, setAutomations] = useState([]);

  const user = session?.user || null;
  const activeCompany = getActiveCompany(companies, activeCompanyId);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast({ message: "", type: "success" }), 4200);
  }, []);

  const setPage = useCallback((nextPage) => {
    if (!publicPages.includes(nextPage) && !user) {
      setPageState("login");
      setToast({ message: "Faça login para acessar os módulos internos.", type: "error" });
      return;
    }
    setPageState(nextPage);
  }, [user]);

  const clearScopedData = useCallback(() => {
    setAnalyses([]);
    setChemicalInputs([]);
    setDiagnostics([]);
    setReports([]);
    setFinancial([]);
    setSensors([]);
    setTickets([]);
    setAutomations([]);
  }, []);

  const loadCompanies = useCallback(async (preferredCompanyId = "") => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [nextProfile, nextCompanies] = await Promise.all([
        fetchProfile(user.id),
        fetchCompanies()
      ]);
      setProfile(nextProfile);
      setCompanies(nextCompanies);
      setActiveCompanyId((current) => {
        if (preferredCompanyId) return preferredCompanyId;
        if (nextCompanies.some((company) => company.id === current)) return current;
        return nextCompanies[0]?.id || "";
      });
      if (!nextCompanies.length) clearScopedData();
    } catch (error) {
      notify(error.message || "Não foi possível carregar empresas e perfil.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [clearScopedData, notify, user]);

  const loadCompanyData = useCallback(async (companyId = activeCompanyId) => {
    if (!user || !companyId) {
      clearScopedData();
      return;
    }
    setLoadingData(true);
    try {
      const [
        nextAnalyses,
        nextInputs,
        nextDiagnostics,
        nextReports,
        nextFinancial,
        nextSensors,
        nextTickets,
        nextAutomations
      ] = await Promise.all([
        fetchAnalyses(companyId),
        fetchChemicalInputs(companyId),
        fetchDiagnostics(companyId),
        fetchReports(companyId),
        fetchFinancial(companyId),
        fetchIotSensors(companyId),
        fetchSupportTickets(companyId),
        fetchAutomations(companyId)
      ]);
      setAnalyses(nextAnalyses);
      setChemicalInputs(nextInputs);
      setDiagnostics(nextDiagnostics);
      setReports(nextReports);
      setFinancial(nextFinancial);
      setSensors(nextSensors);
      setTickets(nextTickets);
      setAutomations(nextAutomations);
    } catch (error) {
      notify(error.message || "Não foi possível carregar dados operacionais.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [activeCompanyId, clearScopedData, notify, user]);

  useEffect(() => {
    async function boot() {
      if (!isSupabaseConfigured) {
        setBooting(false);
        return;
      }
      try {
        const currentSession = await getSession();
        setSession(currentSession);
        if (currentSession) setPageState("dashboard");
      } catch (error) {
        notify(error.message || "Falha ao verificar sessão Supabase.", "error");
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, [notify]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const subscription = onAuthStateChange((nextSession) => {
      setSession(nextSession);
      if (!nextSession) setPageState("login");
      if (nextSession) setPageState("dashboard");
    });
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadCompanies();
  }, [loadCompanies, user]);

  useEffect(() => {
    if (user && activeCompanyId) loadCompanyData(activeCompanyId);
  }, [activeCompanyId, loadCompanyData, user]);

  async function handleLogout() {
    try {
      await signOut();
      setSession(null);
      setProfile(null);
      setCompanies([]);
      setActiveCompanyId("");
      clearScopedData();
      setPageState("login");
      notify("Sessão encerrada com segurança.");
    } catch (error) {
      notify(error.message || "Não foi possível encerrar a sessão.", "error");
    }
  }

  function handleCompanyChange(companyId) {
    setActiveCompanyId(companyId);
  }

  const content = useMemo(() => {
    if (!isSupabaseConfigured) {
      return (
        <section className="auth-card">
          <h1>Configuração Supabase pendente</h1>
          <p className="form-hint">Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar autenticação, banco de dados e Storage.</p>
        </section>
      );
    }

    if (booting) {
      return <section className="auth-card"><h1>Carregando sessão...</h1><p className="form-hint">Validando autenticação Supabase.</p></section>;
    }

    if (page === "register") return <Register setPage={setPageState} notify={notify} />;
    if (!user || page === "login") return <Login setPage={setPageState} onAuthenticated={setSession} notify={notify} />;
    if (!activeCompany && companyRequiredPages.includes(page)) {
      return (
        <PageFrame title="Empresa necessária" subtitle="Cadastre ou selecione uma empresa para continuar.">
          <div className="empty-state">
            <h3>Cadastre uma empresa antes de usar este módulo.</h3>
            <p>Os lançamentos operacionais precisam de uma empresa ativa para que as políticas RLS vinculem os dados ao usuário logado.</p>
            <button className="btn primary" onClick={() => setPageState("companies")}>Cadastrar empresa</button>
          </div>
        </PageFrame>
      );
    }
    if (page === "companies") {
      return <Companies user={user} companies={companies} activeCompanyId={activeCompanyId} onCompanyChange={handleCompanyChange} onSaved={loadCompanies} notify={notify} />;
    }
    if (page === "analyses") return <Analyses company={activeCompany} analyses={analyses} onSaved={loadCompanyData} notify={notify} />;
    if (page === "diagnostics") return <Diagnostics analyses={analyses} diagnostics={diagnostics} onSaved={loadCompanyData} notify={notify} />;
    if (page === "chemical-inputs") return <ChemicalInputs company={activeCompany} chemicalInputs={chemicalInputs} onSaved={loadCompanyData} notify={notify} />;
    if (page === "reports") {
      return <Reports user={user} company={activeCompany} analyses={analyses} diagnostics={diagnostics} chemicalInputs={chemicalInputs} financial={financial} sensors={sensors} reports={reports} onSaved={loadCompanyData} notify={notify} />;
    }
    if (page === "financial") return <Financial company={activeCompany} financial={financial} onSaved={loadCompanyData} notify={notify} />;
    if (page === "iot-sensors") return <IotSensors company={activeCompany} sensors={sensors} onSaved={loadCompanyData} notify={notify} />;
    if (page === "tickets") return <Tickets company={activeCompany} tickets={tickets} profile={profile} onSaved={loadCompanyData} notify={notify} />;
    if (page === "automations") return <Automations company={activeCompany} automations={automations} onSaved={loadCompanyData} notify={notify} />;
    if (page === "admin") return <Admin profile={profile} notify={notify} />;
    return (
      <Dashboard
        activeCompany={activeCompany}
        analyses={analyses}
        chemicalInputs={chemicalInputs}
        diagnostics={diagnostics}
        financial={financial}
        sensors={sensors}
        tickets={tickets}
        automations={automations}
        setPage={setPage}
      />
    );
  }, [activeCompany, activeCompanyId, analyses, automations, booting, chemicalInputs, companies, diagnostics, financial, loadCompanies, loadCompanyData, notify, page, profile, reports, sensors, setPage, tickets, user]);

  return (
    <div className={`platform-shell ${user ? "" : "public-shell"}`}>
      {user && (
        <Sidebar
          page={page}
          setPage={setPage}
          user={user}
          profile={profile}
          companies={companies}
          activeCompanyId={activeCompany?.id || ""}
          onCompanyChange={handleCompanyChange}
          onLogout={handleLogout}
        />
      )}
      <div className="workspace">
        {user && (
          <MobileTopbar
            page={page}
            setPage={setPage}
            companies={companies}
            activeCompanyId={activeCompany?.id || ""}
            onCompanyChange={handleCompanyChange}
            onLogout={handleLogout}
          />
        )}
        <main className="main">
          {loadingData && user && <p className="inline-status saving">Carregando dados operacionais...</p>}
          {content}
        </main>
        <Toast state={toast} />
      </div>
    </div>
  );
}
