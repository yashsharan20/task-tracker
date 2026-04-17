"use client";

import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (task: Task) => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const isOverdue = d < now;
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), isOverdue };
};

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus }: TaskCardProps) {
  const isDone = task.status === "completed";
  const due = task.dueDate ? formatDate(task.dueDate) : null;
  const overdue = due && !isDone && due.isOverdue;

  return (
    <div
      className={`group relative bg-zinc-900 border rounded-xl p-4 transition-all hover:border-zinc-600 ${
        isDone ? "border-zinc-800 opacity-60" : "border-zinc-800"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleStatus(task)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
            isDone
              ? "bg-indigo-600 border-indigo-600"
              : "border-zinc-600 hover:border-indigo-400"
          }`}
          title={isDone ? "Mark as pending" : "Mark as complete"}
        >
          {isDone && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${isDone ? "line-through text-zinc-500" : "text-white"}`}>
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isDone
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-emerald-400" : "bg-amber-400"}`} />
              {isDone ? "Completed" : "Pending"}
            </span>

            {due && (
              <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-400" : "text-zinc-500"}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {overdue ? "Overdue · " : ""}{due.label}
              </span>
            )}
          </div>
        </div>

        {/* Actions - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
