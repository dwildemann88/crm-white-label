import { CalendarDays, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCrm } from "../app/CrmContext";
import type {
  Lead,
  LeadInput,
  Task,
  TaskInput,
  UserInput,
} from "../core/types";
import { localDateKey } from "../core/utils";
import { ModalShell, TagSelector } from "./Common";

export function LeadModal({
  lead,
  onClose,
}: {
  lead?: Lead | null;
  onClose(): void;
}) {
  const { data, currentUser, saveLead, can } = useCrm();
  const pipelines = (data?.pipelines || []).filter((item) => item.active);
  const allStages = [...(data?.stages || [])].sort((a, b) => a.order - b.order);
  const users = (data?.users || []).filter(
    (user) =>
      user.active && ["super_admin", "sales", "sdr"].includes(user.role),
  );
  const customFields = (data?.customFields || []).filter(
    (field) => field.active,
  );
  const tags = (data?.tags || []).map((tag) => tag.name);
  const tagColors = Object.fromEntries(
    (data?.tags || []).map((tag) => [tag.name, tag.color]),
  );

  const [form, setForm] = useState<LeadInput>(() =>
    lead
      ? { ...lead }
      : {
          pipelineId: pipelines[0]?.id || "",
          stageId:
            allStages.find((stage) => stage.pipelineId === pipelines[0]?.id)
              ?.id || "",
          name: "",
          company: "",
          phone: "",
          email: "",
          city: "Santa Rosa/RS",
          origin: "Entrada manual",
          campaign: "Cadastro interno",
          priority: "Média",
          temperature: "Morno",
          score: 60,
          ownerId: currentUser?.id || users[0]?.id || "",
          tags: [],
          value: 0,
          notes: "",
          customValues: {},
        },
  );

  const stages = allStages.filter(
    (stage) => stage.pipelineId === form.pipelineId,
  );

  useEffect(() => {
    const stageIsValid = stages.some((stage) => stage.id === form.stageId);
    if (!stageIsValid && stages[0]) {
      setForm((old) => ({ ...old, stageId: stages[0].id }));
    }
  }, [form.stageId, stages]);

  const change = <K extends keyof LeadInput>(key: K, value: LeadInput[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  const eligibleUsers = users.filter(
    (user) =>
      user.role === "super_admin" || user.pipelineIds.includes(form.pipelineId),
  );
  const requiredCustomFieldsFilled = customFields
    .filter((field) => field.required)
    .every((field) => {
      const value = form.customValues?.[field.key];
      return value !== undefined && value !== null && value !== "";
    });
  const valid = Boolean(
    form.name.trim() &&
      form.phone.trim() &&
      form.ownerId &&
      form.stageId &&
      requiredCustomFieldsFilled,
  );
  const changeCustomValue = (key: string, value: string | number | boolean) =>
    setForm((old) => ({
      ...old,
      customValues: { ...(old.customValues || {}), [key]: value },
    }));

  return (
    <ModalShell
      title={lead ? "Editar lead" : "Cadastrar lead"}
      subtitle="Campos organizados para serem enviados ao backend sem alterar a interface."
      onClose={onClose}
      wide
    >
      <form
        className="modal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!valid) return;
          await saveLead(form);
          onClose();
        }}
      >
        <div className="form-grid">
          <label>
            Nome *
            <input
              value={form.name}
              onChange={(event) => change("name", event.target.value)}
              autoFocus
            />
          </label>
          <label>
            Empresa
            <input
              value={form.company}
              onChange={(event) => change("company", event.target.value)}
            />
          </label>
          <label>
            Telefone *
            <input
              value={form.phone}
              onChange={(event) => change("phone", event.target.value)}
              placeholder="(55) 9 9999-9999"
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(event) => change("email", event.target.value)}
            />
          </label>
          <label>
            Cidade
            <input
              value={form.city}
              onChange={(event) => change("city", event.target.value)}
            />
          </label>
          <label>
            Origem
            <select
              value={form.origin}
              onChange={(event) => change("origin", event.target.value)}
            >
              <option>Meta Ads</option>
              <option>Google Ads</option>
              <option>Landing Page</option>
              <option>Indicação</option>
              <option>Evento</option>
              <option>Entrada manual</option>
            </select>
          </label>
          <label>
            Campanha
            <input
              value={form.campaign}
              onChange={(event) => change("campaign", event.target.value)}
            />
          </label>
          <label>
            Funil
            <select
              value={form.pipelineId}
              onChange={(event) => {
                const pipelineId = event.target.value;
                const firstStage = allStages.find(
                  (stage) => stage.pipelineId === pipelineId,
                );
                const eligible = users.filter(
                  (user) =>
                    user.role === "super_admin" ||
                    user.pipelineIds.includes(pipelineId),
                );
                setForm((old) => ({
                  ...old,
                  pipelineId,
                  stageId: firstStage?.id || "",
                  ownerId: eligible.some((user) => user.id === old.ownerId)
                    ? old.ownerId
                    : eligible[0]?.id || "",
                }));
              }}
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Etapa
            <select
              value={form.stageId}
              onChange={(event) => change("stageId", event.target.value)}
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select
              value={form.ownerId}
              disabled={!can("leads.assign")}
              onChange={(event) => change("ownerId", event.target.value)}
            >
              {eligibleUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.roleLabel}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <select
              value={form.priority}
              onChange={(event) =>
                change("priority", event.target.value as LeadInput["priority"])
              }
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
              <option>Urgente</option>
            </select>
          </label>
          <label>
            Temperatura
            <select
              value={form.temperature}
              onChange={(event) =>
                change(
                  "temperature",
                  event.target.value as LeadInput["temperature"],
                )
              }
            >
              <option>Frio</option>
              <option>Morno</option>
              <option>Quente</option>
            </select>
          </label>
          <label>
            Score
            <input
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={(event) =>
                change(
                  "score",
                  Math.min(100, Math.max(0, Number(event.target.value))),
                )
              }
            />
          </label>
          <label>
            Valor estimado
            <input
              type="number"
              min="0"
              value={form.value}
              onChange={(event) =>
                change("value", Math.max(0, Number(event.target.value)))
              }
            />
          </label>
        </div>

        {customFields.length > 0 && (
          <div className="custom-values-section">
            <strong>Campos personalizados</strong>
            <div className="form-grid">
              {customFields.map((field) => {
                const value = form.customValues?.[field.key];
                if (field.type === "select") {
                  return (
                    <label key={field.id}>
                      {field.name}
                      {field.required ? " *" : ""}
                      <select
                        value={String(value ?? "")}
                        onChange={(event) =>
                          changeCustomValue(field.key, event.target.value)
                        }
                      >
                        <option value="">Selecione</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                if (field.type === "boolean") {
                  return (
                    <label key={field.id}>
                      {field.name}
                      {field.required ? " *" : ""}
                      <select
                        value={
                          value === true
                            ? "true"
                            : value === false
                              ? "false"
                              : ""
                        }
                        onChange={(event) =>
                          changeCustomValue(
                            field.key,
                            event.target.value === ""
                              ? ""
                              : event.target.value === "true",
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    </label>
                  );
                }
                return (
                  <label key={field.id}>
                    {field.name}
                    {field.required ? " *" : ""}
                    <input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={value === undefined ? "" : String(value)}
                      onChange={(event) =>
                        changeCustomValue(
                          field.key,
                          field.type === "number"
                            ? event.target.value === ""
                              ? ""
                              : Number(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <label className="full-field">
          Etiquetas
          <TagSelector
            available={tags}
            value={form.tags}
            onChange={(value) => change("tags", value)}
            colors={tagColors}
          />
        </label>

        <label className="full-field">
          Observações
          <textarea
            value={form.notes}
            onChange={(event) => change("notes", event.target.value)}
            placeholder="Contexto do lead"
          />
        </label>

        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" disabled={!valid}>
            <Save size={17} /> Salvar lead
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function TaskModal({
  task,
  initialDate,
  initialLeadId,
  onClose,
}: {
  task?: Task;
  initialDate?: string;
  initialLeadId?: string;
  onClose(): void;
}) {
  const { data, currentUser, saveTask, deleteTask, can } = useCrm();
  const users = (data?.users || []).filter(
    (item) => item.active && item.role !== "manager",
  );
  const leads = data?.leads || [];
  const [form, setForm] = useState<TaskInput>(() =>
    task
      ? { ...task }
      : {
          title: "",
          description: "",
          date: initialDate || localDateKey(),
          time: "09:00",
          type: "Ligação",
          ownerId: currentUser?.id || users[0]?.id || "",
          leadId: initialLeadId || null,
          priority: "Média",
          reminderMinutes: 15,
        },
  );

  const change = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setForm((old) => ({ ...old, [key]: value }));

  return (
    <ModalShell
      title={task ? "Editar tarefa" : "Adicionar tarefa"}
      subtitle="Vincule um compromisso a um responsável e, opcionalmente, a um lead."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.title.trim()) return;
          await saveTask(form);
          onClose();
        }}
      >
        <label className="full-field">
          Título *
          <input
            value={form.title}
            onChange={(event) => change("title", event.target.value)}
            autoFocus
          />
        </label>
        <label className="full-field">
          Descrição
          <textarea
            value={form.description}
            onChange={(event) => change("description", event.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Data
            <input
              type="date"
              value={form.date}
              onChange={(event) => change("date", event.target.value)}
            />
          </label>
          <label>
            Horário
            <input
              type="time"
              value={form.time}
              onChange={(event) => change("time", event.target.value)}
            />
          </label>
          <label>
            Tipo
            <select
              value={form.type}
              onChange={(event) => change("type", event.target.value)}
            >
              <option>Ligação</option>
              <option>WhatsApp</option>
              <option>Visita</option>
              <option>Reunião</option>
              <option>Follow-up</option>
              <option>Tarefa interna</option>
            </select>
          </label>
          <label>
            Prioridade
            <select
              value={form.priority}
              onChange={(event) =>
                change("priority", event.target.value as TaskInput["priority"])
              }
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
              <option>Urgente</option>
            </select>
          </label>
          <label>
            Responsável
            <select
              value={form.ownerId}
              disabled={!can("leads.assign")}
              onChange={(event) => change("ownerId", event.target.value)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Lembrete
            <select
              value={form.reminderMinutes}
              onChange={(event) =>
                change("reminderMinutes", Number(event.target.value))
              }
            >
              <option value="0">Sem lembrete</option>
              <option value="5">5 minutos antes</option>
              <option value="15">15 minutos antes</option>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
              <option value="1440">1 dia antes</option>
            </select>
          </label>
        </div>

        <label className="full-field">
          Vincular a um lead
          <select
            value={form.leadId || ""}
            onChange={(event) => change("leadId", event.target.value || null)}
          >
            <option value="">Sem vínculo</option>
            {leads.map((leadItem) => (
              <option key={leadItem.id} value={leadItem.id}>
                {leadItem.name} — {leadItem.company}
              </option>
            ))}
          </select>
        </label>

        <div className="modal-footer modal-footer-split">
          {task ? (
            <button
              type="button"
              className="danger-button"
              onClick={async () => {
                if (!window.confirm("Excluir esta tarefa?")) return;
                await deleteTask(task.id);
                onClose();
              }}
            >
              <Trash2 size={16} /> Excluir
            </button>
          ) : (
            <span />
          )}
          <div>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="primary-button" disabled={!form.title.trim()}>
              <CalendarDays size={17} />{" "}
              {task ? "Salvar tarefa" : "Adicionar tarefa"}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export function UserModal({
  userId,
  onClose,
}: {
  userId?: string;
  onClose(): void;
}) {
  const { data, saveUser } = useCrm();
  const existing = data?.users.find((item) => item.id === userId);
  const pipelines = data?.pipelines || [];
  const [form, setForm] = useState<UserInput>(() =>
    existing
      ? { ...existing }
      : {
          name: "",
          email: "",
          role: "sales",
          roleLabel: "Comercial",
          active: true,
          color: "#63e6be",
          pipelineIds: pipelines.map((item) => item.id),
          demoPassword: "projem123",
        },
  );

  const change = <K extends keyof UserInput>(key: K, value: UserInput[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  const roleLabels: Record<string, string> = {
    super_admin: "Administrador superior",
    manager: "Gerente",
    sales: "Comercial",
    sdr: "SDR",
  };

  return (
    <ModalShell
      title={existing ? "Editar usuário" : "Criar usuário"}
      subtitle="No backend real, o acesso local será substituído por convite seguro."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.name.trim() || !form.email.trim()) return;
          await saveUser({ ...form, roleLabel: roleLabels[form.role] });
          onClose();
        }}
      >
        <div className="form-grid">
          <label>
            Nome *
            <input
              value={form.name}
              onChange={(event) => change("name", event.target.value)}
              autoFocus
            />
          </label>
          <label>
            E-mail *
            <input
              type="email"
              value={form.email}
              onChange={(event) => change("email", event.target.value)}
            />
          </label>
          <label>
            Perfil
            <select
              value={form.role}
              onChange={(event) =>
                change("role", event.target.value as UserInput["role"])
              }
            >
              <option value="super_admin">Administrador superior</option>
              <option value="manager">Gerente — leitura geral</option>
              <option value="sales">Comercial</option>
              <option value="sdr">SDR</option>
            </select>
          </label>
          <label>
            Cor do avatar
            <input
              type="color"
              value={form.color}
              onChange={(event) => change("color", event.target.value)}
            />
          </label>
          <label>
            Acesso local
            <input
              value={form.demoPassword || ""}
              onChange={(event) => change("demoPassword", event.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={form.active ? "active" : "inactive"}
              onChange={(event) =>
                change("active", event.target.value === "active")
              }
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>
        </div>

        <label className="full-field">
          Funis autorizados
          <div className="module-selector">
            {pipelines.map((pipeline) => (
              <button
                type="button"
                key={pipeline.id}
                className={
                  form.pipelineIds.includes(pipeline.id) ? "active" : ""
                }
                onClick={() =>
                  change(
                    "pipelineIds",
                    form.pipelineIds.includes(pipeline.id)
                      ? form.pipelineIds.filter((id) => id !== pipeline.id)
                      : [...form.pipelineIds, pipeline.id],
                  )
                }
              >
                {pipeline.name}
              </button>
            ))}
          </div>
        </label>

        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="primary-button">
            <Plus size={17} /> Salvar usuário
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
