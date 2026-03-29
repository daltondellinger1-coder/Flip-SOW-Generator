
import React, { useState, useEffect, useMemo } from 'react';
import { Project, UserProfile } from '../types';
import * as db from '../services/db';
import { importProjectFile, shareFile, exportProjectFile } from '../services/projectImportExport';
import { PlusIcon, FolderIcon, UploadIcon, TrashIcon, LogoutIcon, UserIcon, ShareIcon, XIcon, CheckCircleIcon, GlobeIcon, SparklesIcon, HelpCircleIcon } from './icons';
import { LogoIcon } from './Logo';
import { getMarketIntelligence, MarketIntel } from '../services/geminiService';

interface ProjectCardProps {
  project: Project;
  isOwner: boolean;
  onSelect: (id: number) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onShare: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isOwner, onSelect, onDelete, onShare }) => (
    <div 
        onClick={() => onSelect(project.id!)}
        className="bg-base-200 rounded-lg p-6 shadow-md hover:bg-base-300 transition-all cursor-pointer border border-transparent hover:border-brand-primary group relative flex flex-col"
    >
        <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary mb-3">
                <FolderIcon />
            </div>
            {isOwner && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(project); }}
                        className="p-2 text-gray-400 hover:text-brand-primary bg-base-100 rounded shadow-sm"
                        title="Share Project"
                    >
                        <ShareIcon />
                    </button>
                    <button 
                        onClick={(e) => onDelete(e, project.id!)}
                        className="p-2 text-gray-400 hover:text-red-400 bg-base-100 rounded shadow-sm"
                        title="Delete Project"
                    >
                        <TrashIcon />
                    </button>
                </div>
            )}
        </div>
        
        <h4 className="font-bold text-lg mb-1 truncate text-white">{project.name}</h4>
        <p className="text-sm text-gray-400 truncate mb-4">{project.address}</p>
        
        <div className="flex justify-between items-end border-t border-base-300 pt-4 mt-auto">
            <span className="text-xs text-gray-500">
                Updated: {new Date(project.updated).toLocaleDateString()}
            </span>
            {project.sharedWith && project.sharedWith.length > 0 && (
                 <span className="flex items-center gap-1 text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-full">
                    <UserIcon /> {project.sharedWith.length}
                 </span>
            )}
        </div>
    </div>
);

