import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Trash2, ZoomIn, ZoomOut, Maximize2, Move, Hand, X, Check, Save, Lock, Unlock, Eye, Grid, RefreshCw, Folder, AlertCircle, HelpCircle, Store, Edit3, User, DollarSign, ChevronDown, CreditCard, Zap, Droplets, Camera, UploadCloud
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { formatThaiDate } from '../utils/dateUtils';

export interface ExtendedMarketZone {
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
  rental_type?: 'daily' | 'monthly';
  daily_price?: number | null;
  monthly_price?: number | null;
  entry_fee?: number | null;
  security_deposit?: number | null;
  has_electricity?: boolean;
  has_water?: boolean;
  image1?: string | null;
  image2?: string | null;
  images?: string[];
  item_type: 'block' | 'road' | 'zone' | 'entrance' | 'toilet' | 'exit' | 'dining' | 'parking' | 'info' | 'trash';
  stall_id?: number | null;
  zone_id?: number | null;
  fill_color?: string;
  seller?: {
    id: string;
    name: string;
    shop_name?: string;
    user_name?: string;
    phone: string;
    start_date?: string;
    end_date?: string;
    booking_id?: number;
    booking_status?: string;
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
  const [mode, setMode] = useState<'move' | 'pan'>('move');
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Canva-like Smart Alignment Guides (purple lines during drag in move mode)
  const [smartGuides, setSmartGuides] = useState<{
    hLines: number[]; // horizontal guide Y positions (canvas coords)
    vLines: number[]; // vertical guide X positions (canvas coords)
  }>({ hLines: [], vLines: [] });

  // Facility Dropdown Menu State
  const [showFacilityMenu, setShowFacilityMenu] = useState<boolean>(false);

  // Drag & Resize State Machine
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
  const [editSize, setEditSize] = useState<string>('3x3 เมตร');
  const [editRentalType, setEditRentalType] = useState<'daily' | 'monthly'>('daily');
  const [editDailyPrice, setEditDailyPrice] = useState<number>(500);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number>(5000);
  const [editEntryFee, setEditEntryFee] = useState<number>(1000);
  const [editSecurityDeposit, setEditSecurityDeposit] = useState<number>(2000);
  const [editHasElectricity, setEditHasElectricity] = useState<boolean>(true);
  const [editHasWater, setEditHasWater] = useState<boolean>(true);
  const [editZoneId, setEditZoneId] = useState<number | null>(null);
  const [editItemType, setEditItemType] = useState<ExtendedMarketZone['item_type']>('block');
  const [editImage1, setEditImage1] = useState<string | null>(null);
  const [editImage2, setEditImage2] = useState<string | null>(null);
  const [editImage1File, setEditImage1File] = useState<File | null>(null);
  const [editImage2File, setEditImage2File] = useState<File | null>(null);
  const [editImage1Preview, setEditImage1Preview] = useState<string | null>(null);
  const [editImage2Preview, setEditImage2Preview] = useState<string | null>(null);
  const [removeImage1, setRemoveImage1] = useState<boolean>(false);
  const [removeImage2, setRemoveImage2] = useState<boolean>(false);
  const [isSavingStallImages, setIsSavingStallImages] = useState<boolean>(false);

  // New Element Creation Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createItemType, setCreateItemType] = useState<ExtendedMarketZone['item_type']>('block');
  const [createCode, setCreateCode] = useState<string>('');
  const [createSize, setCreateSize] = useState<string>('3x3 เมตร');
  const [createRentalType, setCreateRentalType] = useState<'daily' | 'monthly'>('daily');
  const [createDailyPrice, setCreateDailyPrice] = useState<number>(500);
  const [createMonthlyPrice, setCreateMonthlyPrice] = useState<number>(5000);
  const [createEntryFee, setCreateEntryFee] = useState<number>(1000);
  const [createSecurityDeposit, setCreateSecurityDeposit] = useState<number>(2000);
  const [createHasElectricity, setCreateHasElectricity] = useState<boolean>(true);
  const [createHasWater, setCreateHasWater] = useState<boolean>(true);
  const [createZoneId, setCreateZoneId] = useState<number | null>(null);
  const [createStatus, setCreateStatus] = useState<string>('available');
  const [createWidth, setCreateWidth] = useState<number>(80);
  const [createHeight, setCreateHeight] = useState<number>(80);
  const [createFillColor, setCreateFillColor] = useState<string>('#2ec4b6');
  const [createImage1File, setCreateImage1File] = useState<File | null>(null);
  const [createImage2File, setCreateImage2File] = useState<File | null>(null);
  const [createImage1Preview, setCreateImage1Preview] = useState<string | null>(null);
  const [createImage2Preview, setCreateImage2Preview] = useState<string | null>(null);
  const [isCreatingStall, setIsCreatingStall] = useState<boolean>(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Custom Confirmation Dialog State
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
      case 'entrance': return 'ทางเข้าหลัก';
      case 'exit': return 'ทางออก';
      case 'dining': return 'ที่นั่งพักกินอาหาร';
      case 'parking': return 'ที่จอดรถ';
      case 'info': return 'จุดประชาสัมพันธ์';
      case 'trash': return 'จุดทิ้งขยะ';
      case 'zone': return 'โซนพื้นที่ (กลุ่มแผง)';
      default: return 'องค์ประกอบแผนผัง';
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'block': return '🏪';
      case 'road': return '🛣️';
      case 'toilet': return '🚻';
      case 'entrance': return '🚪';
      case 'exit': return '🚪';
      case 'dining': return '🍽️';
      case 'parking': return '🅿️';
      case 'info': return 'ℹ️';
      case 'trash': return '🗑️';
      case 'zone': return '📁';
      default: return '📍';
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

      const mappedItems = items.map((item: any) => {
        // Determine effective status:
        // If a seller/booking exists with an approved/occupied booking, override the stall status
        // so the map block reflects reality even if the stall DB status wasn't synced.
        const sellerBookingStatus = item.seller?.booking_status;
        let effectiveStatus: string;
        if (sellerBookingStatus === 'approved' || sellerBookingStatus === 'occupied') {
          effectiveStatus = 'approved';
        } else if (sellerBookingStatus === 'pending') {
          effectiveStatus = 'occupied'; // pending booking → treat as occupied on map
        } else if (item.seller && !sellerBookingStatus) {
          // seller data exists but no explicit booking_status → treat as occupied
          effectiveStatus = 'occupied';
        } else {
          effectiveStatus = item.status || 'available';
        }

        return {
          id: String(item.map_item_id),
          code: item.label || `แผงค้า #${item.stall_id || item.map_item_id}`,
          status: effectiveStatus,
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
          rental_type: item.rental_type || 'daily',
          daily_price: item.daily_price !== undefined && item.daily_price !== null ? Number(item.daily_price) : (item.price || 500),
          monthly_price: item.monthly_price !== undefined && item.monthly_price !== null ? Number(item.monthly_price) : null,
          entry_fee: item.entry_fee !== undefined && item.entry_fee !== null ? Number(item.entry_fee) : null,
          security_deposit: item.security_deposit !== undefined && item.security_deposit !== null ? Number(item.security_deposit) : null,
          has_electricity: item.has_electricity !== undefined ? Boolean(item.has_electricity) : true,
          has_water: item.has_water !== undefined ? Boolean(item.has_water) : true,
          image1: item.image1 || null,
          image2: item.image2 || null,
          images: Array.isArray(item.images) ? item.images : [],
          seller: item.seller || undefined,
        } as ExtendedMarketZone;
      });

      setStalls(mappedItems);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลแผนผัง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Keyboard Arrow Keys & Spacebar Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(targetTag)) return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (selectedStallId && !showDetailModal && !showCreateModal && !confirmDialog) {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelectedItem(-step, 0); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); nudgeSelectedItem(step, 0); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); nudgeSelectedItem(0, -step); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); nudgeSelectedItem(0, step); }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedStallId, showDetailModal, showCreateModal, confirmDialog, stalls]);

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
          price: s.price !== undefined ? Number(s.price) : 500,
          rental_type: s.rental_type || 'daily',
          daily_price: s.rental_type === 'daily' ? (s.daily_price ?? s.price ?? 500) : null,
          monthly_price: s.rental_type === 'monthly' ? (s.monthly_price ?? 5000) : null,
          entry_fee: s.rental_type === 'monthly' ? (s.entry_fee ?? 1000) : null,
          security_deposit: s.rental_type === 'monthly' ? (s.security_deposit ?? 2000) : null,
          has_electricity: s.has_electricity ?? true,
          has_water: s.has_water ?? true,
          image1: s.image1 || null,
          image2: s.image2 || null,
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
      setHasChanges(false);
      await loadMapData();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const triggerSaveConfirm = () => {
    setConfirmDialog({
      title: 'ยืนยันการบันทึกตำแหน่งแผนผังใหม่',
      message: 'คุณต้องการจัดเก็บพิกัดของแผงค้าและองค์ประกอบทั้งหมดบนแผนผังลงฐานข้อมูลระบบหลักใช่หรือไม่?',
      actionText: 'ยืนยันบันทึกข้อมูล',
      type: 'info',
      onConfirm: () => {
        setConfirmDialog(null);
        saveLayoutToBackend();
      }
    });
  };

  const openEditModal = (stall: ExtendedMarketZone) => {
    setEditingStall(stall);
    setEditStatus(stall.status);
    setEditSize(stall.size || '3x3 เมตร');
    setEditRentalType(stall.rental_type || 'daily');
    setEditDailyPrice(stall.daily_price ?? stall.price ?? 500);
    setEditMonthlyPrice(stall.monthly_price ?? 5000);
    setEditEntryFee(stall.entry_fee ?? 1000);
    setEditSecurityDeposit(stall.security_deposit ?? 2000);
    setEditHasElectricity(stall.has_electricity ?? true);
    setEditHasWater(stall.has_water ?? true);
    setEditZoneId(stall.zone_id || null);
    setEditItemType(stall.item_type || 'block');
    setEditImage1(stall.image1 || null);
    setEditImage2(stall.image2 || null);
    setEditImage1File(null);
    setEditImage2File(null);
    setEditImage1Preview(null);
    setEditImage2Preview(null);
    setRemoveImage1(false);
    setRemoveImage2(false);
    setShowDetailModal(true);
  };

  const handleImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage1File(file);
      setRemoveImage1(false);
      const reader = new FileReader();
      reader.onload = () => setEditImage1Preview(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage1 = () => {
    setEditImage1(null);
    setEditImage1File(null);
    setEditImage1Preview(null);
    setRemoveImage1(true);
  };

  const handleImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage2File(file);
      setRemoveImage2(false);
      const reader = new FileReader();
      reader.onload = () => setEditImage2Preview(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage2 = () => {
    setEditImage2(null);
    setEditImage2File(null);
    setEditImage2Preview(null);
    setRemoveImage2(true);
  };

  const handleCreateImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateImage1File(file);
      const reader = new FileReader();
      reader.onload = () => setCreateImage1Preview(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCreateImage1 = () => {
    setCreateImage1File(null);
    setCreateImage1Preview(null);
  };

  const handleCreateImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateImage2File(file);
      const reader = new FileReader();
      reader.onload = () => setCreateImage2Preview(typeof reader.result === 'string' ? reader.result : null);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCreateImage2 = () => {
    setCreateImage2File(null);
    setCreateImage2Preview(null);
  };

  const saveStallDetails = async () => {
    if (!editingStall) return;

    let newCode = editingStall.code;
    if (editItemType === 'zone' && editZoneId) {
      const matchedZone = dbZones.find(z => z.zone_id === editZoneId);
      if (matchedZone) {
        newCode = matchedZone.zone_name;
      }
    }

    let finalImage1 = removeImage1 ? null : (editingStall.image1 || null);
    let finalImage2 = removeImage2 ? null : (editingStall.image2 || null);

    const calcPrice = editRentalType === 'daily' ? editDailyPrice : editMonthlyPrice;
    let assignedStallId = editingStall.stall_id;

    // If stall exists in DB and image changes were made, upload to backend
    if (editingStall.stall_id && (editImage1File || editImage2File || removeImage1 || removeImage2)) {
      try {
        setIsSavingStallImages(true);
        const formPayload = new FormData();
        formPayload.append('_method', 'PUT');
        if (editImage1File) {
          formPayload.append('image1', editImage1File);
        } else if (removeImage1) {
          formPayload.append('remove_image1', '1');
        }
        if (editImage2File) {
          formPayload.append('image2', editImage2File);
        } else if (removeImage2) {
          formPayload.append('remove_image2', '1');
        }

        const res = await fetch(`/api/v1/stalls/${editingStall.stall_id}`, {
          method: 'POST',
          body: formPayload,
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson?.data) {
            finalImage1 = resJson.data.image1;
            finalImage2 = resJson.data.image2;
          }
        }
      } catch (err) {
        console.error('Failed to upload stall images', err);
      } finally {
        setIsSavingStallImages(false);
      }
    } else if (!editingStall.stall_id && (editImage1File || editImage2File)) {
      try {
        setIsSavingStallImages(true);
        const formPayload = new FormData();
        formPayload.append('stall_number', newCode || ('STALL-' + Date.now().toString().slice(-4)));
        formPayload.append('status', editStatus === 'repair' ? 'maintenance' : (editStatus || 'available'));
        formPayload.append('zone_id', String(editZoneId || dbZones[0]?.zone_id || 1));
        formPayload.append('size', editSize || '3x3 เมตร');
        formPayload.append('price', String(calcPrice || 500));
        formPayload.append('rental_type', editRentalType);
        if (editImage1File) formPayload.append('image1', editImage1File);
        if (editImage2File) formPayload.append('image2', editImage2File);

        const res = await fetch('/api/v1/stalls', {
          method: 'POST',
          body: formPayload,
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson?.data) {
            assignedStallId = resJson.data.stall_id;
            finalImage1 = resJson.data.image1;
            finalImage2 = resJson.data.image2;
          }
        }
      } catch (err) {
        console.error('Failed to upload new stall images', err);
      } finally {
        setIsSavingStallImages(false);
      }
    }

    const finalImages = [finalImage1, finalImage2].filter(Boolean) as string[];

    setStalls(stalls.map(s => {
      if (s.id === editingStall.id) {
        const newX = snapToGrid(s.x, 10);
        const newY = snapToGrid(s.y, 10);

        return {
          ...s,
          stall_id: assignedStallId || s.stall_id,
          code: newCode,
          status: editStatus,
          size: editSize,
          price: calcPrice,
          rental_type: editRentalType,
          daily_price: editRentalType === 'daily' ? editDailyPrice : null,
          monthly_price: editRentalType === 'monthly' ? editMonthlyPrice : null,
          entry_fee: editRentalType === 'monthly' ? editEntryFee : null,
          security_deposit: editRentalType === 'monthly' ? editSecurityDeposit : null,
          has_electricity: editHasElectricity,
          has_water: editHasWater,
          image1: finalImage1,
          image2: finalImage2,
          images: finalImages,
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
    setHasChanges(true);
  };

  const selectedStall = stalls.find(s => s.id === selectedStallId);

  const sortedStalls = [...stalls].sort((a, b) => {
    if (a.item_type === 'zone' && b.item_type !== 'zone') return -1;
    if (a.item_type !== 'zone' && b.item_type === 'zone') return 1;
    return 0;
  });

  const availableCount = stalls.filter(s => s.item_type === 'block' && s.status === 'available').length;
  const pendingCount = stalls.filter(s => s.item_type === 'block' && s.status === 'occupied').length;
  const occupiedCount = stalls.filter(s => s.item_type === 'block' && s.status === 'approved').length;
  const repairCount = stalls.filter(s => s.item_type === 'block' && s.status === 'repair').length;

  const getStallsInZone = (zoneItem: ExtendedMarketZone) => {
    return stalls.filter(s => {
      if (s.id === zoneItem.id || s.item_type === 'zone') return false;
      // Match by zone_id assignment (primary) OR coordinate containment (fallback)
      const byZoneId = zoneItem.zone_id != null && s.zone_id === zoneItem.zone_id;
      const byCoords = (
        s.x >= zoneItem.x &&
        s.y >= zoneItem.y &&
        (s.x + s.width) <= (zoneItem.x + zoneItem.width) &&
        (s.y + s.height) <= (zoneItem.y + zoneItem.height)
      );
      return byZoneId || byCoords;
    });
  };

  const getParentZone = (stallItem: ExtendedMarketZone) => {
    if (stallItem.item_type === 'zone') return null;
    return stalls.find(z => {
      if (z.item_type !== 'zone') return false;
      return (
        stallItem.x >= z.x &&
        stallItem.y >= z.y &&
        (stallItem.x + stallItem.width) <= (z.x + z.width) &&
        (stallItem.y + stallItem.height) <= (z.y + z.height)
      );
    });
  };

  const getStatusColor = (item: ExtendedMarketZone) => {
    if (item.item_type === 'road') {
      return 'bg-slate-200/90 border-slate-300 text-slate-700 shadow-sm border-2';
    }
    if (item.item_type === 'toilet') {
      return 'bg-cyan-600 text-white border-2 border-cyan-700 shadow-md font-black';
    }
    if (item.item_type === 'entrance') {
      return 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-md font-black';
    }
    if (item.item_type === 'exit') {
      return 'bg-rose-600 text-white border-2 border-rose-700 shadow-md font-black';
    }
    if (item.item_type === 'dining') {
      return 'bg-amber-500 text-white border-2 border-amber-600 shadow-md font-black';
    }
    if (item.item_type === 'parking') {
      return 'bg-blue-600 text-white border-2 border-blue-700 shadow-md font-black';
    }
    if (item.item_type === 'info') {
      return 'bg-purple-600 text-white border-2 border-purple-700 shadow-md font-black';
    }
    if (item.item_type === 'trash') {
      return 'bg-slate-700 text-white border-2 border-slate-800 shadow-md font-black';
    }
    if (item.item_type === 'zone') {
      return 'bg-indigo-50/20 border-dashed border-2 border-indigo-400/60 hover:bg-indigo-50/30 text-indigo-950 shadow-xs';
    }

    switch (item.status) {
      case 'available':
        return 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-md shadow-emerald-500/10 hover:bg-emerald-600';
      case 'occupied':
        // pending booking → blue (กำลังจอง)
        return 'bg-blue-500 text-white border-2 border-blue-600 shadow-md shadow-blue-500/10 hover:bg-blue-600';
      case 'approved':
        // confirmed tenant → red (มีผู้เช่าแล้ว)
        return 'bg-rose-500 text-white border-2 border-rose-600 shadow-md shadow-rose-500/10 hover:bg-rose-600';
      case 'repair':
        return 'bg-amber-500 text-white border-2 border-amber-600 shadow-md shadow-amber-500/10 hover:bg-amber-600';
      default:
        return 'bg-slate-200 border-2 border-slate-400 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'ว่าง';
      case 'occupied': return 'กำลังรอจอง';
      case 'approved': return 'มีผู้เช่าแล้ว';
      case 'repair': return 'ปิดปรับปรุง';
      default: return status;
    }
  };


  const snapToGrid = (val: number, step = 20) => Math.round(val / step) * step;

  const alignAllToGrid = () => {
    setStalls(prev => prev.map(s => ({
      ...s,
      x: snapToGrid(s.x, 20),
      y: snapToGrid(s.y, 20),
    })));
    setHasChanges(true);
  };

  const nudgeSelectedItem = (dx: number, dy: number) => {
    if (!selectedStallId) return;
    setStalls(prev => prev.map(s => {
      if (s.id !== selectedStallId || s.isLocked) return s;
      return {
        ...s,
        x: Math.max(0, s.x + dx),
        y: Math.max(0, s.y + dy),
      };
    }));
    setHasChanges(true);
  };

  const openCreateModal = (type: ExtendedMarketZone['item_type']) => {
    setShowFacilityMenu(false);
    const count = stalls.filter(s => s.item_type === type).length + 1;
    const numStr = count < 10 ? `0${count}` : `${count}`;
    let prefix = 'A';
    let defaultWidth = 80;
    let defaultHeight = 80;

    switch (type) {
      case 'block': prefix = 'A'; defaultWidth = 80; defaultHeight = 80; break;
      case 'zone': prefix = 'โซน '; defaultWidth = 350; defaultHeight = 250; break;
      case 'road': prefix = 'ถนน '; defaultWidth = 260; defaultHeight = 70; break;
      case 'toilet': prefix = 'ห้องน้ำ '; defaultWidth = 100; defaultHeight = 90; break;
      case 'entrance': prefix = 'ทางเข้า '; defaultWidth = 120; defaultHeight = 80; break;
      case 'exit': prefix = 'ทางออก '; defaultWidth = 120; defaultHeight = 80; break;
      case 'dining': prefix = 'ที่นั่งพักกินอาหาร '; defaultWidth = 180; defaultHeight = 120; break;
      case 'parking': prefix = 'ที่จอดรถ '; defaultWidth = 200; defaultHeight = 140; break;
      case 'info': prefix = 'จุดประชาสัมพันธ์ '; defaultWidth = 110; defaultHeight = 80; break;
      case 'trash': prefix = 'จุดทิ้งขยะ '; defaultWidth = 90; defaultHeight = 80; break;
    }

    setCreateItemType(type);
    setCreateCode(`${prefix}${numStr}`);
    setCreateSize('3x3 เมตร');
    setCreateRentalType('daily');
    setCreateDailyPrice(500);
    setCreateMonthlyPrice(5000);
    setCreateEntryFee(1000);
    setCreateSecurityDeposit(2000);
    setCreateZoneId(dbZones[0]?.zone_id ?? null);
    setCreateStatus('available');
    setCreateWidth(defaultWidth);
    setCreateHeight(defaultHeight);
    setCreateFillColor(type === 'block' ? '#2ec4b6' : type === 'zone' ? '#5d8aff' : '#ff9f1c');
    setCreateImage1File(null);
    setCreateImage2File(null);
    setCreateImage1Preview(null);
    setCreateImage2Preview(null);
    setIsCreatingStall(false);
    setShowCreateModal(true);
  };

  const handleCreateStall = () => {
    setConfirmDialog({
      title: `ยืนยันการสร้าง ${getItemTypeName(createItemType)} ใหม่`,
      message: `คุณต้องการเพิ่ม "${createCode}" ลงบนแผนผังตลาดนัดใช่หรือไม่?`,
      actionText: 'ยืนยันการเพิ่มวัตถุ',
      type: 'info',
      onConfirm: async () => {
        let finalLabel = createCode;
        if (createItemType === 'zone' && createZoneId) {
          const matched = dbZones.find(dz => dz.zone_id === createZoneId);
          if (matched) {
            finalLabel = matched.zone_name;
          }
        }

        let targetX = snapToGrid(140 + (stalls.length * 35) % 400, 20);
        let targetY = snapToGrid(160 + Math.floor((stalls.length * 35) / 400) * 100, 20);

        if (createItemType === 'block' && createZoneId) {
          const parentZone = stalls.find(s => s.item_type === 'zone' && s.zone_id === createZoneId);
          if (parentZone) {
            const minX = parentZone.x + 10;
            const minY = parentZone.y + 10;
            const maxX = parentZone.x + parentZone.width - createWidth - 10;
            const maxY = parentZone.y + parentZone.height - createHeight - 10;
            targetX = maxX > minX ? Math.max(minX, Math.min(maxX, targetX)) : minX;
            targetY = maxY > minY ? Math.max(minY, Math.min(maxY, targetY)) : minY;
          }
        }

        const calcPrice = createRentalType === 'daily' ? createDailyPrice : createMonthlyPrice;
        let assignedStallId: number | null = null;
        let finalImage1: string | null = null;
        let finalImage2: string | null = null;

        if (createItemType === 'block') {
          try {
            setIsCreatingStall(true);
            const formPayload = new FormData();
            formPayload.append('stall_number', finalLabel || ('STALL-' + Date.now().toString().slice(-4)));
            formPayload.append('status', createStatus === 'repair' ? 'maintenance' : (createStatus || 'available'));
            formPayload.append('zone_id', String(createZoneId || dbZones[0]?.zone_id || 1));
            formPayload.append('size', createSize || '3x3 เมตร');
            formPayload.append('price', String(calcPrice || 500));
            formPayload.append('rental_type', createRentalType);
            if (createRentalType === 'daily') {
              formPayload.append('daily_price', String(createDailyPrice));
            } else {
              formPayload.append('monthly_price', String(createMonthlyPrice));
              formPayload.append('entry_fee', String(createEntryFee));
              formPayload.append('security_deposit', String(createSecurityDeposit));
            }
            formPayload.append('has_electricity', createHasElectricity ? '1' : '0');
            formPayload.append('has_water', createHasWater ? '1' : '0');
            if (createImage1File) formPayload.append('image1', createImage1File);
            if (createImage2File) formPayload.append('image2', createImage2File);

            const res = await fetch('/api/v1/stalls', {
              method: 'POST',
              body: formPayload,
            });
            if (res.ok) {
              const resJson = await res.json();
              if (resJson?.data) {
                assignedStallId = resJson.data.stall_id;
                finalImage1 = resJson.data.image1;
                finalImage2 = resJson.data.image2;
              }
            } else {
              const errJson = await res.json().catch(() => null);
              console.error('Failed to create stall in API', errJson);
            }
          } catch (err) {
            console.error('Error uploading stall creation data', err);
          } finally {
            setIsCreatingStall(false);
          }
        }

        const finalImages = [finalImage1, finalImage2].filter(Boolean) as string[];

        const newElement: ExtendedMarketZone = {
          id: `new-${Date.now()}`,
          code: finalLabel,
          status: createStatus || 'available',
          x: targetX,
          y: targetY,
          width: createWidth,
          height: createHeight,
          fill_color: createFillColor,
          isLocked: false,
          size: createSize,
          price: calcPrice,
          rental_type: createRentalType,
          daily_price: createRentalType === 'daily' ? createDailyPrice : null,
          monthly_price: createRentalType === 'monthly' ? createMonthlyPrice : null,
          entry_fee: createRentalType === 'monthly' ? createEntryFee : null,
          security_deposit: createRentalType === 'monthly' ? createSecurityDeposit : null,
          has_electricity: createItemType === 'block' ? createHasElectricity : true,
          has_water: createItemType === 'block' ? createHasWater : true,
          stall_id: assignedStallId,
          image1: finalImage1,
          image2: finalImage2,
          images: finalImages,
          item_type: createItemType,
          zone_id: (createItemType === 'block' || createItemType === 'zone') ? createZoneId : null,
        };
        setStalls([...stalls, newElement]);
        setSelectedStallId(newElement.id);
        setShowCreateModal(false);
        setConfirmDialog(null);
        setHasChanges(true);
      }
    });
  };

  const requestDeleteStall = (id: string) => {
    const item = stalls.find(s => s.id === id);
    if (!item) return;

    setConfirmDialog({
      title: `ยืนยันการลบข้อมูล ${getItemTypeName(item.item_type)}`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${item.code}" ออกจากแผนผังตลาดนัด?`,
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
    setHasChanges(true);
  };

  const toggleLockStall = (id: string) => {
    setStalls(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isLocked: !s.isLocked };
      }
      return s;
    }));
  };

  const lockSelectedItem = (lock: boolean) => {
    if (!selectedStallId) return;
    setStalls(prev => prev.map(s => {
      if (s.id === selectedStallId) {
        return { ...s, isLocked: lock };
      }
      return s;
    }));
  };

  const handlePointerDown = (e: React.PointerEvent, type: 'drag' | 'resize', item: ExtendedMarketZone) => {
    if (mode === 'pan' || isSpacePressed || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (item.isLocked) {
      return;
    }

    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

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

    setStalls(prev => {
      const activeItem = prev.find(s => s.id === interaction.itemId);
      if (!activeItem) return prev;

      let newX = activeItem.x;
      let newY = activeItem.y;
      let newW = activeItem.width;
      let newH = activeItem.height;

      if (interaction.type === 'drag') {
        let rawX = interaction.startItemX + deltaX;
        let rawY = interaction.startItemY + deltaY;

        let calculatedX = snapToGrid(rawX, 10);
        let calculatedY = snapToGrid(rawY, 10);

        const parentZone = getParentZone(activeItem);
        if (activeItem.item_type === 'block' && parentZone) {
          const minX = parentZone.x;
          const minY = parentZone.y;
          const maxX = parentZone.x + parentZone.width - activeItem.width;
          const maxY = parentZone.y + parentZone.height - activeItem.height;
          calculatedX = Math.max(minX, Math.min(maxX, calculatedX));
          calculatedY = Math.max(minY, Math.min(maxY, calculatedY));
        } else {
          calculatedX = Math.max(0, calculatedX);
          calculatedY = Math.max(0, calculatedY);
        }

        // ── Smart Alignment Guide Computation (Canva-style) ──
        // Only compute guides in move mode
        const SNAP_THRESHOLD = 6; // pixels (canvas coords)
        const dragging = {
          left: calculatedX,
          right: calculatedX + activeItem.width,
          centerX: calculatedX + activeItem.width / 2,
          top: calculatedY,
          bottom: calculatedY + activeItem.height,
          centerY: calculatedY + activeItem.height / 2,
        };

        const newHLines: number[] = [];
        const newVLines: number[] = [];

        prev.forEach(other => {
          if (other.id === activeItem.id) return;
          const o = {
            left: other.x,
            right: other.x + other.width,
            centerX: other.x + other.width / 2,
            top: other.y,
            bottom: other.y + other.height,
            centerY: other.y + other.height / 2,
          };

          // Vertical guides (X alignment)
          if (Math.abs(dragging.left - o.left) < SNAP_THRESHOLD) newVLines.push(o.left);
          if (Math.abs(dragging.left - o.right) < SNAP_THRESHOLD) newVLines.push(o.right);
          if (Math.abs(dragging.right - o.left) < SNAP_THRESHOLD) newVLines.push(o.left);
          if (Math.abs(dragging.right - o.right) < SNAP_THRESHOLD) newVLines.push(o.right);
          if (Math.abs(dragging.centerX - o.centerX) < SNAP_THRESHOLD) newVLines.push(o.centerX);

          // Horizontal guides (Y alignment)
          if (Math.abs(dragging.top - o.top) < SNAP_THRESHOLD) newHLines.push(o.top);
          if (Math.abs(dragging.top - o.bottom) < SNAP_THRESHOLD) newHLines.push(o.bottom);
          if (Math.abs(dragging.bottom - o.top) < SNAP_THRESHOLD) newHLines.push(o.top);
          if (Math.abs(dragging.bottom - o.bottom) < SNAP_THRESHOLD) newHLines.push(o.bottom);
          if (Math.abs(dragging.centerY - o.centerY) < SNAP_THRESHOLD) newHLines.push(o.centerY);
        });

        setSmartGuides({
          hLines: [...new Set(newHLines)],
          vLines: [...new Set(newVLines)],
        });

        newX = calculatedX;
        newY = calculatedY;
      } else if (interaction.type === 'resize') {
        let rawW = interaction.startWidth + deltaX;
        let rawH = interaction.startHeight + deltaY;

        let minWidth = activeItem.item_type === 'zone' ? 120 : 50;
        let minHeight = activeItem.item_type === 'zone' ? 120 : 50;

        newW = Math.max(minWidth, snapToGrid(rawW, 10));
        newH = Math.max(minHeight, snapToGrid(rawH, 10));
      }

      // Total displacement from the beginning of drag (not per-frame delta)
      const totalDeltaX = newX - interaction.startItemX;
      const totalDeltaY = newY - interaction.startItemY;

      return prev.map(s => {
        if (s.id === activeItem.id) {
          return { ...s, x: newX, y: newY, width: newW, height: newH };
        }
        // Move zone children together with the zone
        if (interaction.type === 'drag' && activeItem.item_type === 'zone' && interaction.childPositions) {
          const childMatch = interaction.childPositions.find(cp => cp.id === s.id);
          if (childMatch) {
            return {
              ...s,
              x: Math.max(0, childMatch.startX + totalDeltaX),
              y: Math.max(0, childMatch.startY + totalDeltaY),
            };
          }
        }
        return s;
      });
    });

    setHasChanges(true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (interaction.type) {
      try {
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);
      } catch (err) { }

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

      // Clear smart guides on drag end
      setSmartGuides({ hLines: [], vLines: [] });
    }
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-bg')) {
      return;
    }

    setSelectedStallId(null);
    setIsSidebarOpen(false);
    setShowFacilityMenu(false);

    if (mode === 'pan' || isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
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

  const handleStagePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.15));
  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      {/* ── Summary KPI Dashboard Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* 1. แผงค้าว่าง */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:border-emerald-300 hover:shadow-sm transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:scale-105 shadow-2xs">
            <Check size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">แผงค้าว่าง</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{availableCount} <span className="text-xs font-semibold text-slate-400">แผง</span></p>
          </div>
        </div>

        {/* 2. กำลังจอง */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:scale-105 shadow-2xs">
            <Store size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">กำลังจอง</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount} <span className="text-xs font-semibold text-slate-400">แผง</span></p>
          </div>
        </div>

        {/* 3. มีผู้เช่าแล้ว */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:border-rose-300 hover:shadow-sm transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 transition-all duration-200 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 group-hover:scale-105 shadow-2xs">
            <Store size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">มีผู้เช่าแล้ว</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{occupiedCount} <span className="text-xs font-semibold text-slate-400">แผง</span></p>
          </div>
        </div>

        {/* 4. ปิดปรับปรุง */}
        <div className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 hover:border-amber-300 hover:shadow-sm transition-all duration-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 transition-all duration-200 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 group-hover:scale-105 shadow-2xs">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">ปิดปรับปรุง</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{repairCount} <span className="text-xs font-semibold text-slate-400">แผง</span></p>
          </div>
        </div>
      </div>

      {/* ── Main Layout Workspace with Integrated Prominent Sticky Toolbar ── */}
      <div className="relative w-full rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">

        {/* ── Prominent Sticky Toolbar (Directly Attached Above Canvas) ── */}
        <div className="sticky top-0 z-30 bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl shadow-lg">

          {/* Left tools: Add Elements */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Add Stall Button */}
            <button
              onClick={() => openCreateModal('block')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-black text-white transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>+ เพิ่มแผงค้า</span>
            </button>

            {/* Add Zone Button */}
            <button
              onClick={() => openCreateModal('zone')}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-extrabold text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <Folder size={15} className="text-indigo-400" />
              <span>+ โซนพื้นที่</span>
            </button>

            {/* Combined Facilities Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowFacilityMenu(!showFacilityMenu)}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-extrabold text-amber-300 border border-slate-700 transition-all cursor-pointer"
              >
                <span>+ เพิ่มสิ่งอำนวยความสะดวก</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showFacilityMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Facility Options Dropdown Menu */}
              {showFacilityMenu && (
                <div className="absolute left-0 top-full mt-2 z-50 w-64 rounded-2xl bg-slate-900 border border-slate-700 p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    เลือกประเภทสิ่งอำนวยความสะดวก
                  </div>
                  {[
                    { type: 'road', name: 'ถนน / ทางเดิน', icon: '🛣️', desc: 'เส้นทางเดินสำหรับผู้มาใช้บริการ' },
                    { type: 'toilet', name: 'ห้องน้ำ', icon: '🚻', desc: 'จุดสุขาสาธารณะ' },
                    { type: 'entrance', name: 'ทางเข้าหลัก', icon: '🚪', desc: 'ประตูเข้าตลาดนัด' },
                    { type: 'exit', name: 'ทางออก', icon: '🚪', desc: 'ประตูทางออกตลาด' },
                    { type: 'dining', name: 'ที่นั่งพักกินอาหาร', icon: '🍽️', desc: 'โซนรับประทานอาหาร/พักผ่อน' },
                    { type: 'parking', name: 'ที่จอดรถ', icon: '🅿️', desc: 'ลานจอดรถยนต์/มอเตอร์ไซค์' },
                    { type: 'info', name: 'จุดประชาสัมพันธ์', icon: 'ℹ️', desc: 'จุดสอบถาม/บริการแอดมิน' },
                    { type: 'trash', name: 'จุดทิ้งขยะ', icon: '🗑️', desc: 'จุดทิ้งขยะรวม' },
                  ].map(fac => (
                    <button
                      key={fac.type}
                      onClick={() => openCreateModal(fac.type as any)}
                      className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left hover:bg-slate-800 transition-all cursor-pointer group"
                    >
                      <span className="text-xl shrink-0">{fac.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">{fac.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{fac.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStallId && (
              <button
                onClick={() => requestDeleteStall(selectedStallId)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/20 px-3 py-2 text-xs font-extrabold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>ลบวัตถุที่เลือก</span>
              </button>
            )}
          </div>

          {/* Center Mode Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-xl bg-slate-800/90 p-1 border border-slate-700">
              <button
                onClick={() => setMode('move')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  mode === 'move'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Move size={14} />
                <span>ลากจัดวาง</span>
              </button>

              <button
                onClick={() => {
                  setMode('pan');
                  setIsSidebarOpen(false);
                  setSelectedStallId(null);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  mode === 'pan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Hand size={14} />
                <span>เลื่อนมุมมอง</span>
              </button>
            </div>

            <div className="flex items-center rounded-xl bg-slate-800/90 p-1 border border-slate-700">
              <button
                onClick={() => lockSelectedItem(true)}
                disabled={!selectedStallId}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all ${
                  !selectedStallId ? 'text-slate-500 opacity-40' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Lock size={12} />
                <span>ล็อก</span>
              </button>
              <button
                onClick={() => lockSelectedItem(false)}
                disabled={!selectedStallId}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all ${
                  !selectedStallId ? 'text-slate-500 opacity-40' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Unlock size={12} />
                <span>ปลดล็อก</span>
              </button>
            </div>
          </div>

          {/* Right Action Tools: Grid & Save */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={alignAllToGrid}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-extrabold text-slate-200 transition-all cursor-pointer"
              title="จัดระเบียบทุกวัตถุให้ตรงแนวเส้นกริด 20px"
            >
              <Grid size={14} className="text-indigo-400" />
              <span>จัดลงกริด</span>
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                showGrid ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="สลับการแสดงเส้นกริด"
            >
              <Grid size={16} />
            </button>

            <button
              onClick={loadMapData}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="โหลดข้อมูลแผนผังใหม่"
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={triggerSaveConfirm}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all cursor-pointer ${
                !hasChanges
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95'
              }`}
            >
              <Save size={16} />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกผังตลาด'}</span>
            </button>
          </div>

        </div>

        {/* ── Interactive Map Canvas Studio Area ── */}
        <div
          ref={canvasContainerRef}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          className={`relative w-full min-h-[680px] lg:min-h-[720px] overflow-hidden bg-white ${
            mode === 'pan' || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
              <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
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

          {/* Dots Grid Backdrop Layer */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-75"
            style={{
              backgroundImage: showGrid ? 'radial-gradient(#cbd5e1 1.4px, transparent 1.4px)' : 'none',
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          />

          {/* Interactive Stage Viewport */}
          <div
            className={`canvas-bg absolute inset-0 ${
              mode === 'pan' || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            style={{
              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '6000px',
              height: '6000px',
            }}
          >
            {sortedStalls.map((stall) => {
              const isSelected = selectedStallId === stall.id;
              const zoneLabel = stall.code;

              return (
                <div
                  key={stall.id}
                  onPointerDown={(e) => handlePointerDown(e, 'drag', stall)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStallId(stall.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (selectedStallId === stall.id && isSidebarOpen) {
                      setIsSidebarOpen(false);
                    } else {
                      setSelectedStallId(stall.id);
                      setIsSidebarOpen(true);
                    }
                  }}
                  className={`absolute flex select-none flex-col items-center justify-center rounded-2xl text-center border-2 transition-all duration-100 shadow-sm ${getStatusColor(
                    stall
                  )} ${isSelected
                    ? 'ring-4 ring-indigo-500/30 ring-offset-2 ring-offset-white border-indigo-600 scale-[1.04] z-35 shadow-xl'
                    : stall.item_type === 'zone' ? 'z-0 border-2' : 'z-10'
                  } ${(mode === 'pan' || isSpacePressed) ? 'cursor-grab active:cursor-grabbing' : stall.isLocked ? 'cursor-default opacity-85' : 'cursor-move hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  style={{
                    left: `${stall.x}px`,
                    top: `${stall.y}px`,
                    width: `${stall.width}px`,
                    height: `${stall.height}px`,
                    touchAction: 'none',
                  }}
                >
                  {/* Icon + Label Display */}
                  <div className="flex items-center justify-center gap-1 max-w-full px-1">
                    <span className="text-base">{getItemTypeIcon(stall.item_type)}</span>
                    <span className="text-sm lg:text-base tracking-tight font-black uppercase truncate">{zoneLabel}</span>
                  </div>

                  {/* Pricing Badge for Stalls */}
                  {stall.item_type === 'block' && stall.width >= 55 && (
                    <span className="text-[10px] font-extrabold bg-black/20 text-white px-2 py-0.5 rounded-full mt-1 truncate max-w-full">
                      {['occupied', 'approved', 'verified'].includes(stall.status)
                        ? (stall.seller?.shop_name || stall.seller?.name || 'มีผู้เช่าแล้ว')
                        : stall.rental_type === 'monthly'
                          ? `฿${(stall.monthly_price || stall.price || 0).toLocaleString()}/เดือน`
                          : `฿${(stall.daily_price || stall.price || 0).toLocaleString()}/วัน`}
                    </span>
                  )}

                  {/* Render Stall Count on Zone Blocks */}
                  {stall.item_type === 'zone' && (
                    <span className="text-xs font-extrabold text-blue-600 mt-1 flex items-center gap-1.5">
                      <Folder size={12} />
                      {getStallsInZone(stall).length} แผง
                    </span>
                  )}

                  {/* Lock Indicator */}
                  {stall.isLocked && (
                    <div className="absolute top-1.5 right-1.5 rounded-md bg-slate-800/85 p-1 text-white border border-white/10 shadow-sm animate-pulse">
                      <Lock size={10} />
                    </div>
                  )}

                  {/* Resize Handle */}
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

          {/* ── Canva-style Smart Alignment Guides SVG Overlay ── */}
          {mode === 'move' && interaction.type === 'drag' && (smartGuides.hLines.length > 0 || smartGuides.vLines.length > 0) && (
            <svg
              className="absolute inset-0 pointer-events-none z-50"
              style={{
                width: '6000px',
                height: '6000px',
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${zoom})`,
                transformOrigin: '0 0',
                overflow: 'visible',
              }}
            >
              {/* Horizontal guide lines (Y alignment) */}
              {smartGuides.hLines.map((y, i) => (
                <line
                  key={`h-${i}`}
                  x1="-9999"
                  y1={y}
                  x2="99999"
                  y2={y}
                  stroke="#a855f7"
                  strokeWidth={1 / zoom}
                  strokeDasharray={`${4 / zoom},${3 / zoom}`}
                  opacity="0.9"
                />
              ))}
              {/* Vertical guide lines (X alignment) */}
              {smartGuides.vLines.map((x, i) => (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1="-9999"
                  x2={x}
                  y2="99999"
                  stroke="#a855f7"
                  strokeWidth={1 / zoom}
                  strokeDasharray={`${4 / zoom},${3 / zoom}`}
                  opacity="0.9"
                />
              ))}
            </svg>
          )}

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-6 left-6 z-25 flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-xl">
            <button
              onClick={zoomIn}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
              title="ขยาย (Zoom In)"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={zoomOut}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
              title="ย่อ (Zoom Out)"
            >
              <ZoomOut size={18} />
            </button>
            <div className="h-px bg-slate-200 my-0.5 mx-1" />
            <button
              onClick={resetZoom}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
              title="รีเซ็ตสเกล"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <div className="absolute top-6 left-6 z-25 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 text-sm font-black text-slate-800 shadow-md">
            สเกล: {Math.round(zoom * 100)}%
          </div>

          {/* Mode Hints Overlay */}
          <div className="absolute bottom-6 right-6 pointer-events-none rounded-2xl bg-slate-900/90 px-4 py-3 text-xs font-bold text-white shadow-xl backdrop-blur-md max-w-md">
            {mode === 'move'
              ? '⊹ โหมดลากจัดวาง: ดับเบิ้ลคลิกวัตถุเพื่อเปิดดูรายละเอียด หรือคลิกลากเพื่อเปลี่ยนตำแหน่ง'
              : '✋ โหมดเลื่อนมุมมอง: คลิกลากพื้นที่เพื่อเลื่อนมุมมองแผนผังได้อย่างอิสระ'}
          </div>

          {/* ── Floating Studio Details Panel Drawer ── */}
          {selectedStall && isSidebarOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 z-40 w-80 sm:w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl transition-all duration-300 overflow-hidden box-border animate-in fade-in slide-in-from-right-4"
            >
              {/* Sticky Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/90 rounded-t-3xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs shrink-0">
                    <Eye size={18} />
                  </div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight truncate">รายละเอียดวัตถุแผนผัง</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleLockStall(selectedStall.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                      selectedStall.isLocked
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                    title={selectedStall.isLocked ? 'ปลดล็อกวัตถุ' : 'ล็อกตำแหน่งวัตถุ'}
                  >
                    {selectedStall.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Stall Overview Header */}
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 p-4 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-600 text-[11px] uppercase tracking-wider">
                      {getItemTypeName(selectedStall.item_type)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      ['occupied', 'approved'].includes(selectedStall.status)
                        ? 'bg-rose-100 text-rose-700'
                        : selectedStall.status === 'repair'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {getStatusLabel(selectedStall.status)}
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">{selectedStall.code}</h4>
                  <p className="text-xs text-slate-500 font-medium">ขนาดพื้นที่: <span className="font-bold text-slate-800">{selectedStall.size}</span></p>
                </div>

                {/* Rental & Pricing Details Card */}
                {selectedStall.item_type === 'block' && (
                  <>
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
                      <h5 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <CreditCard size={14} className="text-indigo-600" />
                        อัตราค่าเช่า & รูปแบบสัญญา
                      </h5>

                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                          <span className="text-slate-500 font-medium">ประเภทการเช่า:</span>
                          <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                            {selectedStall.rental_type === 'monthly' ? 'เช่ารายเดือน' : 'เช่ารายวัน'}
                          </span>
                        </div>

                        {selectedStall.rental_type === 'monthly' ? (
                          <>
                            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                              <span className="text-slate-500 font-medium">ค่าเช่ารายเดือน:</span>
                              <span className="font-black text-slate-900 font-mono text-sm">
                                ฿{(selectedStall.monthly_price || selectedStall.price || 0).toLocaleString()} / เดือน
                              </span>
                            </div>
                            {selectedStall.entry_fee !== null && (
                              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                                <span className="text-slate-500 font-medium">ค่าแรกเข้า:</span>
                                <span className="font-bold text-slate-800 font-mono">
                                  ฿{(selectedStall.entry_fee || 0).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {selectedStall.security_deposit !== null && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-slate-500 font-medium">เงินประกัน:</span>
                                <span className="font-bold text-slate-800 font-mono">
                                  ฿{(selectedStall.security_deposit || 0).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex justify-between items-center py-1">
                            <span className="text-slate-500 font-medium">ค่าเช่ารายวัน:</span>
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              ฿{(selectedStall.daily_price || selectedStall.price || 0).toLocaleString()} / วัน
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stall Facilities / Utilities */}
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2.5">
                      <h5 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <Zap size={14} className="text-amber-500" />
                        สิ่งอำนวยความสะดวกประจำแผง
                      </h5>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border ${
                          selectedStall.has_electricity !== false
                            ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        }`}>
                          <Zap size={13} className={selectedStall.has_electricity !== false ? 'text-amber-600' : 'text-slate-400'} />
                          ไฟฟ้าพร้อมใช้
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border ${
                          selectedStall.has_water !== false
                            ? 'bg-blue-50 text-blue-800 border-blue-200 shadow-xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        }`}>
                          <Droplets size={13} className={selectedStall.has_water !== false ? 'text-blue-600' : 'text-slate-400'} />
                          น้ำประปา
                        </span>
                      </div>
                    </div>

                    {/* Stall Photos */}
                    {(() => {
                      const photo1 = selectedStall.image1 || selectedStall.images?.[0] || null;
                      const photo2 = selectedStall.image2 || selectedStall.images?.[1] || null;
                      const photoCount = [photo1, photo2].filter(Boolean).length;

                      return (
                        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h5 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                              <Camera size={14} className="text-indigo-500" />
                              รูปถ่ายแผงค้าจริง
                            </h5>
                            {photoCount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {photoCount} รูป
                              </span>
                            )}
                          </div>

                          {photoCount > 0 ? (
                            <div className={`grid ${photo1 && photo2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-1`}>
                              {photo1 && (
                                <div
                                  onClick={() => setPreviewZoomImage(formatImageUrl(photo1) || null)}
                                  className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition-all"
                                  title="คลิกเพื่อดูภาพขนาดใหญ่"
                                >
                                  <img
                                    src={formatImageUrl(photo1)}
                                    alt="รูปหน้าแผง"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                                    <div className="w-7 h-7 rounded-full bg-white/90 text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                      <Eye size={14} />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md">
                                    รูปที่ 1 (หน้าแผง)
                                  </span>
                                </div>
                              )}
                              {photo2 && (
                                <div
                                  onClick={() => setPreviewZoomImage(formatImageUrl(photo2) || null)}
                                  className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition-all"
                                  title="คลิกเพื่อดูภาพขนาดใหญ่"
                                >
                                  <img
                                    src={formatImageUrl(photo2)}
                                    alt="รูปบรรยากาศ"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                                    <div className="w-7 h-7 rounded-full bg-white/90 text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                      <Eye size={14} />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md">
                                    รูปที่ 2 (บรรยากาศ)
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-3.5 text-center">
                              <div className="mx-auto w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1.5">
                                <Camera size={16} />
                              </div>
                              <p className="text-[11px] font-semibold text-slate-400">ยังไม่มีรูปถ่ายสำหรับแผงนี้</p>
                              <button
                                type="button"
                                onClick={() => openEditModal(selectedStall)}
                                className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <UploadCloud size={12} />
                                <span>อัปโหลดรูปภาพ</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* Seller Info if Occupied */}
                {selectedStall.seller && (
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-4 space-y-2.5">
                    <h5 className="font-black text-indigo-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <User size={14} className="text-indigo-600" />
                      ข้อมูลร้านค้า / ผู้จอง
                    </h5>
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-800">
                        ร้านค้า: <span className="text-indigo-700 font-black">{selectedStall.seller.shop_name || selectedStall.seller.name}</span>
                      </p>
                      <p className="text-xs font-medium text-slate-600">
                        ผู้จอง: <span className="font-bold text-slate-800">{selectedStall.seller.name}</span>
                      </p>
                      <p className="text-xs font-medium text-slate-600">
                        เบอร์โทร: <span className="font-bold text-slate-800 font-mono">{selectedStall.seller.phone || '-'}</span>
                      </p>
                      {selectedStall.seller.start_date && (
                        <p className="text-xs font-medium text-slate-600">
                          ระยะเวลาสัญญา: <span className="font-bold text-slate-800">{formatThaiDate(selectedStall.seller.start_date)} - {formatThaiDate(selectedStall.seller.end_date)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Action Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 shrink-0">
                <button
                  onClick={() => openEditModal(selectedStall)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-black text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Edit3 size={15} />
                  <span>แก้ไขข้อมูล</span>
                </button>
                <button
                  onClick={() => requestDeleteStall(selectedStall.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                  title="ลบวัตถุ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Element Modal ── */}
      {showDetailModal && editingStall &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">แก้ไขข้อมูลวัตถุแผนผัง: <span className="text-amber-300">{editingStall.code}</span></h3>
                    <p className="text-xs text-indigo-100 font-medium">ปรับเปลี่ยนรูปแบบสัญญา ค่าเช่า และประเภทวัตถุ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Type Selection */}
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                  <p className="font-black text-slate-800 uppercase tracking-wider text-[11px]">1. ประเภทวัตถุ, ขนาด & สถานะ</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700">ประเภทวัตถุ</label>
                      <select
                        value={editItemType}
                        disabled={['occupied', 'approved'].includes(editingStall.status)}
                        onChange={(e) => setEditItemType(e.target.value as any)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="block">แผงค้า (Stall Block)</option>
                        <option value="zone">โซนพื้นที่ (Zone)</option>
                        <option value="road">ถนน / ทางเดิน (Road)</option>
                        <option value="toilet">ห้องน้ำ (Toilet)</option>
                        <option value="entrance">ทางเข้าหลัก (Entrance)</option>
                        <option value="exit">ทางออก (Exit)</option>
                        <option value="dining">ที่นั่งพักกินอาหาร (Dining Area)</option>
                        <option value="parking">ที่จอดรถ (Parking)</option>
                        <option value="info">จุดประชาสัมพันธ์ (Info Desk)</option>
                        <option value="trash">จุดทิ้งขยะ (Trash Area)</option>
                      </select>
                    </div>

                    {(editItemType === 'block' || editItemType === 'zone') && (
                      <div>
                        <label className="font-bold text-slate-700">สังกัดโซนตลาดนัด</label>
                        <select
                          value={editZoneId || ''}
                          disabled={['occupied', 'approved'].includes(editingStall.status)}
                          onChange={(e) => setEditZoneId(Number(e.target.value) || null)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- ไม่ระบุโซน --</option>
                          {dbZones.map(z => (
                            <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editItemType === 'block' && (
                      <>
                        <div>
                          <label className="font-bold text-slate-700">ขนาดแผง</label>
                          <input
                            type="text"
                            value={editSize}
                            onChange={(e) => setEditSize(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                            placeholder="เช่น 3x3 เมตร"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700">สถานะแผง</label>
                          <select
                            value={editStatus}
                            disabled={['occupied', 'approved'].includes(editingStall.status)}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="available">ว่าง</option>
                            <option value="repair">ปิดปรับปรุง</option>
                            {['occupied', 'approved'].includes(editingStall.status) && (
                              <option value={editingStall.status} disabled>
                                {getStatusLabel(editingStall.status)}
                              </option>
                            )}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Rental Options & Pricing (For Stalls) */}
                {editItemType === 'block' && (
                  <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 space-y-4">
                    <p className="font-black text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <DollarSign size={14} className="text-indigo-600" />
                      2. อัตราค่าเช่า & รูปแบบสัญญา
                    </p>

                    {/* Rental Type Selection */}
                    <div>
                      <label className="font-bold text-slate-700">รูปแบบการเช่าแผง</label>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setEditRentalType('daily')}
                          className={`py-2.5 px-4 rounded-xl font-extrabold text-xs border transition-all cursor-pointer ${
                            editRentalType === 'daily'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📅 เช่ารายวัน
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditRentalType('monthly')}
                          className={`py-2.5 px-4 rounded-xl font-extrabold text-xs border transition-all cursor-pointer ${
                            editRentalType === 'monthly'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📆 เช่ารายเดือน
                        </button>
                      </div>
                    </div>

                    {/* Pricing Inputs based on Rental Type */}
                    {editRentalType === 'daily' ? (
                      <div>
                        <label className="font-bold text-slate-700">ค่าเช่ารายวัน (บาท/วัน)</label>
                        <input
                          type="number"
                          value={editDailyPrice}
                          onChange={(e) => setEditDailyPrice(parseFloat(e.target.value) || 0)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-black text-indigo-600 font-mono text-base focus:ring-2 focus:ring-indigo-500"
                          placeholder="500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="font-bold text-slate-700">ค่าเช่ารายเดือน (บาท/เดือน)</label>
                          <input
                            type="number"
                            value={editMonthlyPrice}
                            onChange={(e) => setEditMonthlyPrice(parseFloat(e.target.value) || 0)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-black text-indigo-600 font-mono text-base focus:ring-2 focus:ring-indigo-500"
                            placeholder="5000"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700">ค่าธรรมเนียมแรกเข้า (บาท)</label>
                            <input
                              type="number"
                              value={editEntryFee}
                              onChange={(e) => setEditEntryFee(parseFloat(e.target.value) || 0)}
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500"
                              placeholder="1000"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700">เงินประกัน (บาท)</label>
                            <input
                              type="number"
                              value={editSecurityDeposit}
                              onChange={(e) => setEditSecurityDeposit(parseFloat(e.target.value) || 0)}
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500"
                              placeholder="2000"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Facilities & Utilities (For Stalls) */}
                {editItemType === 'block' && (
                  <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100 space-y-3">
                    <p className="font-black text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-600" />
                      3. สิ่งอำนวยความสะดวกประจำแผง
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        editHasElectricity
                          ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-slate-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={editHasElectricity}
                          onChange={(e) => setEditHasElectricity(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                        />
                        <div className="flex items-center gap-1.5 text-xs">
                          <Zap size={14} className={editHasElectricity ? 'text-amber-600' : 'text-slate-400'} />
                          <span>ไฟฟ้าพร้อมใช้</span>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        editHasWater
                          ? 'bg-blue-100/70 border-blue-300 text-blue-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-slate-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={editHasWater}
                          onChange={(e) => setEditHasWater(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                        <div className="flex items-center gap-1.5 text-xs">
                          <Droplets size={14} className={editHasWater ? 'text-blue-600' : 'text-slate-400'} />
                          <span>น้ำประปา</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. Stall Photos (1 - 2 Photos) */}
                {editItemType === 'block' && (
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Camera size={14} className="text-blue-600" />
                        4. รูปถ่ายแผงค้าจริง (สำหรับให้ผู้ค้าดูสภาพแผงก่อนตัดสินใจจอง)
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">สูงสุด 2 รูป</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Slot 1: Front Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">รูปที่ 1 (ภาพด้านหน้าแผง)</label>
                          {(editImage1Preview || (!removeImage1 && editImage1)) && (
                            <button
                              type="button"
                              onClick={handleRemoveImage1}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 size={11} /> ลบรูปนี้
                            </button>
                          )}
                        </div>

                        {editImage1Preview || (!removeImage1 && editImage1) ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                            <img
                              src={editImage1Preview || (editImage1 ? formatImageUrl(editImage1) : '')}
                              alt="Stall Photo 1"
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1">
                              <Camera size={20} />
                              <span className="text-[11px] font-bold">เปลี่ยนรูป</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImage1Change}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition cursor-pointer p-3 text-center">
                            <UploadCloud size={24} className="text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-blue-600">คลิกเลือกรูปภาพ</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ไม่เกิน 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImage1Change}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Slot 2: Environment / Wide Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">รูปที่ 2 (ภาพมุมกว้าง / สภาพแวดล้อม)</label>
                          {(editImage2Preview || (!removeImage2 && editImage2)) && (
                            <button
                              type="button"
                              onClick={handleRemoveImage2}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 size={11} /> ลบรูปนี้
                            </button>
                          )}
                        </div>

                        {editImage2Preview || (!removeImage2 && editImage2) ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                            <img
                              src={editImage2Preview || (editImage2 ? formatImageUrl(editImage2) : '')}
                              alt="Stall Photo 2"
                              className="w-full h-full object-cover"
                            />
                            <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1">
                              <Camera size={20} />
                              <span className="text-[11px] font-bold">เปลี่ยนรูป</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImage2Change}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition cursor-pointer p-3 text-center">
                            <UploadCloud size={24} className="text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-blue-600">คลิกเลือกรูปภาพ</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ไม่เกิน 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImage2Change}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={saveStallDetails}
                  disabled={isSavingStallImages}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 py-3 text-sm font-black text-white transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{isSavingStallImages ? 'กำลังบันทึกและอัปโหลดรูป...' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Create New Element Modal ── */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getItemTypeIcon(createItemType)}</span>
                  <div>
                    <h3 className="text-xl font-black">สร้าง {getItemTypeName(createItemType)} ใหม่</h3>
                    <p className="text-xs text-slate-400 font-medium">เพิ่มองค์ประกอบใหม่ลงบนแผนผังตลาด</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full p-2 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div>
                  <label className="font-bold text-slate-700">ชื่อเรียก / รหัสระบุวัตถุ</label>
                  <input
                    type="text"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    placeholder="เช่น A08, โซนอาหาร, ถนนหลัก"
                  />
                </div>

                {createItemType === 'block' && (
                  <div className="space-y-4 rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100">
                    {/* ขนาดแผง & สถานะแผง */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700">ขนาดแผง</label>
                        <input
                          type="text"
                          value={createSize}
                          onChange={(e) => setCreateSize(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          placeholder="เช่น 3x3 เมตร"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700">สถานะแผง</label>
                        <select
                          value={createStatus}
                          onChange={(e) => setCreateStatus(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="available">ว่าง</option>
                          <option value="repair">ปิดปรับปรุง</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">รูปแบบการเช่า</label>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setCreateRentalType('daily')}
                          className={`py-2.5 px-4 rounded-xl font-extrabold text-xs border transition cursor-pointer ${
                            createRentalType === 'daily'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📅 เช่ารายวัน
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateRentalType('monthly')}
                          className={`py-2.5 px-4 rounded-xl font-extrabold text-xs border transition cursor-pointer ${
                            createRentalType === 'monthly'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📆 เช่ารายเดือน
                        </button>
                      </div>
                    </div>

                    {createRentalType === 'daily' ? (
                      <div>
                        <label className="font-bold text-slate-700">ค่าเช่ารายวัน (บาท/วัน)</label>
                        <input
                          type="number"
                          value={createDailyPrice}
                          onChange={(e) => setCreateDailyPrice(parseFloat(e.target.value) || 0)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-black text-indigo-600 font-mono text-base"
                          placeholder="500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="font-bold text-slate-700">ค่าเช่ารายเดือน (บาท/เดือน)</label>
                          <input
                            type="number"
                            value={createMonthlyPrice}
                            onChange={(e) => setCreateMonthlyPrice(parseFloat(e.target.value) || 0)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-black text-indigo-600 font-mono text-base"
                            placeholder="5000"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700">ค่าธรรมเนียมแรกเข้า (บาท)</label>
                            <input
                              type="number"
                              value={createEntryFee}
                              onChange={(e) => setCreateEntryFee(parseFloat(e.target.value) || 0)}
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-800 font-mono"
                              placeholder="1000"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700">เงินประกัน (บาท)</label>
                            <input
                              type="number"
                              value={createSecurityDeposit}
                              onChange={(e) => setCreateSecurityDeposit(parseFloat(e.target.value) || 0)}
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-800 font-mono"
                              placeholder="2000"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Facilities / Utilities Selection */}
                    <div className="pt-2 border-t border-indigo-100">
                      <label className="font-bold text-slate-700 block mb-2">สิ่งอำนวยความสะดวกประจำแผง (เริ่มต้น: มีครบ)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          createHasElectricity
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={createHasElectricity}
                            onChange={(e) => setCreateHasElectricity(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                          />
                          <div className="flex items-center gap-1.5 text-xs">
                            <Zap size={14} className={createHasElectricity ? 'text-amber-600' : 'text-slate-400'} />
                            <span>ไฟฟ้าพร้อมใช้</span>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          createHasWater
                            ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={createHasWater}
                            onChange={(e) => setCreateHasWater(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                          />
                          <div className="flex items-center gap-1.5 text-xs">
                            <Droplets size={14} className={createHasWater ? 'text-blue-600' : 'text-slate-400'} />
                            <span>น้ำประปา</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* 4. Stall Photos (1 - 2 Photos) */}
                    <div className="pt-2 border-t border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Camera size={14} className="text-blue-600" />
                          รูปถ่ายแผงค้าจริง (สำหรับให้ผู้ค้าดูสภาพแผงก่อนตัดสินใจจอง)
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">สูงสุด 2 รูป</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Slot 1: Front Photo */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">รูปที่ 1 (ภาพด้านหน้าแผง)</label>
                            {createImage1Preview && (
                              <button
                                type="button"
                                onClick={handleRemoveCreateImage1}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 size={11} /> ลบรูปนี้
                              </button>
                            )}
                          </div>

                          {createImage1Preview ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                              <img
                                src={createImage1Preview}
                                alt="New Stall Photo 1"
                                className="w-full h-full object-cover"
                              />
                              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1">
                                <Camera size={20} />
                                <span className="text-[11px] font-bold">เปลี่ยนรูป</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCreateImage1Change}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition cursor-pointer p-3 text-center">
                              <UploadCloud size={24} className="text-slate-400 mb-1" />
                              <span className="text-xs font-bold text-blue-600">คลิกเลือกรูปภาพ</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ไม่เกิน 5MB</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCreateImage1Change}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {/* Slot 2: Wide / Environment Photo */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">รูปที่ 2 (ภาพมุมกว้าง / สภาพแวดล้อม)</label>
                            {createImage2Preview && (
                              <button
                                type="button"
                                onClick={handleRemoveCreateImage2}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 size={11} /> ลบรูปนี้
                              </button>
                            )}
                          </div>

                          {createImage2Preview ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                              <img
                                src={createImage2Preview}
                                alt="New Stall Photo 2"
                                className="w-full h-full object-cover"
                              />
                              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1">
                                <Camera size={20} />
                                <span className="text-[11px] font-bold">เปลี่ยนรูป</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCreateImage2Change}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition cursor-pointer p-3 text-center">
                              <UploadCloud size={24} className="text-slate-400 mb-1" />
                              <span className="text-xs font-bold text-blue-600">คลิกเลือกรูปภาพ</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ไม่เกิน 5MB</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCreateImage2Change}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isCreatingStall}
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isCreatingStall}
                  onClick={handleCreateStall}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-black text-white shadow-md cursor-pointer transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreatingStall ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      กำลังสร้างและอัปโหลดรูปภาพ...
                    </>
                  ) : (
                    'สร้างวัตถุ'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Confirmation Dialog Modal ── */}
      {confirmDialog &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
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
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition shadow-sm ${
                      confirmDialog.type === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {confirmDialog.actionText}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Image Lightbox Modal ── */}
      {previewZoomImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setPreviewZoomImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all cursor-pointer"
                title="ปิด"
              >
                <X size={20} />
              </button>
              <img
                src={previewZoomImage}
                alt="รูปขยาย"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MarketMapPage;
