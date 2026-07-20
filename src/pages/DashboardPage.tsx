import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Inbox,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCrm } from "../app/CrmContext";
import {
  Avatar,
  OriginBadge,
  PanelHead,
  PriorityBadge,
  SelectControl,
} from "../components/Common";
import { currency, localDateKey } from "../core/utils";

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: typeof Inbox;
  label: string;
  value: string | number;
  trend: string;
  tone: string;
}) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <div className="kpi-top">
        <span className="kpi-icon">
          <Icon size={20} />
        </span>
        <span className="kpi-trend">
          <TrendingUp size={13} /> {trend}
        </span>
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function DashboardPage({
  onNavigate,
  onLead,
}: {
  onNavigate: (page: string) => void;
  onLead: (id: string) => void;
}) {
  const { data, visibleLeads, toggleTask, currentUser, can } = useCrm();
  const pipelines = (data?.pipelines || []).filter((item) => item.active);
  const [pipelineId, setPipelineId] = useState(pipelines[0]?.id || "");
  const allStages = [...(data?.stages || [])].sort((a, b) => a.order - b.order);
  const stages = allStages.filter((stage) => stage.pipelineId === pipelineId);
  const funnelLeads = visibleLeads.filter(
    (lead) => lead.pipelineId === pipelineId,
  );
  const users = data?.users || [];
  const tasks = data?.tasks || [];
  const metrics = useMemo(() => {
    const wonIds = new Set(
      allStages.filter((item) => item.kind === "won").map((item) => item.id),
    );
    const active = visibleLeads.filter((item) => !wonIds.has(item.stageId));
    const won = visibleLeads.filter((item) => wonIds.has(item.stageId));
    return {
      active,
      pipeline: active.reduce((sum, item) => sum + item.value, 0),
      conversion: Math.round(
        (won.length / Math.max(visibleLeads.length, 1)) * 100,
      ),
      hot: visibleLeads.filter((item) => item.temperature === "Quente").length,
    };
  }, [allStages, visibleLeads]);
  useEffect(() => {
    if (pipelineId && pipelines.some((item) => item.id === pipelineId)) return;
    setPipelineId(pipelines[0]?.id || "");
  }, [pipelineId, pipelines]);

  const today = localDateKey();
  const todayTasks = tasks.filter(
    (task) =>
      task.date === today &&
      (currentUser?.role === "super_admin" ||
        currentUser?.role === "manager" ||
        task.ownerId === currentUser?.id),
  );
  const sources = ["Meta Ads", "Google Ads", "Landing Page", "Outros"].map(
    (source) => ({
      source,
      count:
        source === "Outros"
          ? visibleLeads.filter(
              (lead) =>
                !["Meta Ads", "Google Ads", "Landing Page"].includes(
                  lead.origin,
                ),
            ).length
          : visibleLeads.filter((lead) => lead.origin === source).length,
    }),
  );
  const total = sources.reduce((sum, item) => sum + item.count, 0) || 1;
  let cumulative = 0;
  const colors = ["#ffd43b", "#4dabf7", "#69db7c", "#b197fc"];
  const gradient = sources
    .map((item, index) => {
      const start = cumulative;
      const end = cumulative + (item.count / total) * 360;
      cumulative = end;
      return `${colors[index]} ${start}deg ${end}deg`;
    })
    .join(",");
  return (
    <div className="dashboard-grid">
      <div className="kpi-grid full-span">
        <KpiCard
          icon={Inbox}
          label="Leads ativos"
          value={metrics.active.length}
          trend="Base operacional"
          tone="yellow"
        />
        <KpiCard
          icon={CircleDollarSign}
          label="Pipeline estimado"
          value={currency(metrics.pipeline)}
          trend="Leads visíveis"
          tone="blue"
        />
        <KpiCard
          icon={Target}
          label="Taxa de conversão"
          value={`${metrics.conversion}%`}
          trend="Funil atual"
          tone="green"
        />
        <KpiCard
          icon={Zap}
          label="Leads quentes"
          value={metrics.hot}
          trend="Prioridade comercial"
          tone="purple"
        />
      </div>
      <section className="panel funnel-panel">
        <PanelHead
          title="Visão do funil"
          subtitle="Volume e valor por etapa"
          action={
            <div className="panel-actions">
              {pipelines.length > 1 && (
                <SelectControl
                  value={pipelineId}
                  onChange={setPipelineId}
                  options={pipelines.map((pipeline) => pipeline.id)}
                  labels={Object.fromEntries(
                    pipelines.map((pipeline) => [pipeline.id, pipeline.name]),
                  )}
                  icon={SlidersHorizontal}
                />
              )}
              <button onClick={() => onNavigate("kanban")}>
                Abrir funil <ArrowRight size={15} />
              </button>
            </div>
          }
        />
        <div className="funnel-bars">
          {stages
            .filter((stage) => stage.kind !== "lost")
            .map((stage, index) => {
              const list = funnelLeads.filter(
                (lead) => lead.stageId === stage.id,
              );
              const width = Math.max(28, 100 - index * 11);
              return (
                <div className="funnel-row" key={stage.id}>
                  <div className="funnel-label">
                    <span>{stage.name}</span>
                    <strong>
                      {list.length} leads ·{" "}
                      {currency(
                        list.reduce((sum, item) => sum + item.value, 0),
                      )}
                    </strong>
                  </div>
                  <div className="funnel-track">
                    <div
                      style={
                        {
                          width: `${width}%`,
                          "--stage-color": stage.color,
                        } as React.CSSProperties
                      }
                    >
                      <b>{list.length}</b>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
      <section className="panel source-panel">
        <PanelHead title="Origem dos leads" subtitle="Distribuição por canal" />
        <div className="source-chart-wrap">
          <div
            className="donut"
            style={{ background: `conic-gradient(${gradient})` }}
          >
            <div>
              <strong>{visibleLeads.length}</strong>
              <span>leads</span>
            </div>
          </div>
          <div className="legend-list">
            {sources.map((item, index) => (
              <div key={item.source}>
                <span className={`legend-dot dot-${index}`} />
                <b>{item.source}</b>
                <strong>{Math.round((item.count / total) * 100)}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="panel recent-panel">
        <PanelHead
          title="Leads recentes"
          subtitle="Últimas entradas disponíveis para seu perfil"
          action={
            <button onClick={() => onNavigate("leads")}>
              Ver todos <ArrowRight size={15} />
            </button>
          }
        />
        <div className="recent-list">
          {[...visibleLeads]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 5)
            .map((lead) => {
              const owner = users.find((user) => user.id === lead.ownerId);
              return (
                <button
                  key={lead.id}
                  onClick={() => onLead(lead.id)}
                  className="recent-row"
                >
                  <div className="lead-avatar">
                    {lead.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="recent-main">
                    <strong>{lead.name}</strong>
                    <span>
                      {lead.company} · {lead.city}
                    </span>
                  </div>
                  <OriginBadge origin={lead.origin} />
                  <PriorityBadge value={lead.priority} />
                  <Avatar user={owner} small />
                  <ChevronRight size={16} />
                </button>
              );
            })}
        </div>
      </section>
      <section className="panel task-panel">
        <PanelHead
          title="Tarefas de hoje"
          subtitle={`${todayTasks.filter((task) => !task.done).length} pendentes`}
          action={
            <button onClick={() => onNavigate("calendar")}>
              Agenda <ArrowRight size={15} />
            </button>
          }
        />
        <div className="task-list">
          {todayTasks.length ? (
            todayTasks.map((task) => (
              <button
                key={task.id}
                disabled={!can("tasks.manage")}
                className={`task-row ${task.done ? "done" : ""}`}
                onClick={() => toggleTask(task.id)}
              >
                <span className="task-check">
                  {task.done && <Check size={14} />}
                </span>
                <div>
                  <strong>{task.title}</strong>
                  <span>
                    <Clock3 size={13} /> {task.time} · {task.type}
                  </span>
                </div>
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <p className="muted padded">Nenhuma tarefa para hoje.</p>
          )}
        </div>
      </section>
    </div>
  );
}
