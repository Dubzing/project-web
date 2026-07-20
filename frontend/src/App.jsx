import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { ProjectDialog } from "./components/ProjectDialog";
import { SearchDialog } from "./components/SearchDialog";
import Dashboard from "./pages/Dashboard";
import ProjectBoard from "./pages/ProjectBoard";
import Templates from "./pages/Templates";
import { api } from "./lib/api";

function Shell() {
  const [projects, setProjects] = useState([]);
  const [newOpen, setNewOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    setProjects(await api.listProjects());
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const createProject = async (data) => {
    const { templateId, ...rest } = data;
    let p;
    if (templateId) {
      p = await api.createProjectFromTemplate(templateId, { name: rest.name, color: rest.color });
    } else {
      p = await api.createProject(rest);
    }
    setNewOpen(false);
    await loadProjects();
    toast.success("Project created");
    navigate(`/project/${p.id}`);
  };

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar
        projects={projects}
        onNewProject={() => setNewOpen(true)}
        onRefresh={loadProjects}
        onSearch={() => setSearchOpen(true)}
      />
      <Routes>
        <Route path="/" element={<Dashboard projects={projects} onNewProject={() => setNewOpen(true)} />} />
        <Route path="/templates" element={<Templates />} />
        <Route
          path="/project/:projectId"
          element={<ProjectBoard projects={projects} onProjectsChange={loadProjects} />}
        />
      </Routes>
      <ProjectDialog open={newOpen} onOpenChange={setNewOpen} onSave={createProject} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
