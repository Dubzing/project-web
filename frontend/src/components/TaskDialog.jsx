import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Plus, X, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { STATUSES, PRIORITIES } from "../lib/constants";
import { api } from "../lib/api";

const uid = () => Math.random().toString(36).slice(2);

export const TaskDialog = ({ open, onOpenChange, onSave, onDelete, task, defaultStatus }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subInput, setSubInput] = useState("");
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (open) {
      setTitle(task?.title || "");
      setDescription(task?.description || "");
      setStatus(task?.status || defaultStatus || "todo");
      setPriority(task?.priority || "medium");
      setDueDate(task?.due_date ? task.due_date.slice(0, 10) : "");
      setTags(task?.tags || []);
      setSubtasks(task?.subtasks || []);
      setTagInput("");
      setSubInput("");
      if (!task) api.listTemplates().then(setTemplates);
    }
  }, [open, task, defaultStatus]);

  const applyTemplate = (id) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    if (tpl.title) setTitle(tpl.title);
    if (tpl.description) setDescription(tpl.description);
    setPriority(tpl.priority || "medium");
    setTags(tpl.tags || []);
    setSubtasks((tpl.subtasks || []).map((s) => ({ id: uid(), title: s, done: false })));
  };

  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  const addSub = () => {
    const v = subInput.trim();
    if (v) setSubtasks([...subtasks, { id: uid(), title: v, done: false }]);
    setSubInput("");
  };

  const toggleSub = (id) =>
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const editSub = (id, title) =>
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, title } : s)));

  const moveSub = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= subtasks.length) return;
    const next = [...subtasks];
    [next[i], next[j]] = [next[j], next[i]];
    setSubtasks(next);
  };

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      tags,
      subtasks,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0A0A0A] border-border rounded-none sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="task-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading tracking-tight">
            {task ? "Edit Task" : "New Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!task && templates.length > 0 && (
            <div className="space-y-1.5 pb-3 border-b border-border">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#06B6D4]">
                Start from Template
              </Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger
                  data-testid="task-template-select"
                  className="bg-[#050505] border-border rounded-none font-mono"
                >
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-border rounded-none">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="font-mono">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Title</Label>
            <Input
              data-testid="task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Configure BGP peering on edge routers"
              className="bg-[#050505] border-border rounded-none font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Description</Label>
            <Textarea
              data-testid="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, commands, notes..."
              className="bg-[#050505] border-border rounded-none font-mono resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  data-testid="task-status-select"
                  className="bg-[#050505] border-border rounded-none font-mono"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-border rounded-none">
                  {STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key} className="font-mono">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger
                  data-testid="task-priority-select"
                  className="bg-[#050505] border-border rounded-none font-mono"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-border rounded-none">
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="font-mono">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Due Date</Label>
            <div className="flex items-center gap-2">
              <Input
                data-testid="task-due-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-[#050505] border-border rounded-none font-mono w-fit"
              />
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDueDate("")}
                  data-testid="task-clear-due-btn"
                  className="rounded-none text-[#71717A] hover:text-[#EF4444] h-9 px-2"
                >
                  <X size={14} className="mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Tags</Label>
            <div className="flex gap-2">
              <Input
                data-testid="task-tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="add tag + Enter"
                className="bg-[#050505] border-border rounded-none font-mono text-sm"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="rounded-none border-border shrink-0"
                data-testid="task-add-tag-btn"
              >
                <Plus size={14} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-[#141414] border border-border text-[#A1A1AA]"
                  >
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                      <X size={11} className="hover:text-[#EF4444]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">
              Subtasks ({subtasks.filter((s) => s.done).length}/{subtasks.length})
            </Label>
            <div className="flex gap-2">
              <Input
                data-testid="task-subtask-input"
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
                placeholder="add checklist item + Enter"
                className="bg-[#050505] border-border rounded-none font-mono text-sm"
              />
              <Button
                type="button"
                onClick={addSub}
                variant="outline"
                className="rounded-none border-border shrink-0"
                data-testid="task-add-subtask-btn"
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className="space-y-1 pt-1">
              {subtasks.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={s.done}
                    onCheckedChange={() => toggleSub(s.id)}
                    className="rounded-none border-border data-[state=checked]:bg-[#10B981] data-[state=checked]:border-[#10B981]"
                    data-testid={`subtask-check-${s.id}`}
                  />
                  <input
                    value={s.title}
                    onChange={(e) => editSub(s.id, e.target.value)}
                    data-testid={`subtask-edit-${s.id}`}
                    className={`text-sm flex-1 bg-transparent outline-none border-b border-transparent focus:border-[#3f3f46] px-0.5 ${
                      s.done ? "line-through text-[#52525B]" : "text-[#D4D4D8]"
                    }`}
                  />
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveSub(i, -1)}
                      data-testid={`subtask-up-${s.id}`}
                      disabled={i === 0}
                      className="text-[#52525B] hover:text-[#06B6D4] disabled:opacity-20"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSub(i, 1)}
                      data-testid={`subtask-down-${s.id}`}
                      disabled={i === subtasks.length - 1}
                      className="text-[#52525B] hover:text-[#06B6D4] disabled:opacity-20"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))}
                      className="text-[#52525B] hover:text-[#EF4444] ml-1"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {task && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-none text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                    data-testid="task-delete-btn"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0A0A0A] border-border rounded-none" data-testid="task-delete-confirm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading">Delete this task?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#A1A1AA]">
                      "{task.title}" and its {task.subtasks?.length || 0} subtask(s) will be permanently
                      removed. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none" data-testid="task-delete-cancel-btn">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      data-testid="task-delete-confirm-btn"
                      className="rounded-none bg-[#EF4444] text-white hover:bg-[#dc2626]"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-none">
              Cancel
            </Button>
            <Button
              onClick={submit}
              data-testid="task-save-btn"
              className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
            >
              {task ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
