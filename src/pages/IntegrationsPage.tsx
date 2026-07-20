import {
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  PlugZap,
  RefreshCcw,
  Search,
  Settings2,
  Webhook,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useCrm } from "../app/CrmContext";
import { ModalShell, PanelHead } from "../components/Common";
import type { IntegrationConnection, IntegrationProvider } from "../core/types";
import { formatDateTime } from "../core/utils";

const iconMap: Record<IntegrationProvider, typeof Webhook> = {
  meta: Webhook,
  google: Search,
  whatsapp: MessageCircle,
  webhook: PlugZap,
  website: ExternalLink,
};
const statusLabel = {
  connected: "Conectado",
  attention: "Atenção",
  disconnected: "Desconectado",
};

function IntegrationModal({
  integration,
  onClose,
}: {
  integration: IntegrationConnection;
  onClose: () => void;
}) {
  const { data, updateIntegration, testIntegration } = useCrm();
  const [draft, setDraft] = useState(integration);
  const stages = (data?.stages || []).filter(
    (stage) => stage.pipelineId === draft.targetPipelineId,
  );
  const users = (data?.users || []).filter(
    (user) =>
      user.active &&
      ["super_admin", "sales", "sdr"].includes(user.role) &&
      (user.role === "super_admin" ||
        user.pipelineIds.includes(draft.targetPipelineId)),
  );
  const apiBase = (import.meta.env.VITE_API_URL || location.origin).replace(
    /\/$/,
    "",
  );
  const endpointUrl = `${apiBase}${draft.endpoint}`;
  const change = <K extends keyof IntegrationConnection>(
    key: K,
    value: IntegrationConnection[K],
  ) => setDraft((old) => ({ ...old, [key]: value }));
  return (
    <ModalShell
      title={`Configurar ${integration.name}`}
      subtitle="A interface já salva configuração, destino e mapeamento. Credenciais reais serão tratadas pelo backend."
      onClose={onClose}
      wide
    >
      <div className="integration-config">
        <div className="integration-guide">
          <strong>Fluxo de ativação</strong>
          <ol>
            <li>Conectar ou informar credenciais no backend.</li>
            <li>Selecionar origem e formulários.</li>
            <li>Mapear os campos recebidos.</li>
            <li>Definir etapa e responsável padrão.</li>
            <li>Executar teste e ativar.</li>
          </ol>
          <div className="endpoint-box">
            <small>Endpoint previsto</small>
            <code>{endpointUrl}</code>
            <button onClick={() => navigator.clipboard?.writeText(endpointUrl)}>
              <Copy size={15} />
            </button>
          </div>
        </div>
        <form
          className="modal-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await updateIntegration(draft);
            onClose();
          }}
        >
          <div className="form-grid">
            <label>
              Conta / identificação
              <input
                value={draft.accountLabel}
                onChange={(event) => change("accountLabel", event.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={draft.status}
                onChange={(event) =>
                  change(
                    "status",
                    event.target.value as IntegrationConnection["status"],
                  )
                }
              >
                <option value="connected">Conectado</option>
                <option value="attention">Atenção</option>
                <option value="disconnected">Desconectado</option>
              </select>
            </label>
            <label>
              Pipeline
              <select
                value={draft.targetPipelineId}
                onChange={(event) => {
                  const pipelineId = event.target.value;
                  const firstStage = data?.stages.find(
                    (stage) => stage.pipelineId === pipelineId,
                  );
                  change("targetPipelineId", pipelineId);
                  if (firstStage) change("targetStageId", firstStage.id);
                  change("defaultOwnerId", null);
                }}
              >
                {data?.pipelines.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Etapa inicial
              <select
                value={draft.targetStageId}
                onChange={(event) =>
                  change("targetStageId", event.target.value)
                }
              >
                {stages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Responsável padrão
              <select
                value={draft.defaultOwnerId || ""}
                onChange={(event) =>
                  change("defaultOwnerId", event.target.value || null)
                }
              >
                <option value="">Distribuição automática</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Identificador seguro (demonstração)
              <input
                type="password"
                autoComplete="off"
                value={draft.secretMasked}
                onChange={(event) => change("secretMasked", event.target.value)}
              />
            </label>
          </div>
          <label className="full-field">
            Mapeamento de campos
            <div className="mapping-list">
              {draft.fieldMappings.map((mapping, index) => (
                <div key={`${mapping.source}-${index}`}>
                  <input
                    value={mapping.source}
                    onChange={(event) =>
                      change(
                        "fieldMappings",
                        draft.fieldMappings.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, source: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <span>→</span>
                  <input
                    value={mapping.target}
                    onChange={(event) =>
                      change(
                        "fieldMappings",
                        draft.fieldMappings.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, target: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        "fieldMappings",
                        draft.fieldMappings.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-mapping"
                onClick={() =>
                  change("fieldMappings", [
                    ...draft.fieldMappings,
                    { source: "novo_campo", target: "custom_field" },
                  ])
                }
              >
                Adicionar campo
              </button>
            </div>
          </label>
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={async () => {
                await updateIntegration(draft);
                await testIntegration(draft.id);
              }}
            >
              <RefreshCcw size={16} /> Testar conexão
            </button>
            <button type="submit" className="primary-button">
              <Settings2 size={16} /> Salvar configuração
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export function IntegrationsPage() {
  const { data, can, testIntegration } = useCrm();
  const [selected, setSelected] = useState<IntegrationConnection | null>(null);
  const integrations = data?.integrations || [];
  return (
    <div className="integrations-page">
      <section className="panel integrations-hero">
        <PanelHead
          title="Central de integrações"
          subtitle="Conectores desacoplados do restante do CRM"
        />
        <div className="integration-steps">
          <div>
            <b>1</b>
            <span>
              <strong>Conectar</strong>Conta, token ou webhook
            </span>
          </div>
          <div>
            <b>2</b>
            <span>
              <strong>Mapear</strong>Campos de entrada
            </span>
          </div>
          <div>
            <b>3</b>
            <span>
              <strong>Direcionar</strong>Pipeline e responsável
            </span>
          </div>
          <div>
            <b>4</b>
            <span>
              <strong>Testar</strong>Evento antes de ativar
            </span>
          </div>
        </div>
      </section>
      <div className="integration-cards">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.provider];
          return (
            <article
              className={`integration-card status-${integration.status}`}
              key={integration.id}
            >
              <div className="integration-card-head">
                <span>
                  <Icon size={23} />
                </span>
                <div>
                  <h3>{integration.name}</h3>
                  <p>{integration.description}</p>
                </div>
                <b>
                  <i />
                  {statusLabel[integration.status]}
                </b>
              </div>
              <div className="integration-card-body">
                <dl>
                  <div>
                    <dt>Conta</dt>
                    <dd>{integration.accountLabel}</dd>
                  </div>
                  <div>
                    <dt>Eventos recebidos</dt>
                    <dd>{integration.eventsReceived}</dd>
                  </div>
                  <div>
                    <dt>Último evento</dt>
                    <dd>
                      {integration.lastEventAt
                        ? formatDateTime(integration.lastEventAt)
                        : "Nenhum"}
                    </dd>
                  </div>
                  <div>
                    <dt>Endpoint</dt>
                    <dd>
                      <code>{integration.endpoint}</code>
                    </dd>
                  </div>
                </dl>
                {integration.errors.length ? (
                  <div className="integration-errors">
                    <XCircle size={16} />
                    <span>{integration.errors[0]}</span>
                  </div>
                ) : (
                  <div className="integration-ok">
                    <CheckCircle2 size={16} />
                    <span>Configuração sem erros pendentes.</span>
                  </div>
                )}
              </div>
              <footer>
                <button
                  className="secondary-button"
                  disabled={!can("integrations.manage")}
                  onClick={() => testIntegration(integration.id)}
                >
                  <RefreshCcw size={16} /> Testar
                </button>
                <button
                  className="primary-button"
                  disabled={!can("integrations.manage")}
                  onClick={() => setSelected(integration)}
                >
                  <Settings2 size={16} /> Configurar
                </button>
              </footer>
            </article>
          );
        })}
      </div>
      <section className="panel webhook-doc">
        <PanelHead
          title="Entrada genérica para páginas externas"
          subtitle="Use uma chave exclusiva por formulário ou aplicação."
        />
        <pre>{`POST /public/leads/webhook_7a91\nAuthorization: Bearer SUA_CHAVE\nContent-Type: application/json\n\n{\n  "nome": "João da Silva",\n  "telefone": "5555999999999",\n  "cidade": "Santa Rosa",\n  "valor_conta": 780,\n  "utm_source": "google",\n  "gclid": "abc123"\n}`}</pre>
      </section>
      {selected && (
        <IntegrationModal
          integration={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
