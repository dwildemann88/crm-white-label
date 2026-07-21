import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCheck,
  ContactRound,
  Inbox,
  KanbanSquare,
  Layers3,
  LayoutDashboard,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Search,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCrm } from "../app/CrmContext";
import { cx, formatDateTime } from "../core/utils";
import { Avatar } from "./Common";

export type PageId =
  | "dashboard"
  | "kanban"
  | "leads"
  | "calendar"
  | "inbox"
  | "analytics"
  | "integrations"
  | "admin"
  | "developer";

const navItems = [
  {
    id: "dashboard" as PageId,
    label: "Visão geral",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    id: "kanban" as PageId,
    label: "Funil Kanban",
    icon: KanbanSquare,
    module: "kanban",
  },
  {
    id: "leads" as PageId,
    label: "Leads gerais",
    icon: ContactRound,
    module: "leads",
  },
  {
    id: "calendar" as PageId,
    label: "Agenda e tarefas",
    icon: CalendarDays,
    module: "calendar",
  },
  {
    id: "inbox" as PageId,
    label: "WhatsApp",
    icon: MessageCircle,
    module: "inbox",
    permission: "messages.read" as const,
  },
  {
    id: "analytics" as PageId,
    label: "Relatórios",
    icon: BarChart3,
    module: "analytics",
    permission: "reports.read" as const,
  },
  {
    id: "integrations" as PageId,
    label: "Integrações",
    icon: PlugZap,
    module: "integrations",
    permission: "integrations.manage" as const,
  },
  {
    id: "admin" as PageId,
    label: "Administração",
    icon: UserCog,
    module: "admin",
    permission: "users.manage" as const,
  },
  {
    id: "developer" as PageId,
    label: "Desenvolvedor",
    icon: Layers3,
    module: "developer",
    permission: "developer.manage" as const,
  },
];

const titles: Record<PageId, [string, string]> = {
  dashboard: ["Visão geral", "Acompanhe a operação comercial em tempo real."],
  kanban: ["Funil de vendas", "Movimente e qualifique leads entre as etapas."],
  leads: ["Leads gerais", "Base centralizada com filtros, colunas e ações."],
  calendar: ["Agenda e tarefas", "Organize retornos, visitas e compromissos."],
  inbox: ["WhatsApp", "Atendimento compartilhado vinculado aos leads."],
  analytics: [
    "Relatórios",
    "Conversão, origem, produtividade e previsibilidade.",
  ],
  integrations: [
    "Integrações",
    "Conecte canais sem alterar os módulos do CRM.",
  ],
  admin: ["Administração", "Usuários, funis, etiquetas e identidade visual."],
  developer: ["Desenvolvedor", "Crie versões white-label sem escrever código."],
};

interface AppShellProps {
  page: PageId;
  onPage(page: PageId): void;
  onNewLead(): void;
  onGlobalSearch(query: string): void;
  children: React.ReactNode;
}

