import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { KanbanBoard } from './components/KanbanBoard.jsx';
import { AuditLogView } from './components/AuditLogView.jsx';
import { SearchFilterBar } from './components/SearchFilterBar.jsx';
import { MembersModal } from './components/MembersModal.jsx';
import { CreateProjectModal } from './components/CreateProjectModal.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { api } from './api.js';
import { Trello, History, FolderKanban, Plus } from 'lucide-react';

export const App = () => {
  const { user, currentOrg, currentRole, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('board');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [members, setMembers] = useState([]);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
    labels: '',
    dueDateBefore: '',
  });

  const loadOrgData = async () => {
    if (!currentOrg?.id) return;
    try {
      const [projectsData, orgDetails] = await Promise.all([
        api.getProjects(currentOrg.id),
        api.getOrganization(currentOrg.id),
      ]);

      setProjects(projectsData);
      setMembers(orgDetails.members || []);

      if (projectsData.length > 0) {
        setSelectedProjectId((prev) =>
          projectsData.some((p) => p.id === prev) ? prev : projectsData[0].id
        );
      } else {
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error('Failed to load organization data:', err);
    }
  };

  useEffect(() => {
    if (user && currentOrg?.id) {
      loadOrgData();
    }
  }, [currentOrg?.id, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Initializing Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        onOpenMembers={() => setIsMembersModalOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'board'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              <Trello className="w-4 h-4" />
              Kanban Board
            </button>

            {(currentRole === 'OWNER' || currentRole === 'ADMIN') && (
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'audit'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <History className="w-4 h-4" />
                Audit Logs
              </button>
            )}
          </div>

          {activeTab === 'board' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-slate-500" /> Project:
              </span>
              {projects.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No projects yet</span>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                      selectedProjectId === project.id
                        ? 'bg-slate-800 border-sky-500/60 text-sky-400 font-semibold shadow-sm'
                        : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {project.name}
                  </button>
                ))
              )}

              {(currentRole === 'OWNER' || currentRole === 'ADMIN') && (
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Create new project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {activeTab === 'board' && (
          <div>
            <SearchFilterBar
              filters={filters}
              onFilterChange={setFilters}
              members={members}
            />

            {selectedProjectId ? (
              <KanbanBoard
                projectId={selectedProjectId}
                projectName={selectedProject?.name || 'Project Board'}
                members={members}
                filterStatus={filters.status}
                filterPriority={filters.priority}
                filterAssigneeId={filters.assigneeId}
                filterSearch={filters.search}
                filterDueDateBefore={filters.dueDateBefore}
              />
            ) : (
              <div className="bg-slate-850 rounded-2xl border border-slate-800 p-12 text-center my-12">
                <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">No Projects Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  This organization doesn't have any projects yet. Create a project to start managing tasks on the Kanban board.
                </p>
                {(currentRole === 'OWNER' || currentRole === 'ADMIN') && (
                  <button
                    onClick={() => setIsCreateProjectOpen(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Create First Project
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && <AuditLogView members={members} />}
      </main>

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        onMembersChanged={loadOrgData}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setSelectedProjectId(newProj.id);
        }}
      />
    </div>
  );
};
