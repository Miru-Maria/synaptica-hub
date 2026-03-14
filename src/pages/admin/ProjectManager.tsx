import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, ArrowLeft, CheckCircle2, Circle, Clock, AlertTriangle, Archive } from "lucide-react";

type ProjectStatus = "active" | "on-hold" | "complete";
type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface ProjectWithProgress {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  totalTasks: number;
  completedTasks: number;
}

interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  owner: string;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10));
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-emerald-400/15 text-emerald-400",
  "on-hold": "bg-amber-400/15 text-amber-400",
  complete: "bg-blue-400/15 text-blue-400",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  "on-hold": "On Hold",
  complete: "Complete",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-neutral-700 text-neutral-400",
  medium: "bg-amber-400/15 text-amber-400",
  high: "bg-red-400/15 text-red-400",
};

const TASK_STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle className="w-4 h-4 text-neutral-500" />,
  "in-progress": <Clock className="w-4 h-4 text-amber-400" />,
  done: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
};

export default function ProjectManager() {
  const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectWithProgress | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithProgress | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "active" as ProjectStatus, startDate: "", dueDate: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "todo" as TaskStatus, owner: "", priority: "medium" as TaskPriority, dueDate: "" });

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/projects", { headers: authHeaders() });
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
    setLoading(false);
  }, []);

  const loadProjectDetail = useCallback(async (id: string) => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        fetch(`/api/admin/projects/${id}`, { headers: authHeaders() }),
        fetch(`/api/admin/projects/${id}/tasks`, { headers: authHeaders() }),
      ]);
      if (projRes.ok) setSelectedProject(await projRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
    } catch (err) {
      console.error("Failed to load project detail:", err);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) loadProjectDetail(selectedProjectId);
  }, [selectedProjectId, loadProjectDetail]);

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm({ name: "", description: "", status: "active", startDate: "", dueDate: "" });
    setShowProjectForm(true);
  };

  const openEditProject = (p: ProjectWithProgress) => {
    setEditingProject(p);
    setProjectForm({ name: p.name, description: p.description, status: p.status, startDate: p.startDate || "", dueDate: p.dueDate || "" });
    setShowProjectForm(true);
  };

  const saveProject = async () => {
    const body = { ...projectForm, startDate: projectForm.startDate || undefined, dueDate: projectForm.dueDate || undefined };
    try {
      const res = editingProject
        ? await fetch(`/api/admin/projects/${editingProject.id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) })
        : await fetch("/api/admin/projects", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      if (!res.ok) { console.error("Failed to save project:", await res.text()); return; }
      setShowProjectForm(false);
      await loadProjects();
      if (selectedProjectId && editingProject) await loadProjectDetail(selectedProjectId);
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const archiveProject = async (id: string) => {
    try {
      await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ archived: true }),
      });
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setSelectedProject(null);
      }
      await loadProjects();
    } catch (err) {
      console.error("Failed to archive project:", err);
    }
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: "", description: "", status: "todo", owner: "", priority: "medium", dueDate: "" });
    setShowTaskForm(true);
  };

  const openEditTask = (t: ProjectTask) => {
    setEditingTask(t);
    setTaskForm({ title: t.title, description: t.description, status: t.status, owner: t.owner, priority: t.priority, dueDate: t.dueDate || "" });
    setShowTaskForm(true);
  };

  const saveTask = async () => {
    if (!selectedProjectId) return;
    const body = { ...taskForm, dueDate: taskForm.dueDate || undefined };
    try {
      const res = editingTask
        ? await fetch(`/api/admin/projects/${selectedProjectId}/tasks/${editingTask.id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) })
        : await fetch(`/api/admin/projects/${selectedProjectId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      if (!res.ok) { console.error("Failed to save task:", await res.text()); return; }
      setShowTaskForm(false);
      await loadProjectDetail(selectedProjectId);
      await loadProjects();
    } catch (err) {
      console.error("Failed to save task:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!selectedProjectId) return;
    try {
      await fetch(`/api/admin/projects/${selectedProjectId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      await loadProjectDetail(selectedProjectId);
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const quickUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!selectedProjectId) return;
    try {
      await fetch(`/api/admin/projects/${selectedProjectId}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      await loadProjectDetail(selectedProjectId);
      await loadProjects();
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-400 text-sm">Loading projects...</p>
      </div>
    );
  }

  if (selectedProjectId && selectedProject) {
    const progressPercent = selectedProject.totalTasks > 0
      ? Math.round((selectedProject.completedTasks / selectedProject.totalTasks) * 100)
      : 0;
    const projectOverdue = isOverdue(selectedProject.dueDate) && selectedProject.status !== "complete";

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedProjectId(null); setSelectedProject(null); }} className="text-neutral-400 hover:text-neutral-200">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        <Card className={`bg-neutral-900 border-neutral-800 ${projectOverdue ? "border-red-500/40" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg text-neutral-100">{selectedProject.name}</CardTitle>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedProject.status]}`}>
                  {STATUS_LABELS[selectedProject.status]}
                </span>
                {projectOverdue && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-400/15 text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditProject(selectedProject)} className="text-neutral-400">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => archiveProject(selectedProject.id)} className="text-neutral-500 hover:text-amber-400">
                  <Archive className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProject.description && (
              <p className="text-sm text-neutral-400">{selectedProject.description}</p>
            )}
            <div className="flex items-center gap-6 text-xs text-neutral-500">
              {selectedProject.startDate && <span>Started: {selectedProject.startDate}</span>}
              {selectedProject.dueDate && <span className={projectOverdue ? "text-red-400 font-medium" : ""}>Due: {selectedProject.dueDate}</span>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Progress</span>
                <span className="text-neutral-300 font-medium">{progressPercent}% ({selectedProject.completedTasks}/{selectedProject.totalTasks})</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-300">Tasks</h3>
          <Button variant="outline" size="sm" onClick={openCreateTask} className="border-neutral-700 text-neutral-300">
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No tasks yet. Add one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {([
              { label: "To Do", items: todoTasks, status: "todo" as TaskStatus },
              { label: "In Progress", items: inProgressTasks, status: "in-progress" as TaskStatus },
              { label: "Done", items: doneTasks, status: "done" as TaskStatus },
            ]).filter((g) => g.items.length > 0).map((group) => (
              <div key={group.status} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold px-1">
                  {TASK_STATUS_ICONS[group.status]}
                  <span>{group.label} ({group.items.length})</span>
                </div>
                {group.items.map((task) => {
                  const taskOverdue = isOverdue(task.dueDate) && task.status !== "done";
                  return (
                    <Card key={task.id} className={`bg-neutral-900 border-neutral-800 ${taskOverdue ? "border-red-500/40" : ""}`}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => {
                                const next: Record<TaskStatus, TaskStatus> = { todo: "in-progress", "in-progress": "done", done: "todo" };
                                quickUpdateTaskStatus(task.id, next[task.status]);
                              }}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {TASK_STATUS_ICONS[task.status]}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${task.status === "done" ? "text-neutral-500 line-through" : "text-neutral-200"}`}>
                                  {task.title}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                                  {task.priority}
                                </span>
                                {taskOverdue && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-400/15 text-red-400 flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                {task.owner && <span>{task.owner}</span>}
                                {task.dueDate && <span className={taskOverdue ? "text-red-400" : ""}>Due: {task.dueDate}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => openEditTask(task)} className="text-neutral-500 hover:text-neutral-300 h-7 w-7 p-0">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="text-neutral-500 hover:text-red-400 h-7 w-7 p-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Title</Label>
                <Input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Description</Label>
                <Textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-xs">Status</Label>
                  <Select value={taskForm.status} onValueChange={(v) => setTaskForm((f) => ({ ...f, status: v as TaskStatus }))}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-xs">Priority</Label>
                  <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-xs">Owner</Label>
                  <Input value={taskForm.owner} onChange={(e) => setTaskForm((f) => ({ ...f, owner: e.target.value }))} placeholder="e.g. Miruna" className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400 text-xs">Due Date</Label>
                  <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowTaskForm(false)}>Cancel</Button>
              <Button onClick={saveTask} disabled={!taskForm.title.trim()}>{editingTask ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">Track client and internal projects.</p>
        <Button variant="outline" size="sm" onClick={openCreateProject} className="border-neutral-700 text-neutral-300">
          <Plus className="w-4 h-4 mr-1" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">No projects yet.</p>
            <p className="text-neutral-500 text-xs mt-1">Create your first project to start tracking tasks and progress.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const progressPercent = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
            const projectOverdue = isOverdue(p.dueDate) && p.status !== "complete";
            return (
              <Card
                key={p.id}
                className={`bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer ${projectOverdue ? "border-red-500/40" : ""}`}
                onClick={() => setSelectedProjectId(p.id)}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-neutral-100 text-sm">{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                        {projectOverdue && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-400/15 text-red-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1">
                        {p.dueDate && <span className={projectOverdue ? "text-red-400" : ""}>Due: {p.dueDate}</span>}
                        <span>{p.completedTasks}/{p.totalTasks} tasks</span>
                        <span className="text-neutral-400 font-medium">{progressPercent}%</span>
                      </div>
                      <div className="mt-2.5 w-full bg-neutral-800 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => openEditProject(p)} className="text-neutral-500 hover:text-neutral-300 h-7 w-7 p-0">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => archiveProject(p.id)} className="text-neutral-500 hover:text-amber-400 h-7 w-7 p-0">
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs">Name</Label>
              <Input value={projectForm.name} onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs">Description</Label>
              <Textarea value={projectForm.description} onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs">Status</Label>
              <Select value={projectForm.status} onValueChange={(v) => setProjectForm((f) => ({ ...f, status: v as ProjectStatus }))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-100"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Start Date</Label>
                <Input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm((f) => ({ ...f, startDate: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-400 text-xs">Due Date</Label>
                <Input type="date" value={projectForm.dueDate} onChange={(e) => setProjectForm((f) => ({ ...f, dueDate: e.target.value }))} className="bg-neutral-800 border-neutral-700 text-neutral-100" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowProjectForm(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={!projectForm.name.trim()}>{editingProject ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
