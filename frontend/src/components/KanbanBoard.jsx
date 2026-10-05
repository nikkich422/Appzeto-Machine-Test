import React, { useState, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TaskModal } from './TaskModal.jsx';

const COLUMNS = [
  { id: 'TODO', label: 'TODO', color: 'border-slate-600', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: 'border-sky-500', dotColor: 'bg-sky-400' },
  { id: 'REVIEW', label: 'REVIEW', color: 'border-amber-500', dotColor: 'bg-amber-400' },
  { id: 'DONE', label: 'DONE', color: 'border-emerald-500', dotColor: 'bg-emerald-400' },
];

export const KanbanBoard = ({
  projectId,
  projectName,
  members,
  filterStatus,
  filterPriority,
  filterAssigneeId,
  filterSearch,
  filterDueDateBefore,
}) => {
  const { user, currentRole, currentOrg } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [addingInColumn, setAddingInColumn] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('MEDIUM');

  const canCreateTask = currentRole !== 'VIEWER';
  const canDrag = currentRole !== 'VIEWER';

  const loadTasks = async () => {
    if (!currentOrg?.id || !projectId) return;
    try {
      setIsLoading(true);
      const res = await api.getTasks({
        organizationId: currentOrg.id,
        projectId,
        limit: 100,
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load project tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId, currentOrg?.id]);

  // Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    socket.emit('join_project', projectId);

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [...prev, newTask];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
      }
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
    };
  }, [projectId]);

  // Drag and Drop
  const handleDragStart = (e, taskId) => {
    if (!canDrag) return;
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDragLeave = (e, colStatus) => {
    if (dragOverColumn === colStatus) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    // Optimistic UI move
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    } catch (err) {
      console.error('Failed to move task:', err);
      loadTasks();
      alert(err.message || 'Permission denied or update failed');
    }
  };

  const handleCreateQuickTask = async (colStatus) => {
    if (!quickTitle.trim() || !projectId) return;

    try {
      const created = await api.createTask({
        title: quickTitle.trim(),
        status: colStatus,
        priority: quickPriority,
        projectId,
      });

      setTasks((prev) => [...prev, created]);
      setQuickTitle('');
      setAddingInColumn(null);
    } catch (err) {
      alert(err.message || 'Failed to create task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssigneeId && t.assigneeId !== filterAssigneeId) return false;
    if (filterDueDateBefore && t.dueDate) {
      if (new Date(t.dueDate) > new Date(filterDueDateBefore)) return false;
    }
    if (filterSearch && filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchLabels = t.labels?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLabels) return false;
    }
    return true;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">MED</span>;
      default:
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">LOW</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">{projectName}</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live WebSocket Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-slate-850/80 rounded-2xl border transition-all duration-200 flex flex-col min-h-[500px] max-h-[calc(100vh-240px)] ${
                isOver
                  ? 'border-sky-400/80 ring-2 ring-sky-500/30 bg-slate-800/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></span>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                    {col.label}
                  </span>
                  <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium border border-slate-700/60">
                    {colTasks.length}
                  </span>
                </div>

                {canCreateTask && (
                  <button
                    onClick={() => {
                      setAddingInColumn(addingInColumn === col.id ? null : col.id);
                      setQuickTitle('');
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {addingInColumn === col.id && (
                <div className="p-3 bg-slate-800/90 border-b border-slate-700">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Task title..."
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateQuickTask(col.id);
                      if (e.key === 'Escape') setAddingInColumn(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 mb-2"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value)}
                      aria-label="Select priority for new task"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setAddingInColumn(null)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleCreateQuickTask(col.id)}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-xs">
                    {canDrag ? 'Drop tasks here' : 'No tasks'}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={canDrag}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`bg-slate-800/90 hover:bg-slate-750 p-3.5 rounded-xl border border-slate-700/80 shadow-sm hover:border-slate-600 transition cursor-pointer select-none group ${
                        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        {getPriorityBadge(task.priority)}
                        {task.dueDate && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(task.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-slate-100 group-hover:text-sky-300 transition line-clamp-2 leading-snug mb-1.5">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {task.labels && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {task.labels.split(',').map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-medium bg-slate-900/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
                        <div className="flex items-center gap-1.5">
                          {task.assignee ? (
                            <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name}`}>
                              <img
                                src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&background=0284c7&color=fff`}
                                alt={task.assignee.name}
                                className="w-5 h-5 rounded-full object-cover border border-slate-600"
                              />
                              <span className="text-[11px] text-slate-300 font-medium truncate max-w-[80px]">
                                {task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                          )}
                        </div>

                        {(task._count?.comments || 0) > 0 && (
                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <MessageSquare className="w-3 h-3 text-slate-500" />
                            <span>{task._count?.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
          }}
          onTaskDeleted={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }}
          members={members}
        />
      )}
    </div>
  );
};
