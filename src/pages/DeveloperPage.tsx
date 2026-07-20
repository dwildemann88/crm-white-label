import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  ImagePlus,
  Layers3,
  Palette,
  Plus,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useCrm } from "../app/CrmContext";
import { ModalShell, PanelHead } from "../components/Common";
import type { Organization } from "../core/types";
import { fileToDataUrl } from "../core/utils";

const modules = [
  ["dashboard", "Dashboard"],
  ["kanban", "Kanban"],
  ["leads", "Leads gerais"],
  ["calendar", "Agenda"],
  ["inbox", "WhatsApp"],
  ["analytics", "Relatórios"],
  ["integrations", "Integrações"],
  ["admin", "Administração"],
];

function OrganizationPreview({
  organization,
  onClose,
}: {
  organization: Organization;
  onClose(): void;
}) {
  return (
    <ModalShell
      title={`Prévia — ${organization.name}`}
      subtitle="Simulação visual da identidade da empresa."
      onClose={onClose}
      wide
    >
      <div
        className="crm-preview"
        style={
          {
            "--preview-primary": organization.branding.primaryColor,
            "--preview-secondary": organization.branding.secondaryColor,
            "--preview-bg": organization.branding.backgroundColor,
          } as React.CSSProperties
        }
      >
        <aside>
          <div className="preview-logo">
            {organization.branding.logoUrl ? (
              <img
                src={organization.branding.logoUrl}
                alt={organization.name}
              />
            ) : (
              <strong>{organization.branding.productName.slice(0, 1)}</strong>
            )}
          </div>
          <b>{organization.branding.productName}</b>
          {["Visão geral", "Funil Kanban", "Leads gerais", "Agenda"].map(
            (item) => (
              <span key={item}>{item}</span>
            ),
          )}
        </aside>
        <main>
          <header>
            <div>
              <strong>{organization.name}</strong>
              <small>Prévia da operação comercial</small>
            </div>
            <span className="preview-button">Novo lead</span>
          </header>
          <section>
            <div className="preview-kpi">
              <small>Leads ativos</small>
              <strong>128</strong>
            </div>
            <div className="preview-kpi">
              <small>Pipeline</small>
              <strong>R$ 420 mil</strong>
            </div>
            <div className="preview-kpi">
              <small>Conversão</small>
              <strong>18%</strong>
            </div>
          </section>
          <article>
            <h3>Funil comercial</h3>
            <div className="preview-bars">
              <i />
              <i />
              <i />
              <i />
            </div>
          </article>
        </main>
      </div>
    </ModalShell>
  );
}

