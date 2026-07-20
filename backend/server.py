from __future__ import annotations

import json
import logging
import os
import sqlite3
import uuid
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, List, Optional

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DB_PATH", ROOT_DIR / "data" / "projects.db")).resolve()
STATIC_DIR = Path(os.getenv("STATIC_DIR", ROOT_DIR / "static")).resolve()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def dump_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def load_json(value: Optional[str], default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default


@contextmanager
def db_connection() -> Iterator[sqlite3.Connection]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db() -> None:
    with db_connection() as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = NORMAL")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL DEFAULT '#06B6D4',
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'todo',
                priority TEXT NOT NULL DEFAULT 'medium',
                due_date TEXT,
                tags TEXT NOT NULL DEFAULT '[]',
                subtasks TEXT NOT NULL DEFAULT '[]',
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'medium',
                tags TEXT NOT NULL DEFAULT '[]',
                subtasks TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS project_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL DEFAULT '#06B6D4',
                tasks TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_projects_status
                ON projects(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_project_status_order
                ON tasks(project_id, status, sort_order);
            CREATE INDEX IF NOT EXISTS idx_tasks_due_date
                ON tasks(due_date);
            """
        )
    logger.info("SQLite database ready at %s", DB_PATH)


def row_to_project(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def row_to_task(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["order"] = item.pop("sort_order")
    item["tags"] = load_json(item.get("tags"), [])
    item["subtasks"] = load_json(item.get("subtasks"), [])
    return item


def row_to_template(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["tags"] = load_json(item.get("tags"), [])
    item["subtasks"] = load_json(item.get("subtasks"), [])
    return item


def row_to_project_template(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["tasks"] = load_json(item.get("tasks"), [])
    return item


def fetch_project(connection: sqlite3.Connection, project_id: str) -> Optional[dict[str, Any]]:
    row = connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return row_to_project(row) if row else None


def fetch_task(connection: sqlite3.Connection, task_id: str) -> Optional[dict[str, Any]]:
    row = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_task(row) if row else None


def fetch_template(connection: sqlite3.Connection, template_id: str) -> Optional[dict[str, Any]]:
    row = connection.execute("SELECT * FROM templates WHERE id = ?", (template_id,)).fetchone()
    return row_to_template(row) if row else None


def fetch_project_template(
    connection: sqlite3.Connection, template_id: str
) -> Optional[dict[str, Any]]:
    row = connection.execute(
        "SELECT * FROM project_templates WHERE id = ?", (template_id,)
    ).fetchone()
    return row_to_project_template(row) if row else None


# ---------- Models ----------
class Subtask(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    done: bool = False


class Project(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    description: str = ""
    color: str = "#06B6D4"
    status: str = "active"
    created_at: str = Field(default_factory=now_iso)


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    color: str = "#06B6D4"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None


class Task(BaseModel):
    id: str = Field(default_factory=new_id)
    project_id: str
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    subtasks: List[Subtask] = Field(default_factory=list)
    order: int = 0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    subtasks: List[Subtask] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    tags: Optional[List[str]] = None
    subtasks: Optional[List[Subtask]] = None
    order: Optional[int] = None


class Template(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    title: str = ""
    description: str = ""
    priority: str = "medium"
    tags: List[str] = Field(default_factory=list)
    subtasks: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)


class TemplateCreate(BaseModel):
    name: str
    title: str = ""
    description: str = ""
    priority: str = "medium"
    tags: List[str] = Field(default_factory=list)
    subtasks: List[str] = Field(default_factory=list)


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    subtasks: Optional[List[str]] = None


class PTemplateTask(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    tags: List[str] = Field(default_factory=list)
    subtasks: List[str] = Field(default_factory=list)


class ProjectTemplate(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    description: str = ""
    color: str = "#06B6D4"
    tasks: List[PTemplateTask] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)


class SaveAsTemplatePayload(BaseModel):
    name: str


class CreateFromTemplatePayload(BaseModel):
    name: str
    color: Optional[str] = None


class ReorderPayload(BaseModel):
    status: str
    ordered_ids: List[str]


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Projects", version="1.0.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ---------- Health ----------
@api_router.get("/health")
def health() -> dict[str, str]:
    with db_connection() as connection:
        connection.execute("SELECT 1").fetchone()
    return {"status": "ok"}


# ---------- Project routes ----------
@api_router.get("/projects", response_model=List[Project])
def list_projects():
    with db_connection() as connection:
        rows = connection.execute("SELECT * FROM projects ORDER BY created_at").fetchall()
    return [row_to_project(row) for row in rows]


@api_router.post("/projects", response_model=Project)
def create_project(payload: ProjectCreate):
    project = Project(**payload.model_dump())
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO projects (id, name, description, color, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                project.id,
                project.name,
                project.description,
                project.color,
                project.status,
                project.created_at,
            ),
        )
    return project


@api_router.put("/projects/{project_id}", response_model=Project)
def update_project(project_id: str, payload: ProjectUpdate):
    updates = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    with db_connection() as connection:
        if updates:
            assignments = ", ".join(f"{key} = ?" for key in updates)
            connection.execute(
                f"UPDATE projects SET {assignments} WHERE id = ?",
                (*updates.values(), project_id),
            )
        project = fetch_project(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@api_router.delete("/projects/{project_id}")
def delete_project(project_id: str):
    with db_connection() as connection:
        connection.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return {"ok": True}


# ---------- Task routes ----------
@api_router.get("/tasks", response_model=List[Task])
def list_tasks(project_id: Optional[str] = None):
    with db_connection() as connection:
        if project_id:
            rows = connection.execute(
                "SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order, created_at",
                (project_id,),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM tasks ORDER BY sort_order, created_at"
            ).fetchall()
    return [row_to_task(row) for row in rows]


@api_router.post("/tasks", response_model=Task)
def create_task(payload: TaskCreate):
    with db_connection() as connection:
        project = fetch_project(connection, payload.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        order = connection.execute(
            "SELECT COUNT(*) FROM tasks WHERE project_id = ? AND status = ?",
            (payload.project_id, payload.status),
        ).fetchone()[0]
        task = Task(**payload.model_dump(), order=order)
        connection.execute(
            """
            INSERT INTO tasks (
                id, project_id, title, description, status, priority, due_date,
                tags, subtasks, sort_order, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task.id,
                task.project_id,
                task.title,
                task.description,
                task.status,
                task.priority,
                task.due_date,
                dump_json(task.tags),
                dump_json([item.model_dump() for item in task.subtasks]),
                task.order,
                task.created_at,
                task.updated_at,
            ),
        )
    return task


@api_router.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, payload: TaskUpdate):
    updates = payload.model_dump(exclude_unset=True)
    if "tags" in updates and updates["tags"] is not None:
        updates["tags"] = dump_json(updates["tags"])
    if "subtasks" in updates and updates["subtasks"] is not None:
        updates["subtasks"] = dump_json(
            [item.model_dump() if isinstance(item, Subtask) else item for item in updates["subtasks"]]
        )
    if "order" in updates:
        updates["sort_order"] = updates.pop("order")
    updates["updated_at"] = now_iso()

    with db_connection() as connection:
        assignments = ", ".join(f"{key} = ?" for key in updates)
        connection.execute(
            f"UPDATE tasks SET {assignments} WHERE id = ?",
            (*updates.values(), task_id),
        )
        task = fetch_task(connection, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@api_router.post("/tasks/reorder")
def reorder_tasks(payload: ReorderPayload):
    timestamp = now_iso()
    with db_connection() as connection:
        connection.executemany(
            "UPDATE tasks SET sort_order = ?, status = ?, updated_at = ? WHERE id = ?",
            [
                (position, payload.status, timestamp, task_id)
                for position, task_id in enumerate(payload.ordered_ids)
            ],
        )
    return {"ok": True}


@api_router.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    with db_connection() as connection:
        connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    return {"ok": True}


# ---------- Dashboard ----------
@api_router.get("/dashboard/stats")
def dashboard_stats():
    with db_connection() as connection:
        project_rows = connection.execute(
            "SELECT * FROM projects WHERE status != 'closed' ORDER BY created_at"
        ).fetchall()
        task_rows = connection.execute(
            """
            SELECT tasks.*
            FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE projects.status != 'closed'
            """
        ).fetchall()

    projects = [row_to_project(row) for row in project_rows]
    tasks = [row_to_task(row) for row in task_rows]
    total_tasks = len(tasks)
    done = sum(1 for task in tasks if task["status"] == "done")
    in_progress = sum(1 for task in tasks if task["status"] == "in_progress")
    todo = sum(1 for task in tasks if task["status"] == "todo")

    today = datetime.now(timezone.utc).date()
    overdue = 0
    due_soon = 0
    for task in tasks:
        if task["status"] == "done" or not task.get("due_date"):
            continue
        try:
            due = datetime.fromisoformat(task["due_date"]).date()
        except (TypeError, ValueError):
            continue
        if due < today:
            overdue += 1
        elif (due - today).days <= 3:
            due_soon += 1

    per_project = []
    for project in projects:
        project_tasks = [task for task in tasks if task["project_id"] == project["id"]]
        project_done = sum(1 for task in project_tasks if task["status"] == "done")
        per_project.append(
            {
                "id": project["id"],
                "name": project["name"],
                "color": project["color"],
                "total": len(project_tasks),
                "done": project_done,
                "progress": round(project_done / len(project_tasks) * 100)
                if project_tasks
                else 0,
            }
        )

    project_map = {project["id"]: project for project in projects}
    upcoming_source = [
        task for task in tasks if task["status"] != "done" and task.get("due_date")
    ]
    upcoming_source.sort(key=lambda task: task["due_date"])
    upcoming = []
    for task in upcoming_source[:5]:
        project = project_map.get(task["project_id"], {})
        upcoming.append(
            {
                "id": task["id"],
                "title": task["title"],
                "due_date": task["due_date"],
                "priority": task["priority"],
                "status": task["status"],
                "project_id": task["project_id"],
                "project_name": project.get("name", ""),
                "project_color": project.get("color", "#06B6D4"),
            }
        )

    return {
        "total_projects": len(projects),
        "total_tasks": total_tasks,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "overdue": overdue,
        "due_soon": due_soon,
        "completion": round(done / total_tasks * 100) if total_tasks else 0,
        "per_project": per_project,
        "upcoming": upcoming,
    }


# ---------- Search ----------
@api_router.get("/search")
def search(q: str = ""):
    query = q.strip()
    if not query:
        return {"projects": [], "tasks": []}

    pattern = f"%{query}%"
    with db_connection() as connection:
        project_rows = connection.execute(
            "SELECT * FROM projects WHERE name LIKE ? COLLATE NOCASE LIMIT 50",
            (pattern,),
        ).fetchall()
        task_rows = connection.execute(
            """
            SELECT tasks.*, projects.name AS project_name, projects.color AS project_color
            FROM tasks
            JOIN projects ON projects.id = tasks.project_id
            WHERE tasks.title LIKE ? COLLATE NOCASE
               OR tasks.description LIKE ? COLLATE NOCASE
               OR tasks.tags LIKE ? COLLATE NOCASE
            LIMIT 100
            """,
            (pattern, pattern, pattern),
        ).fetchall()

    projects = [row_to_project(row) for row in project_rows]
    tasks = []
    for row in task_rows:
        task = row_to_task(row)
        project_name = task.pop("project_name")
        project_color = task.pop("project_color")
        task["project_name"] = project_name
        task["project_color"] = project_color
        tasks.append(task)
    return {"projects": projects, "tasks": tasks}


# ---------- Templates ----------
@api_router.get("/templates", response_model=List[Template])
def list_templates():
    with db_connection() as connection:
        rows = connection.execute("SELECT * FROM templates ORDER BY created_at").fetchall()
    return [row_to_template(row) for row in rows]


@api_router.post("/templates", response_model=Template)
def create_template(payload: TemplateCreate):
    template = Template(**payload.model_dump())
    with db_connection() as connection:
        connection.execute(
            """
            INSERT INTO templates (
                id, name, title, description, priority, tags, subtasks, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                template.id,
                template.name,
                template.title,
                template.description,
                template.priority,
                dump_json(template.tags),
                dump_json(template.subtasks),
                template.created_at,
            ),
        )
    return template


@api_router.put("/templates/{template_id}", response_model=Template)
def update_template(template_id: str, payload: TemplateUpdate):
    updates = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    if "tags" in updates:
        updates["tags"] = dump_json(updates["tags"])
    if "subtasks" in updates:
        updates["subtasks"] = dump_json(updates["subtasks"])

    with db_connection() as connection:
        if updates:
            assignments = ", ".join(f"{key} = ?" for key in updates)
            connection.execute(
                f"UPDATE templates SET {assignments} WHERE id = ?",
                (*updates.values(), template_id),
            )
        template = fetch_template(connection, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@api_router.delete("/templates/{template_id}")
def delete_template(template_id: str):
    with db_connection() as connection:
        connection.execute("DELETE FROM templates WHERE id = ?", (template_id,))
    return {"ok": True}


# ---------- Project close / reopen ----------
@api_router.post("/projects/{project_id}/close", response_model=Project)
def close_project(project_id: str):
    with db_connection() as connection:
        project = fetch_project(connection, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        task_rows = connection.execute(
            "SELECT status FROM tasks WHERE project_id = ?", (project_id,)
        ).fetchall()
        if not task_rows:
            raise HTTPException(status_code=400, detail="Add and complete tasks before closing")
        if any(row["status"] != "done" for row in task_rows):
            raise HTTPException(status_code=400, detail="All tasks must be done to close a project")
        connection.execute(
            "UPDATE projects SET status = 'closed' WHERE id = ?", (project_id,)
        )
        project = fetch_project(connection, project_id)
    return project


@api_router.post("/projects/{project_id}/reopen", response_model=Project)
def reopen_project(project_id: str):
    with db_connection() as connection:
        project = fetch_project(connection, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        connection.execute(
            "UPDATE projects SET status = 'active' WHERE id = ?", (project_id,)
        )
        project = fetch_project(connection, project_id)
    return project


# ---------- Project templates ----------
@api_router.get("/project-templates", response_model=List[ProjectTemplate])
def list_project_templates():
    with db_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM project_templates ORDER BY created_at"
        ).fetchall()
    return [row_to_project_template(row) for row in rows]


@api_router.post("/projects/{project_id}/save-as-template", response_model=ProjectTemplate)
def save_project_as_template(project_id: str, payload: SaveAsTemplatePayload):
    with db_connection() as connection:
        project = fetch_project(connection, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        task_rows = connection.execute(
            "SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order",
            (project_id,),
        ).fetchall()
        tasks = [row_to_task(row) for row in task_rows]
        template_tasks = [
            PTemplateTask(
                title=task["title"],
                description=task["description"],
                priority=task["priority"],
                tags=task["tags"],
                subtasks=[subtask["title"] for subtask in task["subtasks"]],
            )
            for task in tasks
        ]
        template = ProjectTemplate(
            name=payload.name,
            description=project["description"],
            color=project["color"],
            tasks=template_tasks,
        )
        connection.execute(
            """
            INSERT INTO project_templates (id, name, description, color, tasks, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                template.id,
                template.name,
                template.description,
                template.color,
                dump_json([task.model_dump() for task in template.tasks]),
                template.created_at,
            ),
        )
    return template


@api_router.post("/project-templates/{template_id}/create-project", response_model=Project)
def create_project_from_template(template_id: str, payload: CreateFromTemplatePayload):
    with db_connection() as connection:
        template = fetch_project_template(connection, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Project template not found")

        project = Project(
            name=payload.name,
            description=template["description"],
            color=payload.color or template["color"],
        )
        connection.execute(
            """
            INSERT INTO projects (id, name, description, color, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                project.id,
                project.name,
                project.description,
                project.color,
                project.status,
                project.created_at,
            ),
        )

        for position, template_task in enumerate(template["tasks"]):
            task = Task(
                project_id=project.id,
                title=template_task["title"],
                description=template_task.get("description", ""),
                priority=template_task.get("priority", "medium"),
                tags=template_task.get("tags", []),
                subtasks=[Subtask(title=title) for title in template_task.get("subtasks", [])],
                order=position,
            )
            connection.execute(
                """
                INSERT INTO tasks (
                    id, project_id, title, description, status, priority, due_date,
                    tags, subtasks, sort_order, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task.id,
                    task.project_id,
                    task.title,
                    task.description,
                    task.status,
                    task.priority,
                    task.due_date,
                    dump_json(task.tags),
                    dump_json([item.model_dump() for item in task.subtasks]),
                    task.order,
                    task.created_at,
                    task.updated_at,
                ),
            )
    return project


@api_router.delete("/project-templates/{template_id}")
def delete_project_template(template_id: str):
    with db_connection() as connection:
        connection.execute("DELETE FROM project_templates WHERE id = ?", (template_id,))
    return {"ok": True}


app.include_router(api_router)

# Vite's production build is copied into STATIC_DIR by the Dockerfile.
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        requested_file = (STATIC_DIR / full_path).resolve()
        if (
            full_path
            and requested_file.is_file()
            and STATIC_DIR in requested_file.parents
        ):
            return FileResponse(requested_file)
        return FileResponse(STATIC_DIR / "index.html")
