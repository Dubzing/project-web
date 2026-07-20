import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { PRIORITIES } from "../lib/constants";

export const TemplateDialog = ({ open, onOpenChange, onSave, template }) => {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [subInput, setSubInput] = useState("");

  useEffect(() => {
    if (open) {
      setName(template?.name || "");
      setTitle(template?.title || "");
      setDescription(template?.description || "");
      setPriority(template?.priority || "medium");
      setTags(template?.tags || []);
      setSubtasks(template?.subtasks || []);
      setTagInput("");
      setSubInput("");
    }
  }, [open, template]);

  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };
  const addSub = () => {
    const v = subInput.trim();
    if (v) setSubtasks([...subtasks, v]);
    setSubInput("");
  };
  const moveSub = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= subtasks.length) return;
    const next = [...subtasks];
    [next[i], next[j]] = [next[j], next[i]];
    setSubtasks(next);
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      title: title.trim(),
      description: description.trim(),
      priority,
      tags,
      subtasks,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0A0A0A] border-border rounded-none sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="template-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading tracking-tight">
            {template ? "Edit Template" : "New Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Template Name</Label>
            <Input
              data-testid="template-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Site Turnup"
              className="bg-[#050505] border-border rounded-none font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Default Task Title</Label>
            <Input
              data-testid="template-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Turn up new branch site"
              className="bg-[#050505] border-border rounded-none font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Description</Label>
            <Textarea
              data-testid="template-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#050505] border-border rounded-none font-mono resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger
                data-testid="template-priority-select"
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

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Tags</Label>
            <div className="flex gap-2">
              <Input
                data-testid="template-tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="add tag + Enter"
                className="bg-[#050505] border-border rounded-none font-mono text-sm"
              />
              <Button type="button" onClick={addTag} variant="outline" className="rounded-none border-border shrink-0">
                <Plus size={14} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-[#141414] border border-border text-[#A1A1AA]">
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
              Checklist Steps ({subtasks.length})
            </Label>
            <div className="flex gap-2">
              <Input
                data-testid="template-subtask-input"
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
                placeholder="add step + Enter"
                className="bg-[#050505] border-border rounded-none font-mono text-sm"
              />
              <Button type="button" onClick={addSub} variant="outline" className="rounded-none border-border shrink-0">
                <Plus size={14} />
              </Button>
            </div>
            <div className="space-y-1 pt-1">
              {subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2 group bg-[#050505] border border-border px-2 py-1.5">
                  <span className="text-[10px] text-[#52525B] font-mono w-5">{i + 1}.</span>
                  <span className="text-sm flex-1 text-[#D4D4D8]">{s}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveSub(i, -1)}
                      data-testid={`template-sub-up-${i}`}
                      className="text-[#52525B] hover:text-[#06B6D4] disabled:opacity-20"
                      disabled={i === 0}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSub(i, 1)}
                      data-testid={`template-sub-down-${i}`}
                      className="text-[#52525B] hover:text-[#06B6D4] disabled:opacity-20"
                      disabled={i === subtasks.length - 1}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => setSubtasks(subtasks.filter((_, x) => x !== i))}
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

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-none">
            Cancel
          </Button>
          <Button
            onClick={submit}
            data-testid="template-save-btn"
            className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
          >
            {template ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