interface ProjectDashboardProps {
  user: UserProfile;
  onSelectProject: (projectId: number) => void;
  onLogout: () => void;
  onOpenHelp: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ user, onSelectProject, onLogout, onOpenHelp }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSharing, setIsSharing] = useState<Project | null>(null);
  const [shareMode, setShareMode] = useState<'local' | 'external'>('local');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [marketIntel, setMarketIntel] = useState<Record<number, MarketIntel>>({});
  const [loadingIntel, setLoadingIntel] = useState<Record<number, boolean>>({});
  
  // For Sharing
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  // For External Sharing (Pre-loading file to fix iOS share issues)
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    loadProjects();
    loadRegisteredUsers();
  }, [user.email]);

  // Reset sharing state when modal closes
  useEffect(() => {
      if (!isSharing) {
          setPreparedFile(null);
          setIsPreparing(false);
          setShareMode('local');
      }
  }, [isSharing]);

  // Pre-load file when switching to external mode
  useEffect(() => {
      if (isSharing && shareMode === 'external' && !preparedFile && !isPreparing && isSharing.id) {
          setIsPreparing(true);
          exportProjectFile(isSharing.id)
            .then(file => {
                setPreparedFile(file);
                setIsPreparing(false);
            })
            .catch(err => {
                console.error("Failed to prepare file", err);
                setIsPreparing(false);
            });
      }
  }, [isSharing, shareMode, preparedFile, isPreparing]);

  const loadProjects = async () => {
    setIsLoading(true);
    const list = await db.getAccessibleProjects(user.email);
    setProjects(list);
    setIsLoading(false);
  };

  const loadRegisteredUsers = async () => {
      const usersList = await db.getAllUsers();
      setRegisteredUsers(usersList.filter(u => u.email !== user.email));
  };

  const handleFetchMarketIntel = async (project: Project) => {
    if (!project.id || marketIntel[project.id]) return;
    setLoadingIntel(prev => ({ ...prev, [project.id!]: true }));
    const data = await getMarketIntelligence(project.address);
    if (data) {
        setMarketIntel(prev => ({ ...prev, [project.id!]: data }));
    }
    setLoadingIntel(prev => ({ ...prev, [project.id!]: false }));
  };

  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && newProjectAddress) {
        setCreateError(null);
        setIsSubmitting(true);
        try {
            const id = await db.createProject(newProjectName, newProjectAddress, user.email);
            setIsCreating(false);
            setNewProjectName('');
            setNewProjectAddress('');
            onSelectProject(id as number);
        } catch (err: any) {
            console.error("Failed to create project:", err);
            setCreateError(err.message || "Failed to create project. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
        await db.deleteProject(id);
        loadProjects();
    }
  };

  const handleLocalShare = async (targetEmail: string) => {
      if (isSharing && isSharing.id) {
          await db.shareProject(isSharing.id, targetEmail);
          alert(`Project shared locally with ${targetEmail}. They can now see it when logging in on this device.`);
          loadProjects();
      }
  };

  const handleExternalShare = () => {
      if (preparedFile) {
          shareFile(preparedFile);
      }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const newId = await importProjectFile(file, user.email);
            await db.updateProjectDetails(newId, { ownerEmail: user.email });
            alert("Project imported successfully!");
            onSelectProject(newId);
        } catch (error) {
            alert("Failed to import project.");
        }
    }
  };

  const { myProjects, sharedProjects } = useMemo(() => {
      const my = projects.filter(p => p.ownerEmail === user.email || (!p.ownerEmail && !p.sharedWith)); 
      const shared = projects.filter(p => p.sharedWith && p.sharedWith.includes(user.email));
      return { myProjects: my, sharedProjects: shared };
  }, [projects, user.email]);

  const firstName = user.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-base-100 text-white">
        <header className="bg-base-200 p-4 shadow-md flex justify-between items-center sticky top-0 z-10 border-b border-brand-secondary">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                    <LogoIcon className="w-10 h-10" />
                </div>
                <div className="flex flex-col">
                    <h1 className="font-bold text-xl text-brand-primary leading-tight">What's up, {firstName}?</h1>
                    <p className="text-base font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400 bg-base-300 px-2 py-0.5 rounded-full w-fit">{user.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onOpenHelp}
                    className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                    title="Help & Support"
                >
                    <HelpCircleIcon />
                </button>
                <button 
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:text-red-400 flex items-center gap-1"
                >
                    <span className="hidden md:inline text-sm">Sign Out</span>
                    <LogoutIcon />
                </button>
            </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-brand-primary flex items-center gap-2">
                    <FolderIcon />
                    Project Dashboard
                </h2>
                <label className="cursor-pointer bg-base-200 hover:bg-base-300 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm border border-base-300 transition-colors w-full md:w-auto justify-center shadow-sm">
                    <UploadIcon />
                    Import Project File
                    <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
            </div>

            {isCreating && (
                <div className="bg-base-200 p-6 rounded-lg mb-8 shadow-lg border border-brand-secondary animate-fade-in">
                    <h3 className="font-bold text-lg mb-4">Create New Project</h3>
                    <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            placeholder="Project Name (e.g. Downtown Flip)" 
                            className="bg-base-300 p-3 rounded border border-base-300 focus:border-brand-primary outline-none text-white"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="Property Address" 
                            className="bg-base-300 p-3 rounded border border-base-300 focus:border-brand-primary outline-none text-white"
                            value={newProjectAddress}
                            onChange={e => setNewProjectAddress(e.target.value)}
                            required
                        />
                        {createError && (
                            <div className="md:col-span-2 bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded text-sm">
                                {createError}
                            </div>
                        )}
                        <div className="md:col-span-2 flex gap-3 justify-end mt-2">
                            <button type="button" onClick={() => { setIsCreating(false); setCreateError(null); }} className="px-4 py-2 rounded text-gray-400 hover:text-white">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="bg-brand-primary px-6 py-2 rounded text-white font-bold hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2">
                                {isSubmitting && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                                {isSubmitting ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-base-300 pb-2">
                    <span>My Projects</span>
                    <span className="text-xs bg-brand-primary px-2 py-0.5 rounded-full text-white">{myProjects.length}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="border-2 border-dashed border-base-300 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-brand-primary hover:bg-base-200/50 transition-all group text-gray-400 hover:text-brand-primary"
                    >
                        <div className="p-4 rounded-full bg-base-200 group-hover:bg-brand-primary/20 mb-2 transition-colors">
                            <PlusIcon />
                        </div>
                        <span className="font-semibold">Create New Project</span>
                    </button>

                    {isLoading ? (
                        <div className="col-span-full text-center py-10 text-gray-500">Loading projects...</div>
                    ) : myProjects.map(project => (
                        <div key={project.id} className="space-y-3">
                            <ProjectCard 
                                project={project}
                                isOwner={true}
                                onSelect={onSelectProject}
                                onDelete={handleDeleteProject}
                                onShare={(p) => {
                                    setIsSharing(p);
                                    setShareMode('local'); 
                                }}
                            />
                            
                            {/* Market Intel Sneak-Peek */}
                            <div className="bg-brand-secondary/30 border border-brand-primary/20 rounded-lg p-4 transition-all">
                                {!marketIntel[project.id!] ? (
                                    <button 
                                        onClick={() => handleFetchMarketIntel(project)}
                                        disabled={loadingIntel[project.id!]}
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-primary flex items-center gap-2 hover:text-white disabled:opacity-50"
                                    >
                                        {loadingIntel[project.id!] ? (
                                            <div className="animate-spin h-3 w-3 border-2 border-brand-primary border-t-transparent rounded-full" />
                                        ) : (
                                            <SparklesIcon />
                                        )}
                                        {loadingIntel[project.id!] ? 'Analyzing Market...' : 'Get Local Context'}
                                    </button>
                                ) : (
                                    <div className="animate-fade-in">
                                        <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <GlobeIcon /> Market Snapshot
                                        </h5>
                                        <p className="text-[11px] text-gray-300 line-clamp-2 italic mb-3">"{marketIntel[project.id!].summary}"</p>
                                        <div className="flex flex-wrap gap-2">
                                            {marketIntel[project.id!].permitLinks.map((link, idx) => (
                                                <a 
                                                    key={idx} 
                                                    href={link.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-1 rounded border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all truncate max-w-[120px]"
                                                >
                                                    {link.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {sharedProjects.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-base-300 pb-2">
                        <span>Shared With Me</span>
                        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full text-white">{sharedProjects.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedProjects.map(project => (
                            <ProjectCard 
                                key={project.id}
                                project={project}
                                isOwner={false}
                                onSelect={onSelectProject}
                                onDelete={() => {}}
                                onShare={() => {}}
                            />
                        ))}
                    </div>
                </div>
            )}

        </main>

        {isSharing && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-base-300 flex justify-between items-center">
                        <h3 className="font-bold text-lg truncate pr-4">Share "{isSharing.name}"</h3>
                        <button onClick={() => setIsSharing(null)}><XIcon /></button>
                    </div>
                    
                    <div className="flex border-b border-base-300">
                        <button 
                            onClick={() => setShareMode('local')}
                            className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 border-b-2 ${shareMode === 'local' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            <UserIcon /> On This Device
                        </button>
                        <button 
                            onClick={() => setShareMode('external')}
                            className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 border-b-2 ${shareMode === 'external' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            <GlobeIcon /> Send Copy
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {shareMode === 'local' ? (
                            <>
                                <p className="text-sm text-gray-400 mb-4">
                                    Grant access to other users who use this specific device.
                                </p>
                                {registeredUsers.length > 0 ? (
                                    <ul className="space-y-2">
                                        {registeredUsers.map(u => {
                                            const isAlreadyShared = isSharing.sharedWith?.includes(u.email);
                                            return (
                                                <li key={u.email} className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-bold text-sm">{u.name}</p>
                                                        <p className="text-xs text-gray-400">{u.role}</p>
                                                    </div>
                                                    {isAlreadyShared ? (
                                                        <span className="text-green-500 text-xs flex items-center gap-1">
                                                            <CheckCircleIcon /> Access Granted
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleLocalShare(u.email)}
                                                            className="bg-brand-primary text-white px-3 py-1 rounded text-xs hover:bg-brand-secondary"
                                                        >
                                                            Grant Access
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 bg-base-200 rounded-lg border border-dashed border-base-300">
                                        <p>No other users found on this device.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 space-y-6">
                                <div className="bg-base-200 p-6 rounded-full text-brand-primary">
                                    <ShareIcon />
                                </div>
                                <button 
                                    onClick={handleExternalShare}
                                    disabled={isPreparing || !preparedFile}
                                    className="bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-secondary font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                                >
                                    {isPreparing ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <UploadIcon /> 
                                    )}
                                    <span>{isPreparing ? 'Preparing...' : 'Share / Download File'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProjectDashboard;
