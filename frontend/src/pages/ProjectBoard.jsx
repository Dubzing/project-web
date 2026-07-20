import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Pencil, MoreVertical, Save, CheckCircle2, RotateCcw, Lock } from "lucide-react";
import { api } from "../lib/api";
import { STATUSES } from "../lib/constants";
import { TaskCard } from "../components/TaskCard";
import { TaskDialog } from "../components/TaskDialog";
import { ProjectDialog } from "../components/ProjectDialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";

export default function ProjectBoard({ projects, onProjectsChange }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === projectId);
  const [tasks, setTasks] = useState([]);
  const [taskDialog, setTaskDialog] = useState({ open: false, task: null, status: "todo" });
  const [editProject, setEditProject] = useState(false);
  const [dragTask, setDragTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [tplDialog, setTplDialog] = useState(false);
  const [tplName, setTplName] = useState("");

  const load = useCallback(async () => {
    if (!projectId) return;
    setTasks(await api.listTasks(projectId));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = (status) => setTaskDialog({ open: true, task: null, status });
  const openEdit = (task) => setTaskDialog({ open: true, task, status: task.status });

  const saveTask = async (data) => {
    if (taskDialog.task) {
      await api.updateTask(taskDialog.task.id, data);
      toast.success("Task updated");
    } else {
      await api.createTask({ ...data, project_id: projectId });
      toast.success("Task created");
    }
    setTaskDialog({ open: false, task: null, status: "todo" });
    load();
  };

  const deleteTask = async () => {
    await api.deleteTask(taskDialog.task.id);
    toast.success("Task deleted");
    setTaskDialog({ open: false, task: null, status: "todo" });
    load();
  };

  const moveTask = async (status, insertIndex) => {
    if (!dragTask) return;
    const colList = tasks
      .filter((t) => t.status === status && t.id !== dragTask.id)
      .sort((a, b) => a.order - b.order);
    const idx = insertIndex == null ? colList.length : Math.min(insertIndex, colList.length);
    const orderedIds = colList.map((t) => t.id);
    orderedIds.splice(idx, 0, dragTask.id);

    setTasks((prev) => {
      const map = new Map(prev.map((t) => [t.id, { ...t }]));
      orderedIds.forEach((id, i) => {
        const t = map.get(id);
        if (t) {
          t.status = status;
          t.order = i;
        }
      });
      return Array.from(map.values());
    });
    setDragTask(null);
    setDragOverCol(null);
    try {
      await api.reorderTasks(status, orderedIds);
    } catch (e) {
      toast.error("Could not save order");
    }
    load();
  };

  const onCardDrop = (e, targetTask) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragTask) return;
    const status = targetTask.status;
    const colList = tasks
      .filter((t) => t.status === status && t.id !== dragTask.id)
      .sort((a, b) => a.order - b.order);
    const idx = colList.findIndex((t) => t.id === targetTask.id);
    moveTask(status, idx === -1 ? colList.length : idx);
  };

  const saveProject = async (data) => {
    const { templateId, ...rest } = data;
    await api.updateProject(projectId, rest);
    setEditProject(false);
    onProjectsChange();
    toast.success("Project updated");
  };

  const saveAsTemplate = async () => {
    if (!tplName.trim()) return;
    await api.saveProjectAsTemplate(projectId, tplName.trim());
    setTplDialog(false);
    setTplName("");
    toast.success("Saved as project template");
  };

  const closeProject = async () => {
    try {
      await api.closeProject(projectId);
      onProjectsChange();
      toast.success("Project closed");
    } catch (e) {
      toast.error(e?.detail || "Could not close project");
    }
  };

  const reopenProject = async () => {
    await api.reopenProject(projectId);
    onProjectsChange();
    toast.success("Project reopened");
  };

  if (!project) {
    return (
      <div className="p-8 text-[#71717A]" data-testid="project-not-found">
        Project not found.
      </div>
    );
  }

  const isClosed = project.status === "closed";
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === "done");

  return (
    <div className="flex-1 min-h-screen" data-testid="project-board">
      <header className="border-b border-border px-8 py-6 bg-[#070707] sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3" style={{ backgroundColor: project.color }} />
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F4F4F5]">
                {project.name}
              </h1>
              {isClosed && (
                <span
                  className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] px-2 py-1 border border-[#10B981] text-[#10B981]"
                  data-testid="closed-badge"
                >
                  <Lock size={11} /> Closed
                </span>
              )}
              {!isClosed && (
                <button
                  onClick={() => setEditProject(true)}
                  data-testid="edit-project-btn"
                  className="text-[#52525B] hover:text-[#06B6D4] transition-colors"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-[#71717A] mt-1.5 max-w-2xl">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-heading font-bold text-[#06B6D4]">{tasks.length}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#52525B]">tasks</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="project-actions-btn"
                  className="p-2 border border-border text-[#A1A1AA] hover:text-[#F4F4F5] hover:border-[#3f3f46] transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0A0A0A] border-border rounded-none" align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setTplName(`${project.name} Template`);
                    setTplDialog(true);
                  }}
                  data-testid="save-as-template-btn"
                  className="rounded-none cursor-pointer font-mono text-sm"
                >
                  <Save size={14} className="mr-2" /> Save as Template
                </DropdownMenuItem>
                {isClosed ? (
                  <DropdownMenuItem
                    onClick={reopenProject}
                    data-testid="reopen-project-btn"
                    className="rounded-none cursor-pointer font-mono text-sm text-[#06B6D4]"
                  >
                    <RotateCcw size={14} className="mr-2" /> Reopen Project
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={closeProject}
                    disabled={!allDone}
                    data-testid="close-project-btn"
                    className="rounded-none cursor-pointer font-mono text-sm text-[#10B981] disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} className="mr-2" /> Close Project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {!isClosed && !allDone && (
          <p className="text-[11px] text-[#52525B] mt-2" data-testid="close-hint">
            Complete all tasks to close this project.
          </p>
        )}
        {isClosed && (
          <div className="mt-3 flex items-center gap-3 bg-[#0f1a14] border border-[#10B981]/40 px-4 py-2.5" data-testid="closed-banner">
            <CheckCircle2 size={16} className="text-[#10B981]" />
            <span className="text-sm text-[#A1A1AA]">
              This project is closed and hidden from the dashboard.
            </span>
            <Button
              onClick={reopenProject}
              className="ml-auto rounded-none bg-transparent border border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 h-8 text-xs"
              data-testid="banner-reopen-btn"
            >
              <RotateCcw size={13} className="mr-1.5" /> Reopen
            </Button>
          </div>
        )}
      </header>

      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {STATUSES.map((col) => {
          const colTasks = tasks
            .filter((t) => t.status === col.key)
            .sort((a, b) => a.order - b.order);
          return (
            <div
              key={col.key}
              data-testid={`column-${col.key}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.key);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                moveTask(col.key, null);
              }}
              className={`bg-[#080808] border transition-colors duration-150 ${
                dragOverCol === col.key ? "border-[#06B6D4]" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2" style={{ backgroundColor: col.color }} />
                  <span className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] font-medium">
                    {col.label}
                  </span>
                  <span className="text-xs text-[#52525B]">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => openNew(col.key)}
                  data-testid={`add-task-${col.key}`}
                  className="text-[#52525B] hover:text-[#06B6D4] transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="p-3 space-y-3 min-h-[120px]">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onClick={openEdit}
                    onDragStart={(e, task) => setDragTask(task)}
                    onDrop={onCardDrop}
                    dragging={dragTask?.id === t.id}
                  />
                ))}
                {colTasks.length === 0 && (
                  <button
                    onClick={() => openNew(col.key)}
                    className="w-full text-xs text-[#3f3f46] hover:text-[#71717A] py-6 border border-dashed border-border hover:border-[#3f3f46] transition-colors"
                    data-testid={`empty-add-${col.key}`}
                  >
                    + add task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(o) => setTaskDialog((s) => ({ ...s, open: o }))}
        onSave={saveTask}
        onDelete={deleteTask}
        task={taskDialog.task}
        defaultStatus={taskDialog.status}
      />
      <ProjectDialog
        open={editProject}
        onOpenChange={setEditProject}
        onSave={saveProject}
        project={project}
      />

      <Dialog open={tplDialog} onOpenChange={setTplDialog}>
        <DialogContent className="bg-[#0A0A0A] border-border rounded-none sm:max-w-md" data-testid="save-template-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading tracking-tight">Save as Project Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Template Name</Label>
            <Input
              data-testid="save-template-name-input"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="bg-[#050505] border-border rounded-none font-mono"
            />
            <p className="text-[11px] text-[#71717A]">
              Clones all {tasks.length} task(s) and their subtasks into a reusable blueprint.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTplDialog(false)} className="rounded-none">
              Cancel
            </Button>
            <Button
              onClick={saveAsTemplate}
              data-testid="save-template-confirm-btn"
              className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
