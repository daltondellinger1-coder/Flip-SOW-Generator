
import React, { useState, useEffect, useCallback } from 'react';
import { LineItem, View, RoomDimensions, UnitPrice, UserProfile } from './types';
import * as db from './services/db';
import { exportToCsv } from './services/csvExporter';
import { calculateDimensionBasedQuantity, parseDimensionsFromText } from './services/calculationUtils';

import ItemForm from './components/ItemForm';
import SOWView from './components/SOWView';
import SummaryView from './components/SummaryView';
import MaterialListView from './components/MaterialListView';
import GalleryView from './components/GalleryView';
import DimensionsSummaryView from './components/DimensionsSummaryView';
import AddressModal from './components/AddressModal';
import WalkthroughModal from './components/WalkthroughModal';
import BulkPasteModal from './components/BulkPasteModal'; 
import UnitPricingModal from './components/UnitPricingModal';
import ProjectTotals from './components/ProjectTotals';
import RoomDetailView from './components/RoomDetailView';
import ProjectSyncModal from './components/ProjectSyncModal';
import LoginView from './components/LoginView';
import ProjectDashboard from './components/ProjectDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import ExportModal from './components/ExportModal'; 
import DisplaySettingsModal from './components/DisplaySettingsModal';
import OnboardingTutorial from './components/OnboardingTutorial';
import HelpSection from './components/HelpSection';
import { LogoIcon } from './components/Logo';

