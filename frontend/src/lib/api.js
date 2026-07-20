const API = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // The response did not contain JSON.
    }
    const error = new Error(detail);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

const jsonOptions = (method, data) => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

export const api = {
  listProjects: () => request("/projects"),
  createProject: (data) => request("/projects", jsonOptions("POST", data)),
  updateProject: (id, data) => request(`/projects/${id}`, jsonOptions("PUT", data)),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  listTasks: (projectId) =>
    request(`/tasks${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ""}`),
  createTask: (data) => request("/tasks", jsonOptions("POST", data)),
  updateTask: (id, data) => request(`/tasks/${id}`, jsonOptions("PUT", data)),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  reorderTasks: (status, orderedIds) =>
    request("/tasks/reorder", jsonOptions("POST", { status, ordered_ids: orderedIds })),

  stats: () => request("/dashboard/stats"),
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),

  listTemplates: () => request("/templates"),
  createTemplate: (data) => request("/templates", jsonOptions("POST", data)),
  updateTemplate: (id, data) => request(`/templates/${id}`, jsonOptions("PUT", data)),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: "DELETE" }),

  closeProject: (id) => request(`/projects/${id}/close`, { method: "POST" }),
  reopenProject: (id) => request(`/projects/${id}/reopen`, { method: "POST" }),

  listProjectTemplates: () => request("/project-templates"),
  saveProjectAsTemplate: (id, name) =>
    request(`/projects/${id}/save-as-template`, jsonOptions("POST", { name })),
  createProjectFromTemplate: (templateId, data) =>
    request(`/project-templates/${templateId}/create-project`, jsonOptions("POST", data)),
  deleteProjectTemplate: (id) =>
    request(`/project-templates/${id}`, { method: "DELETE" }),
};
