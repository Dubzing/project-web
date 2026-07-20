import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderGit2, ListTodo, CircleDot, CheckCircle2, AlertTriangle, Clock, Plus, CalendarClock } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { PRIORITIES, dueMeta } from "../lib/constants";

const StatCard = ({ label, value, icon: Icon, accent, testid }) => (
  <div className="bg-[#0A0A0A] border border-border p-5" data-testid={testid}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A]">{label}</span>
      <Icon size={16} style={{ color: accent }} />
    </div>
    <div className="font-heading text-4xl font-bold mt-3" style={{ color: accent }}>
      {value}
    </div>
  </div>
);

export default function Dashboard({ projects, onNewProject }) {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.stats().then(setStats);
  }, [projects]);

  if (!stats) return <div className="p-8 text-[#71717A]" data-testid="dashboard-loading">Loading...</div>;

  return (
    <div className="flex-1 min-h-screen" data-testid="dashboard">
      <header className="border-b border-border px-8 py-6 bg-[#070707]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#06B6D4] mb-1">
              // ops overview
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Dashboard
            </h1>
          </div>
          <Button
            onClick={onNewProject}
            data-testid="dashboard-new-project-btn"
            className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
          >
            <Plus size={16} className="mr-1.5" /> New Project
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projects" value={stats.total_projects} icon={FolderGit2} accent="#F4F4F5" testid="stat-projects" />
          <StatCard label="Total Tasks" value={stats.total_tasks} icon={ListTodo} accent="#F4F4F5" testid="stat-tasks" />
          <StatCard label="In Progress" value={stats.in_progress} icon={CircleDot} accent="#06B6D4" testid="stat-inprogress" />
          <StatCard label="Completed" value={stats.done} icon={CheckCircle2} accent="#10B981" testid="stat-done" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="#EF4444" testid="stat-overdue" />
          <StatCard label="Due Soon (3d)" value={stats.due_soon} icon={Clock} accent="#F59E0B" testid="stat-duesoon" />
          <div className="bg-[#0A0A0A] border border-border p-5" data-testid="stat-completion">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A]">Completion Rate</span>
              <span className="font-heading text-xl font-bold text-[#10B981]">{stats.completion}%</span>
            </div>
            <div className="mt-4 h-2 bg-[#141414] w-full">
              <div className="h-full bg-[#10B981] transition-all duration-500" style={{ width: `${stats.completion}%` }} />
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] mb-3 flex items-center gap-2">
            <CalendarClock size={13} /> Upcoming Deadlines
          </div>
          {stats.upcoming.length === 0 ? (
            <div className="border border-dashed border-border px-5 py-6 text-sm text-[#52525B]" data-testid="no-upcoming">
              No open tasks with due dates. You're all caught up.
            </div>
          ) : (
            <div className="border border-border" data-testid="upcoming-list">
              {stats.upcoming.map((t, i) => {
                const prio = PRIORITIES[t.priority] || PRIORITIES.medium;
                const due = dueMeta(t.due_date);
                return (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/project/${t.project_id}`)}
                    data-testid={`upcoming-task-${t.id}`}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[#0f0f0f] transition-colors duration-150 ${
                      i !== stats.upcoming.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span className="w-1 h-8 shrink-0" style={{ backgroundColor: prio.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#F4F4F5] truncate font-heading font-medium">{t.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5" style={{ backgroundColor: t.project_color }} />
                        <span className="text-[11px] text-[#71717A]">{t.project_name}</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-wider shrink-0"
                      style={{ color: prio.color }}
                    >
                      {prio.label}
                    </span>
                    <span
                      className="text-xs font-mono shrink-0 w-28 text-right"
                      style={{ color: due?.color }}
                    >
                      {due?.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] mb-3">
            Project Progress
          </div>
          {stats.per_project.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center" data-testid="no-projects">
              <FolderGit2 size={32} className="mx-auto text-[#3f3f46] mb-3" />
              <p className="text-[#71717A] text-sm mb-4">No projects yet. Create your first one.</p>
              <Button
                onClick={onNewProject}
                className="rounded-none bg-[#06B6D4] text-black hover:bg-[#0891b2] font-semibold"
                data-testid="empty-new-project-btn"
              >
                <Plus size={16} className="mr-1.5" /> New Project
              </Button>
            </div>
          ) : (
            <div className="border border-border">
              {stats.per_project.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  data-testid={`dashboard-project-${p.id}`}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#0f0f0f] transition-colors duration-150 ${
                    i !== stats.per_project.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-heading font-medium text-[#F4F4F5] w-48 truncate">{p.name}</span>
                  <div className="flex-1 h-1.5 bg-[#141414]">
                    <div className="h-full transition-all duration-500" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                  </div>
                  <span className="text-xs text-[#71717A] w-16 text-right font-mono">
                    {p.done}/{p.total}
                  </span>
                  <span className="text-sm font-mono w-12 text-right" style={{ color: p.color }}>
                    {p.progress}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
