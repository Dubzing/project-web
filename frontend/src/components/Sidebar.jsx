import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { LayoutDashboard, FolderGit2, Plus, Server, Trash2, Terminal, Search, LayoutTemplate, ChevronRight, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

export const Sidebar = ({ projects, onNewProject, onRefresh, onSearch, active }) => {
  const [time, setTime] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams();

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this project and all its tasks?")) return;
    await api.deleteProject(id);
    if (projectId === id) navigate("/");
    onRefresh();
  };

  const linkBase =
    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 border-l-2";

  const activeProjects = projects.filter((p) => p.status !== "closed");
  const closedProjects = projects.filter((p) => p.status === "closed");

  return (
    <aside
      data-testid="sidebar"
      className="w-64 shrink-0 border-r border-border bg-[#070707] h-screen sticky top-0 flex flex-col"
    >
      <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#06B6D4] flex items-center justify-center">
          <Terminal size={18} className="text-black" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-heading font-bold text-base leading-none tracking-tight text-[#F4F4F5]">
            NETRACK
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] mt-1">ops console</div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={onSearch}
          data-testid="sidebar-search-btn"
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#0f0f0f] border border-border text-[#71717A] hover:text-[#F4F4F5] hover:border-[#3f3f46] transition-colors duration-150 text-sm"
        >
          <Search size={15} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] border border-border px-1.5 py-0.5">⌘K</kbd>
        </button>
      </div>

      <nav className="py-3">
        <NavLink
          to="/"
          data-testid="nav-dashboard"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? "border-[#06B6D4] bg-[#0f0f0f] text-[#F4F4F5]"
                : "border-transparent text-[#A1A1AA] hover:bg-[#0f0f0f] hover:text-[#F4F4F5]"
            }`
          }
          end
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>
        <NavLink
          to="/templates"
          data-testid="nav-templates"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? "border-[#06B6D4] bg-[#0f0f0f] text-[#F4F4F5]"
                : "border-transparent text-[#A1A1AA] hover:bg-[#0f0f0f] hover:text-[#F4F4F5]"
            }`
          }
        >
          <LayoutTemplate size={16} />
          Templates
        </NavLink>
      </nav>

      <div className="px-4 py-2 flex items-center justify-between border-t border-border">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A]">Projects</span>
        <button
          data-testid="sidebar-new-project-btn"
          onClick={onNewProject}
          className="text-[#71717A] hover:text-[#06B6D4] transition-colors duration-150"
          title="New project"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeProjects.length === 0 && (
          <div className="px-4 py-3 text-xs text-[#52525B]">No active projects.</div>
        )}
        {activeProjects.map((p) => (
          <NavLink
            key={p.id}
            to={`/project/${p.id}`}
            data-testid={`nav-project-${p.id}`}
            className={({ isActive }) =>
              `${linkBase} group justify-between ${
                isActive
                  ? "border-[#06B6D4] bg-[#0f0f0f] text-[#F4F4F5]"
                  : "border-transparent text-[#A1A1AA] hover:bg-[#0f0f0f] hover:text-[#F4F4F5]"
              }`
            }
          >
            <span className="flex items-center gap-3 truncate">
              <span className="w-2 h-2 shrink-0" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </span>
            <button
              data-testid={`delete-project-${p.id}`}
              onClick={(e) => handleDelete(e, p.id)}
              className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#EF4444] transition-all duration-150"
            >
              <Trash2 size={13} />
            </button>
          </NavLink>
        ))}

        {closedProjects.length > 0 && (
          <div className="mt-2 border-t border-border">
            <button
              onClick={() => setShowClosed((s) => !s)}
              data-testid="toggle-closed-projects"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
            >
              <ChevronRight
                size={12}
                className={`transition-transform duration-150 ${showClosed ? "rotate-90" : ""}`}
              />
              Closed ({closedProjects.length})
            </button>
            {showClosed &&
              closedProjects.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/project/${p.id}`}
                  data-testid={`nav-project-${p.id}`}
                  className={({ isActive }) =>
                    `${linkBase} group justify-between ${
                      isActive
                        ? "border-[#10B981] bg-[#0f0f0f] text-[#A1A1AA]"
                        : "border-transparent text-[#52525B] hover:bg-[#0f0f0f] hover:text-[#A1A1AA]"
                    }`
                  }
                >
                  <span className="flex items-center gap-3 truncate">
                    <CheckCircle2 size={13} className="shrink-0 text-[#10B981]" />
                    <span className="truncate line-through decoration-[#3f3f46]">{p.name}</span>
                  </span>
                  <button
                    data-testid={`delete-project-${p.id}`}
                    onClick={(e) => handleDelete(e, p.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#EF4444] transition-all duration-150"
                  >
                    <Trash2 size={13} />
                  </button>
                </NavLink>
              ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border text-[10px] text-[#52525B] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Server size={11} /> uptime
        </span>
        <span className="text-[#06B6D4] font-mono" data-testid="sidebar-clock">
          {time}
        </span>
      </div>
    </aside>
  );
};
