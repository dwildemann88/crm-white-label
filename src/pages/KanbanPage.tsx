import {
  AlertCircle,
  Filter,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCrm } from "../app/CrmContext";
import {
  Avatar,
  OriginBadge,
  PriorityBadge,
  SelectControl,
} from "../components/Common";
import type { Lead } from "../core/types";
import { currency } from "../core/utils";

function LeadCard({
  lead,
  onOpen,
  onDrag,
  onDragEnd,
  draggable,
}: {
  lead: Lead;
  onOpen: () => void;
  onDrag: () => void;
  onDragEnd: () => void;
  draggable: boolean;
}) {
  const { data } = useCrm();
  const owner = data?.users.find((user) => user.id === lead.ownerId);
  const tagColors = Object.fromEntries(
    (data?.tags || []).map((tag) => [tag.name, tag.color]),
  );
  return (
    <article
      className={`lead-card${draggable ? "" : " read-only"}`}
      draggable={draggable}
      onDragStart={onDrag}
      onDragEnd={onDragEnd}
      onClick={onOpen}
    >
      <div className="lead-card-top">
        <OriginBadge origin={lead.origin} />
      </div>
      <div className="lead-card-title">
        <strong>{lead.name}</strong>
        <span>{lead.company}</span>
      </div>
      <div className="lead-card-tags">
        {lead.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            style={
              {
                "--tag-color": tagColors[tag] || "#ffd43b",
              } as React.CSSProperties
            }
          >
            {tag}
          </span>
        ))}
        {lead.tags.length > 2 && <span>+{lead.tags.length - 2}</span>}
      </div>
      <div className="lead-card-info">
        <span>
          <Phone size={13} /> {lead.phone}
        </span>
        <span>
          <Target size={13} /> Score {lead.score}
        </span>
      </div>
      <div className="lead-card-footer">
        <div>
          <PriorityBadge value={lead.priority} />
          <strong>{currency(lead.value)}</strong>
        </div>
        <Avatar user={owner} small />
      </div>
    </article>
  );
}

export function KanbanPage({
  onLead,
  onAdd,
  onEditStages,
}: {
  onLead: (id: string) => void;
  onAdd: () => void;
  onEditStages: () => void;
}) {
  const { data, visibleLeads, moveLead, can } = useCrm();
  const pipelines = (data?.pipelines || []).filter((item) => item.active);
  const [pipelineId, setPipelineId] = useState(pipelines[0]?.id || "");
  const stages = [...(data?.stages || [])]
    .filter((stage) => stage.pipelineId === pipelineId)
    .sort((a, b) => a.order - b.order);
  const users = data?.users || [];
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("Todos");
  const [priority, setPriority] = useState("Todas");
  const [origin, setOrigin] = useState("Todas");
  const [dragging, setDragging] = useState<string | null>(null);
  useEffect(() => {
    if (pipelineId && pipelines.some((item) => item.id === pipelineId)) return;
    setPipelineId(pipelines[0]?.id || "");
  }, [pipelineId, pipelines]);

  const origins = useMemo(
    () => Array.from(new Set(visibleLeads.map((lead) => lead.origin))).sort(),
    [visibleLeads],
  );
  const filtered = useMemo(
    () =>
      visibleLeads.filter((lead) => {
        const query = search.toLowerCase();
        return (
          lead.pipelineId === pipelineId &&
          (!query ||
            `${lead.name} ${lead.company} ${lead.phone}`
              .toLowerCase()
              .includes(query)) &&
          (owner === "Todos" || lead.ownerId === owner) &&
          (priority === "Todas" || lead.priority === priority) &&
          (origin === "Todas" || lead.origin === origin)
        );
      }),
    [visibleLeads, search, owner, priority, origin, pipelineId],
  );
  return (
    <div className="kanban-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-control">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar no funil"
            />
          </div>
          <SelectControl
            value={pipelineId}
            onChange={setPipelineId}
            options={pipelines.map((pipeline) => pipeline.id)}
            labels={Object.fromEntries(
              pipelines.map((pipeline) => [pipeline.id, pipeline.name]),
            )}
            icon={SlidersHorizontal}
          />
          <SelectControl
            value={owner}
            onChange={setOwner}
            options={["Todos", ...users.map((user) => user.id)]}
            labels={Object.fromEntries(
              users.map((user) => [user.id, user.name]),
            )}
            icon={Users}
          />
          <SelectControl
            value={priority}
            onChange={setPriority}
            options={["Todas", "Urgente", "Alta", "Média", "Baixa"]}
            icon={AlertCircle}
          />
          <SelectControl
            value={origin}
            onChange={setOrigin}
            options={["Todas", ...origins]}
            icon={Filter}
          />
        </div>
        <div className="toolbar-right">
          {can("pipeline.manage") && (
            <button className="secondary-button" onClick={onEditStages}>
              <SlidersHorizontal size={17} /> Editar funil
            </button>
          )}
          {can("leads.create") && (
            <button className="primary-button" onClick={onAdd}>
              <Plus size={17} /> Novo lead
            </button>
          )}
        </div>
      </div>
      {!pipelines.length ? (
        <div className="panel empty-board-state">
          Nenhum funil ativo. Crie ou ative um funil na Administração.
        </div>
      ) : (
        <div className="kanban-board">
          {stages.map((stage) => {
            const list = filtered.filter((lead) => lead.stageId === stage.id);
            return (
              <div
                className="kanban-column"
                key={stage.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={async () => {
                  if (dragging && can("pipeline.move"))
                    await moveLead(dragging, stage.id);
                  setDragging(null);
                }}
              >
                <div className="kanban-column-head">
                  <div>
                    <span
                      style={
                        { "--stage-color": stage.color } as React.CSSProperties
                      }
                    />
                    <strong>{stage.name}</strong>
                    <b>{list.length}</b>
                  </div>
                </div>
                <div className="kanban-column-value">
                  {currency(list.reduce((sum, item) => sum + item.value, 0))}
                </div>
                <div className="kanban-cards">
                  {list.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onOpen={() => onLead(lead.id)}
                      onDrag={() => setDragging(lead.id)}
                      onDragEnd={() => setDragging(null)}
                      draggable={can("pipeline.move")}
                    />
                  ))}
                  {can("leads.create") && (
                    <button className="add-column-card" onClick={onAdd}>
                      <Plus size={16} /> Adicionar lead
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
