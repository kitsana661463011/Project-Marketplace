import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize2, Move, MousePointer, X, Check, Save, Lock, Unlock, Eye, MapPin, Grid, RefreshCw, Folder, Layers, AlertCircle, HelpCircle } from 'lucide-react';

interface ExtendedMarketZone {
  id: string;
  code: string;
  status: string;
  zone?: string;
  row?: number;
  col?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isLocked: boolean;
  size: string;
  price: number;
  item_type: 'block' | 'road' | 'zone' | 'entrance' | 'toilet';
  stall_id?: number | null;
  zone_id?: number | null;
  fill_color?: string;
  seller?: {
    id: string;
    name: string;
    phone: string;
  };
}

export const MarketMapPage: React.FC = () => {
  // Map Items state
  const [stalls, setStalls] = useState<ExtendedMarketZone[]>([]);
  const [dbZones, setDbZones] = useState<{ zone_id: number; zone_name: string; zone_price: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Layout changes tracking state
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // UI States
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'move'>('select');
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Drag & Resize State Machine (Stores child initial coordinates for group dragging)
  const [interaction, setInteraction] = useState<{
    type: 'drag' | 'resize' | null;
    itemId: string | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startItemX: number;
    startItemY: number;
    childPositions?: { id: string; startX: number; startY: number }[];
  }>({
    type: null,
    itemId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startItemX: 0,
    startItemY: 0,
    childPositions: [],
  });

  // Edit Modal States
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [editingStall, setEditingStall] = useState<ExtendedMarketZone | null>(null);
  const [editStatus, setEditStatus] = useState<string>('available');
  const [editSellerName, setEditSellerName] = useState<string>('');
  const [editSellerPhone, setEditSellerPhone] = useState<string>('');
  const [editSize, setEditSize] = useState<string>('3x3 เมตร');
  const [editPrice, setEditPrice] = useState<number>(500);
  const [editZoneId, setEditZoneId] = useState<number | null>(null);
  const [editItemType, setEditItemType] = useState<'block' | 'road' | 'zone' | 'entrance' | 'toilet'>('block');

  // New Element Creation Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createItemType, setCreateItemType] = useState<'block' | 'road' | 'zone' | 'toilet' | 'entrance'>('block');
  const [createCode, setCreateCode] = useState<string>('');
  const [createSize, setCreateSize] = useState<string>('3x3 เมตร');
  const [createPrice, setCreatePrice] = useState<number>(500);
  const [createZoneId, setCreateZoneId] = useState<number | null>(null);

  // Beautiful Custom Confirmation Dialog State (Requires high z-index to overlay modals)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    actionText: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
  } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'block': return 'แผงค้า';
      case 'road': return 'ถนน / ทางเดิน';
      case 'toilet': return 'ห้องน้ำ';
      case 'entrance': return 'ทางเข้า';
      case 'zone': return 'โซนพื้นที่ (กลุ่มแผง)';
      default: return 'วัตถุแผนผัง';
    }
  };

  // Load Map Data on Mount
  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/maps/1');
      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลแผนผังจากระบบหลักได้');
      }

      const json = await response.json();
      const items = Array.isArray(json?.data?.items) ? json.data.items : [];
      const zones = Array.isArray(json?.data?.zones) ? json.data.zones : [];

      setDbZones(zones);

      const mappedItems = items.map((item: any) => ({
        id: String(item.map_item_id),
        code: item.label || `แผงค้า #${item.stall_id || item.map_item_id}`,
        status: item.status || 'available',
        item_type: item.item_type || 'block',
        stall_id: item.stall_id,
        zone_id: item.zone_id,
        x: Number(item.x) || 100,
        y: Number(item.y) || 100,
        width: Number(item.width) || 75,
        height: Number(item.height) || 75,
        fill_color: item.fill_color,
        isLocked: false,
        size: item.size || '3x3 เมตร',
        price: item.price || 500,
        seller: item.seller || undefined,
      } as ExtendedMarketZone));

      setStalls(mappedItems);
      setHasChanges(false); // Reset changes status on initial load
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลแผนผัง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Save Layout to Backend
  const saveLayoutToBackend = async () => {
    try {
      setSaving(true);

      const payload = {
        items: stalls.map(s => ({
          map_item_id: s.id,
          item_type: s.item_type,
          stall_id: s.stall_id || null,
          zone_id: s.zone_id || null,
          label: s.code,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          fill_color: s.fill_color || null,
          size: s.size || null,
          status: s.status || null,
        }))
      };

      const response = await fetch('/api/v1/maps/1/items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถบันทึกตำแหน่งแผนผังลงฐานข้อมูลได้');
      }

      alert('บันทึกตำแหน่งแผนผังตลาดนัดลงฐานข้อมูลสำเร็จ');
      setHasChanges(false); // Reset change tracker on successful save
      await loadMapData(); // Refresh DB IDs from backend
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  // Trigger Confirmation Dialog before saving to backend
  const triggerSaveConfirm = () => {
    setConfirmDialog({
      title: 'บันทึกตำแหน่งผังตลาดนัด',
      message: 'คุณต้องการบันทึกพิกัด ขนาด และความสัมพันธ์ของโครงสร้างผังตลาดทั้งหมดลงสู่ระบบหลักใช่หรือไม่?',
      actionText: 'ยืนยันการบันทึก',
      type: 'success',
      onConfirm: () => {
        saveLayoutToBackend();
        setConfirmDialog(null);
      }
    });
  };

  // Find parent zone bounds to restrict a stall
  const getParentZone = (stall: ExtendedMarketZone) => {
    return stalls.find(s => s.item_type === 'zone' && s.zone_id === stall.zone_id);
  };

  // Group stalls inside a zone helper
  const getStallsInZone = (zone: ExtendedMarketZone) => {
    return stalls.filter(s => s.item_type === 'block' && s.zone_id === zone.zone_id);
  };

  const getStatusColor = (item: ExtendedMarketZone) => {
    if (item.item_type === 'road') {
      return 'bg-slate-100/95 border-slate-300 text-slate-700 shadow-sm border-2';
    }
    if (item.item_type === 'toilet') {
      return 'bg-amber-100/95 border-2 border-amber-500 text-amber-950 shadow-md font-black';
    }
    if (item.item_type === 'zone') {
      // Softened dashed boundaries for visual zones to avoid distraction
      return 'bg-indigo-50/5 border-dashed border-2 border-indigo-400/40 hover:bg-indigo-50/15 text-indigo-950 shadow-inner';
    }

    switch (item.status) {
      case 'available':
        return 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-md shadow-emerald-500/10 hover:bg-emerald-600';
      case 'occupied':
        return 'bg-rose-500 text-white border-2 border-rose-600 shadow-md shadow-rose-500/10 hover:bg-rose-600';
      case 'repair':
        return 'bg-amber-500 text-white border-2 border-amber-600 shadow-md shadow-amber-500/10 hover:bg-amber-600';
      default:
        return 'bg-slate-200 border-2 border-slate-400 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'ว่าง (Available)';
      case 'occupied':
        return 'จองแล้ว (Occupied)';
      case 'repair':
        return 'ปรับปรุง (Repair)';
      default:
        return status;
    }
  };

  // Zoom Operations
  const zoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.15));
  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Open Element Creation Popup
  const openCreateModal = (type: 'block' | 'road' | 'zone' | 'toilet' | 'entrance') => {
    const nextNum = stalls.length + 1;
    const prefix = type === 'block' ? 'D' : type === 'zone' ? 'ZONE-' : type.toUpperCase();

    setCreateItemType(type);
    setCreateCode(`${prefix}${nextNum}`);
    setCreateSize('3x3 เมตร');
    setCreatePrice(500);
    setCreateZoneId(null);
    setShowCreateModal(true);
  };

  // Confirm and insert newly created item into canvas with warning confirm
  const handleCreateStall = () => {
    setConfirmDialog({
      title: `ยืนยันการสร้าง ${getItemTypeName(createItemType)} ใหม่`,
      message: `คุณต้องการบันทึกและเพิ่มวัตถุใหม่ "${createCode}" ลงบนแผนผังตลาดนัดใช่หรือไม่?`,
      actionText: 'ยืนยันการเพิ่มวัตถุ',
      type: 'info',
      onConfirm: () => {
        let finalLabel = createCode;
        if (createItemType === 'zone' && createZoneId) {
          const matched = dbZones.find(dz => dz.zone_id === createZoneId);
          if (matched) {
            finalLabel = matched.zone_name;
          }
        }

        // Calculate initial target coordinates
        let targetX = 150 + (stalls.length * 35) % 400;
        let targetY = 200;

        // Check bounds and clamp to parent zone if chosen
        if (createItemType === 'block' && createZoneId) {
          const parentZone = stalls.find(s => s.item_type === 'zone' && s.zone_id === createZoneId);
          if (parentZone) {
            const minX = parentZone.x + 10;
            const minY = parentZone.y + 10;
            const maxX = parentZone.x + parentZone.width - 80 - 10;
            const maxY = parentZone.y + parentZone.height - 80 - 10;
            targetX = maxX > minX ? Math.max(minX, Math.min(maxX, targetX)) : minX;
            targetY = maxY > minY ? Math.max(minY, Math.min(maxY, targetY)) : minY;
          }
        }

        const newElement: ExtendedMarketZone = {
          id: `new-${Date.now()}`,
          code: finalLabel,
          status: 'available', // Cleaned active dead value to standard status
          x: targetX,
          y: targetY,
          width: createItemType === 'zone' ? 350 : createItemType === 'road' ? 250 : 80,
          height: createItemType === 'zone' ? 250 : createItemType === 'road' ? 70 : 80,
          isLocked: false,
          size: createSize,
          price: createItemType === 'block' ? createPrice : 0,
          item_type: createItemType,
          zone_id: (createItemType === 'block' || createItemType === 'zone') ? createZoneId : null,
        };
        setStalls([...stalls, newElement]);
        setSelectedStallId(newElement.id);
        setShowCreateModal(false);
        setConfirmDialog(null);
        setHasChanges(true); // Flag layout changes
      }
    });
  };

  // Request to delete stall with custom confirmation modal
  const requestDeleteStall = (id: string) => {
    const item = stalls.find(s => s.id === id);
    if (!item) return;

    setConfirmDialog({
      title: `ยืนยันการลบข้อมูล ${getItemTypeName(item.item_type)}`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${item.code}" ออกจากแผนผังตลาดนัด? บล็อกนี้จะถูกนำออกทันทีเมื่อคุณบันทึกผัง`,
      actionText: 'ยืนยันการลบ',
      type: 'danger',
      onConfirm: () => {
        deleteStall(id);
        setConfirmDialog(null);
      }
    });
  };

  const deleteStall = (id: string) => {
    setStalls(stalls.filter(s => s.id !== id));
    if (selectedStallId === id) {
      setSelectedStallId(null);
    }
    setHasChanges(true); // Flag layout changes
  };

  // Lock / Unlock individual item (UI only - does not affect hasChanges)
  const toggleLockStall = (id: string) => {
    setStalls(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isLocked: !s.isLocked };
      }
      return s;
    }));
  };

  // Global Lock / Unlock all items (UI only - does not affect hasChanges)
  const lockAll = (lock: boolean) => {
    setStalls(prev => prev.map(s => ({ ...s, isLocked: lock })));
  };

  // Interaction handlers (Pointer Events for robust dragging outside elements)
  const handlePointerDown = (e: React.PointerEvent, type: 'drag' | 'resize', item: ExtendedMarketZone) => {
    if (item.isLocked) return;

    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // Collect initial positions of child stalls if dragging a ZONE
    let childPositions: { id: string; startX: number; startY: number }[] = [];
    if (type === 'drag' && item.item_type === 'zone') {
      const children = getStallsInZone(item);
      childPositions = children.map(c => ({
        id: c.id,
        startX: c.x,
        startY: c.y,
      }));
    }

    setInteraction({
      type,
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: item.width,
      startHeight: item.height,
      startItemX: item.x,
      startItemY: item.y,
      childPositions,
    });
    setSelectedStallId(item.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interaction.type || !interaction.itemId) return;

    const deltaX = (e.clientX - interaction.startX) / zoom;
    const deltaY = (e.clientY - interaction.startY) / zoom;

    setStalls(prev => prev.map(s => {
      if (s.id === interaction.itemId) {
        if (interaction.type === 'drag') {
          let calculatedX = Math.round(interaction.startItemX + deltaX);
          let calculatedY = Math.round(interaction.startItemY + deltaY);

          const parentZone = getParentZone(s);
          if (s.item_type === 'block' && parentZone) {
            const minX = parentZone.x;
            const minY = parentZone.y;
            const maxX = parentZone.x + parentZone.width - s.width;
            const maxY = parentZone.y + parentZone.height - s.height;
            calculatedX = Math.max(minX, Math.min(maxX, calculatedX));
            calculatedY = Math.max(minY, Math.min(maxY, calculatedY));
          } else {
            calculatedX = Math.max(0, calculatedX);
            calculatedY = Math.max(0, calculatedY);
          }

          return { ...s, x: calculatedX, y: calculatedY };
        } else if (interaction.type === 'resize') {
          let calculatedWidth = Math.round(interaction.startWidth + deltaX);
          let calculatedHeight = Math.round(interaction.startHeight + deltaY);

          const parentZone = getParentZone(s);
          if (s.item_type === 'block' && parentZone) {
            const maxWidth = parentZone.x + parentZone.width - s.x;
            const maxHeight = parentZone.y + parentZone.height - s.y;
            calculatedWidth = Math.max(35, Math.min(maxWidth, calculatedWidth));
            calculatedHeight = Math.max(35, Math.min(maxHeight, calculatedHeight));
          } else {
            calculatedWidth = Math.max(35, calculatedWidth);
            calculatedHeight = Math.max(35, calculatedHeight);
          }

          return { ...s, width: calculatedWidth, height: calculatedHeight };
        }
      }

      if (interaction.type === 'drag' && interaction.childPositions) {
        const childPos = interaction.childPositions.find(c => c.id === s.id);
        if (childPos) {
          const calculatedX = Math.round(childPos.startX + deltaX);
          const calculatedY = Math.round(childPos.startY + deltaY);
          return {
            ...s,
            x: Math.max(0, calculatedX),
            y: Math.max(0, calculatedY),
          };
        }
      }

      return s;
    }));
    setHasChanges(true); // Flag changes on drag/resize
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (interaction.itemId) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fail-silent
      }
    }
    setInteraction({
      type: null,
      itemId: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      startItemX: 0,
      startItemY: 0,
      childPositions: [],
    });
  };

  // Stage panning handlers
  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (e.target === canvasContainerRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { }
  };

  // Selected Block Detail Modal Setup
  const openDetailModal = (stall: ExtendedMarketZone) => {
    setEditingStall(stall);
    setEditStatus(stall.status);
    setEditSellerName(stall.seller?.name || '');
    setEditSellerPhone(stall.seller?.phone || '');
    setEditSize(stall.size);
    setEditPrice(stall.price);
    setEditZoneId(stall.zone_id || null);
    setEditItemType(stall.item_type);
    setShowDetailModal(true);
  };

  const saveStallDetails = () => {
    if (!editingStall) return;

    setStalls(prev => prev.map(s => {
      if (s.id === editingStall.id) {
        let newX = s.x;
        let newY = s.y;
        const newParent = stalls.find(pz => pz.item_type === 'zone' && pz.zone_id === editZoneId);

        // Correctly check editItemType to perform clamp check
        if (editItemType === 'block' && newParent) {
          const minX = newParent.x;
          const minY = newParent.y;
          const maxX = newParent.x + newParent.width - s.width;
          const maxY = newParent.y + newParent.height - s.height;
          newX = Math.max(minX, Math.min(maxX, s.x));
          newY = Math.max(minY, Math.min(maxY, s.y));
        }

        let finalCode = s.code;
        if (editItemType === 'zone' && editZoneId) {
          const matched = dbZones.find(dz => dz.zone_id === editZoneId);
          if (matched) {
            finalCode = matched.zone_name;
          }
        }

        return {
          ...s,
          code: finalCode,
          status: editStatus,
          seller: editStatus === 'occupied' ? { id: s.seller?.id || 's_new', name: editSellerName, phone: editSellerPhone } : undefined,
          size: editSize,
          price: editItemType === 'block' ? editPrice : 0,
          zone_id: (editItemType === 'block' || editItemType === 'zone') ? editZoneId : null,
          item_type: editItemType,
          x: newX,
          y: newY,
        };
      }
      return s;
    }));

    setShowDetailModal(false);
    setEditingStall(null);
    setHasChanges(true); // Flag details modification
  };

  const selectedStall = stalls.find(s => s.id === selectedStallId);

  const sortedStalls = [...stalls].sort((a, b) => {
    if (a.item_type === 'zone' && b.item_type !== 'zone') return -1;
    if (a.item_type !== 'zone' && b.item_type === 'zone') return 1;
    return 0;
  });

  const availableCount = stalls.filter(s => s.item_type === 'block' && s.status === 'available').length;
  const occupiedCount = stalls.filter(s => s.item_type === 'block' && s.status === 'occupied').length;
  const repairCount = stalls.filter(s => s.item_type === 'block' && s.status === 'repair').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 lg:p-6 font-sans">

      {/* ── Studio Clean Header Bar (Titles aligned in single row with buttons - Text size enlarged) ── */}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-800">โครงสร้างแผนผังตลาดนัด</h1>
            <p className="text-sm lg:text-base text-slate-500 mt-1">จัดวางโซนกลุ่มแผงค้าและควบคุมโครงสร้างพื้นที่อย่างเป็นระบบ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-all ${showGrid
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            title="แสดงเส้นกริด"
          >
            <Grid size={18} />
          </button>

          {/* Refresh Data */}
          <button
            onClick={loadMapData}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm"
            title="โหลดข้อมูลใหม่"
          >
            <RefreshCw size={16} />
          </button>

          {/* Save Button with solid colors, disabled only when no changes */}
          <button
            onClick={triggerSaveConfirm}
            disabled={saving || !hasChanges}
            className={`flex h-11 items-center gap-2 rounded-lg px-5 text-sm lg:text-base font-black transition-all duration-200 ${!hasChanges
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 active:scale-95'
              }`}
          >
            <Save size={16} />
            {saving ? 'กำลังบันทึก...' : 'บันทึกผังตลาด'}
          </button>
        </div>
      </div>

      {/* ── Compact Control Center Bar (Enlarged Buttons & Labels) ── */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Elements */}
          <button
            onClick={() => openCreateModal('block')}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm lg:text-base font-bold text-white transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>เพิ่มแผงค้า</span>
          </button>

          <button
            onClick={() => openCreateModal('zone')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm lg:text-base font-bold text-slate-700 hover:bg-slate-55 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>เพิ่มโซนใหม่</span>
          </button>

          <button
            onClick={() => openCreateModal('road')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm lg:text-base font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>เพิ่มถนน</span>
          </button>

          <button
            onClick={() => openCreateModal('toilet')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm lg:text-base font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>เพิ่มห้องน้ำ</span>
          </button>

          <button
            onClick={() => openCreateModal('entrance')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm lg:text-base font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>เพิ่มทางเข้า</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {/* Delete Block */}
          <button
            onClick={() => selectedStallId && requestDeleteStall(selectedStallId)}
            disabled={!selectedStallId}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm lg:text-base font-bold text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Trash2 size={16} />
            <span>ลบที่เลือก</span>
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {/* Interaction Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setMode('select')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm lg:text-base font-bold transition-all ${mode === 'select'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <MousePointer size={14} />
              <span>โหมดเรียกดู</span>
            </button>
            <button
              onClick={() => setMode('move')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm lg:text-base font-bold transition-all ${mode === 'move'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Move size={14} />
              <span>โหมดจัดวาง</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Position Lockers */}
          <button
            onClick={() => lockAll(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm lg:text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <Lock size={14} />
            <span>ล็อกทั้งหมด</span>
          </button>

          <button
            onClick={() => lockAll(false)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm lg:text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <Unlock size={14} />
            <span>ปลดล็อกทั้งหมด</span>
          </button>
        </div>

        {/* Legend Dashboard (Enlarged text size) */}
        <div className="flex items-center gap-3 text-sm lg:text-base font-bold">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-emerald-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>แผงว่าง: {availableCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-rose-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>จองแล้ว: {occupiedCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-amber-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>ซ่อมแซม: {repairCount}</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout Workspace ── */}
      <div className="flex flex-col gap-6 lg:flex-row">

        {/* ── Clean White Studio Canvas Editor ── */}
        <div
          ref={canvasContainerRef}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          className="relative flex-1 min-h-[660px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md"
        >
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
              <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <p className="text-base font-bold text-slate-500">กำลังเชื่อมต่อโครงสร้างผังตลาด...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-4 text-center z-50">
              <X className="h-14 w-14 text-rose-500 mb-4" />
              <p className="text-lg font-black text-slate-800 mb-2">{error}</p>
              <button
                onClick={loadMapData}
                className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-bold text-white transition-all shadow-md"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : null}

          {/* Softer Opacity Slate Dots Grid Backdrop */}
          <div
            className="canvas-bg absolute inset-0 cursor-grab active:cursor-grabbing transition-shadow duration-300"
            style={{
              backgroundImage: showGrid ? 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)' : 'none',
              backgroundSize: '24px 24px',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Render items sorted: zones first (drawn on background) */}
            {sortedStalls.map((stall) => {
              const isSelected = selectedStallId === stall.id;
              const zoneLabel = stall.item_type === 'zone'
                ? (dbZones.find(z => z.zone_id === stall.zone_id)?.zone_name || stall.code)
                : stall.code;

              return (
                <div
                  key={stall.id}
                  onPointerDown={(e) => mode === 'move' ? handlePointerDown(e, 'drag', stall) : undefined}
                  onClick={() => {
                    setSelectedStallId(stall.id);
                    if (mode === 'select') {
                      openDetailModal(stall);
                    }
                  }}
                  className={`absolute flex select-none flex-col items-center justify-center rounded-2xl text-center border-2 transition-all duration-100 shadow-sm ${getStatusColor(
                    stall
                  )} ${isSelected
                    ? 'ring-4 ring-indigo-500/25 ring-offset-2 ring-offset-white border-indigo-600 scale-[1.04] z-35 shadow-lg shadow-indigo-600/10'
                    : stall.item_type === 'zone' ? 'z-0 border-2' : 'z-10'
                    } ${stall.isLocked ? 'cursor-default opacity-85' : 'cursor-move hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  style={{
                    left: `${stall.x}px`,
                    top: `${stall.y}px`,
                    width: `${stall.width}px`,
                    height: `${stall.height}px`,
                    touchAction: 'none',
                  }}
                >
                  {/* Subtle lower depth side bar for stall blocks */}
                  {stall.item_type !== 'zone' && (
                    <div className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-b-xl bg-black/5 pointer-events-none" />
                  )}

                  {/* Stall Code / Label (Enlarged Text) */}
                  <span className="text-sm lg:text-base tracking-tight font-black uppercase">{zoneLabel}</span>

                  {/* Size Label (Enlarged Text) */}
                  {stall.item_type === 'block' && stall.width >= 55 && (
                    <span className="text-[11px] font-bold text-white/90 mt-0.5">{stall.size.replace(' เมตร', 'ม.')}</span>
                  )}

                  {/* Render Stall Count on Zone Blocks (Enlarged Text) */}
                  {stall.item_type === 'zone' && (
                    <span className="text-xs lg:text-sm font-extrabold text-blue-600 mt-1 flex items-center gap-1.5">
                      <Folder size={11} />
                      {getStallsInZone(stall).length} แผง
                    </span>
                  )}

                  {/* Lock Indicator */}
                  {stall.isLocked && (
                    <div className="absolute top-1.5 right-1.5 rounded-md bg-slate-800/85 p-1 text-white border border-white/10 shadow-sm animate-pulse">
                      <Lock size={10} />
                    </div>
                  )}

                  {/* Resize Anchor Handle */}
                  {isSelected && !stall.isLocked && mode === 'move' && (
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'resize', stall)}
                      className="absolute bottom-0 right-0 h-6 w-6 translate-x-1.5 translate-y-1.5 cursor-se-resize rounded-lg bg-indigo-600 border-2 border-white shadow-xl hover:bg-indigo-700 z-40 flex items-center justify-center active:scale-90 transition-all animate-bounce"
                      title="ยืดขยายขนาด"
                    >
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Floating Zoom / Map Controls ── */}
          <div className="absolute bottom-6 left-6 z-25 flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md">
            <button
              onClick={zoomIn}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              title="ขยาย (Zoom In)"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={zoomOut}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              title="ย่อ (Zoom Out)"
            >
              <ZoomOut size={18} />
            </button>
            <div className="h-px bg-slate-200 my-0.5 mx-1" />
            <button
              onClick={resetZoom}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              title="ย้อนกลับค่าเริ่มต้น"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Custom scale percentage label (Enlarged Text) */}
          <div className="absolute top-6 left-6 z-25 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm">
            สเกล: {Math.round(zoom * 100)}%
          </div>

          {/* Mode Hints overlay (Enlarged Text) */}
          <div className="absolute bottom-6 right-6 pointer-events-none rounded-xl bg-slate-800/90 px-4 py-3 text-sm font-bold text-white shadow-lg">
            {mode === 'move'
              ? '🖐️ โหมดจัดวาง: ลากย้ายแผง (ระบบจะกักให้อยู่ในโซน) / ลากโซนหลักแผงจะติดย้ายตามกลุ่มไปด้วย'
              : '🖱️ โหมดเรียกดู: คลิกวัตถุเพื่อจัดการรายละเอียดข้อมูล'}
          </div>
        </div>

        {/* ── Studio Details Panel Sidebar (Enlarged Typography, soft shadow, rounded shape) ── */}
        <div className="w-full rounded-2xl border border-slate-100 bg-white p-5 shadow-lg lg:w-80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-4">
              <Eye size={18} className="text-indigo-600" />
              <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-600">รายละเอียดข้อมูล</h3>
            </div>

            {selectedStall ? (
              <div className="space-y-5">
                <div className="rounded-xl bg-slate-50/50 p-4.5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="text-slate-500" />
                      <span className="text-lg lg:text-xl font-extrabold text-slate-800 truncate max-w-[170px]">
                        {selectedStall.item_type === 'zone'
                          ? (dbZones.find(z => z.zone_id === selectedStall.zone_id)?.zone_name || selectedStall.code)
                          : selectedStall.code}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleLockStall(selectedStall.id)}
                      className={`rounded-xl p-3 border transition-all ${selectedStall.isLocked
                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-800 shadow-sm'
                        }`}
                      title={selectedStall.isLocked ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่ง'}
                    >
                      {selectedStall.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </div>

                  <div className="mt-5 space-y-3.5 text-sm border-t border-slate-100 pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">ประเภทวัตถุ:</span>
                      <span className="font-bold text-slate-800">{getItemTypeName(selectedStall.item_type)}</span>
                    </div>

                    {/* Show Stall Specific Info */}
                    {selectedStall.item_type === 'block' && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">สถานะการเช่า:</span>
                          <span className={`font-black ${selectedStall.status === 'available' ? 'text-emerald-600' :
                            selectedStall.status === 'occupied' ? 'text-rose-600' : 'text-amber-600'
                            }`}>{getStatusLabel(selectedStall.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">โซนกลุ่ม:</span>
                          <span className="text-slate-800 font-extrabold">
                            {dbZones.find(z => z.zone_id === selectedStall.zone_id)?.zone_name || 'ไม่ได้กำหนดโซน'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">อัตราค่าเช่า:</span>
                          <span className="text-indigo-650 font-black font-mono text-base">{selectedStall.price} บาท/วัน</span>
                        </div>
                      </>
                    )}

                    {/* Show Zone Specific Info */}
                    {selectedStall.item_type === 'zone' && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">ผูกในระบบ:</span>
                          <span className="text-slate-800 font-bold">
                            {dbZones.find(z => z.zone_id === selectedStall.zone_id)?.zone_name || 'ไม่ได้ผูกโซน DB'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">จำนวนแผงค้าในกลุ่ม:</span>
                          <span className="text-slate-800 font-black font-mono text-base">{getStallsInZone(selectedStall).length} แผง</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">ขนาดในระบบ:</span>
                      <span className="text-slate-800 font-bold font-mono">{selectedStall.width} x {selectedStall.height}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">พิกัด X:</span>
                      <span className="font-mono text-slate-800 font-bold">{selectedStall.x}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">พิกัด Y:</span>
                      <span className="font-mono text-slate-800 font-bold">{selectedStall.y}px</span>
                    </div>
                  </div>
                </div>

                {/* Show list of stalls inside selected zone */}
                {selectedStall.item_type === 'zone' && (
                  <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100 space-y-2 text-sm">
                    <p className="font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                      <Folder size={14} />
                      รายชื่อแผงค้าในกลุ่มโซนนี้
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {getStallsInZone(selectedStall).map(s => (
                        <span key={s.id} className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-700 border border-slate-200">
                          {s.code}
                        </span>
                      ))}
                      {getStallsInZone(selectedStall).length === 0 && (
                        <p className="text-slate-400 italic mt-1.5">ยังไม่มีการผูกแผงค้าใดๆ ในกลุ่มโซนนี้</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Seller details if occupied stall */}
                {selectedStall.item_type === 'block' && selectedStall.status === 'occupied' && selectedStall.seller && (
                  <div className="rounded-xl bg-indigo-50/40 p-4 border border-indigo-100 space-y-2.5 text-sm shadow-sm">
                    <p className="font-bold text-indigo-700 uppercase tracking-wider">ผู้เช่าแผงปัจจุบัน</p>
                    <div className="flex justify-between mt-2.5">
                      <span className="text-slate-500 font-semibold">ชื่อร้าน:</span>
                      <span className="font-bold text-slate-800">{selectedStall.seller.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">เบอร์โทร:</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedStall.seller.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center">
                <MousePointer className="h-10 w-10 text-slate-300 mb-4 animate-bounce" />
                <p className="text-sm font-bold px-5">คลิกเลือกบล็อกโครงสร้างในแผนผังเพื่อเรียกดูรายละเอียด</p>
              </div>
            )}
          </div>

          {selectedStall && (
            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={() => openDetailModal(selectedStall)}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-base font-black text-white transition-all shadow-sm"
              >
                แก้ไขข้อมูล{getItemTypeName(selectedStall.item_type)}
              </button>
              <button
                onClick={() => requestDeleteStall(selectedStall.id)}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3.5 text-base font-black text-rose-600 hover:bg-rose-100 transition-all"
              >
                ลบ{getItemTypeName(selectedStall.item_type)}นี้
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── New Element Creation Popup Modal (z-50) (Rectangular & Screen-fit scrollable) ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

            {/* Modal Header - Sticky/fixed at top */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4.5 text-white shrink-0">
              <div>
                <h3 className="text-xl font-extrabold">เพิ่ม{getItemTypeName(createItemType)}ใหม่</h3>
                <p className="text-sm text-indigo-100">กำหนดพารามิเตอร์เริ่มต้นเพื่อเพิ่มลงตำแหน่งแคนวาส</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full p-1.5 transition hover:bg-white/20">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form - Scrollable inner body */}
            <div className="p-6 space-y-5 text-slate-700 overflow-y-auto flex-1">

              {/* Name/Code Input */}
              <div>
                <label className="text-sm lg:text-base font-bold text-slate-800">รหัส / ชื่อเรียก</label>
                <input
                  type="text"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="เช่น A01 หรือ โซนผักสด"
                />
              </div>

              {/* Size Input */}
              <div>
                <label className="text-sm lg:text-base font-bold text-slate-800">ขนาดพื้นที่ (เช่น 3x3 เมตร)</label>
                <input
                  type="text"
                  value={createSize}
                  onChange={(e) => setCreateSize(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Price / Rent (Only show for Stall Blocks) */}
              {createItemType === 'block' && (
                <>
                  <div>
                    <label className="text-sm lg:text-base font-bold text-slate-800">อัตราค่าเช่า (บาท/วัน)</label>
                    <input
                      type="number"
                      value={createPrice}
                      onChange={(e) => setCreatePrice(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Parent Zone grouping dropdown (From dbZones) */}
                  <div>
                    <label className="text-sm lg:text-base font-bold text-slate-800">สังกัดกลุ่มโซน</label>
                    <select
                      value={createZoneId || ''}
                      onChange={(e) => setCreateZoneId(Number(e.target.value) || null)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- ไม่ระบุกลุ่มโซน --</option>
                      {dbZones.map(z => (
                        <option key={z.zone_id} value={z.zone_id}>
                          {z.zone_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* If adding a Zone, select which DB Zone to bind */}
              {createItemType === 'zone' && (
                <div>
                  <label className="text-sm lg:text-base font-bold text-slate-800">ผูกกับโซนในฐานข้อมูล</label>
                  <select
                    value={createZoneId || ''}
                    onChange={(e) => setCreateZoneId(Number(e.target.value) || null)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {dbZones.map(z => (
                      <option key={z.zone_id} value={z.zone_id}>
                        {z.zone_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actions Footer - Sticky at bottom */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-200 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateStall}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-base font-bold text-white transition-all shadow-md shadow-indigo-500/10"
              >
                <Plus size={18} />
                เพิ่มลงแผนผัง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Element Details Edit Modal (z-50) (Rectangular & Screen-fit scrollable) ── */}
      {showDetailModal && editingStall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">

            {/* Modal Header - Much more prominent name display */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 text-white shrink-0">
              <div>
                <span className="bg-indigo-500/50 text-white font-extrabold px-3 py-1 rounded-lg text-xs uppercase tracking-wide border border-white/20">
                  {getItemTypeName(editingStall.item_type)}
                </span>
                <h3 className="text-2xl font-black mt-2">แก้ไข: <span className="text-yellow-300 underline underline-offset-4 decoration-yellow-400 decoration-2">{editingStall.code}</span></h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="rounded-full p-2 transition hover:bg-white/20">
                <X size={22} />
              </button>
            </div>

            {/* Modal Form - Scrollable inner body */}
            <div className="p-6 space-y-5 text-slate-700 overflow-y-auto flex-1">

              {/* Alert notice if occupied (read-only mode) */}
              {(editStatus === 'occupied' || editingStall.status === 'occupied') && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-amber-800 text-sm font-semibold mb-2 shadow-sm animate-pulse">
                  <AlertCircle size={20} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-900">แผงค้านี้ได้รับการจอง/มีผู้เช่าแล้ว</p>
                    <p className="font-medium text-xs mt-0.5 text-amber-800/80">ระบบล็อกข้อมูลโครงสร้าง ขนาด และค่าเช่าไว้เป็นโหมดอ่านอย่างเดียว (Read-only)</p>
                  </div>
                </div>
              )}

              {/* Type Select */}
              <div>
                <label className="text-sm lg:text-base font-bold text-slate-800">ประเภทวัตถุ</label>
                <select
                  value={editItemType}
                  disabled={editStatus === 'occupied' || editingStall.status === 'occupied'}
                  onChange={(e) => setEditItemType(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="block">แผงค้า (Stall Block)</option>
                  <option value="zone">โซนพื้นที่ / กลุ่มแผงค้า (Zone)</option>
                  <option value="road">ถนน / ทางเดิน (Road)</option>
                  <option value="toilet">ห้องน้ำ (Toilet)</option>
                  <option value="entrance">ทางเข้า (Entrance)</option>
                </select>
              </div>

              {/* Only show Stall status fields if it's a block */}
              {editItemType === 'block' && (
                <>
                  {/* Status selection */}
                  <div>
                    <label className="text-sm lg:text-base font-bold text-slate-800">สถานะแผง</label>
                    <select
                      value={editStatus}
                      disabled={editingStall.status === 'occupied'}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="available">ว่าง (Available)</option>
                      <option value="occupied">จองแล้ว (Occupied)</option>
                      <option value="repair">ปรับปรุง (Repair)</option>
                    </select>
                  </div>

                  {/* Zone parent selector */}
                  <div>
                    <label className="text-sm lg:text-base font-bold text-slate-800">เลือกโซน (กลุ่มแผงค้า)</label>
                    <select
                      value={editZoneId || ''}
                      disabled={editStatus === 'occupied' || editingStall.status === 'occupied'}
                      onChange={(e) => setEditZoneId(Number(e.target.value) || null)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- ไม่จัดอยู่ในโซนใด --</option>
                      {dbZones.map(z => (
                        <option key={z.zone_id} value={z.zone_id}>
                          {z.zone_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* If editing a Zone, allow linking database zone */}
              {editItemType === 'zone' && (
                <div>
                  <label className="text-sm lg:text-base font-bold text-slate-800">ผูกกับโซนในฐานข้อมูล</label>
                  <select
                    value={editZoneId || ''}
                    disabled={editingStall.status === 'occupied'}
                    onChange={(e) => setEditZoneId(Number(e.target.value) || null)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {dbZones.map(z => (
                      <option key={z.zone_id} value={z.zone_id}>
                        {z.zone_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Size */}
              <div>
                <label className="text-sm lg:text-base font-bold text-slate-800">ขนาดพื้นที่ (เช่น 3x3 เมตร)</label>
                <input
                  type="text"
                  value={editSize}
                  disabled={editStatus === 'occupied' || editingStall.status === 'occupied'}
                  onChange={(e) => setEditSize(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Price - HIDE entirely for road/toilet/zone */}
              {editItemType === 'block' && (
                <div>
                  <label className="text-sm lg:text-base font-bold text-slate-800">อัตราค่าเช่า (บาท/วัน)</label>
                  <input
                    type="number"
                    value={editPrice}
                    disabled={editStatus === 'occupied' || editingStall.status === 'occupied'}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Occupied Customer details - View-only/Disabled when occupied */}
              {editItemType === 'block' && editStatus === 'occupied' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <h4 className="text-base font-extrabold text-indigo-650 text-indigo-600">ข้อมูลผู้เช่าปัจจุบัน (ดึงจากระบบ)</h4>
                  <div>
                    <label className="text-sm font-bold text-slate-700">ชื่อร้านค้า / ผู้จอง</label>
                    <input
                      type="text"
                      value={editSellerName}
                      disabled={true}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 py-3 text-base font-bold text-slate-750 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      value={editSellerPhone}
                      disabled={true}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 py-3 text-base font-bold text-slate-750 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer - Sticky at bottom */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-200 transition-all"
              >
                {editingStall.status === 'occupied' ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
              </button>
              {editingStall.status !== 'occupied' && (
                <button
                  onClick={saveStallDetails}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-base font-bold text-white transition-all shadow-md shadow-emerald-500/10"
                >
                  <Check size={18} />
                  บันทึกข้อมูล
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Beautiful Premium Custom Confirmation Dialog Modal (z-[100] for top layer popup) ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              {confirmDialog.type === 'danger' ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100 mb-4 animate-bounce">
                  <AlertCircle size={28} />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4">
                  <HelpCircle size={28} />
                </div>
              )}

              <h4 className="text-xl font-black text-slate-900">{confirmDialog.title}</h4>
              <p className="mt-3 text-sm font-medium text-slate-500 px-4 leading-relaxed">
                {confirmDialog.message}
              </p>

              <div className="mt-6 flex w-full gap-4 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all shadow-sm ${confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'
                    }`}
                >
                  {confirmDialog.actionText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MarketMapPage;
