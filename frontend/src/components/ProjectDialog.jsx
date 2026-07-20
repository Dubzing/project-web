import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PROJECT_COLORS } from "../lib/constants";
import { api } from "../lib/api";
import { LayoutTemplate } from "lucide-react";

export const ProjectDialog = ({ open, onOpenChange, onSave, project }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    if (open) {
      setName(project?.name || "");
      setDescription(project?.description || "");
      setColor(project?.color || PROJECT_COLORS[0]);
      setTemplateId("");
      if (!project) api.listProjectTemplates().then(setTemplates);
    }
  }, [open, project]);

  const applyTemplate = (id) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    if (!name.trim()) setName(tpl.name);
    setDescription(tpl.description || "");
    setColor(tpl.color || PROJECT_COLORS[0]);
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), color, templateId: templateId || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-border rounded-none sm:max-w-md" data-testid="project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-tight">
            {project ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!project && templates.length > 0 && (
            <div className="space-y-1.5 pb-3 border-b border-border">
              <Label className="text-xs uppercase tracking-[0.15em] text-[#06B6D4] flex items-center gap-1.5">
                <LayoutTemplate size={13} /> Clone from Project Template
              </Label>
              <Select value={templateId} onValueChange={applyTemplate}>
                <SelectTrigger
                  data-testid="project-template-select"
                  className="bg-[#050505] border-border rounded-none font-mono"
                >
                  <SelectValue placeholder="Start from scratch (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-border rounded-none">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="font-mono">
                      {t.name} ({t.tasks.length} tasks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templateId && (
                <p className="text-[11px] text-[#71717A]">
                  All tasks and subtasks from this template will be cloned into the new project.
                </p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Name</Label>
            <Input
              data-testid="project-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Network Migration"
              className="bg-[#050505] border-border rounded-none font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Description</Label>
            <Textarea
              data-testid="project-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary..."
              className="bg-[#050505] border-border rounded-none font-mono resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.15em] text-[#71717A]">Color</Label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  data-testid={`project-color-${c}`}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 transition-transform duration-150 ${
                    color === c ? "ring-2 ring-offset-2 ring-offset-[#0A0A0A] ring-white scale-105" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-none"
            data-testid="project-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            data-testid="project-save-btn"
            className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
          >
            {project ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
