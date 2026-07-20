import {
  AlertCircle,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  KanbanSquare,
  Plus,
  Search,
  Tag,
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
import { currency, downloadCsv } from "../core/utils";

const COLUMNS_KEY = "projem-flow-leads-columns-v1";
const CUSTOM_COLUMNS_KEY = "projem-flow-leads-custom-columns-v1";
type VisibleColumns = {
  contact: boolean;
  city: boolean;
  origin: boolean;
  stage: boolean;
  priority: boolean;
  owner: boolean;
  value: boolean;
};

const defaultColumns: VisibleColumns = {
  contact: true,
  city: true,
  origin: true,
  stage: true,
  priority: true,
  owner: true,
  value: true,
};

interface LeadsPageProps {
  onLead(id: string): void;
  onAdd(): void;
  initialSearch?: string;
  onSearchApplied?(): void;
}

export function LeadsPage({
  onLead,
  onAdd,
  initialSearch = "",
  onSearchApplied,
}: LeadsPageProps) {
  const { data, visibleLeads, can } = useCrm();
  const pipelines = data?.pipelines || [];
  const stages = [...(data?.stages || [])].sort((a, b) => a.order - b.order);
  const users = data?.users || [];
  const tags = data?.tags || [];
  const customFields = (data?.customFields || []).filter(
    (field) => field.active,
  );

  const [search, setSearch] = useState(initialSearch);
  const [pipeline, setPipeline] = useState("Todos");
  const [stage, setStage] = useState("Todas");
  const [owner, setOwner] = useState("Todos");
  const [origin, setOrigin] = useState("Todas");
  const [priority, setPriority] = useState("Todas");
  const [tag, setTag] = useState("Todas");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<VisibleColumns>(() => {
    try {
      const saved = localStorage.getItem(COLUMNS_KEY);
      return saved
        ? {
            ...defaultColumns,
            ...(JSON.parse(saved) as Partial<VisibleColumns>),
          }
        : { ...defaultColumns };
    } catch {
      return { ...defaultColumns };
    }
  });

  const [customVisible, setCustomVisible] = useState<Record<string, boolean>>(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem(CUSTOM_COLUMNS_KEY) || "{}",
        ) as Record<string, boolean>;
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    if (!initialSearch) return;
    setSearch(initialSearch);
    onSearchApplied?.();
  }, [initialSearch, onSearchApplied]);

  useEffect(() => {
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(visible));
  }, [visible]);

  useEffect(() => {
    setCustomVisible((old) => {
      const next = { ...old };
      customFields.forEach((field) => {
        if (next[field.id] === undefined) next[field.id] = field.showInTable;
      });
      return next;
    });
  }, [data?.customFields]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(customVisible));
  }, [customVisible]);

  const origins = useMemo(
    () => Array.from(new Set(visibleLeads.map((lead) => lead.origin))).sort(),
    [visibleLeads],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleLeads.filter((lead) => {
      const searchable =
        `${lead.name} ${lead.company} ${lead.phone} ${lead.email} ${lead.city}`.toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (pipeline === "Todos" || lead.pipelineId === pipeline) &&
        (stage === "Todas" || lead.stageId === stage) &&
        (owner === "Todos" || lead.ownerId === owner) &&
        (origin === "Todas" || lead.origin === origin) &&
        (priority === "Todas" || lead.priority === priority) &&
        (tag === "Todas" || lead.tags.includes(tag))
      );
    });
  }, [visibleLeads, search, pipeline, stage, owner, origin, priority, tag]);

  const hasFilters = Boolean(
    search ||
      pipeline !== "Todos" ||
      stage !== "Todas" ||
      owner !== "Todos" ||
      origin !== "Todas" ||
      priority !== "Todas" ||
      tag !== "Todas",
  );

  const clearFilters = () => {
    setSearch("");
    setPipeline("Todos");
    setStage("Todas");
    setOwner("Todos");
    setOrigin("Todas");
    setPriority("Todas");
    setTag("Todas");
  };

  const exportData = () =>
    downloadCsv(
      "leads-projem-flow.csv",
      filtered.map((lead) => ({
        Nome: lead.name,
        Empresa: lead.company,
        Telefone: lead.phone,
        Email: lead.email,
        Cidade: lead.city,
        Origem: lead.origin,
        Campanha: lead.campaign,
        Funil: pipelines.find((item) => item.id === lead.pipelineId)?.name,
        Etapa: stages.find((item) => item.id === lead.stageId)?.name,
        Responsável: users.find((item) => item.id === lead.ownerId)?.name,
        Prioridade: lead.priority,
        Temperatura: lead.temperature,
        Score: lead.score,
        Valor: lead.value,
        Tags: lead.tags.join("; "),
        ...Object.fromEntries(
          customFields.map((field) => [
            field.name,
            lead.customValues?.[field.key] ?? "",
          ]),
        ),
      })),
    );

  return (
    <div className="leads-page">
      <div className="toolbar leads-toolbar">
        <div className="toolbar-left">
          <div className="search-control wide">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, empresa, telefone ou e-mail"
            />
          </div>

          <SelectControl
            value={pipeline}
            onChange={(value) => {
              setPipeline(value);
              setStage("Todas");
            }}
            options={["Todos", ...pipelines.map((item) => item.id)]}
            labels={Object.fromEntries(
              pipelines.map((item) => [item.id, item.name]),
            )}
            icon={KanbanSquare}
          />
          <SelectControl
            value={stage}
            onChange={setStage}
            options={[
              "Todas",
              ...stages
                .filter(
                  (item) =>
                    pipeline === "Todos" || item.pipelineId === pipeline,
                )
                .map((item) => item.id),
            ]}
            labels={Object.fromEntries(
              stages.map((item) => [item.id, item.name]),
            )}
            icon={KanbanSquare}
          />
          <SelectControl
            value={owner}
            onChange={setOwner}
            options={["Todos", ...users.map((item) => item.id)]}
            labels={Object.fromEntries(
              users.map((item) => [item.id, item.name]),
            )}
            icon={Users}
          />
          <SelectControl
            value={origin}
            onChange={setOrigin}
            options={["Todas", ...origins]}
            icon={Filter}
          />
          <SelectControl
            value={priority}
            onChange={setPriority}
            options={["Todas", "Urgente", "Alta", "Média", "Baixa"]}
            icon={AlertCircle}
          />
          <SelectControl
            value={tag}
            onChange={setTag}
            options={["Todas", ...tags.map((item) => item.name)]}
            icon={Tag}
          />
        </div>

        <div className="toolbar-right">
          {hasFilters && (
            <button className="text-button" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
          <button
            className="secondary-button"
            onClick={exportData}
            disabled={!filtered.length}
          >
            <Download size={17} /> Exportar
          </button>

          <div className="column-picker-wrap">
            <button
              className="secondary-button"
              onClick={() => setColumnsOpen((value) => !value)}
            >
              <Columns3 size={17} /> Colunas
            </button>
            {columnsOpen && (
              <div className="popover column-picker">
                <div className="popover-head">
                  <strong>Colunas visíveis</strong>
                </div>
                {(
                  Object.entries(visible) as Array<
                    [keyof VisibleColumns, boolean]
                  >
                ).map(([key, value]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() =>
                        setVisible((old) => ({ ...old, [key]: !old[key] }))
                      }
                    />
                    {
                      (
                        {
                          contact: "Contato",
                          city: "Cidade",
                          origin: "Origem",
                          stage: "Etapa",
                          priority: "Prioridade",
                          owner: "Responsável",
                          value: "Valor",
                        } as Record<string, string>
                      )[key]
                    }
                  </label>
                ))}
                {customFields.map((field) => (
                  <label key={field.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(customVisible[field.id])}
                      onChange={() =>
                        setCustomVisible((old) => ({
                          ...old,
                          [field.id]: !old[field.id],
                        }))
                      }
                    />
                    {field.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {can("leads.create") && (
            <button className="primary-button" onClick={onAdd}>
              <Plus size={17} /> Novo lead
            </button>
          )}
        </div>
      </div>

      <section className="panel leads-table-panel">
        <div className="table-summary">
          <div>
            <strong>{filtered.length}</strong>
            <span>leads encontrados</span>
          </div>
          <span>
            {hasFilters
              ? "Filtros ativos"
              : "Base completa dentro do seu escopo"}
          </span>
        </div>

        <div className="leads-table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                {visible.contact && <th>Contato</th>}
                {visible.city && <th>Cidade</th>}
                {visible.origin && <th>Origem</th>}
                {visible.stage && <th>Etapa</th>}
                {visible.priority && <th>Prioridade</th>}
                {visible.owner && <th>Responsável</th>}
                {visible.value && <th>Valor</th>}
                {customFields
                  .filter((field) => customVisible[field.id])
                  .map((field) => (
                    <th key={field.id}>{field.name}</th>
                  ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const ownerUser = users.find(
                  (item) => item.id === lead.ownerId,
                );
                const stageItem = stages.find(
                  (item) => item.id === lead.stageId,
                );
                return (
                  <tr key={lead.id} onClick={() => onLead(lead.id)}>
                    <td>
                      <div className="lead-table-main">
                        <span className="lead-avatar">
                          {lead.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <strong>{lead.name}</strong>
                          <span>{lead.company || "Sem empresa"}</span>
                        </div>
                      </div>
                    </td>
                    {visible.contact && (
                      <td>
                        <strong>{lead.phone}</strong>
                        <span className="cell-subtitle">
                          {lead.email || "Sem e-mail"}
                        </span>
                      </td>
                    )}
                    {visible.city && <td>{lead.city}</td>}
                    {visible.origin && (
                      <td>
                        <OriginBadge origin={lead.origin} />
                      </td>
                    )}
                    {visible.stage && (
                      <td>
                        <span
                          className="stage-table"
                          style={
                            {
                              "--stage-color": stageItem?.color || "#ddd",
                            } as React.CSSProperties
                          }
                        >
                          <i />
                          {stageItem?.name}
                        </span>
                      </td>
                    )}
                    {visible.priority && (
                      <td>
                        <PriorityBadge value={lead.priority} />
                      </td>
                    )}
                    {visible.owner && (
                      <td>
                        <div className="owner-cell">
                          <Avatar user={ownerUser} small />
                          <span>{ownerUser?.name}</span>
                        </div>
                      </td>
                    )}
                    {visible.value && (
                      <td>
                        <strong>{currency(lead.value)}</strong>
                      </td>
                    )}
                    {customFields
                      .filter((field) => customVisible[field.id])
                      .map((field) => {
                        const value = lead.customValues?.[field.key];
                        return (
                          <td key={field.id}>
                            {typeof value === "boolean"
                              ? value
                                ? "Sim"
                                : "Não"
                              : String(value ?? "—")}
                          </td>
                        );
                      })}
                    <td>
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty-table">
              Nenhum lead corresponde aos filtros atuais.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
