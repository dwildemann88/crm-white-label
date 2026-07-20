import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCcw,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, type PageId } from "../components/AppShell";
import { LeadDrawer } from "../components/LeadDrawer";
import { LeadModal, TaskModal, UserModal } from "../components/Modals";
import { useCrm } from "./CrmContext";
import { DashboardPage } from "../pages/DashboardPage";
import { KanbanPage } from "../pages/KanbanPage";
import { LeadsPage } from "../pages/LeadsPage";
import { CalendarPage } from "../pages/CalendarPage";
import { InboxPage } from "../pages/InboxPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { IntegrationsPage } from "../pages/IntegrationsPage";
import { AdminPage } from "../pages/AdminPage";
import { DeveloperPage } from "../pages/DeveloperPage";
import { LoginPage } from "../pages/LoginPage";

interface ModalState {
  type: "lead" | "task" | "user";
  id?: string;
  date?: string;
}

export function App() {
  const {
    session,
    data,
    loading,
    busy,
    error,
    clearError,
    toast,
    visibleLeads,
    can,
    openWhatsAppConversation,
  } = useCrm();

  const [page, setPage] = useState<PageId>("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [globalLeadSearch, setGlobalLeadSearch] = useState("");
  const [inboxConversationId, setInboxConversationId] = useState<
    string | undefined
  >();

  const selectedLead = useMemo(
    () => visibleLeads.find((item) => item.id === selectedLeadId) || null,
    [selectedLeadId, visibleLeads],
  );

  const openLeadWhatsApp = async (leadId: string) => {
    try {
      const conversationId = await openWhatsAppConversation(leadId);

      setInboxConversationId(conversationId);
      setSelectedLeadId(null);
      setPage("inbox");
    } catch {
      // O CrmContext já apresenta o erro na interface.
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <LoaderCircle className="spin" />
        <strong>Preparando o ambiente de demonstração...</strong>
        <span>Carregando dados, permissões e módulos.</span>
      </div>
    );
  }

  if (!session || !data) {
    const manualLogin =
      import.meta.env.VITE_DATA_PROVIDER === "rest" ||
      import.meta.env.VITE_DEMO_AUTO_LOGIN === "false";

    if (manualLogin) return <LoginPage />;

    return (
      <div className="access-fallback">
        <AlertCircle size={34} />
        <h1>Não foi possível iniciar o CRM</h1>
        <p>
          {error ||
            "O ambiente local não conseguiu criar a sessão demonstrativa."}
        </p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw size={17} /> Tentar novamente
        </button>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            onNavigate={(value) => setPage(value as PageId)}
            onLead={setSelectedLeadId}
          />
        );

      case "kanban":
        return (
          <KanbanPage
            onLead={setSelectedLeadId}
            onAdd={() => setModal({ type: "lead" })}
            onEditStages={() => setPage("admin")}
          />
        );

      case "leads":
        return (
          <LeadsPage
            onLead={setSelectedLeadId}
            onAdd={() => setModal({ type: "lead" })}
            initialSearch={globalLeadSearch}
            onSearchApplied={() => setGlobalLeadSearch("")}
          />
        );

      case "calendar":
        return (
          <CalendarPage
            onAdd={(date) => setModal({ type: "task", date })}
            onEdit={(taskId) => setModal({ type: "task", id: taskId })}
          />
        );

      case "inbox":
        return (
          <InboxPage
            onLead={setSelectedLeadId}
            initialConversationId={inboxConversationId}
          />
        );

      case "analytics":
        return <AnalyticsPage />;

      case "integrations":
        return can("integrations.manage") ? (
          <IntegrationsPage />
        ) : (
          <DashboardPage
            onNavigate={(value) => setPage(value as PageId)}
            onLead={setSelectedLeadId}
          />
        );

      case "admin":
        return can("users.manage") ? (
          <AdminPage onUser={(id) => setModal({ type: "user", id })} />
        ) : (
          <DashboardPage
            onNavigate={(value) => setPage(value as PageId)}
            onLead={setSelectedLeadId}
          />
        );

      case "developer":
        return can("developer.manage") ? (
          <DeveloperPage />
        ) : (
          <DashboardPage
            onNavigate={(value) => setPage(value as PageId)}
            onLead={setSelectedLeadId}
          />
        );
    }
  };

  return (
    <>
      <AppShell
        page={page}
        onPage={setPage}
        onNewLead={() => setModal({ type: "lead" })}
        onGlobalSearch={setGlobalLeadSearch}
      >
        {renderPage()}
      </AppShell>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onEdit={() =>
            setModal({
              type: "lead",
              id: selectedLead.id,
            })
          }
          onTask={() =>
            setModal({
              type: "task",
              id: selectedLead.id,
            })
          }
          onWhatsApp={() => {
            void openLeadWhatsApp(selectedLead.id);
          }}
        />
      )}

      {modal?.type === "lead" && (
        <LeadModal
          lead={
            modal.id ? data.leads.find((item) => item.id === modal.id) : null
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "task" && (
        <TaskModal
          task={
            modal.id && data.tasks.some((item) => item.id === modal.id)
              ? data.tasks.find((item) => item.id === modal.id)
              : undefined
          }
          initialDate={modal.date}
          initialLeadId={
            modal.id && data.leads.some((item) => item.id === modal.id)
              ? modal.id
              : undefined
          }
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "user" && (
        <UserModal userId={modal.id} onClose={() => setModal(null)} />
      )}

      {busy && (
        <div className="busy-indicator">
          <LoaderCircle className="spin" size={17} /> Processando...
        </div>
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {error && (
        <div className="error-toast">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={clearError} aria-label="Fechar">
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}