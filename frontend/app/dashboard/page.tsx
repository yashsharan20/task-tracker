"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/api";
import { Task, CreateTaskInput, TaskStatus } from "@/types";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import Modal from "@/components/Modal";

type FilterStatus = "all" | TaskStatus;

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [user, authLoading, router]);

  const fetchTasks = useCallback(async () => {
    try {
      const filters = filterStatus !== "all" ? { status: filterStatus } : undefined;
      const res = await getTasks(filters);
      setTasks(res.data);
    } catch (err) {
      if (err instanceof Error) {
        logout();
        router.replace("/auth");
      } else {
        toast.error("Failed to load tasks");
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus, logout, router]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const handleCreate = async (data: CreateTaskInput) => {
    setFormLoading(true);
    // Optimistic update
    const tempTask: Task = {
      _id: `temp-${Date.now()}`,
      ...data,
      status: data.status || "pending",
      owner: user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [tempTask, ...prev]);
    setShowModal(false);

    try {
      const res = await createTask(data);
      setTasks((prev) => prev.map((t) => (t._id === tempTask._id ? res.data : t)));
      toast.success("Task created");
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempTask._id));
      toast.error(err instanceof Error ? err.message : "Failed to create task");
      setShowModal(true);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    setFormLoading(true);

    const prevTask = editingTask;
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === editingTask._id ? { ...t, ...data } : t))
    );
    setEditingTask(null);

    try {
      const res = await updateTask(editingTask._id, data);
      setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
      toast.success("Task updated");
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t._id === prevTask._id ? prevTask : t)));
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "pending" ? "completed" : "pending";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(task._id, { status: newStatus });
    } catch {
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: task.status } : t))
      );
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    const taskToDelete = tasks.find((t) => t._id === id);
    if (!taskToDelete) return;

    // Optimistic remove
    setTasks((prev) => prev.filter((t) => t._id !== id));

    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch {
      setTasks((prev) => [taskToDelete, ...prev]);
      toast.error("Failed to delete task");
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth");
    toast.success("Signed out");
  };

  // Filtered + searched tasks
  const visibleTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f11]">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">TaskTracker</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total", value: tasks.length, color: "text-white" },
            { label: "Pending", value: pendingCount, color: "text-amber-400" },
            { label: "Done", value: completedCount, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 gap-0.5">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                  filterStatus === f
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* New task button */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New task
          </button>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm">
              {search ? "No tasks match your search" : "No tasks yet — create your first one"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={(t) => setEditingTask(t)}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <Modal title="New task" onClose={() => setShowModal(false)}>
          <TaskForm
            onSubmit={handleCreate}
            onCancel={() => setShowModal(false)}
            loading={formLoading}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editingTask && (
        <Modal title="Edit task" onClose={() => setEditingTask(null)}>
          <TaskForm
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
            initialData={editingTask}
            loading={formLoading}
          />
        </Modal>
      )}
    </div>
  );
}
