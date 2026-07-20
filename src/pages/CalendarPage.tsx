import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useCrm } from "../app/CrmContext";
import type { Task } from "../core/types";
import {
  Avatar,
  PanelHead,
  PriorityBadge,
  SelectControl,
} from "../components/Common";
import { formatDate } from "../core/utils";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function CalendarPage({
  onAdd,
  onEdit,
}: {
  onAdd(date?: string): void;
  onEdit(taskId: string): void;
}) {
  const { data, currentUser, toggleTask, can } = useCrm();
  const today = new Date();
  const todayKey = toDateKey(today);
  type TaskStatusFilter =
  | "Pendentes"
  | "Atrasadas"
  | "Concluídas"
  | "Todas";

const isTaskOverdue = (task: Task): boolean => {
  if (task.done) {
    return false;
  }

  const scheduledAt = new Date(
    `${task.date}T${task.time}:00`,
  );

  if (Number.isNaN(scheduledAt.getTime())) {
    return false;
  }

  return scheduledAt.getTime() < Date.now();
};
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1, 12),
  );
  const [ownerFilter, setOwnerFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] =
  useState<TaskStatusFilter>("Pendentes");

  const users = data?.users || [];
  const leads = data?.leads || [];
  const allTasks = (data?.tasks || []).filter(
    (task) =>
      currentUser?.role === "super_admin" ||
      currentUser?.role === "manager" ||
      task.ownerId === currentUser?.id,
  );

  const tasks = allTasks.filter((task) => {
  const matchesOwner =
    ownerFilter === "Todos" ||
    task.ownerId === ownerFilter;

  if (!matchesOwner) {
    return false;
  }

  switch (statusFilter) {
    case "Pendentes":
      return !task.done;

    case "Atrasadas":
      return isTaskOverdue(task);

    case "Concluídas":
      return task.done;

    case "Todas":
      return true;

    default:
      return true;
  }
});
const pendingCount = allTasks.filter(
  (task) => !task.done,
).length;

const overdueCount = allTasks.filter(
  isTaskOverdue,
).length;

const agendaTitle: Record<
  TaskStatusFilter,
  string
> = {
  Pendentes: "Próximas tarefas",
  Atrasadas: "Tarefas atrasadas",
  Concluídas: "Tarefas concluídas",
  Todas: "Todas as tarefas",
};
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + days }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  const monthTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const date = new Date(`${task.date}T12:00:00`);
        return date.getFullYear() === year && date.getMonth() === month;
      }),
    [tasks, year, month],
  );

  const orderedTasks = [...tasks].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );

  return (
    <div className="calendar-grid">
      <section className="panel calendar-panel">
        <PanelHead
          title={`${monthNames[month]} de ${year}`}
          subtitle={
            can("tasks.manage")
              ? "Clique em um dia para adicionar uma tarefa"
              : "Visualização de agenda em modo leitura"
          }
          action={
            <div className="calendar-nav">
              <button
                onClick={() => setCursor(new Date(year, month - 1, 1, 12))}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() =>
                  setCursor(
                    new Date(today.getFullYear(), today.getMonth(), 1, 12),
                  )
                }
              >
                Hoje
              </button>
              <button
                onClick={() => setCursor(new Date(year, month + 1, 1, 12))}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          }
        />

        <div className="calendar-filters">
          <SelectControl
            value={ownerFilter}
            onChange={setOwnerFilter}
            options={["Todos", ...users.map((user) => user.id)]}
            labels={Object.fromEntries(
              users.map((user) => [user.id, user.name]),
            )}
          />
          <SelectControl
  value={statusFilter}
  onChange={(value) =>
    setStatusFilter(
      value as TaskStatusFilter,
    )
  }
  options={[
    "Pendentes",
    "Atrasadas",
    "Concluídas",
    "Todas",
  ]}
/>
        </div>

        <div className="calendar-weekdays">
          {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-cells">
          {cells.map((day, index) => {
            if (!day)
              return (
                <div key={`empty-${index}`} className="calendar-cell empty" />
              );
            const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = monthTasks.filter((task) => task.date === date);
            return (
              <button
                key={date}
                className={`calendar-cell${date === todayKey ? " today" : ""}`}
                onClick={() => can("tasks.manage") && onAdd(date)}
              >
                <span>{day}</span>
                <div>
                  {dayTasks.slice(0, 3).map((task) => (
                    <i
  key={task.id}
  className={[
    task.done ? "done" : "",
    isTaskOverdue(task)
      ? "overdue"
      : "",
  ]
    .filter(Boolean)
    .join(" ")}
>
                      {task.time} · {task.title}
                    </i>
                  ))}
                  {dayTasks.length > 3 && (
                    <small>+{dayTasks.length - 3} tarefas</small>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel agenda-side">
        <PanelHead
  title={agendaTitle[statusFilter]}
  subtitle={
    `${pendingCount} pendentes · ` +
    `${overdueCount} atrasadas`
  }
          action={
            can("tasks.manage") ? (
              <button
                className="primary-button icon-only"
                onClick={() => onAdd()}
              >
                <Plus size={17} />
              </button>
            ) : undefined
          }
        />

        <div className="agenda-list">
          {orderedTasks.map((task) => {
            const owner = users.find((user) => user.id === task.ownerId);
            const lead = leads.find((item) => item.id === task.leadId);
            return (
              <div
  key={task.id}
  className={[
    "agenda-item",
    task.done ? "done" : "",
    isTaskOverdue(task)
      ? "overdue"
      : "",
  ]
    .filter(Boolean)
    .join(" ")}
>
                <button
                  className="agenda-check"
                  disabled={!can("tasks.manage")}
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? "Reabrir tarefa" : "Concluir tarefa"}
                >
                  {task.done && <Check size={13} />}
                </button>
                <button
                  className="agenda-main"
                  onClick={() => can("tasks.manage") && onEdit(task.id)}
                >
                  <small>
                    {formatDate(task.date)} · {task.time}
                  </small>
                  <strong>{task.title}</strong>
                  <span>
                    {lead ? `${lead.name} · ${task.type}` : task.type}
                  </span>
                </button>
                <PriorityBadge value={task.priority} />
                <Avatar user={owner} small />
                {can("tasks.manage") && (
                  <button
                    className="agenda-edit"
                    onClick={() => onEdit(task.id)}
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>
            );
          })}
          {!orderedTasks.length && (
            <div className="empty-table">
              <Clock3 size={20} /> Nenhuma tarefa neste filtro.
            </div>
          )}
        </div>

        {can("tasks.manage") && (
          <button className="secondary-button full" onClick={() => onAdd()}>
            <CalendarDays size={17} /> Nova tarefa
          </button>
        )}
      </section>
    </div>
  );
}