function OrganizationEditor({
  organization,
  onClose,
}: {
  organization: Organization;
  onClose(): void;
}) {
  const { saveOrganization } = useCrm();
  const [draft, setDraft] = useState(organization);

  return (
    <ModalShell
      title={`Configurar ${organization.name}`}
      subtitle="Essa camada cria versões diferentes sem duplicar o código do CRM."
      onClose={onClose}
      wide
    >
      <form
        className="modal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (
            !draft.name.trim() ||
            !draft.slug.trim() ||
            !draft.branding.productName.trim()
          )
            return;
          await saveOrganization({
            ...draft,
            name: draft.name.trim(),
            slug: draft.slug.trim(),
            branding: {
              ...draft.branding,
              productName: draft.branding.productName.trim(),
              companyName:
                draft.branding.companyName.trim() || draft.name.trim(),
            },
          });
          onClose();
        }}
      >
        <div className="form-grid">
          <label>
            Nome da empresa
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  name: event.target.value,
                  branding: {
                    ...old.branding,
                    companyName: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            Identificador / subdomínio
            <input
              value={draft.slug}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  slug: event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-"),
                }))
              }
            />
          </label>
          <label>
            Nome do produto
            <input
              value={draft.branding.productName}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  branding: {
                    ...old.branding,
                    productName: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            Status
            <select
              value={draft.active ? "active" : "draft"}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  active: event.target.value === "active",
                }))
              }
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
            </select>
          </label>
          <label>
            Cor principal
            <input
              type="color"
              value={draft.branding.primaryColor}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  branding: {
                    ...old.branding,
                    primaryColor: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            Cor secundária
            <input
              type="color"
              value={draft.branding.secondaryColor}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  branding: {
                    ...old.branding,
                    secondaryColor: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            Cor de fundo
            <input
              type="color"
              value={draft.branding.backgroundColor}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  branding: {
                    ...old.branding,
                    backgroundColor: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            Logo por arquivo
            <span className="file-input-button">
              <ImagePlus size={16} /> Selecionar imagem
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const logoUrl = await fileToDataUrl(file);
                  setDraft((old) => ({
                    ...old,
                    branding: { ...old.branding, logoUrl },
                  }));
                }}
              />
            </span>
          </label>
          <label className="full-field">
            URL da logo
            <input
              value={draft.branding.logoUrl}
              onChange={(event) =>
                setDraft((old) => ({
                  ...old,
                  branding: { ...old.branding, logoUrl: event.target.value },
                }))
              }
              placeholder="https://... ou imagem carregada"
            />
          </label>
        </div>

        <label className="full-field">
          Módulos ativos
          <div className="module-selector">
            {modules.map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={draft.enabledModules.includes(id) ? "active" : ""}
                onClick={() =>
                  setDraft((old) => ({
                    ...old,
                    enabledModules: old.enabledModules.includes(id)
                      ? old.enabledModules.filter((item) => item !== id)
                      : [...old.enabledModules, id],
                  }))
                }
              >
                {draft.enabledModules.includes(id) && <Check size={14} />}{" "}
                {label}
              </button>
            ))}
          </div>
        </label>

        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="primary-button"
            disabled={
              !draft.name.trim() ||
              !draft.slug.trim() ||
              !draft.branding.productName.trim()
            }
          >
            <Settings2 size={16} /> Salvar versão
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function DeveloperPage() {
  const { data, duplicateOrganization, switchOrganization } = useCrm();
  const organizations = data?.organizations || [];
  const currentOrganizationId = data?.session?.organizationId || "";
  const currentOrganization = organizations.find(
    (item) => item.id === currentOrganizationId,
  );
  const [selected, setSelected] = useState<Organization | null>(null);
  const [preview, setPreview] = useState<Organization | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sourceId, setSourceId] = useState(organizations[0]?.id || "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <div className="developer-page">
      <section className="panel developer-hero">
        <div>
          <span className="eyebrow">
            <Layers3 size={15} /> CONSOLE WHITE-LABEL
          </span>
          <h2>Crie diferentes versões do CRM sem alterar código.</h2>
          <p>
            Logo, paleta, módulos, funis, usuários e integrações ficam salvos
            como configuração da empresa.
          </p>
          <span className="current-workspace">
            Ambiente em edição: <strong>{currentOrganization?.name}</strong>
          </span>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>
          <Plus size={17} /> Nova empresa
        </button>
      </section>

      <div className="organization-grid">
        {organizations.map((organization) => (
          <article
            className="organization-card"
            key={organization.id}
            style={
              {
                "--org-primary": organization.branding.primaryColor,
                "--org-secondary": organization.branding.secondaryColor,
              } as React.CSSProperties
            }
          >
            <div className="organization-preview">
              <span className="preview-sidebar" />
              <div>
                <b>{organization.branding.productName}</b>
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="organization-info">
              <div>
                <h3>{organization.name}</h3>
                <span className={organization.active ? "active" : "draft"}>
                  {organization.active ? "Ativo" : "Rascunho"}
                </span>
              </div>
              <p>{organization.slug}.seudominio.com.br</p>
              <div className="organization-meta">
                <span>
                  <Palette size={15} />
                  {organization.branding.primaryColor}
                </span>
                <span>
                  <Layers3 size={15} />
                  {organization.enabledModules.length} módulos
                </span>
                <span>
                  <ShieldCheck size={15} />
                  Isolado por organização
                </span>
              </div>
            </div>
            <footer>
              <button
                className="secondary-button"
                onClick={() => setPreview(organization)}
              >
                <Eye size={16} /> Visualizar
              </button>
              <button
                className="secondary-button"
                onClick={() => setSelected(organization)}
              >
                <Settings2 size={16} /> Aparência
              </button>
              <button
                className="primary-button organization-workspace-button"
                disabled={organization.id === currentOrganizationId}
                onClick={() => void switchOrganization(organization.id)}
              >
                {organization.id === currentOrganizationId ? (
                  <Check size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
                {organization.id === currentOrganizationId
                  ? "Ambiente atual"
                  : "Abrir operação"}
              </button>
            </footer>
          </article>
        ))}
      </div>

      <section className="panel template-explanation">
        <PanelHead
          title="Como a estrutura funciona"
          subtitle="Uma base de código, múltiplas operações isoladas"
        />
        <div className="architecture-flow">
          <div>
            <b>Empresa</b>
            <span>Identidade, módulos e domínio</span>
          </div>
          <i>→</i>
          <div>
            <b>Configuração</b>
            <span>Funis, campos e permissões</span>
          </div>
          <i>→</i>
          <div>
            <b>Integrações</b>
            <span>Credenciais próprias do cliente</span>
          </div>
          <i>→</i>
          <div>
            <b>Dados isolados</b>
            <span>organization_id em cada registro</span>
          </div>
        </div>
      </section>

      {selected && (
        <OrganizationEditor
          organization={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {preview && (
        <OrganizationPreview
          organization={preview}
          onClose={() => setPreview(null)}
        />
      )}

      {showCreate && (
        <ModalShell
          title="Criar versão do CRM"
          subtitle="Duplique um modelo e personalize pela interface."
          onClose={() => setShowCreate(false)}
        >
          <form
            className="modal-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!name || !slug) return;
              await duplicateOrganization(sourceId, name, slug);
              setShowCreate(false);
              setName("");
              setSlug("");
            }}
          >
            <label className="full-field">
              Modelo base
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-field">
              Nome da empresa
              <input
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  if (!slug)
                    setSlug(
                      value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    );
                }}
              />
            </label>
            <label className="full-field">
              Subdomínio
              <input
                value={slug}
                onChange={(event) =>
                  setSlug(
                    event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  )
                }
              />
            </label>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </button>
              <button className="primary-button" disabled={!name || !slug}>
                <Copy size={16} /> Criar a partir do modelo
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
