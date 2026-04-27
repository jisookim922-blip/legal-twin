"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from "lucide-react";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  phaseId: number;
  onToggle: (phaseId: number, taskId: string) => void;
  onAdd: (phaseId: number, text: string) => void;
  onDelete: (phaseId: number, taskId: string) => void;
}

export default function TaskList({
  tasks,
  phaseId,
  onToggle,
  onAdd,
  onDelete,
}: TaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAdd(phaseId, newTaskText.trim());
    setNewTaskText("");
  };

  return (
    <div className="p-6 border-b border-gray-100 bg-white shrink-0">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-blue-500" /> タスク
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-medium">
            {completedTasks} / {totalTasks} 完了
          </span>
          <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2 mb-5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 py-1.5 group">
            <button
              onClick={() => onToggle(phaseId, task.id)}
              className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors focus:outline-none"
            >
              {task.completed ? (
                <CheckCircle2
                  className="text-blue-500"
                  size={22}
                  fill="currentColor"
                  stroke="white"
                />
              ) : (
                <Circle size={22} />
              )}
            </button>
            <span
              onClick={() => onToggle(phaseId, task.id)}
              className={`text-[14px] flex-1 cursor-pointer transition-all ${
                task.completed
                  ? "line-through text-gray-400"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => onDelete(phaseId, task.id)}
              className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 items-center max-w-md">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="新しいタスクを追加..."
          className="bg-gray-50 focus:bg-white border border-transparent focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none text-gray-900 placeholder-gray-400 transition-all flex-1 py-2 px-4 text-[13px]"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 shadow-sm w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
