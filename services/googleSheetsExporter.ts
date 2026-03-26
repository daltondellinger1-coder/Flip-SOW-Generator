
import { LineItem } from '../types';

/**
 * Senior Google Workspace Engineer Implementation:
 * Fulfilling the "Eliminate Double Entry" goal by providing a high-fidelity 
 * tab-separated copy-to-clipboard function optimized for Google Sheets.
 */

export const initializeGoogleApi = async (): Promise<void> => {
    return Promise.resolve();
};

export const exportToGoogleSheetClipboard = async (lineItems: LineItem[], address: string): Promise<boolean> => {
    try {
        const headers = ['Trade', 'Room', 'Item', 'Action', 'Qty', 'Unit', 'Notes'];
        
        const rows = lineItems
            .filter(item => item.item !== 'General Room Photo')
            .sort((a, b) => a.trade.localeCompare(b.trade))
            .map(item => [
                item.trade,
                item.room,
                item.item,
                item.action,
                item.quantity || 0,
                item.unit || '',
                item.notes || ''
            ]);

        const tsvContent = [
            [`Project: ${address}`],
            [],
            headers,
            ...rows
        ].map(row => row.join('\t')).join('\n');

        await navigator.clipboard.writeText(tsvContent);
        return true;
    } catch (error) {
        console.error("Clipboard export failed", error);
        return false;
    }
};

export const exportToGoogleSheet = async (lineItems: LineItem[], address: string): Promise<string> => {
    const success = await exportToGoogleSheetClipboard(lineItems, address);
    if (success) {
        alert("Success! SOW data copied to clipboard in Spreadsheet format. Paste (Ctrl+V) directly into Google Sheets.");
        return "Clipboard";
    }
    throw new Error("Failed to export to clipboard.");
};
