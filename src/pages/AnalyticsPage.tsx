import {
  BarChart3,
  CircleDollarSign,
  Clock3,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCrm } from "../app/CrmContext";
import {
  Avatar,
  OriginBadge,
  PanelHead,
  SelectControl,
} from "../components/Common";
import { currency } from "../core/utils";

export function AnalyticsPage() {
  const { data, visibleLeads } = useCrm();
  const pipelines = data?.pipelines || [];
  const [pipelineId, setPipelineId] = useState("Todos");
  const reportLeads = visibleLeads.filter(
    (lead) => pipelineId === "Todos" || lead.pipelineId === pipelineId,
  );
  const stages = [...(data?.stages || [])]
    .filter(
      (stage) => pipelineId === "Todos" || stage.pipelineId === pipelineId,
    )
    .sort((a, b) => a.order - b.order);
  const users = data?.users || [];
  const sources = [...new Set(reportLeads.map((item) => item.origin))]
    .map((name) => ({
      name,
      count: reportLeads.filter((item) => item.origin === name).length,
      value: reportLeads
        .filter((item) => item.origin === name)
        .reduce((sum, item) => sum + item.value, 0),
    }))
    .sort((a, b) => b.count - a.count);
  const total = reportLeads.length || 1;
  const wonStageIds = stages
    .filter((stage) => stage.kind === "won")
    .map((stage) => stage.id);
  const won = reportLeads.filter((lead) => wonStageIds.includes(lead.stageId));
  const ownerStats = users
    .filter((user) => ["sales", "sdr"].includes(user.role))
    .map((user) => ({
      user,
      leads: reportLeads.filter((lead) => lead.ownerId === user.id).length,
      value: reportLeads
        .filter((lead) => lead.ownerId === user.id)
        .reduce((sum, lead) => sum + lead.value, 0),
      won: won.filter((lead) => lead.ownerId === user.id).length,
    }));
  useEffect(() => {
    if (
      pipelineId === "Todos" ||
      pipelines.some((pipeline) => pipeline.id === pipelineId)
    )
      return;
    setPipelineId("Todos");
  }, [pipelineId, pipelines]);

  const reportLeadIds = new Set(reportLeads.map((lead) => lead.id));
  const historyCount = (data?.histories || []).filter((history) =>
    reportLeadIds.has(history.leadId),
  ).length;

  return (
    <div className="analytics-grid">
      <div className="kpi-grid full-span">
        <div className="kpi-card tone-yellow">
          <div className="kpi-top">
            <span className="kpi-icon">
              <BarChart3 size={20} />
            </span>
          </div>
          <span>Leads analisados</span>
          <strong>{reportLeads.length}</strong>
        </div>
        <div className="kpi-card tone-blue">
          <div className="kpi-top">
            <span className="kpi-icon">
              <CircleDollarSign size={20} />
            </span>
          </div>
          <span>Pipeline total</span>
          <strong>
            {currency(reportLeads.reduce((sum, item) => sum + item.value, 0))}
          </strong>
        </div>
        <div className="kpi-card tone-green">
          <div className="kpi-top">
            <span className="kpi-icon">
              <Target size={20} />
            </span>
          </div>
          <span>Conversão</span>
          <strong>{Math.round((won.length / total) * 100)}%</strong>
        </div>
        <div className="kpi-card tone-purple">
          <div className="kpi-top">
            <span className="kpi-icon">
              <Clock3 size={20} />
            </span>
          </div>
          <span>Base histórica</span>
          <strong>{historyCount}</strong>
        </div>
      </div>
      <section className="panel analytics-funnel full-span">
        <PanelHead
          title="Funil gráfico"
          subtitle="Contagem atual por etapa; o backend real usará o histórico para coortes e velocidade."
          action={
            <SelectControl
              value={pipelineId}
              onChange={setPipelineId}
              options={["Todos", ...pipelines.map((pipeline) => pipeline.id)]}
              labels={Object.fromEntries(
                pipelines.map((pipeline) => [pipeline.id, pipeline.name]),
              )}
              icon={SlidersHorizontal}
            />
          }
        />
        <div className="analytics-funnel-bars">
          {stages.map((stage, index) => {
            const list = reportLeads.filter(
              (lead) => lead.stageId === stage.id,
            );
            return (
              <div key={stage.id}>
                <span>{stage.name}</span>
                <div>
                  <i
                    style={
                      {
                        width: `${Math.max(4, (list.length / Math.max(reportLeads.length, 1)) * 100)}%`,
                        "--stage-color": stage.color,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <strong>{list.length}</strong>
                <small>
                  {currency(list.reduce((sum, item) => sum + item.value, 0))}
                </small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel source-table-panel">
        <PanelHead
          title="Desempenho por origem"
          subtitle="Volume e potencial por canal"
        />
        <table className="mini-table">
          <thead>
            <tr>
              <th>Origem</th>
              <th>Leads</th>
              <th>Participação</th>
              <th>Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.name}>
                <td>
                  <OriginBadge origin={source.name} />
                </td>
                <td>{source.count}</td>
                <td>
                  <div className="progress-cell">
                    <span>
                      <i
                        style={{ width: `${(source.count / total) * 100}%` }}
                      />
                    </span>
                    {Math.round((source.count / total) * 100)}%
                  </div>
                </td>
                <td>
                  <strong>{currency(source.value)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel seller-panel">
        <PanelHead
          title="Produtividade da equipe"
          subtitle="Distribuição por responsável"
        />
        <div className="seller-list">
          {ownerStats.map((item) => (
            <div key={item.user.id}>
              <Avatar user={item.user} />
              <div>
                <strong>{item.user.name}</strong>
                <span>{item.user.roleLabel}</span>
              </div>
              <p>
                <b>{item.leads}</b>
                <span>Leads</span>
              </p>
              <p>
                <b>{currency(item.value)}</b>
                <span>Pipeline</span>
              </p>
              <p>
                <b>{item.won}</b>
                <span>Fechados</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