export function AppShell({
  page,
  onPage,
  onNewLead,
  onGlobalSearch,
  children,
}: AppShellProps) {
  const { data, currentUser, can, login, markNotificationRead } = useCrm();
  const [mobile, setMobile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return (
      window.localStorage.getItem(
        "projem-flow-sidebar-collapsed",
      ) === "true"
    );
  });

  useEffect(() => {
    window.localStorage.setItem(
      "projem-flow-sidebar-collapsed",
      String(collapsed),
    );
  }, [collapsed]);

  const organization = data?.organizations.find(
    (item) => item.id === data.session?.organizationId,
  );
  const enabledModules = organization?.enabledModules || [];
  const visibleNav = useMemo(
    () =>
      navItems.filter(
        (item) =>
          enabledModules.includes(item.module) &&
          (!item.permission || can(item.permission)),
      ),
    [can, enabledModules],
  );

  const notifications = (data?.notifications || [])
    .filter((item) => item.userId === null || item.userId === currentUser?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = notifications.filter((item) => !item.read);
  const title = titles[page];
  const demoUsers = (data?.users || []).filter(
    (user) => user.active && user.demoPassword,
  );

  const goTo = (target: PageId) => {
    onPage(target);
    setMobile(false);
  };

  const submitSearch = () => {
    const query = globalQuery.trim();
    if (!query) return;
    onGlobalSearch(query);
    onPage("leads");
  };

  return (
    <div
      className={cx("app-shell", collapsed && "sidebar-collapsed")}
      style={
        {
          "--brand-primary": organization?.branding.primaryColor || "#ffd43b",
          "--brand-secondary":
            organization?.branding.secondaryColor || "#0e0f12",
          "--app-bg": organization?.branding.backgroundColor || "#09090a",
        } as React.CSSProperties
      }
    >
      <aside className={cx("sidebar", mobile && "open", collapsed && "collapsed")}>
        <div className="brand-wrap">
          <div className="brand-mark">
            {organization?.branding.logoUrl ? (
              <img
                src={organization.branding.logoUrl}
                alt={organization.branding.companyName}
              />
            ) : (
              <Zap size={22} strokeWidth={2.6} />
            )}
          </div>
          <div className="brand-copy">
            <strong>
              {organization?.branding.productName || "PROJEM FLOW"}
            </strong>
            <span>CRM COMERCIAL</span>
          </div>

          <button
            type="button"
            className="icon-button sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={
              collapsed
                ? "Expandir barra lateral"
                : "Recolher barra lateral"
            }
            title={
              collapsed
                ? "Expandir barra lateral"
                : "Recolher barra lateral"
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          <button
            className="icon-button sidebar-close"
            onClick={() => setMobile(false)}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-caption">OPERAÇÃO</span>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={cx("nav-item", page === item.id && "active")}
                onClick={() => goTo(item.id)}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={19} />
                <span className="nav-label">{item.label}</span>
                {item.id === "inbox" && (
                  <b>
                    {data?.conversations.reduce(
                      (sum, conversation) => sum + conversation.unread,
                      0,
                    ) || 0}
                  </b>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div
            className="system-status"
            title={
              import.meta.env.VITE_DATA_PROVIDER === "rest"
                ? "Backend conectado"
                : "Ambiente demonstrativo"
            }
          >
            <span className="status-dot" />
            <span className="system-status-label">
              {import.meta.env.VITE_DATA_PROVIDER === "rest"
                ? "Backend conectado"
                : "Ambiente demonstrativo"}
            </span>
          </div>

          <div className="profile-switcher">
            <button
              className="profile-mini"
              onClick={() => setProfileOpen((value) => !value)}
            >
              <Avatar user={currentUser} />
              <div className="profile-copy">
                <strong>{currentUser?.name}</strong>
                <span>{currentUser?.roleLabel}</span>
              </div>
              <Users className="profile-switch-icon" size={16} />
            </button>
            {profileOpen && import.meta.env.VITE_DATA_PROVIDER !== "rest" && (
              <div className="profile-menu">
                <div className="popover-head">
                  <div>
                    <strong>Perfis de demonstração</strong>
                    <span>Teste o escopo de cada nível</span>
                  </div>
                  <button onClick={() => setProfileOpen(false)}>
                    <X size={15} />
                  </button>
                </div>
                {demoUsers.map((user) => (
                  <button
                    key={user.id}
                    className={cx(
                      "profile-option",
                      user.id === currentUser?.id && "active",
                    )}
                    onClick={async () => {
                      await login(user.email, user.demoPassword || "projem123");
                      setProfileOpen(false);
                      onPage("dashboard");
                    }}
                  >
                    <Avatar user={user} small />
                    <span>
                      <strong>{user.name}</strong>
                      <small>{user.roleLabel}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobile && (
        <button
          className="mobile-overlay"
          onClick={() => setMobile(false)}
          aria-label="Fechar menu"
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobile(true)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1>{title[0]}</h1>
              <p>{title[1]}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="global-search">
              <Search size={17} />
              <input
                value={globalQuery}
                placeholder="Buscar lead, empresa ou telefone"
                onChange={(event) => setGlobalQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch();
                }}
              />
            </div>

            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                onClick={() => setNotificationsOpen((value) => !value)}
                aria-label="Notificações"
              >
                <Bell size={18} />
                {unread.length > 0 && <span />}
              </button>

              {notificationsOpen && (
                <div className="popover notifications">
                  <div className="popover-head">
                    <div>
                      <strong>Notificações</strong>
                      <span>{unread.length} não lidas</span>
                    </div>
                    <button onClick={() => setNotificationsOpen(false)}>
                      <X size={16} />
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.slice(0, 8).map((item) => (
                      <button
                        className={cx(
                          "notification-item",
                          !item.read && "unread",
                        )}
                        key={item.id}
                        onClick={() => markNotificationRead(item.id)}
                      >
                        <span>
                          <Inbox size={16} />
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                          <small>{formatDateTime(item.createdAt)}</small>
                        </div>
                      </button>
                    ))}
                    {!notifications.length && (
                      <p className="empty-notifications">
                        Nenhuma notificação.
                      </p>
                    )}
                  </div>

                  {unread.length > 0 && (
                    <button
                      className="notification-footer"
                      onClick={() => markNotificationRead()}
                    >
                      <CheckCheck size={15} /> Marcar todas como lidas
                    </button>
                  )}
                </div>
              )}
            </div>

            {can("leads.create") && (
              <button
                className="primary-button desktop-add"
                onClick={onNewLead}
              >
                Novo lead
              </button>
            )}
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}
