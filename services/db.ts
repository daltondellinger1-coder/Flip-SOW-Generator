
import Dexie, { Table } from 'dexie';
import { LineItem, RoomDimensions, UnitPrice, Project, UserProfile } from '../types';

// Local Cache DB
const localDb = new Dexie('SOW_Sync_Cache') as Dexie & {
  lineItems: Table<LineItem, number>;
  projects: Table<Project, number>;
  projectData: Table<{ id: string; value: any }, string>;
  app_users: Table<UserProfile & { password?: string }, string>; 
};

localDb.version(1).stores({
  projects: '++id, updated, ownerEmail, *sharedWith',
  lineItems: '++id, projectId, room, item, trade, [projectId+room]',
  projectData: 'id',
  app_users: 'email'
});

const getAuthToken = () => {
    const userStr = localStorage.getItem('sow_user');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        return user.token;
    } catch (e) {
        return null;
    }
};

const apiFetch = async (path: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            // Not JSON or no error field
        }
        
        if (response.status === 401) {
            // Handle unauthorized - maybe logout?
            localStorage.removeItem('sow_user');
            window.location.reload();
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

// --- Projects ---

export const getProjects = async () => {
    try {
        const remoteProjects = await apiFetch('/api/projects');
        // Update local cache
        await localDb.projects.clear();
        await localDb.projects.bulkAdd(remoteProjects);
        return remoteProjects;
    } catch (e) {
        console.warn("Offline: Using local projects cache");
        return localDb.projects.orderBy('updated').reverse().toArray();
    }
};

export const getAccessibleProjects = async (email: string) => {
    try {
        const remoteProjects = await apiFetch('/api/projects');
        await localDb.projects.clear();
        await localDb.projects.bulkAdd(remoteProjects);
        return remoteProjects;
    } catch (e) {
        const owned = await localDb.projects.where('ownerEmail').equals(email).toArray();
        const shared = await localDb.projects.where('sharedWith').equals(email).toArray();
        const map = new Map();
        [...owned, ...shared].forEach(p => map.set(p.id, p));
        return Array.from(map.values()).sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    }
};

export const createProject = async (name: string, address: string, ownerEmail: string) => {
    try {
        const { id } = await apiFetch('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ name, address })
        });
        return id;
    } catch (e) {
        // Fallback to local if offline? 
        // For simplicity in this "end-to-end" request, we'll assume online for creation
        throw e;
    }
};

export const deleteProject = async (projectId: number) => {
    await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    await localDb.projects.delete(projectId);
};

// --- Line Items ---

export const getAllLineItems = async (projectId: number) => {
    try {
        const items = await apiFetch(`/api/projects/${projectId}/items`);
        // Sync local cache
        await localDb.lineItems.where({ projectId }).delete();
        await localDb.lineItems.bulkAdd(items);
        return items;
    } catch (e) {
        return localDb.lineItems.where({ projectId }).toArray();
    }
};

export const addBulkLineItems = async (projectId: number, items: Omit<LineItem, 'id' | 'projectId'>[]) => {
    await apiFetch(`/api/projects/${projectId}/items/bulk`, {
        method: 'POST',
        body: JSON.stringify(items)
    });
};

export const updateLineItem = async (item: LineItem) => {
    await apiFetch(`/api/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(item)
    });
};

export const deleteLineItem = async (id: number) => {
    await apiFetch(`/api/items/${id}`, { method: 'DELETE' });
};

// --- Project Data ---

export const getProjectData = async <T>(projectId: number | null, key: string, defaultValue: T): Promise<T> => {
    try {
        const data = await apiFetch(`/api/projects/${projectId}/data`);
        return data[key] !== undefined ? data[key] : defaultValue;
    } catch (e) {
        const scopedKey = projectId ? `proj_${projectId}_${key}` : key;
        const local = await localDb.projectData.get(scopedKey);
        return local ? local.value : defaultValue;
    }
};

export const setProjectData = async (projectId: number | null, key: string, value: any) => {
    await apiFetch(`/api/projects/${projectId}/data`, {
        method: 'POST',
        body: JSON.stringify({ key, value })
    });
};

// --- User Management ---

export const registerUser = async (user: UserProfile & { password?: string }) => {
    const result = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(user)
    });
    return result;
};

export const authenticateUser = async (email: string, password?: string) => {
    const result = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    return result;
};

// Legacy support / No-ops
export const getAllUsers = async () => {
    try {
        return await apiFetch('/api/users');
    } catch (e) {
        return [];
    }
};

export const ensureDefaultProject = async () => null;
export const migrateLocalStorageUsers = async () => {};

export const addLineItem = async (projectId: number, item: Omit<LineItem, 'id' | 'projectId'>) => {
    return addBulkLineItems(projectId, [item]);
};

export const deleteItemsInRoom = async (projectId: number, room: string) => {
    // This is a bit complex for a simple API, so we'll fetch all and filter
    const items = await getAllLineItems(projectId);
    const toDelete = items.filter((i: any) => i.room === room);
    await Promise.all(toDelete.map((i: any) => deleteLineItem(i.id)));
};

export const resetProject = async (projectId: number) => {
    const items = await getAllLineItems(projectId);
    await Promise.all(items.map((i: any) => deleteLineItem(i.id)));
    await setProjectData(projectId, 'address', 'Reset Project');
    await setProjectData(projectId, 'roomDimensions', {});
};

export const shareProject = async (projectId: number, targetEmail: string) => {
    await apiFetch(`/api/projects/${projectId}/share`, {
        method: 'POST',
        body: JSON.stringify({ targetEmail })
    });
};

export const updateProjectDetails = async (projectId: number, updates: Partial<Project>) => {
    if (updates.address) {
        await setProjectData(projectId, 'address', updates.address);
    }
    // Handle other updates if needed
};

export const getProject = async (projectId: number) => {
    try {
        const projects = await getProjects();
        return projects.find((p: any) => p.id === projectId);
    } catch (e) {
        return localDb.projects.get(projectId);
    }
};

export { localDb as db };
