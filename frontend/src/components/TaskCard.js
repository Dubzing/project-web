import { ListChecks, Calendar, GripVertical } from "lucide-react";
import { PRIORITIES, dueMeta } from "../lib/constants";

export const TaskCard = ({ task, onClick, onDragStart, onDrop, dragging }) => {
  const prio = PRIORITIES[task.priority] || PRIORITIES.medium;
  const due = dueMeta(task.due_date);
  const subDone = task.subtasks.filter((s) => s.done).length;
  const subTotal = task.subtasks.length;

  return (
    <div
      data-testid={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop && onDrop(e, task)}
      onClick={() => onClick(task)}
      className={`group bg-[#0C0C0C] border border-border hover:border-[#3f3f46] cursor-pointer transition-colors duration-150 ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <div className="h-0.5 w-full" style={{ backgroundColor: prio.color }} />
      <div className="p-3.5">
        <div className="flex items-start gap-2">
          <GripVertical
            size={14}
            className="text-[#3f3f46] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-heading text-sm font-medium text-[#F4F4F5] leading-snug">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-[#71717A] mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pl-6">
            {task.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 bg-[#141414] border border-border text-[#A1A1AA]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 pl-6 text-[11px]">
          <span
            className="uppercase tracking-wider font-medium"
            style={{ color: prio.color }}
            data-testid={`task-priority-${task.id}`}
          >
            {prio.label}
          </span>
          {subTotal > 0 && (
            <span className="flex items-center gap-1 text-[#71717A]">
              <ListChecks size={12} /> {subDone}/{subTotal}
            </span>
          )}
          {due && (
            <span className="flex items-center gap-1 ml-auto" style={{ color: due.color }}>
              <Calendar size={12} /> {due.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
