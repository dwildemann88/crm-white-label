import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Gauge,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Tag,
  UserCog,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useCrm } from "../app/CrmContext";
import type { Lead, TagDefinition } from "../core/types";
import { currency, formatDateTime, uid } from "../core/utils";
import { Avatar, OriginBadge, PriorityBadge, TagSelector } from "./Common";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="info-row">
      <span>
        <Icon size={16} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value || "Não informado"}</strong>
      </div>
    </div>
  );
}

export function LeadDrawer({
  lead,
  onClose,
  onEdit,
  onTask,
  onWhatsApp,
}: {
  lead: Lead;
  onClose(): void;
  onEdit(): void;
  onTask(): void;
  onWhatsApp(): void;
}) {
  const { data, addLeadNote, saveLead, saveTag, can } = useCrm();
  const [note, setNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState("#ffd43b");

  const owner = data?.users.find((item) => item.id === lead.ownerId);
  const stage = data?.stages.find((item) => item.id === lead.stageId);
  const allTags = (data?.tags || []).map((item) => item.name);
  const tagColors = Object.fromEntries(
    (data?.tags || []).map((item) => [item.name, item.color]),
  );
  const customFields = (data?.customFields || []).filter(
    (field) => field.active && lead.customValues?.[field.key] !== undefined,
  );
  const history = useMemo(
    () =>
      (data?.histories || [])
        .filter((item) => item.leadId === lead.id)
        .slice(0, 8),
    [data?.histories, lead.id],
  );
const existingConversation =
  data?.conversations.find(
    (conversation) =>
      conversation.leadId === lead.id &&
      conversation.channel === "whatsapp",
  );
  const toggleTags = async (tags: string[]) => saveLead({ ...lead, tags });

  const createTag = async () => {
    const name = newTag.trim();
    if (!name || !data?.session) return;
    const tag: TagDefinition = {
      id: uid("tag"),
      organizationId: data.session.organizationId,
      name,
      color: newTagColor,
    };
    await saveTag(tag);
    await toggleTags(Array.from(new Set([...lead.tags, name])));
    setNewTag("");
  };

  return (
    <>
      <button
        className="drawer-overlay"
        onClick={onClose}
        aria-label="Fechar detalhes"
      />
      <aside className="lead-drawer">
        <header>
          <div className="lead-drawer-title">
            <span className="lead-temperature">{lead.temperature}</span>
            <h2>{lead.name}</h2>
            <p>{lead.company || "Sem empresa informada"}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={19} />
          </button>
        </header>

        <div className="drawer-actions">
  {can("messages.manage") && (
    <button
      className="primary-button"
      onClick={onWhatsApp}
      disabled={!lead.phone.trim()}
      title={
        lead.phone.trim()
          ? undefined
          : "Cadastre um telefone antes de iniciar o WhatsApp"
      }
    >
      <MessageCircle size={17} />
      {existingConversation
        ? "Abrir WhatsApp"
        : "Iniciar WhatsApp"}
    </button>
  )}

  {can("tasks.manage") && (
    <button
      className="secondary-button"
      onClick={onTask}
    >
      <CalendarDays size={17} />
      Criar tarefa
    </button>
  )}

  {can("leads.write") && (
    <button
      className="secondary-button"
      onClick={onEdit}
    >
      <Edit3 size={17} />
      Editar lead
    </button>
  )}
</div>

        <div className="drawer-body">
          <section className="drawer-summary">
            <div>
              <small>Valor estimado</small>
              <strong>{currency(lead.value)}</strong>
            </div>
            <div>
              <small>Score</small>
              <strong>{lead.score}/100</strong>
            </div>
            <div>
              <small>Prioridade</small>
              <PriorityBadge value={lead.priority} />
            </div>
          </section>

          <section className="drawer-section">
            <h3>Responsável e etapa</h3>
            <div className="owner-row">
              <Avatar user={owner} />
              <div>
                <strong>{owner?.name}</strong>
                <span>{owner?.roleLabel}</span>
              </div>
              <span
                className="stage-pill"
                style={
                  {
                    "--stage-color": stage?.color || "#ffd43b",
                  } as React.CSSProperties
                }
              >
                {stage?.name}
              </span>
            </div>
          </section>

          <section className="drawer-section info-grid">
            <InfoRow icon={Phone} label="Telefone" value={lead.phone} />
            <InfoRow icon={Mail} label="E-mail" value={lead.email} />
            <InfoRow icon={MapPin} label="Cidade" value={lead.city} />
            <InfoRow
              icon={BriefcaseBusiness}
              label="Empresa"
              value={lead.company}
            />
            <InfoRow icon={Gauge} label="Campanha" value={lead.campaign} />
            <InfoRow
              icon={Clock3}
              label="Atualização"
              value={formatDateTime(lead.updatedAt)}
            />
          </section>

          {customFields.length > 0 && (
            <section className="drawer-section">
              <h3>Campos personalizados</h3>
              <div className="custom-value-list">
                {customFields.map((field) => {
                  const rawValue = lead.customValues?.[field.key];
                  const value =
                    typeof rawValue === "boolean"
                      ? rawValue
                        ? "Sim"
                        : "Não"
                      : String(rawValue ?? "Não informado");
                  return (
                    <div key={field.id}>
                      <small>{field.name}</small>
                      <strong>{value}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="drawer-section">
            <h3>Origem e etiquetas</h3>
            <OriginBadge origin={lead.origin} />
            <TagSelector
              available={allTags}
              value={lead.tags}
              onChange={toggleTags}
              colors={tagColors}
              disabled={!can("leads.write")}
            />
            {can("tags.manage") && (
              <div className="quick-tag-form">
                <input
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  placeholder="Nova etiqueta"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(event) => setNewTagColor(event.target.value)}
                  aria-label="Cor da etiqueta"
                />
                <button
                  className="secondary-button"
                  disabled={!newTag.trim()}
                  onClick={() => void createTag()}
                >
                  <Plus size={15} /> Criar
                </button>
              </div>
            )}
          </section>

          <section className="drawer-section">
            <h3>Observações</h3>
            <div className="notes-box">
              {lead.notes ? (
                lead.notes
                  .split("\n")
                  .map((line, index) => <p key={index}>{line || <br />}</p>)
              ) : (
                <p className="muted">Nenhuma observação registrada.</p>
              )}
            </div>
            {can("leads.write") && (
              <>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Adicionar observação ao histórico"
                />
                <button
                  className="secondary-button full"
                  disabled={!note.trim()}
                  onClick={async () => {
                    await addLeadNote(lead.id, note);
                    setNote("");
                  }}
                >
                  <Check size={16} /> Registrar observação
                </button>
              </>
            )}
          </section>

          <section className="drawer-section timeline">
            <h3>Histórico recente</h3>
            {history.length ? (
              history.map((item) => (
                <div key={item.id}>
                  <span>
                    
                    {item.type === "message" ? (
                      <MessageCircle size={14} />
                      
                    ) : item.type === "assigned" ? (
                      <UserCog size={14} />
                    ) : (
                      <Tag size={14} />
                    )}
                  </span>
                  <p>
                    <strong>{item.description}</strong>
                    <small>{formatDateTime(item.createdAt)}</small>
                  </p>
                </div>
              ))
            ) : (
              <p className="muted">Nenhum evento registrado.</p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
