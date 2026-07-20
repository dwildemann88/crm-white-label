import {
  CheckCheck,
  ChevronDown,
  Clock3,
  FileText,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCrm } from "../app/CrmContext";
import { Avatar, EmptyState, OriginBadge } from "../components/Common";
import { formatDateTime } from "../core/utils";

type ChatFilter = "all" | "unread" | "mine";

function formatWindowRemaining(
  expiresAt: string | null,
  now: number,
): string {
  if (!expiresAt) {
    return "Nenhuma mensagem recebida";
  }

  const remaining =
    new Date(expiresAt).getTime() -
    now;

  if (remaining <= 0) {
    return "Janela encerrada";
  }

  const totalMinutes =
    Math.max(
      1,
      Math.ceil(
        remaining / 60_000,
      ),
    );

  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  const minutes =
    totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min restantes`;
  }

  if (minutes === 0) {
    return `${hours}h restantes`;
  }

  return `${hours}h ${minutes}min restantes`;
}

export function InboxPage({
  onLead,
  initialConversationId,
}: {
  onLead(id: string): void;
  initialConversationId?: string;
}) {
  const {
    data,
    visibleLeads,
    currentUser,
    can,
    sendMessage,
    transferConversation,
    markConversationRead,
  } = useCrm();

  const allConversations = (data?.conversations || [])
    .filter((conversation) =>
      visibleLeads.some((lead) => lead.id === conversation.leadId),
    )
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  const users = (data?.users || []).filter(
    (user) =>
      user.active &&
      ["sales", "sdr", "manager", "super_admin"].includes(user.role),
  );

  const [selectedId, setSelectedId] = useState(allConversations[0]?.id || "");
  useEffect(() => {
  if (!initialConversationId) {
    return;
  }

  const conversationExists =
    allConversations.some(
      (conversation) =>
        conversation.id === initialConversationId,
    );

  if (conversationExists) {
    setSelectedId(initialConversationId);
  }
}, [
  initialConversationId,
  data?.conversations,
  visibleLeads,
]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [text, setText] = useState("");
  const [clockNow, setClockNow] =
    useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setClockNow(Date.now());
      },
      30_000,
    );

    return () =>
      window.clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () =>
      allConversations.filter((conversation) => {
        const lead = visibleLeads.find(
          (item) => item.id === conversation.leadId,
        );
        const matchesSearch =
          `${lead?.name || ""} ${lead?.phone || ""} ${lead?.company || ""}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "unread" && conversation.unread > 0) ||
          (filter === "mine" && conversation.ownerId === currentUser?.id);
        return matchesSearch && matchesFilter;
      }),
    [allConversations, currentUser?.id, filter, search, visibleLeads],
  );

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((item) => item.id === selectedId))
      setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected =
    allConversations.find((item) => item.id === selectedId) || filtered[0];
  const lead = visibleLeads.find((item) => item.id === selected?.leadId);
  const owner = users.find((user) => user.id === selected?.ownerId);
  const messages = useMemo(
    () =>
      (data?.messages || [])
        .filter((message) => message.conversationId === selected?.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data?.messages, selected?.id],
  );

  useEffect(() => {
    if (selected?.id && selected.unread > 0)
      void markConversationRead(selected.id);
  }, [markConversationRead, selected?.id, selected?.unread]);

  if (!allConversations.length) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Nenhuma conversa disponível"
        text="As conversas recebidas pela API do WhatsApp aparecerão aqui."
      />
    );
  }

  if (!selected || !lead) {
    return (
      <EmptyState
        icon={Search}
        title="Nenhuma conversa neste filtro"
        text="Ajuste a busca ou selecione outra visualização."
      />
    );
  }

  const canReply =
    can("messages.manage") &&
    (selected.ownerId ===
      currentUser?.id ||
      currentUser?.role ===
        "super_admin");

  const canTransfer =
    can("leads.assign");

  const windowExpiresAt =
    selected.whatsappWindow
      ?.expiresAt ?? null;

  const windowOpen =
    selected.whatsappWindow
      ? Boolean(
          windowExpiresAt &&
            new Date(
              windowExpiresAt,
            ).getTime() >
              clockNow,
        )
      : true;

  const requiresTemplate =
    selected.whatsappWindow
      ? !windowOpen
      : false;

  const canSendFreeText =
    canReply && windowOpen;

  const windowDescription =
    windowOpen
      ? formatWindowRemaining(
          windowExpiresAt,
          clockNow,
        )
      : selected.whatsappWindow
          ?.lastInboundAt
        ? `Encerrada em ${formatDateTime(
            windowExpiresAt ??
              selected.whatsappWindow
                .lastInboundAt,
          )}`
        : "O cliente ainda não iniciou a conversa.";

  const submitMessage = async () => {
    const body = text.trim();

    if (
      !body ||
      !canSendFreeText
    ) {
      return;
    }

    await sendMessage(
      selected.id,
      body,
    );

    setText("");
  };

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="chat-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar conversa"
          />
        </div>

        <div className="chat-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Todas
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Não lidas
          </button>
          <button
            className={filter === "mine" ? "active" : ""}
            onClick={() => setFilter("mine")}
          >
            Minhas
          </button>
        </div>

        <div className="conversation-list">
          {filtered.map((conversation) => {
            const contact = visibleLeads.find(
              (item) => item.id === conversation.leadId,
            );
            const responsible = users.find(
              (user) => user.id === conversation.ownerId,
            );
            return (
              <button
                key={conversation.id}
                className={conversation.id === selected.id ? "active" : ""}
                onClick={() => setSelectedId(conversation.id)}
              >
                <span className="lead-avatar">
                  {contact?.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <strong>{contact?.name}</strong>
                  <span>{contact?.phone}</span>
                  <small>Responsável: {responsible?.name}</small>
                </div>
                {conversation.unread > 0 && <b>{conversation.unread}</b>}
              </button>
            );
          })}
          {!filtered.length && (
            <div className="empty-conversations">
              Nenhuma conversa localizada.
            </div>
          )}
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-head">
          <button className="chat-contact" onClick={() => onLead(lead.id)}>
            <span className="lead-avatar">
              {lead.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{lead.name}</strong>
              <span>
                {lead.phone} · {lead.company || "Sem empresa"}
              </span>
            </div>
          </button>

          <div className="chat-head-actions">
            <OriginBadge origin={lead.origin} />
            {canTransfer ? (
              <label className="transfer-control">
                <UserRoundCheck size={16} />
                <select
                  value={selected.ownerId}
                  onChange={(event) =>
                    transferConversation(selected.id, event.target.value)
                  }
                >
                  {users
                    .filter((user) => user.role !== "manager")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
                <ChevronDown size={14} />
              </label>
            ) : (
              <span className="read-only-badge">Somente leitura</span>
            )}
          </div>
        </header>

        <div className="chat-context">
          <div>
            <small>Número compartilhado</small>
            <strong>WhatsApp Projem</strong>
          </div>
          <div>
            <small>Responsável atual</small>
            <span>
              <Avatar user={owner} small />
              {owner?.name} · {owner?.roleLabel}
            </span>
          </div>
          <div>
            <small>Identificação</small>
            <strong>Assinatura na primeira mensagem e transferências</strong>
          </div>

          <div
            className={`whatsapp-window-card ${
              windowOpen
                ? "open"
                : "closed"
            }`}
            title={
              windowExpiresAt
                ? `Expira em ${formatDateTime(
                    windowExpiresAt,
                  )}`
                : "Sem mensagem recebida do cliente."
            }
          >
            <small>Janela do WhatsApp</small>

            <span>
              {windowOpen ? (
                <Clock3 size={15} />
              ) : (
                <LockKeyhole
                  size={15}
                />
              )}

              <strong>
                {windowOpen
                  ? "Janela aberta"
                  : "Janela encerrada"}
              </strong>
            </span>

            <em>
              {windowDescription}
            </em>
          </div>
        </div>

        <div className="messages-area">
          {messages.map((message) => {
            const sender = users.find(
              (user) => user.id === message.senderUserId,
            );
            if (message.direction === "internal") {
              return (
                <div className="internal-message" key={message.id}>
                  {message.body}
                </div>
              );
            }
            return (
              <div
                key={message.id}
                className={`message-bubble ${message.direction === "outbound" ? "outgoing" : "incoming"}`}
              >
                <p>
                  {message.body.split("\n").map((line, index) => (
                    <span key={index}>{line || <br />}</span>
                  ))}
                </p>
                <small>
                  {sender && `${sender.name} · `}
                  {formatDateTime(message.createdAt)}
                  {message.direction === "outbound" && <CheckCheck size={14} />}
                </small>
              </div>
            );
          })}
        </div>

        <footer className="chat-compose">
          {!canReply && (
            <div className="chat-lock">
              {can("messages.manage")
                ? `Atendimento atribuído a ${owner?.name}. Transfira a conversa para responder.`
                : "Seu perfil pode acompanhar a conversa, mas não enviar mensagens."}
            </div>
          )}

          {canReply &&
            requiresTemplate && (
              <div className="chat-lock whatsapp-window-lock">
                <span>
                  A janela de 24 horas está encerrada. Use um template aprovado para retomar o atendimento.
                </span>

                <button
                  type="button"
                  className="template-button"
                  disabled
                  title="O envio de templates será conectado na próxima etapa."
                >
                  <FileText size={15} />
                  Enviar template
                </button>
              </div>
            )}

          <button
            disabled
            title="Anexos serão ativados com a integração real do WhatsApp"
            aria-label="Anexos aguardando integração"
          >
            <Paperclip size={19} />
          </button>

          <textarea
            disabled={
              !canSendFreeText
            }
            value={text}
            onChange={(event) =>
              setText(
                event.target.value,
              )
            }
            placeholder={
              requiresTemplate
                ? "Janela encerrada. Envie um template aprovado para retomar a conversa."
                : "Digite uma mensagem. A identificação será inserida automaticamente quando necessária."
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void submitMessage();
              }
            }}
          />

          <button
            className="send-button"
            disabled={
              !canSendFreeText ||
              !text.trim()
            }
            onClick={() =>
              void submitMessage()
            }
          >
            <Send size={18} />
          </button>
        </footer>
      </section>
    </div>
  );
}
