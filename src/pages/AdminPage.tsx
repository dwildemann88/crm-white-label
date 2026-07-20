import {
  ArrowDown,
  ArrowUp,
  LockKeyhole,
  Plus,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCrm } from "../app/CrmContext";
import { Avatar, PanelHead, RoleBadge } from "../components/Common";
import type {
  Branding,
  CustomFieldDefinition,
  Pipeline,
  PipelineStage,
  TagDefinition,
} from "../core/types";
import { uid } from "../core/utils";

export function AdminPage({ onUser }: { onUser(id?: string): void }) {
  const {
    data,
    toggleUser,
    savePipeline,
    deletePipeline,
    saveStage,
    deleteStage,
    saveCustomField,
    deleteCustomField,
    saveTag,
    deleteTag,
    updateBranding,
    resetDemo,
  } = useCrm();

  const users = data?.users || [];
  const sourcePipelines = data?.pipelines || [];
  const [selectedPipelineId, setSelectedPipelineId] = useState(
    sourcePipelines[0]?.id || "",
  );
  const selectedPipeline = sourcePipelines.find(
    (item) => item.id === selectedPipelineId,
  );
  const sourceStages = [...(data?.stages || [])]
    .filter((stage) => stage.pipelineId === selectedPipelineId)
    .sort((a, b) => a.order - b.order);
  const sourceFields = data?.customFields || [];
  const tags = data?.tags || [];
  const organization = data?.organizations.find(
    (item) => item.id === data.session?.organizationId,
  );

  const [pipelineName, setPipelineName] = useState(
    selectedPipeline?.name || "",
  );
  const [pipelineDescription, setPipelineDescription] = useState(
    selectedPipeline?.description || "",
  );
  const [pipelineActive, setPipelineActive] = useState(
    selectedPipeline?.active ?? true,
  );
  const [stages, setStages] = useState(sourceStages);
  const [fields, setFields] = useState<CustomFieldDefinition[]>(sourceFields);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState("#ffd43b");
  const [branding, setBranding] = useState<Branding>(
    organization?.branding || {
      productName: "PROJEM FLOW",
      companyName: "",
      logoUrl: "",
      primaryColor: "#ffd43b",
      secondaryColor: "#0e0f12",
      backgroundColor: "#09090a",
      loginHeadline: "",
    },
  );

  useEffect(() => {
    if (
      selectedPipelineId &&
      sourcePipelines.some((item) => item.id === selectedPipelineId)
    )
      return;
    setSelectedPipelineId(sourcePipelines[0]?.id || "");
  }, [selectedPipelineId, sourcePipelines]);
  useEffect(() => {
    setPipelineName(selectedPipeline?.name || "");
    setPipelineDescription(selectedPipeline?.description || "");
    setPipelineActive(selectedPipeline?.active ?? true);
  }, [selectedPipeline]);
  useEffect(() => setStages(sourceStages), [data?.stages, selectedPipelineId]);
  useEffect(() => setFields(sourceFields), [data?.customFields]);
  useEffect(() => {
    if (organization) setBranding(organization.branding);
  }, [organization]);

  const addPipeline = async () => {
    if (!data?.session) return;
    const pipeline: Pipeline = {
      id: uid("pipe"),
      organizationId: data.session.organizationId,
      name: `Novo funil ${sourcePipelines.length + 1}`,
      description: "Fluxo comercial personalizável.",
      active: true,
    };
    await savePipeline(pipeline);
    setSelectedPipelineId(pipeline.id);
  };

  const persistPipeline = async () => {
    if (!selectedPipeline) return;
    await savePipeline({
      ...selectedPipeline,
      name: pipelineName,
      description: pipelineDescription,
      active: pipelineActive,
    });
  };

  const removePipeline = async () => {
    if (!selectedPipeline) return;
    const confirmed = window.confirm(
      `Excluir o funil “${selectedPipeline.name}”? Essa ação só será aceita se não houver leads ou integrações vinculados.`,
    );
    if (!confirmed) return;
    await deletePipeline(selectedPipeline.id);
  };

  const addStage = () => {
    if (!data?.session || !selectedPipelineId) return;
    setStages((old) => [
      ...old,
      {
        id: uid("stage"),
        organizationId: data.session!.organizationId,
        pipelineId: selectedPipelineId,
        name: "Nova etapa",
        color: "#74c0fc",
        order: old.length + 1,
        kind: "open",
      },
    ]);
  };

  const changeStage = (id: string, patch: Partial<PipelineStage>) => {
    setStages((old) =>
      old.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)),
    );
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    setStages(
      next.map((stage, stageIndex) => ({ ...stage, order: stageIndex + 1 })),
    );
  };

  const persistStages = async () => {
    for (const stage of stages.map((item, index) => ({
      ...item,
      order: index + 1,
    }))) {
      await saveStage(stage);
    }
  };

  const addField = () => {
    if (!data?.session) return;
    setFields((old) => [
      ...old,
      {
        id: uid("field"),
        organizationId: data.session!.organizationId,
        name: "Novo campo",
        key: `campo_${old.length + 1}`,
        type: "text",
        options: [],
        required: false,
        active: true,
        showInTable: false,
      },
    ]);
  };

  const changeField = (id: string, patch: Partial<CustomFieldDefinition>) => {
    setFields((old) =>
      old.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  };

  const persistFields = async () => {
    for (const field of fields) await saveCustomField(field);
  };

  const addTag = async () => {
    if (!newTag.trim() || !data?.session) return;
    const tag: TagDefinition = {
      id: uid("tag"),
      organizationId: data.session.organizationId,
      name: newTag.trim(),
      color: newTagColor,
    };
    await saveTag(tag);
    setNewTag("");
  };

  return (
    <div className="admin-grid">
      <section className="panel users-panel full-span">
        <PanelHead
          title="Usuários e níveis de acesso"
          subtitle="Cadastro, status, perfil e escopo preparados para autenticação real"
          action={
            <button className="primary-button" onClick={() => onUser()}>
              <UserPlus size={17} /> Novo usuário
            </button>
          }
        />
        <div className="users-table-wrap">
          <table className="leads-table admin-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Nível</th>
                <th>Escopo</th>
                <th>Funis</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="owner-cell">
                      <Avatar user={user} />
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={user.role} label={user.roleLabel} />
                  </td>
                  <td>
                    {user.role === "super_admin" &&
                      "Todos os dados e configurações"}
                    {user.role === "manager" &&
                      "Todos os fluxos, somente leitura"}
                    {user.role === "sales" && "Leads atribuídos ao usuário"}
                    {user.role === "sdr" &&
                      "Entrada, qualificação e leads atribuídos"}
                  </td>
                  <td>{user.pipelineIds.length} autorizado(s)</td>
                  <td>
                    <button
                      className={`status-toggle ${user.active ? "active" : ""}`}
                      onClick={() => toggleUser(user.id)}
                    >
                      <span />
                      {user.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="secondary-button compact"
                      onClick={() => onUser(user.id)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel customization-panel full-span">
        <PanelHead
          title="Funis comerciais"
          subtitle="Crie operações separadas e escolha qual fluxo deseja configurar."
          action={
            <button
              className="secondary-button"
              onClick={() => void addPipeline()}
            >
              <Plus size={16} /> Novo funil
            </button>
          }
        />
        <div className="pipeline-manager">
          <label>
            Funil selecionado
            <select
              value={selectedPipelineId}
              onChange={(event) => setSelectedPipelineId(event.target.value)}
            >
              {sourcePipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nome
            <input
              value={pipelineName}
              onChange={(event) => setPipelineName(event.target.value)}
              disabled={!selectedPipeline}
            />
          </label>
          <label className="pipeline-description-field">
            Descrição
            <input
              value={pipelineDescription}
              onChange={(event) => setPipelineDescription(event.target.value)}
              disabled={!selectedPipeline}
            />
          </label>
          <label className="check-label pipeline-active-control">
            <input
              type="checkbox"
              checked={pipelineActive}
              onChange={(event) => setPipelineActive(event.target.checked)}
              disabled={!selectedPipeline}
            />
            Funil ativo
          </label>
          <div className="pipeline-manager-actions">
            <button
              className="secondary-button"
              onClick={() => void removePipeline()}
              disabled={!selectedPipeline || sourcePipelines.length <= 1}
            >
              <Trash2 size={16} /> Excluir
            </button>
            <button
              className="primary-button"
              onClick={() => void persistPipeline()}
              disabled={!selectedPipeline || !pipelineName.trim()}
            >
              <Save size={16} /> Salvar funil
            </button>
          </div>
        </div>
      </section>

      <section className="panel customization-panel full-span">
        <PanelHead
          title="Etapas do funil"
          subtitle={
            selectedPipeline
              ? `Configurando: ${selectedPipeline.name}. Edite e salve o conjunto.`
              : "Crie ou selecione um funil para configurar as etapas."
          }
          action={
            <div className="panel-actions">
              <button
                className="secondary-button"
                onClick={addStage}
                disabled={!selectedPipelineId}
              >
                <Plus size={16} /> Etapa
              </button>
              <button
                className="primary-button"
                onClick={() => void persistStages()}
                disabled={!selectedPipelineId || stages.length === 0}
              >
                <Save size={16} /> Salvar funil
              </button>
            </div>
          }
        />
        <div className="stage-editor inline">
          {stages.map((stage, index) => (
            <div key={stage.id}>
              <div className="stage-order-actions">
                <button
                  disabled={index === 0}
                  onClick={() => moveStage(index, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  disabled={index === stages.length - 1}
                  onClick={() => moveStage(index, 1)}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <input
                type="color"
                value={stage.color}
                onChange={(event) =>
                  changeStage(stage.id, { color: event.target.value })
                }
              />
              <input
                value={stage.name}
                onChange={(event) =>
                  changeStage(stage.id, { name: event.target.value })
                }
              />
              <select
                value={stage.kind}
                onChange={(event) =>
                  changeStage(stage.id, {
                    kind: event.target.value as PipelineStage["kind"],
                  })
                }
              >
                <option value="open">Aberta</option>
                <option value="won">Ganha</option>
                <option value="lost">Perdida</option>
              </select>
              <button
                className="icon-danger"
                onClick={() => {
                  if (
                    stage.id.startsWith("stage_") &&
                    sourceStages.some((item) => item.id === stage.id)
                  )
                    void deleteStage(stage.id);
                  else
                    setStages((old) =>
                      old.filter((item) => item.id !== stage.id),
                    );
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel customization-panel full-span">
        <PanelHead
          title="Campos personalizados do lead"
          subtitle="Crie colunas e dados específicos sem alterar o código das telas."
          action={
            <div className="panel-actions">
              <button className="secondary-button" onClick={addField}>
                <Plus size={16} /> Campo
              </button>
              <button
                className="primary-button"
                onClick={() => void persistFields()}
              >
                <Save size={16} /> Salvar campos
              </button>
            </div>
          }
        />
        <div className="custom-field-editor">
          {fields.map((field) => (
            <div key={field.id}>
              <input
                value={field.name}
                onChange={(event) =>
                  changeField(field.id, { name: event.target.value })
                }
                placeholder="Nome do campo"
              />
              <input
                value={field.key}
                onChange={(event) =>
                  changeField(field.id, {
                    key: event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "_"),
                  })
                }
                placeholder="identificador"
              />
              <select
                value={field.type}
                onChange={(event) =>
                  changeField(field.id, {
                    type: event.target.value as CustomFieldDefinition["type"],
                    options:
                      event.target.value === "select" ? field.options : [],
                  })
                }
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Data</option>
                <option value="select">Seleção</option>
                <option value="boolean">Sim/Não</option>
              </select>
              <input
                value={field.options.join(", ")}
                disabled={field.type !== "select"}
                onChange={(event) =>
                  changeField(field.id, {
                    options: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={
                  field.type === "select" ? "Opção 1, Opção 2" : "Sem opções"
                }
              />
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) =>
                    changeField(field.id, { required: event.target.checked })
                  }
                />
                Obrigatório
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={field.showInTable}
                  onChange={(event) =>
                    changeField(field.id, { showInTable: event.target.checked })
                  }
                />
                Na tabela
              </label>
              <button
                className="icon-danger"
                onClick={async () => {
                  if (sourceFields.some((item) => item.id === field.id))
                    await deleteCustomField(field.id);
                  else
                    setFields((old) =>
                      old.filter((item) => item.id !== field.id),
                    );
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!fields.length && (
            <p className="muted padded">
              Nenhum campo personalizado configurado.
            </p>
          )}
        </div>
      </section>

      <section className="panel customization-panel">
        <PanelHead
          title="Etiquetas"
          subtitle="Usuários operacionais podem criar; exclusão global fica com o administrador."
        />
        <div className="tag-cloud editable">
          {tags.map((tag) => (
            <span
              key={tag.id}
              style={{ "--tag-color": tag.color } as React.CSSProperties}
            >
              <i />
              {tag.name}
              <button onClick={() => deleteTag(tag.id)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="inline-add tag-add">
          <input
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
            placeholder="Nova etiqueta"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(event) => setNewTagColor(event.target.value)}
          />
          <button onClick={() => void addTag()}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </section>

      <section className="panel branding-panel">
        <PanelHead
          title="Identidade visual"
          subtitle="Personalização controlada sem alteração de código"
        />
        <div
          className="branding-preview"
          style={
            {
              "--preview-primary": branding.primaryColor,
              "--preview-secondary": branding.secondaryColor,
            } as React.CSSProperties
          }
        >
          <span>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" />
            ) : (
              <strong>{branding.productName.slice(0, 1)}</strong>
            )}
          </span>
          <div>
            <b>{branding.productName}</b>
            <small>{branding.companyName}</small>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Nome do produto
            <input
              value={branding.productName}
              onChange={(event) =>
                setBranding((old) => ({
                  ...old,
                  productName: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Nome da empresa
            <input
              value={branding.companyName}
              onChange={(event) =>
                setBranding((old) => ({
                  ...old,
                  companyName: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Cor principal
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(event) =>
                setBranding((old) => ({
                  ...old,
                  primaryColor: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Cor secundária
            <input
              type="color"
              value={branding.secondaryColor}
              onChange={(event) =>
                setBranding((old) => ({
                  ...old,
                  secondaryColor: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Cor de fundo
            <input
              type="color"
              value={branding.backgroundColor}
              onChange={(event) =>
                setBranding((old) => ({
                  ...old,
                  backgroundColor: event.target.value,
                }))
              }
            />
          </label>
          <label className="full-field">
            URL da logo
            <input
              value={branding.logoUrl}
              onChange={(event) =>
                setBranding((old) => ({ ...old, logoUrl: event.target.value }))
              }
              placeholder="https://..."
            />
          </label>
        </div>
        <button
          className="primary-button"
          onClick={() => updateBranding(branding)}
        >
          Salvar identidade
        </button>
      </section>

      <section className="panel security-panel full-span">
        <PanelHead
          title="Segurança e ambiente"
          subtitle="Acesso demonstrativo agora; autenticação definitiva será conectada depois."
        />
        <div className="security-items">
          <div>
            <ShieldCheck size={20} />
            <div>
              <strong>Permissões centralizadas</strong>
              <span>Interface e gateway validam as ações por perfil.</span>
            </div>
          </div>
          <div>
            <LockKeyhole size={20} />
            <div>
              <strong>Acesso automático temporário</strong>
              <span>
                O CRM abre no administrador sem tela de login inicial.
              </span>
            </div>
          </div>
          <div>
            <RefreshCcw size={20} />
            <div>
              <strong>Ambiente recuperável</strong>
              <span>Restaure os dados simulados para repetir testes.</span>
            </div>
          </div>
        </div>
        <button className="danger-button" onClick={() => void resetDemo()}>
          <RefreshCcw size={16} /> Restaurar ambiente local
        </button>
      </section>
    </div>
  );
}
