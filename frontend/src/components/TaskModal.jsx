import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Send,
  Trash2,
  AlertCircle,
  History,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const TaskModal = ({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  members,
}) => {
  const { user, currentRole } = useAuth();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit =
    currentRole === 'OWNER' ||
    currentRole === 'ADMIN' ||
    (currentRole === 'MEMBER' && (task?.assigneeId === user?.id || task?.creatorId === user?.id));

  const canDelete = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const canComment = currentRole !== 'VIEWER';

  const fetchTaskDetails = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTask(taskId);
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setStatus(data.status);
      setPriority(data.priority);
      setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '');
      setLabels(data.labels || '');
      setAssigneeId(data.assigneeId || '');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const updated = await api.updateTask(taskId, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        labels,
        assigneeId: assigneeId || null,
      });
      setTask((prev) => ({ ...prev, ...updated }));
      onTaskUpdated(updated);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canComment) return;

    setIsSubmittingComment(true);
    try {
      const added = await api.addTaskComment(taskId, newComment.trim());
      setTask((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), added],
      }));
      setNewComment('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-300">
          Loading task details...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-850 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-sky-400">
              {task?.project?.name || 'Task'}
            </span>
            <span className="text-xs text-slate-400">ID: {taskId.slice(0, 8)}</span>
          </div>

          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                title="Delete task (Admin/Owner only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border-l-4 border-rose-500 p-3 mx-6 mt-4 rounded text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-700 px-6 bg-slate-800/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Task Details & Discussion
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> Audit History ({task?.auditLogs?.length || 0})
          </button>
        </div>

        {/* Tab 1: Task Details */}
        {activeTab === 'details' ? (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input
                type="text"
                disabled={!canEdit}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <textarea
                disabled={!canEdit}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a detailed description..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select
                  disabled={!canEdit}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500 disabled:opacity-60"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                <select
                  disabled={!canEdit}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500 disabled:opacity-60"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assignee</label>
                <select
                  disabled={!canEdit}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-sky-500 disabled:opacity-60"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.name || m.user?.email || 'Member'} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-sky-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Labels (comma-separated)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="frontend, bug, high-priority"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
              />
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-4 border-t border-slate-700/80">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" /> Comments & Activity
              </h4>

              <div className="space-y-3 mb-4">
                {task?.comments?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No comments yet. Start the conversation!</p>
                ) : (
                  task?.comments?.map((comment) => (
                    <div key={comment.id} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'User')}&background=0284c7&color=fff`}
                            alt={comment.user?.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-slate-200">{comment.user?.name || 'User'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 pl-7 leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {canComment ? (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment... (use @name to mention team members)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-500 italic">Viewers cannot post comments.</p>
              )}
            </div>
          </div>
        ) : (
          /* Tab 2: Audit History */
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Audit Log History for this Task
            </h4>

            {task?.auditLogs?.length === 0 ? (
              <p className="text-xs text-slate-500">No activity recorded for this task.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {task?.auditLogs?.map((log) => (
                  <div key={log.id} className="relative flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0 z-10 text-sky-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">
                          {log.user?.name || 'System'} • <span className="text-sky-400">{log.action}</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.oldValue && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          <span className="text-rose-400 line-through">Old: {log.oldValue}</span>
                        </div>
                      )}
                      {log.newValue && (
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          New: {log.newValue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