import { ListIcon, DocumentTextIcon, SummaryIcon, SparklesIcon, ShareIcon, ChevronLeftIcon, LocationMarkerIcon, CubeIcon, PrinterIcon, TrashIcon, PhotographIcon, ClipboardIcon, CalculatorIcon, DotsHorizontalIcon, HelpCircleIcon } from './components/icons';
import { parseSmartEntry } from './services/geminiService';
import { ROOMS, DEFAULT_UNIT_PRICES, TRADE_MAP } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [address, setAddress] = useState('123 Demo St, Anytown, USA');
  const [roomDimensions, setRoomDimensions] = useState<Record<string, Omit<RoomDimensions, 'room'>>>({});
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>([]);
  const [costMultiplier, setCostMultiplier] = useState<number>(1.0);
  const [targetResellValue, setTargetResellValue] = useState<number>(0);
  const [contingencyPercentage, setContingencyPercentage] = useState<number>(0);
  const [view, setView] = useState<View>('list');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isWalkthroughModalOpen, setIsWalkthroughModalOpen] = useState(false);
  const [isBulkPasteModalOpen, setIsBulkPasteModalOpen] = useState(false); 
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); 
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [uiScale, setUiScale] = useState<number>(() => {
    const saved = localStorage.getItem('sow_ui_scale');
    return saved ? parseFloat(saved) : 1;
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDangerous: false,
  });

  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  // Apply UI Scale to document root
  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale * 100}%`;
    localStorage.setItem('sow_ui_scale', uiScale.toString());
  }, [uiScale]);

  useEffect(() => {
    const savedUser = localStorage.getItem('sow_user');
    if (savedUser) {
        try {
            setUser(JSON.parse(savedUser));
        } catch (e) {
            console.error("Failed to parse user data", e);
            localStorage.removeItem('sow_user');
        }
    }
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
        if (user) {
            const completed = await db.getProjectData<boolean>(null, 'onboarding_completed', false);
            if (!completed) {
                setIsOnboardingOpen(true);
            }
        }
    };
    checkOnboarding();
  }, [user]);

  const handleLogin = (profile: UserProfile) => {
    localStorage.setItem('sow_user', JSON.stringify(profile));
    setUser(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem('sow_user');
    setUser(null);
    setCurrentProjectId(null);
    setIsOnboardingOpen(false);
    setIsHelpOpen(false);
  };

  const completeOnboarding = async () => {
    setIsOnboardingOpen(false);
    if (user) {
        await db.setProjectData(null, 'onboarding_completed', true);
    }
  };

  const loadProjectData = useCallback(async (projectId: number) => {
    setIsLoading(true);
    try {
        const project = await db.getProject(projectId);
        if (!project) throw new Error("Project not found");
        
        setCurrentProjectName(project.name);
        setAddress(project.address);

        const [items, savedDims, projectPrices, multiplier, resellVal, contingency] = await Promise.all([
          db.getAllLineItems(projectId),
          db.getProjectData<Record<string, Omit<RoomDimensions, 'room'>>>(projectId, 'roomDimensions', {}),
          db.getProjectData<UnitPrice[]>(projectId, 'unitPrices', []),
          db.getProjectData<number>(projectId, 'costMultiplier', 1.0),
          db.getProjectData<number>(projectId, 'targetResellValue', 0),
          db.getProjectData<number>(projectId, 'contingencyPercentage', 0)
        ]);

        const globalDefaults = await db.getProjectData<UnitPrice[]>(null, 'globalDefaultUnitPrices', []);

        setLineItems(items);
        setRoomDimensions(savedDims);
        setCostMultiplier(multiplier || 1.0);
        setTargetResellValue(resellVal || 0);
        setContingencyPercentage(contingency || 0);

        const priceMap = new Map<string, UnitPrice>();
        DEFAULT_UNIT_PRICES.forEach(p => priceMap.set(p.id, p));
        if (globalDefaults && Array.isArray(globalDefaults)) {
            globalDefaults.forEach(p => priceMap.set(p.id, p));
        }
        if (projectPrices && Array.isArray(projectPrices) && projectPrices.length > 0) {
            projectPrices.forEach(p => priceMap.set(p.id, p));
        }
        
        setUnitPrices(Array.from(priceMap.values()));
    } catch (e) {
        console.error(e);
        setCurrentProjectId(null); 
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentProjectId) {
        loadProjectData(currentProjectId);
    }
  }, [currentProjectId, loadProjectData]);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAddItems = useCallback(async (itemsToAdd: (Omit<LineItem, 'id'> | LineItem)[]) => {
    if (!currentProjectId) return;
    const itemsWithFullData = itemsToAdd.map(item => ({
        ...item,
        materialsProvidedBy: item.materialsProvidedBy || 'Contractor',
    }));
    if (editingItem) {
        await db.deleteLineItem(editingItem.id);
        await db.addBulkLineItems(currentProjectId, itemsWithFullData as Omit<LineItem, 'id' | 'projectId'>[]);
        setEditingItem(null);
    } else {
        await db.addBulkLineItems(currentProjectId, itemsWithFullData as Omit<LineItem, 'id' | 'projectId'>[]);
    }
    const allItems = await db.getAllLineItems(currentProjectId);
    setLineItems(allItems);
  }, [editingItem, currentProjectId]);

  const handleUpdateItem = useCallback(async (updatedItem: LineItem) => {
    if (!currentProjectId) return;
    try {
        await db.updateLineItem(updatedItem);
        const allItems = await db.getAllLineItems(currentProjectId);
        setLineItems(allItems);
    } catch(e) {
        console.error("Failed to update item", e);
        alert("Failed to update item.");
    }
  }, [currentProjectId]);

  const handleDeleteItem = useCallback((id: number) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      isDangerous: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        if (!currentProjectId) return;
        try {
          await db.deleteLineItem(Number(id));
          const allItems = await db.getAllLineItems(currentProjectId);
          setLineItems(allItems);
        } catch (e: any) {
          console.error("Failed to delete item", e);
        }
      }
    });
  }, [currentProjectId]);

  const handleRemovePhoto = useCallback(async (item: LineItem) => {
      if (!currentProjectId) return;
      const updatedItem = { ...item, photo: undefined };
      try {
        await db.updateLineItem(updatedItem);
        const allItems = await db.getAllLineItems(currentProjectId);
        setLineItems(allItems);
      } catch (e) {
        console.error("Failed to remove photo", e);
      }
  }, [currentProjectId]);

  const handleDuplicateItem = useCallback(async (item: LineItem) => {
      if (!currentProjectId) return;
      const { id, projectId, ...itemData } = item;
      await db.addLineItem(currentProjectId, itemData);
      const allItems = await db.getAllLineItems(currentProjectId);
      setLineItems(allItems);
  }, [currentProjectId]);

  const handleDeleteAllItemsInRoom = useCallback((room: string) => {
    setConfirmModalState({
      isOpen: true,
      title: `Clear ${room}`,
      message: `Are you sure you want to delete ALL items in ${room}?`,
      isDangerous: true,
      confirmText: 'Delete All',
      onConfirm: async () => {
        if (!currentProjectId) return;
        try {
            await db.deleteItemsInRoom(currentProjectId, room);
            const allItems = await db.getAllLineItems(currentProjectId);
            setLineItems(allItems);
        } catch (e: any) {
            console.error("Failed to clear room", e);
        }
      }
    });
  }, [currentProjectId]);

  const handleAddTemplate = useCallback(async (itemNames: string[]) => {
      if (!currentProjectId || !currentRoom) return;
      const dims = roomDimensions[currentRoom];
      const itemsToAdd: Omit<LineItem, 'id'>[] = itemNames.map(name => {
          const mapEntry = TRADE_MAP[name];
          let quantity = 1; 
          if (dims) {
             const calculated = calculateDimensionBasedQuantity(name, dims);
             if (calculated !== undefined) quantity = calculated;
          }
          return {
              room: currentRoom,
              item: name,
              trade: mapEntry ? mapEntry.trade : 'Misc',
              action: mapEntry ? mapEntry.defaultAction : 'REPLACE',
              unit: mapEntry ? mapEntry.defaultUnit : 'EA',
              quantity: quantity,
              materialsProvidedBy: 'Contractor',
              notes: 'Added via Quick Template'
          };
      });
      await db.addBulkLineItems(currentProjectId, itemsToAdd as Omit<LineItem, 'id' | 'projectId'>[]);
      const allItems = await db.getAllLineItems(currentProjectId);
      setLineItems(allItems);
      alert(`Added ${itemsToAdd.length} items to ${currentRoom}!`);
  }, [currentProjectId, currentRoom, roomDimensions]);

  const handleUpdateAddress = useCallback(async (newAddress: string) => {
    if (!currentProjectId) return;
    setAddress(newAddress);
    await db.setProjectData(currentProjectId, 'address', newAddress);
  }, [currentProjectId]);

  const handleUpdateDimensionsList = useCallback(async (dimensionsList: RoomDimensions[]) => {
      if (!currentProjectId) return;
      const updatedDimMap = { ...roomDimensions };
      dimensionsList.forEach(dim => {
          updatedDimMap[dim.room] = { 
            length: dim.length, 
            width: dim.width,
            sidingHeight: dim.sidingHeight,
            roofPitch: dim.roofPitch,
            subAreas: dim.subAreas
          };
      });
      setRoomDimensions(updatedDimMap);
      await db.setProjectData(currentProjectId, 'roomDimensions', updatedDimMap);
  }, [roomDimensions, currentProjectId]);

  const handleUpdateSingleRoomDimension = useCallback(async (room: string, updatedValues: Partial<Omit<RoomDimensions, 'room'>>) => {
      if (!currentProjectId) return;
      const currentDims = roomDimensions[room] || { length: 0, width: 0 };
      const newDims = { ...currentDims, ...updatedValues };
      const updatedDimMap = { ...roomDimensions, [room]: newDims };
      setRoomDimensions(updatedDimMap);
      await db.setProjectData(currentProjectId, 'roomDimensions', updatedDimMap);
  }, [roomDimensions, currentProjectId]);

  const handleAutoCalculateQuantities = useCallback(async (room: string) => {
    if (!currentProjectId) return;
    const dims = roomDimensions[room];
    if (!dims || !dims.length || !dims.width) {
      alert("Please enter room dimensions first.");
      return;
    }
    const roomItems = lineItems.filter(i => i.room === room);
    const itemsToUpdate: LineItem[] = [];
    roomItems.forEach(item => {
      const calculatedQty = calculateDimensionBasedQuantity(item.item, dims);
      if (calculatedQty !== undefined && calculatedQty > 0) {
         if (item.quantity !== calculatedQty) {
            itemsToUpdate.push({ ...item, quantity: calculatedQty });
         }
      }
    });
    if (itemsToUpdate.length === 0) {
      alert("Items already up to date.");
      return;
    }
    setConfirmModalState({
      isOpen: true,
      title: 'Update Quantities',
      message: `Update quantities for ${itemsToUpdate.length} items?`,
      isDangerous: false,
      confirmText: 'Update',
      onConfirm: async () => {
        await Promise.all(itemsToUpdate.map(item => db.updateLineItem(item)));
        const allItems = await db.getAllLineItems(currentProjectId);
        setLineItems(allItems);
      }
    });
  }, [lineItems, roomDimensions, currentProjectId]);

  const handleSavePrices = useCallback(async (prices: UnitPrice[]) => {
    if (!currentProjectId) return;
    setUnitPrices(prices);
    await db.setProjectData(currentProjectId, 'unitPrices', prices);
  }, [currentProjectId]);

  const handleSaveAsDefaultPrices = useCallback(async (prices: UnitPrice[]) => {
    if (!currentProjectId) return;
    await db.setProjectData(currentProjectId, 'unitPrices', prices);
    await db.setProjectData(null, 'globalDefaultUnitPrices', prices); 
    alert("Saved as Defaults.");
    await loadProjectData(currentProjectId);
  }, [loadProjectData, currentProjectId]);

  const handleUpdateMultiplier = useCallback(async (val: number) => {
      if (!currentProjectId) return;
      setCostMultiplier(val);
      await db.setProjectData(currentProjectId, 'costMultiplier', val);
  }, [currentProjectId]);

  const handleUpdateResellValue = useCallback(async (val: number) => {
      if (!currentProjectId) return;
      setTargetResellValue(val);
      await db.setProjectData(currentProjectId, 'targetResellValue', val);
  }, [currentProjectId]);

  const handleUpdateContingency = useCallback(async (val: number) => {
      if (!currentProjectId) return;
      setContingencyPercentage(val);
      await db.setProjectData(currentProjectId, 'contingencyPercentage', val);
  }, [currentProjectId]);
  
  const handleSmartAIProcessing = async (result: any) => {
    if (!currentProjectId || !result) return;
    setIsProcessingAI(true);
    
    let currentDimsMap = { ...roomDimensions };
    
    // 1. Process the structured dimensions
    if (result.dimensions && result.dimensions.length > 0) {
        result.dimensions.forEach((dim: any) => {
            currentDimsMap[dim.room] = { 
              length: dim.length, width: dim.width,
              sidingHeight: dim.sidingHeight, roofPitch: dim.roofPitch, subAreas: dim.subAreas
            };
        });
    }

    // 2. Process items
    if (result.items && result.items.length > 0) {
            const enrichedItems = result.items.map((itm: any) => {
            const isDimensional = ['SF', 'LF', 'SQ'].includes(itm.unit || '');
            
            // Fallback Dimension Parsing
            if (!currentDimsMap[itm.room]) {
                const foundInSpecs = parseDimensionsFromText(itm.specs || '');
                const foundInNotes = parseDimensionsFromText(itm.notes || '');
                const foundDims = foundInSpecs || foundInNotes;
                
                if (foundDims) {
                    currentDimsMap[itm.room] = { ...foundDims };
                }
            }

            const isSuspiciouslyLow = itm.quantity === undefined || itm.quantity === 0 || (isDimensional && itm.quantity <= 1);
            
            if (isSuspiciouslyLow) {
                    const dims = currentDimsMap[itm.room];
                    if (dims) {
                        const calculated = calculateDimensionBasedQuantity(itm.item, dims);
                        if (calculated !== undefined && calculated > 0) return { ...itm, quantity: calculated };
                    }
            }
            return itm;
        });

        // Persist
        setRoomDimensions(currentDimsMap);
        await db.setProjectData(currentProjectId, 'roomDimensions', currentDimsMap);

        // Add items
        await handleAddItems(enrichedItems);
    }
    
    setIsWalkthroughModalOpen(false);
    setIsBulkPasteModalOpen(false);
    setIsProcessingAI(false);
  };

  const handleResetProject = useCallback(() => {
    setConfirmModalState({
      isOpen: true, title: 'Reset Project Data', message: 'Wipe all data?', isDangerous: true, confirmText: 'Reset',
      onConfirm: async () => {
        if (!currentProjectId) return;
        await db.resetProject(currentProjectId);
        setCurrentProjectId(null);
      }
    });
  }, [currentProjectId]);

  const closeConfirmModal = () => setConfirmModalState(prev => ({ ...prev, isOpen: false }));

  const handlePrintSOW = () => {
    if (view !== 'sow') { setView('sow'); setIsPrinting(true); } else { window.focus(); setTimeout(() => window.print(), 200); }
  };

  const handleExportCSV = () => {
      const sanitizedName = currentProjectName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      exportToCsv(lineItems, unitPrices, address, `SOW_${sanitizedName}.csv`, 'room');
  };

  useEffect(() => {
    if (isPrinting && view === 'sow') {
      const timer = setTimeout(() => { window.focus(); window.print(); setIsPrinting(false); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [view, isPrinting]);

  const renderListView = () => {
    if (currentRoom) {
      return (
        <RoomDetailView
          roomName={currentRoom}
          itemsInRoom={lineItems.filter(item => item.room === currentRoom)}
          dimensions={roomDimensions[currentRoom]}
          onUpdateDimensions={(updatedValues) => handleUpdateSingleRoomDimension(currentRoom, updatedValues)}
          onGoBack={() => setCurrentRoom(null)}
          onAddItem={() => setIsItemFormOpen(true)}
          onDeleteItem={handleDeleteItem}
          onDeleteAllItems={() => handleDeleteAllItemsInRoom(currentRoom)}
          setEditingItem={(item) => { setEditingItem(item); setIsItemFormOpen(true); }}
          onAutoCalculate={() => handleAutoCalculateQuantities(currentRoom)}
          onAddTemplate={handleAddTemplate}
          unitPrices={unitPrices} 
          onDuplicateItem={handleDuplicateItem}
          onSwitchRoom={(r) => setCurrentRoom(r)}
          onDirectAdd={(item) => handleAddItems([item])}
          onUpdateItem={handleUpdateItem} 
        />
      );
    }
    const itemsByRoom = lineItems.reduce((acc, item) => { acc[item.room] = (acc[item.room] || 0) + 1; return acc; }, {} as Record<string, number>);
    return (
      <div className="animate-fade-in">
        <ProjectTotals lineItems={lineItems} unitPrices={unitPrices} costMultiplier={costMultiplier} contingencyPercentage={contingencyPercentage} onOpenPricing={() => setIsPricingModalOpen(true)} />
        <div className="px-4 pb-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ROOMS.map(room => (
            <button key={room} onClick={() => setCurrentRoom(room)} className="bg-base-200 p-5 rounded-xl shadow-md hover:bg-base-300 hover:ring-2 hover:ring-brand-primary transition-all text-left border border-base-300 group">
              <h3 className="font-bold text-white text-lg truncate group-hover:text-brand-primary transition-colors">{room}</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{itemsByRoom[room] || 0} items</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case 'sow': return <SOWView lineItems={lineItems} address={address} />;
      case 'materials': return <MaterialListView lineItems={lineItems} roomDimensions={roomDimensions} address={address} />;
      case 'summary': return (
        <SummaryView 
            lineItems={lineItems} 
            unitPrices={unitPrices} 
            costMultiplier={costMultiplier}
            targetResellValue={targetResellValue}
            contingencyPercentage={contingencyPercentage}
            onUpdateMultiplier={handleUpdateMultiplier}
            onUpdateResellValue={handleUpdateResellValue}
            onUpdateContingency={handleUpdateContingency}
            address={address} 
            roomDimensions={roomDimensions} 
            onOpenPricing={() => setIsPricingModalOpen(true)} 
        />
      );
      case 'gallery': return <GalleryView lineItems={lineItems} onRemovePhoto={handleRemovePhoto} address={address} />;
      case 'dimensions': return <DimensionsSummaryView roomDimensions={roomDimensions} address={address} />;
      case 'list': default: return renderListView();
    }
  };

  if (!user) return <LoginView onLogin={handleLogin} />;
  if (!currentProjectId) return <ProjectDashboard user={user} onSelectProject={setCurrentProjectId} onLogout={handleLogout} onOpenHelp={() => setIsHelpOpen(true)} />;
  if (isLoading) return <div className="bg-base-100 text-white min-h-screen flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div><p>Loading...</p></div></div>;

  return (
    <div id="app-container" className="bg-base-100 min-h-screen text-white font-sans flex flex-col overflow-x-hidden">
      <header className="bg-base-200 px-4 py-3 flex justify-between items-center shadow-xl sticky top-0 z-40 print:relative print:shadow-none print:bg-white print:border-b">
        <div className="flex items-center gap-3 overflow-hidden">
             <button onClick={() => setCurrentProjectId(null)} className="text-gray-400 hover:text-white p-1 no-print">
                <ChevronLeftIcon />
             </button>
             <div className="flex items-center gap-2 truncate">
                <LogoIcon className="w-8 h-8 flex-shrink-0 text-brand-primary" />
                <div className="flex flex-col truncate">
                    <h1 className="text-base font-black text-white truncate print:text-black uppercase tracking-tight">{currentProjectName}</h1>
                    <div className="flex items-center text-[10px] text-gray-500 truncate no-print"><span className="mr-0.5"><LocationMarkerIcon /></span><span className="truncate">{address}</span></div>
                </div>
             </div>
        </div>
        
        <div className="flex items-center space-x-2 no-print relative">
            <button onClick={() => setIsBulkPasteModalOpen(true)} className="bg-brand-primary/10 text-brand-primary p-2.5 rounded-lg hover:bg-brand-primary hover:text-white transition-all shadow-sm border border-brand-primary/20"><ClipboardIcon /></button>
            
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className={`p-2.5 rounded-lg transition-all border ${isMenuOpen ? 'bg-base-300 border-gray-500' : 'bg-base-200 border-base-300 text-gray-400 hover:text-white'}`}
            >
                <DotsHorizontalIcon />
            </button>

            {/* Overflow Menu */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 top-12 w-56 bg-base-200 border border-base-300 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in py-2">
                        <button onClick={() => { setIsAddressModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-300 flex items-center gap-3 text-sm font-medium border-b border-base-300/50">
                            <LocationMarkerIcon /> <span>Edit Address</span>
                        </button>
                        <button onClick={() => { setIsDisplaySettingsOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-300 flex items-center gap-3 text-sm font-medium border-b border-base-300/50">
                            <span className="font-black text-lg h-6 w-6 flex items-center justify-center">A</span> <span>Text Size</span>
                        </button>
                        <button onClick={() => { setIsExportModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-300 flex items-center gap-3 text-sm font-medium border-b border-base-300/50">
                            <PrinterIcon /> <span>Print & Export</span>
                        </button>
                        <button onClick={() => { setIsSyncModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-300 flex items-center gap-3 text-sm font-medium border-b border-base-300/50">
                            <ShareIcon /> <span>Project Transfer</span>
                        </button>
                        <button onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-base-300 flex items-center gap-3 text-sm font-medium border-b border-base-300/50">
                            <HelpCircleIcon /> <span>Help & Tutorial</span>
                        </button>
                        <button onClick={() => { handleResetProject(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-red-900/20 text-red-400 flex items-center gap-3 text-sm font-medium transition-colors">
                            <TrashIcon /> <span>Wipe Project</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-base-200 border-b border-base-300 px-4 py-2 sticky top-[60px] z-30 shadow-md no-print overflow-x-auto no-scrollbar">
        <div className="flex bg-base-100 rounded-xl p-1 gap-1 min-w-max">
            <button onClick={() => setView('list')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'list' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                <ListIcon /> <span>Rooms</span>
            </button>
            <button onClick={() => setView('dimensions')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'dimensions' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                <CalculatorIcon /> <span>Dims</span>
            </button>
            <button onClick={() => setView('sow')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'sow' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                <DocumentTextIcon /> <span>Scope</span>
            </button>
            <button onClick={() => setView('materials')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'materials' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                <CubeIcon /> <span>Buy</span>
            </button>
            <button onClick={() => setView('gallery')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'gallery' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                <PhotographIcon /> <span>Media</span>
            </button>
            <button onClick={() => setView('summary')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'summary' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                <SummaryIcon /> <span>Review</span>
            </button>
        </div>
      </div>

      <main className="flex-grow overflow-y-auto pb-24 print:pb-0 print:overflow-visible print:h-auto">{renderView()}</main>
      
      <button onClick={() => setIsWalkthroughModalOpen(true)} className="fixed bottom-6 right-6 bg-brand-primary text-white p-4 rounded-full shadow-2xl hover:bg-brand-secondary active:scale-90 transition-all z-40 flex items-center justify-center no-print ring-4 ring-brand-primary/20"><SparklesIcon /></button>
      
      {isItemFormOpen && (
        <div className="no-print">
          <ItemForm onAddItems={handleAddItems} onUpdateDimensions={handleUpdateDimensionsList} onClose={() => { setIsItemFormOpen(false); setEditingItem(null); }} initialRoom={currentRoom || undefined} isOnline={isOnline} allRoomDimensions={roomDimensions as any} initialItemData={editingItem} unitPrices={unitPrices} />
        </div>
      )}
      {isAddressModalOpen && <AddressModal onClose={() => setIsAddressModalOpen(false)} onSave={handleUpdateAddress} currentAddress={address} />}
      {isWalkthroughModalOpen && <WalkthroughModal onClose={() => setIsWalkthroughModalOpen(false)} onComplete={handleSmartAIProcessing} isProcessing={isProcessingAI} />}
      {isBulkPasteModalOpen && <BulkPasteModal onClose={() => setIsBulkPasteModalOpen(false)} onComplete={handleSmartAIProcessing} isProcessing={isProcessingAI} />}
      {isPricingModalOpen && <UnitPricingModal onClose={() => setIsPricingModalOpen(false)} lineItems={lineItems} savedPrices={unitPrices} onSave={handleSavePrices} onSaveAsDefault={handleSaveAsDefaultPrices} />}
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} onPrintSOW={handlePrintSOW} onExportCSV={handleExportCSV} />}
      {isDisplaySettingsOpen && <DisplaySettingsModal currentScale={uiScale} onSetScale={setUiScale} onClose={() => setIsDisplaySettingsOpen(false)} />}
      {isSyncModalOpen && user && currentProjectId && <ProjectSyncModal onClose={() => setIsSyncModalOpen(false)} onImportComplete={() => loadProjectData(currentProjectId)} onReturnToDashboard={() => { setIsSyncModalOpen(false); setCurrentProjectId(null); }} currentAddress={address} projectId={currentProjectId} ownerEmail={user.email} />}
      <ConfirmationModal isOpen={confirmModalState.isOpen} onClose={closeConfirmModal} onConfirm={confirmModalState.onConfirm} title={confirmModalState.title} message={confirmModalState.message} isDangerous={confirmModalState.isDangerous} confirmText={confirmModalState.confirmText} />
      
      {isOnboardingOpen && (
        <OnboardingTutorial onComplete={completeOnboarding} />
      )}

      {isHelpOpen && (
        <HelpSection 
            onClose={() => setIsHelpOpen(false)} 
            onStartTutorial={() => {
                setIsHelpOpen(false);
                setIsOnboardingOpen(true);
            }} 
        />
      )}
    </div>
  );
};

export default App;
