import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Search, FolderGit2, ListTodo } from "lucide-react";
import { api } from "../lib/api";
import { PRIORITIES } from "../lib/constants";

export const SearchDialog = ({ open, onOpenChange }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults({ projects: [], tasks: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setResults({ projects: [], tasks: [] });
      return;
    }
    const t = setTimeout(async () => {
      setResults(await api.search(q));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults = results.projects.length > 0 || results.tasks.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0A0A0A] border-border rounded-none sm:max-w-xl p-0 gap-0 top-[15%] translate-y-0"
        data-testid="search-dialog"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={18} className="text-[#71717A]" />
          <input
            ref={inputRef}
            data-testid="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, tasks, tags..."
            className="flex-1 bg-transparent outline-none text-sm text-[#F4F4F5] font-mono placeholder:text-[#52525B]"
          />
          <kbd className="text-[10px] text-[#52525B] border border-border px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {q.trim() && !hasResults && (
            <div className="px-4 py-8 text-center text-sm text-[#52525B]" data-testid="search-empty">
              No results for "{q}"
            </div>
          )}

          {results.projects.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-[#52525B]">
                Projects
              </div>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  data-testid={`search-project-${p.id}`}
                  onClick={() => go(`/project/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#141414] transition-colors duration-150"
                >
                  <FolderGit2 size={15} style={{ color: p.color }} />
                  <span className="text-sm text-[#F4F4F5]">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {results.tasks.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-[#52525B]">
                Tasks
              </div>
              {results.tasks.map((t) => {
                const prio = PRIORITIES[t.priority] || PRIORITIES.medium;
                return (
                  <button
                    key={t.id}
                    data-testid={`search-task-${t.id}`}
                    onClick={() => go(`/project/${t.project_id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#141414] transition-colors duration-150"
                  >
                    <ListTodo size={15} className="text-[#71717A] shrink-0" />
                    <span className="text-sm text-[#F4F4F5] truncate flex-1">{t.title}</span>
                    <span className="text-[10px] text-[#52525B] shrink-0">{t.project_name}</span>
                    <span
                      className="text-[10px] uppercase tracking-wider shrink-0"
                      style={{ color: prio.color }}
                    >
                      {prio.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
