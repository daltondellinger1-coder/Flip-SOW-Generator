
import * as db from './db';
import { LineItem, RoomDimensions, UnitPrice, Project } from '../types';

interface ProjectDataBundle {
  version: number;
  timestamp: string;
  projectInfo: Partial<Project>;
  lineItems: LineItem[];
  roomDimensions: Record<string, Omit<RoomDimensions, 'room'>>;
  unitPrices: UnitPrice[];
}

/**
 * Bundles current project data into a JSON object and triggers a download.
 */
export const exportProjectFile = async (projectId: number): Promise<File> => {
  const project = await db.db.projects.get(projectId);
  if (!project) throw new Error("Project not found");

  const lineItems = await db.getAllLineItems(projectId);
  const roomDimensions = await db.getProjectData<Record<string, Omit<RoomDimensions, 'room'>>>(projectId, 'roomDimensions', {});
  const unitPrices = await db.getProjectData<UnitPrice[]>(projectId, 'unitPrices', []);

  const bundle: ProjectDataBundle = {
    version: 2,
    timestamp: new Date().toISOString(),
    projectInfo: project,
    lineItems,
    roomDimensions,
    unitPrices
  };

  const jsonContent = JSON.stringify(bundle, null, 2);
  const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
  const fileName = `SOW_${sanitizedName}_${new Date().toISOString().split('T')[0]}.json`;

  return new File([jsonContent], fileName, { type: 'application/json' });
};

/**
 * Helper to trigger a browser download of a File object.
 */
export const downloadFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Uses the Web Share API to share a specific file object.
 * This should be called directly from a click handler to satisfy browser security requirements.
 */
export const shareFile = async (file: File): Promise<void> => {
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'SOW Project File',
          text: `Here is the SOW project file for ${file.name}`,
        });
      } catch (error: any) {
        // Ignore user cancellation
        if (error.name === 'AbortError') return;
        
        console.warn('Share API failed, falling back to download:', error);
        downloadFile(file);
      }
    } else {
      downloadFile(file);
    }
  } catch (error) {
    console.error("Error in shareFile:", error);
    downloadFile(file);
  }
};

/**
 * Wrapper for sharing a project by ID. 
 * Note: This involves an async fetch which might break navigator.share on strict browsers (iOS).
 * Use exportProjectFile + shareFile for better results in UI components.
 */
export const shareProjectFile = async (projectId: number): Promise<void> => {
  const file = await exportProjectFile(projectId);
  await shareFile(file);
};

/**
 * Reads a JSON file and imports it as a NEW project.
 */
export const importProjectFile = async (file: File, ownerEmail: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const bundle = JSON.parse(content) as ProjectDataBundle;

        // Basic Validation
        if (!bundle.lineItems || !Array.isArray(bundle.lineItems)) {
          throw new Error("Invalid project file: Missing line items.");
        }

        // Create a new project from the imported data
        const newProjectName = bundle.projectInfo?.name ? `${bundle.projectInfo.name} (Imported)` : `Imported Project ${new Date().toLocaleDateString()}`;
        const newAddress = bundle.projectInfo?.address || 'Unknown Address';
        
        const newProjectId = await db.createProject(newProjectName, newAddress, ownerEmail);

        // Restore Data
        // We strip IDs to let the DB assign new ones and avoid collisions
        const itemsToImport = bundle.lineItems.map(({ id, projectId, ...rest }) => rest);
        
        await db.addBulkLineItems(newProjectId, itemsToImport);
        await db.setProjectData(newProjectId, 'roomDimensions', bundle.roomDimensions || {});
        await db.setProjectData(newProjectId, 'unitPrices', bundle.unitPrices || []);

        resolve(newProjectId as number);
      } catch (err) {
        console.error("Import failed", err);
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
