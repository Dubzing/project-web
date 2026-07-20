import { useState, useEffect, useCallback } from "react";
import { Plus, LayoutTemplate, Pencil, Trash2, ListChecks, FolderGit2, Layers } from "lucide-react";
import { api } from "../lib/api";
import { PRIORITIES } from "../lib/constants";
import { TemplateDialog } from "../components/TemplateDialog";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [projectTemplates, setProjectTemplates] = useState([]);
  const [dialog, setDialog] = useState({ open: false, template: null });

  const load = useCallback(async () => {
    const [tpls, ptpls] = await Promise.all([api.listTemplates(), api.listProjectTemplates()]);
    setTemplates(tpls);
    setProjectTemplates(ptpls);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (data) => {
    if (dialog.template) {
      await api.updateTemplate(dialog.template.id, data);
      toast.success("Template updated");
    } else {
      await api.createTemplate(data);
      toast.success("Template created");
    }
    setDialog({ open: false, template: null });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    await api.deleteTemplate(id);
    toast.success("Template deleted");
    load();
  };

  const removeProjectTemplate = async (id) => {
    if (!window.confirm("Delete this project template?")) return;
    await api.deleteProjectTemplate(id);
    toast.success("Project template deleted");
    load();
  };

  return (
    <div className="flex-1 min-h-screen" data-testid="templates-page">
      <header className="border-b border-border px-8 py-6 bg-[#070707]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#06B6D4] mb-1">
              // reusable blueprints
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Templates
            </h1>
          </div>
          <Button
            onClick={() => setDialog({ open: true, template: null })}
            data-testid="new-template-btn"
            className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
          >
            <Plus size={16} className="mr-1.5" /> New Task Template
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-10">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] mb-3 flex items-center gap-2">
            <Layers size={13} /> Project Templates
          </div>
          {projectTemplates.length === 0 ? (
            <div className="border border-dashed border-border px-5 py-8 text-center" data-testid="no-project-templates">
              <p className="text-[#71717A] text-sm mb-1">No project templates yet.</p>
              <p className="text-[#52525B] text-xs max-w-lg mx-auto">
                Open any project, use the ⋮ menu → "Save as Template" to capture its entire task list
                (with subtasks) as a reusable blueprint. Then clone it when creating a new project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="project-templates-grid">
              {projectTemplates.map((pt) => (
                <div
                  key={pt.id}
                  data-testid={`project-template-card-${pt.id}`}
                  className="bg-[#0A0A0A] border border-border group"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="flex items-center gap-2 font-heading font-semibold text-[#F4F4F5] truncate">
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: pt.color }} />
                      {pt.name}
                    </span>
                    <button
                      onClick={() => removeProjectTemplate(pt.id)}
                      data-testid={`delete-project-template-${pt.id}`}
                      className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#EF4444] transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
                      <FolderGit2 size={12} /> {pt.tasks.length} task(s)
                    </span>
                    <div className="text-xs text-[#52525B] space-y-0.5">
                      {pt.tasks.slice(0, 4).map((t, i) => (
                        <div key={i} className="truncate">
                          • {t.title}
                          {t.subtasks.length > 0 && (
                            <span className="text-[#3f3f46]"> ({t.subtasks.length})</span>
                          )}
                        </div>
                      ))}
                      {pt.tasks.length > 4 && (
                        <div className="text-[#3f3f46]">+{pt.tasks.length - 4} more</div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#3f3f46] pt-1">
                      Clone via New Project → "Clone from Project Template"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] mb-3 flex items-center gap-2">
            <LayoutTemplate size={13} /> Task Templates
          </div>
        {templates.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center" data-testid="no-templates">
            <LayoutTemplate size={32} className="mx-auto text-[#3f3f46] mb-3" />
            <p className="text-[#71717A] text-sm mb-2">No templates yet.</p>
            <p className="text-[#52525B] text-xs mb-4 max-w-md mx-auto">
              Create a template for recurring work (site turnups, change requests, server builds) and
              spin up ready-to-go tasks with a single click.
            </p>
            <Button
              onClick={() => setDialog({ open: true, template: null })}
              className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
              data-testid="empty-new-template-btn"
            >
              <Plus size={16} className="mr-1.5" /> New Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const prio = PRIORITIES[tpl.priority] || PRIORITIES.medium;
              return (
                <div
                  key={tpl.id}
                  data-testid={`template-card-${tpl.id}`}
                  className="bg-[#0A0A0A] border border-border group"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-heading font-semibold text-[#F4F4F5] truncate">{tpl.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDialog({ open: true, template: tpl })}
                        data-testid={`edit-template-${tpl.id}`}
                        className="text-[#52525B] hover:text-[#06B6D4]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(tpl.id)}
                        data-testid={`delete-template-${tpl.id}`}
                        className="text-[#52525B] hover:text-[#EF4444]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {tpl.title && <p className="text-sm text-[#D4D4D8]">{tpl.title}</p>}
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="uppercase tracking-wider" style={{ color: prio.color }}>
                        {prio.label}
                      </span>
                      {tpl.subtasks.length > 0 && (
                        <span className="flex items-center gap-1 text-[#71717A]">
                          <ListChecks size={12} /> {tpl.subtasks.length} steps
                        </span>
                      )}
                    </div>
                    {tpl.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tpl.tags.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-[#141414] border border-border text-[#A1A1AA]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      <TemplateDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}
        onSave={save}
        template={dialog.template}
      />
    </div>
  );
}
