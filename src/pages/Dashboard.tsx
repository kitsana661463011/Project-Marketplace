import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgeCheck,
  Store,
  Users,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  CreditCard,
  Map,
  Sparkles,
  Building2,
  Clock,
  ChevronRight,
  Megaphone,
  FolderPlus,
  Heart,
  Search,
  UserRound,
  Zap,
  Droplets,
  AlertTriangle,
  Layers,
  X,
  Trash2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type OverviewCard = {
  title: string;
  value: number | string;
  subValue?: string;
  detail?: string;
  type?: string;
};

type CategoryShareItem = {
  id?: string | number;
  name: string;
  count?: number;
  value?: number;
  percentage?: number;
};

type UserInterestItem = {
  id?: number;
  name: string;
  count: number;
  percentage: number;
};

type ZoneSummaryItem = {
  zone_id: number;
  zone_name: string;
  total_stalls: number;
  occupied_count: number;
  available_count: number;
};

type RecentActivityItem = {
  id?: string | number;
  type?: string;
  title: string;
  owner?: string;
  status: string;
  status_label: string;
  message: string;
  created_at: string;
};

type MarketSummary = {
  total_revenue?: number;
  total_stalls?: number;
  occupied_stalls?: number;
  available_stalls?: number;
  pending_bookings?: number;
  pending_reports?: number;
  total_shops?: number;
  total_sellers?: number;
  pending_sellers?: number;
  total_users_with_interests?: number;
};

type DashboardPayload = {
  summary: MarketSummary;
  overviewCards: OverviewCard[];
  categories: CategoryShareItem[];
  userInterests: UserInterestItem[];
  zones: ZoneSummaryItem[];
  recentActivity: RecentActivityItem[];
};

const categoryBarColors = [
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-violet-500 to-purple-400',
];

const interestBarColors = [
  'from-rose-500 to-pink-400',
  'from-purple-500 to-indigo-400',
  'from-blue-500 to-sky-400',
  'from-amber-500 to-yellow-400',
  'from-emerald-500 to-teal-400',
];

const MarketMapPreviewSection: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [stalls, setStalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/maps/1');
        if (!res.ok) return;
        const json = await res.json();
        const items = Array.isArray(json?.data?.items) ? json.data.items : [];
        setStalls(
          items.map((item: any) => ({
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
            size: item.size || '3x3 เมตร',
            price: item.price || 500,
            rental_type: item.rental_type || 'daily',
            daily_price: item.daily_price !== undefined && item.daily_price !== null ? Number(item.daily_price) : (item.price || 500),
            monthly_price: item.monthly_price !== undefined && item.monthly_price !== null ? Number(item.monthly_price) : null,
            entry_fee: item.entry_fee !== undefined && item.entry_fee !== null ? Number(item.entry_fee) : null,
            security_deposit: item.security_deposit !== undefined && item.security_deposit !== null ? Number(item.security_deposit) : null,
            has_electricity: item.has_electricity !== undefined ? Boolean(item.has_electricity) : true,
            has_water: item.has_water !== undefined ? Boolean(item.has_water) : true,
            seller: item.seller,
          }))
        );
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    void loadMap();
  }, []);

  const [pointerDownPos, setPointerDownPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    setHasMoved(false);
    setPointerDownPos({ x: e.clientX, y: e.clientY });
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > 5 || dy > 5) {
        setHasMoved(true);
      }
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  const availableCount = stalls.filter((s) => s.item_type === 'block' && s.status === 'available').length;
  const occupiedCount = stalls.filter((s) => s.item_type === 'block' && ['occupied', 'approved', 'verified'].includes(s.status)).length;

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
      case 'zone': return 'โซนพื้นที่';
      default: return 'วัตถุผังตลาด';
    }
  };

  const getItemStyle = (stall: any) => {
    if (stall.item_type === 'road') return 'bg-slate-200/90 border-slate-300 text-slate-700 font-bold border-2';
    if (stall.item_type === 'toilet') return 'bg-cyan-600 border-2 border-cyan-700 text-white font-black';
    if (stall.item_type === 'entrance') return 'bg-emerald-600 border-2 border-emerald-700 text-white font-black';
    if (stall.item_type === 'exit') return 'bg-rose-600 border-2 border-rose-700 text-white font-black';
    if (stall.item_type === 'dining') return 'bg-amber-500 border-2 border-amber-600 text-white font-black';
    if (stall.item_type === 'parking') return 'bg-blue-600 border-2 border-blue-700 text-white font-black';
    if (stall.item_type === 'info') return 'bg-purple-600 border-2 border-purple-700 text-white font-black';
    if (stall.item_type === 'trash') return 'bg-slate-700 border-2 border-slate-800 text-white font-black';
    if (stall.item_type === 'zone') return 'bg-indigo-50/20 border-dashed border-2 border-indigo-400/60 text-indigo-950 font-black';

    if (['occupied', 'approved', 'verified'].includes(stall.status)) {
      return 'bg-rose-500 border-2 border-rose-600 text-white font-black shadow-md';
    }
    if (stall.status === 'repair') {
      return 'bg-amber-500 border-2 border-amber-600 text-white font-black shadow-md';
    }
    return 'bg-emerald-500 border-2 border-emerald-600 text-white font-black shadow-md hover:bg-emerald-600';
  };

  const sortedStalls = [...stalls].sort((a, b) => {
    if (a.item_type === 'zone' && b.item_type !== 'zone') return -1;
    if (a.item_type !== 'zone' && b.item_type === 'zone') return 1;
    return 0;
  });

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">
              <MapPin className="h-4.5 w-4.5" />
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">ตัวอย่างแผนผังตลาดนัด (Interactive Market Map)</h3>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            แสดงผังโครงสร้างแผงค้าในตลาด (สามารถลากเลื่อนดูตำแหน่งแผงค้าและขยายย่อได้ ไม่สามารถแก้ไขตำแหน่งหรือเพิ่มข้อมูลได้)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> แผงว่าง ({availableCount})
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-600" /> มีผู้เช่า ({occupiedCount})
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/stores')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer active:scale-95"
          >
            <Maximize2 className="h-4 w-4" />
            <span>จัดการผังเต็ม</span>
          </button>
        </div>
      </div>

      {/* Interactive Read-Only Canvas Container */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner select-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="absolute inset-0 transition-transform duration-75"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.4px, transparent 1.4px)',
            backgroundSize: '24px 24px',
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${zoom})`,
            transformOrigin: 'top left',
            width: '6000px',
            height: '6000px',
          }}
        >
          {loading ? (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
              กำลังโหลดผังตลาด...
            </div>
          ) : (
            sortedStalls.map((stall) => (
              <div
                key={stall.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasMoved) {
                    setSelectedItem(stall);
                  }
                }}
                className={`absolute flex flex-col items-center justify-center rounded-2xl text-center transition-all cursor-pointer ${getItemStyle(stall)}`}
                style={{
                  left: `${stall.x}px`,
                  top: `${stall.y}px`,
                  width: `${stall.width}px`,
                  height: `${stall.height}px`,
                }}
              >
                <div className="flex items-center justify-center gap-1 max-w-full px-1">
                  <span className="text-sm">{getItemTypeIcon(stall.item_type)}</span>
                  <span className="text-xs font-black truncate uppercase">{stall.code}</span>
                </div>

                {stall.item_type === 'block' && stall.width >= 55 && (
                  <span className="text-[10px] font-extrabold bg-black/20 text-white px-1.5 py-0.5 rounded-full mt-0.5 truncate max-w-full">
                    {['occupied', 'approved', 'verified'].includes(stall.status)
                      ? (stall.seller?.shop_name || stall.seller?.name || 'มีผู้เช่าแล้ว')
                      : stall.rental_type === 'monthly'
                        ? `฿${(stall.monthly_price || stall.price || 0).toLocaleString()}/เดือน`
                        : `฿${(stall.daily_price || stall.price || 0).toLocaleString()}/วัน`}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-md">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition"
            title="ขยาย"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition"
            title="ย่อ"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition"
            title="รีเซ็ตตำแหน่ง"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 text-xs font-bold text-slate-600 font-mono">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="absolute top-4 right-4 z-20 rounded-xl bg-slate-900/80 border border-slate-700/80 px-3.5 py-1.5 text-[11px] font-bold text-white backdrop-blur-md shadow-xs">
          ✋ ลากเพื่อเลื่อนดูผังตลาด | คลิกที่แผงเพื่อดูรายละเอียด (Read-Only)
        </div>

        {/* Read-only Item Details Card Popover */}
        {selectedItem && (
          <div className="absolute bottom-4 right-4 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getItemTypeIcon(selectedItem.item_type)}</span>
                <div>
                  <h4 className="font-black text-sm text-slate-900">{selectedItem.code}</h4>
                  <span className="text-[10px] font-bold text-indigo-600">{getItemTypeName(selectedItem.item_type)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">ขนาดพื้นที่:</span>
                <span className="font-bold text-slate-900">{selectedItem.size}</span>
              </div>

              {selectedItem.item_type === 'block' && (
                <>
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">ประเภทการเช่า:</span>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {selectedItem.rental_type === 'monthly' ? 'เช่ารายเดือน' : 'เช่ารายวัน'}
                    </span>
                  </div>

                  {selectedItem.rental_type === 'monthly' ? (
                    <>
                      <div className="flex justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-500">ค่าเช่ารายเดือน:</span>
                        <span className="font-black text-slate-900 font-mono">฿{(selectedItem.monthly_price || selectedItem.price || 0).toLocaleString()} / เดือน</span>
                      </div>
                      {selectedItem.entry_fee !== null && (
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-500">ค่าแรกเข้า:</span>
                          <span className="font-bold text-slate-800 font-mono">฿{(selectedItem.entry_fee || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedItem.security_deposit !== null && (
                        <div className="flex justify-between py-0.5 border-b border-slate-100">
                          <span className="text-slate-500">เงินประกัน:</span>
                          <span className="font-bold text-slate-800 font-mono">฿{(selectedItem.security_deposit || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-500">ค่าเช่ารายวัน:</span>
                      <span className="font-black text-emerald-600 font-mono">฿{(selectedItem.daily_price || selectedItem.price || 0).toLocaleString()} / วัน</span>
                    </div>
                  )}

                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">สถานะ:</span>
                    <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                      ['occupied', 'approved', 'verified'].includes(selectedItem.status)
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {['occupied', 'approved', 'verified'].includes(selectedItem.status) ? 'มีผู้เช่าแล้ว' : 'ว่างพร้อมเช่า'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 pt-1 border-t border-slate-100">
                    <span className="text-slate-500">สาธารณูปโภค:</span>
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                        selectedItem.has_electricity !== false
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}>
                        <Zap size={10} /> ไฟฟ้า
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                        selectedItem.has_water !== false
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}>
                        <Droplets size={10} /> น้ำ
                      </span>
                    </div>
                  </div>
                </>
              )}

              {selectedItem.seller && (
                <div className="mt-2 pt-2 border-t border-slate-100 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">ผู้จอง / ร้านค้า:</span>
                  <p className="font-black text-slate-900">{selectedItem.seller.shop_name || selectedItem.seller.name}</p>
                  <p className="text-[11px] font-medium text-slate-600">ผู้เช่า: {selectedItem.seller.name} ({selectedItem.seller.phone || '-'})</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardPayload>({
    summary: {},
    overviewCards: [],
    categories: [],
    userInterests: [],
    zones: [],
    recentActivity: [],
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categorySuccessMsg, setCategorySuccessMsg] = useState('');

  const [isAddInterestOpen, setIsAddInterestOpen] = useState(false);
  const [interestName, setInterestName] = useState('');
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [interestSuccessMsg, setInterestSuccessMsg] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  const [isViewAllCategoriesOpen, setIsViewAllCategoriesOpen] = useState(false);
  const [isViewAllInterestsOpen, setIsViewAllInterestsOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | number | null>(null);
  const [deletingInterestId, setDeletingInterestId] = useState<number | null>(null);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/dashboard/overview');

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const payload = await response.json();
      const data = payload?.data;

      if (!data) return;

      setDashboardData({
        summary: data.summary ?? {},
        overviewCards: data.overview_cards ?? [],
        categories: data.category_share ?? [],
        userInterests: data.user_interests ?? [],
        zones: data.zone_summary ?? [],
        recentActivity: data.recent_activity ?? [],
      });
    } catch {
      // Keep existing
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmittingCategory(true);
    try {
      const response = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: categoryName.trim(),
          description: categoryDesc.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      setCategoryName('');
      setCategoryDesc('');
      setIsAddCategoryOpen(false);
      setCategorySuccessMsg('เพิ่มหมวดหมู่สินค้าใหม่เรียบร้อยแล้ว!');
      setTimeout(() => setCategorySuccessMsg(''), 4000);
      await loadDashboardData();
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่ใหม่');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleAddInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestName.trim()) return;

    setIsSubmittingInterest(true);
    try {
      const response = await fetch('/api/v1/user-interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest_name: interestName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user interest option');
      }

      setInterestName('');
      setIsAddInterestOpen(false);
      setInterestSuccessMsg('เพิ่มตัวเลือกความสนใจของผู้ใช้เรียบร้อยแล้ว!');
      setTimeout(() => setInterestSuccessMsg(''), 4000);
      await loadDashboardData();
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกตัวเลือกความสนใจใหม่');
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string | number) => {
    if (!window.confirm('คุณต้องการลบหมวดหมู่นี้จริงหรือไม่?')) return;

    setDeletingCategoryId(categoryId);
    try {
      const response = await fetch(`/api/v1/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Failed to delete category');
      }

      await loadDashboardData();
    } catch (error: any) {
      alert(error?.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteInterest = async (interestId: number) => {
    if (!window.confirm('คุณต้องการลบตัวเลือกความสนใจนี้จริงหรือไม่?')) return;

    setDeletingInterestId(interestId);
    try {
      const response = await fetch(`/api/v1/user-interests/${interestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Failed to delete user interest');
      }

      await loadDashboardData();
    } catch (error: any) {
      alert(error?.message || 'เกิดข้อผิดพลาดในการลบตัวเลือกความสนใจ');
    } finally {
      setDeletingInterestId(null);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const { summary, zones, categories, userInterests } = dashboardData;

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  const filteredInterests = userInterests.filter((i) =>
    i.name.toLowerCase().includes(interestSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. แจ้งเหตุ/ปัญหา (หน้าสุด) */}
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="group relative overflow-hidden rounded-[24px] border border-rose-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-rose-500 to-pink-500" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">แจ้งเหตุ/ปัญหา</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-rose-600">{summary.pending_reports ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">เคส</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>ต้องตรวจสอบ / ซ่อมแซมด่วน</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        {/* 2. คำขอจองรออนุมัติ */}
        <button
          type="button"
          onClick={() => navigate('/verifications')}
          className="group relative overflow-hidden rounded-[24px] border border-amber-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">คำขอจองรออนุมัติ</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <BadgeCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-amber-600">{summary.pending_bookings ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>รอการตรวจสอบจากแอดมิน</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        {/* 3. ข้อมูลผู้ค้า */}
        <button
          type="button"
          onClick={() => navigate('/sellers')}
          className="group relative overflow-hidden rounded-[24px] border border-sky-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-sky-500 to-blue-600" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ข้อมูลผู้ค้า</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-sky-600">{summary.total_sellers ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">ราย</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-sky-600">
              <Users className="h-3.5 w-3.5" />
              <span>ผู้ค้าในระบบที่อนุมัติแล้ว</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        {/* 4. รายการรออนุมัติผู้สมัครใหม่ */}
        <button
          type="button"
          onClick={() => navigate('/sellers')}
          className="group relative overflow-hidden rounded-[24px] border border-purple-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-purple-500 to-indigo-600" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">รายการรออนุมัติผู้สมัครใหม่</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <UserRound className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-purple-600">{summary.pending_sellers ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-600">
              <Clock className="h-3.5 w-3.5" />
              <span>รอการตรวจสอบเอกสาร</span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>

        {/* 5. จำนวนแผงค้าในตลาดทั้งหมด */}
        <button
          type="button"
          onClick={() => navigate('/stores')}
          className="group relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
        >
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-r-full bg-gradient-to-b from-blue-600 to-indigo-600" />
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">จำนวนแผงค้าในตลาดทั้งหมด</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pl-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black tracking-tight text-slate-900">{summary.total_stalls ?? 0}</p>
              <span className="text-sm font-semibold text-slate-400">แผง</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Building2 className="h-3.5 w-3.5" />
              <span>
                จองแล้ว {summary.occupied_stalls ?? 0} แผง / ว่าง {summary.available_stalls ?? ((summary.total_stalls ?? 0) - (summary.occupied_stalls ?? 0))} แผง
              </span>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" /> ทางลัดการจัดการข้อมูล (Admin Quick Actions)
          </h3>
          <span className="text-xs text-slate-400 font-medium">คลิกเพื่อไปยังหน้านั้นๆ ทันที</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'อนุมัติการจองแผง', icon: BadgeCheck, href: '/verifications', color: 'from-amber-500 to-orange-500', badge: summary.pending_bookings },
            { label: 'ตรวจสอบการชำระเงิน', icon: CreditCard, href: '/payments', color: 'from-emerald-500 to-teal-500' },
            { label: 'แผนผังแผงค้าตลาด', icon: Map, href: '/stores', color: 'from-blue-600 to-indigo-600' },
            { label: 'จัดการข้อมูลผู้ค้า', icon: Users, href: '/sellers', color: 'from-sky-500 to-blue-600' },
            { label: 'สร้างประกาศข่าวสาร', icon: Megaphone, href: '/announcements', color: 'from-purple-500 to-pink-500' },
          ].map((action) => {
            const IconComp = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.href)}
                className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-center transition-all duration-200 hover:border-blue-300 hover:bg-white hover:shadow-md active:scale-95"
              >
                <div className="relative mb-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-md transition-transform group-hover:scale-110`}>
                    <IconComp className="h-6 w-6" />
                  </div>
                  {action.badge ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                      {action.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-bold text-slate-800 transition group-hover:text-blue-600">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* 1. ความหนาแน่นโซนตลาด */}
        <div className="h-[420px] rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0 mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">ความหนาแน่นโซนตลาด</h3>
                  <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-extrabold text-blue-800 border border-blue-200">
                    {zones.length} โซน
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-600">สถานะแผงค้าว่างและแผงจองแบ่งตามโซน</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/stores')}
                className="flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                <span>ผังเต็ม</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {zones.length > 0 ? (
              zones.map((zone) => {
                const total = zone.total_stalls || 1;
                const occupiedPct = Math.round((zone.occupied_count / total) * 100);
                const zoneLetter = zone.zone_name.replace(/[^A-Za-z0-9ก-๙]/g, '').charAt(3) || 'Z';
                return (
                  <div
                    key={zone.zone_id}
                    onClick={() => navigate('/stores')}
                    className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-3.5 shadow-2xs transition-all duration-200 hover:border-blue-300 hover:shadow-md"
                  >
                    {/* Zone Header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-extrabold text-xs text-white shadow-xs">
                          {zoneLetter}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition">
                          {zone.zone_name}
                        </span>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-700 border border-slate-200">
                        ทั้งหมด {total} แผง
                      </span>
                    </div>

                    {/* Stats Grid: จองแล้ว vs ว่าง */}
                    <div className="grid grid-cols-2 gap-2 mb-2.5">
                      <div className="rounded-xl bg-blue-50/90 p-2 border border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900">จองแล้ว:</span>
                        <span className="font-black text-sm text-blue-700">{zone.occupied_count} แผง</span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/90 p-2 border border-emerald-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900">ว่าง:</span>
                        <span className="font-black text-sm text-emerald-700">{zone.available_count} แผง</span>
                      </div>
                    </div>

                    {/* Occupancy Indicator Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>อัตราการครองแผงโซนนี้</span>
                        <span className="font-black text-blue-600">{occupiedPct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 flex">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full"
                          style={{ width: `${occupiedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">ไม่มีข้อมูลโซนตลาด</div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>รวม {zones.length} โซนในผังตลาด</span>
            <span className="font-extrabold text-slate-900">ทั้งหมด {summary.total_stalls ?? 0} แผง</span>
          </div>
        </div>

        {/* 2. สัดส่วนประเภทสินค้า */}
        <div className="h-[420px] rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0 mb-3 border-b border-slate-100 pb-3 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">สัดส่วนประเภทสินค้า</h3>
                  <span className="rounded-full bg-indigo-100/80 px-2.5 py-0.5 text-xs font-extrabold text-indigo-800 border border-indigo-200">
                    {categories.length} หมวดหมู่
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-600">หมวดหมู่ร้านค้าจำแนกตามความนิยม</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาหมวดหมู่สินค้า..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {categorySuccessMsg && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{categorySuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => {
                const count = category.count ?? category.value ?? 0;
                const percentage = category.percentage ?? 0;
                return (
                  <div key={`${category.id ?? 'cat'}-${category.name}`} className="group rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 transition-colors hover:bg-blue-50/30">
                    <div className="flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 truncate">{category.name}</span>
                          <span className="text-xs font-bold text-slate-600 shrink-0">({count} ร้านค้า)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-white px-2.5 py-0.5 text-xs font-black text-blue-700 shadow-2xs border border-slate-200 shrink-0">
                          {percentage}%
                        </span>
                        {category.id != null && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deletingCategoryId === category.id}
                            className="rounded-full p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition"
                            title="ลบหมวดหมู่"
                          >
                            {deletingCategoryId === category.id ? (
                              <span className="text-[10px] font-semibold">กำลังลบ</span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200/90">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${categoryBarColors[index % categoryBarColors.length]}`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">ไม่พบหมวดหมู่สินค้าที่ค้นหา</div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>รวม {categories.length} หมวดหมู่</span>
            <button
              type="button"
              onClick={() => setIsViewAllCategoriesOpen(true)}
              className="flex items-center gap-0.5 font-extrabold text-blue-600 hover:text-blue-700 transition cursor-pointer"
            >
              <span>ดูทั้งหมด ({categories.length})</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3. ความสนใจของผู้ใช้ */}
        <div className="h-[420px] rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="shrink-0 mb-3 border-b border-slate-100 pb-3 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
                    <span>ความสนใจของผู้ใช้</span>
                  </h3>
                  <span className="rounded-full bg-rose-100/80 px-2.5 py-0.5 text-xs font-extrabold text-rose-800 border border-rose-200">
                    {userInterests.length} ตัวเลือก
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-600">สิ่งที่ผู้สมัครเลือกตอนลงทะเบียน</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddInterestOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition active:scale-95 cursor-pointer"
              >
                <Heart className="h-4 w-4" />
                <span>เพิ่มตัวเลือก</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาตัวเลือกความสนใจ..."
                value={interestSearch}
                onChange={(e) => setInterestSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:border-rose-500 focus:bg-white focus:outline-none"
              />
              {interestSearch && (
                <button
                  type="button"
                  onClick={() => setInterestSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {interestSuccessMsg && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{interestSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {filteredInterests.length > 0 ? (
              filteredInterests.map((interest, index) => (
                <div key={`interest-${interest.name}`} className="group rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 transition-colors hover:bg-rose-50/30">
                  <div className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2 flex items-center gap-2">
                      {index === 0 && <span className="text-sm shrink-0">🔥</span>}
                      <span className="font-extrabold text-sm text-slate-900 truncate">{interest.name}</span>
                      <span className="text-xs font-bold text-slate-600 shrink-0">({interest.count} คนเลือก)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-white px-2.5 py-0.5 text-xs font-black text-rose-600 shadow-2xs border border-slate-200 shrink-0">
                        {interest.percentage}%
                      </span>
                      {interest.id != null && (
                        <button
                          type="button"
                          onClick={() => handleDeleteInterest(interest.id)}
                          disabled={deletingInterestId === interest.id}
                          className="rounded-full p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition"
                          title="ลบตัวเลือกความสนใจ"
                        >
                          {deletingInterestId === interest.id ? (
                            <span className="text-[10px] font-semibold">กำลังลบ</span>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200/90">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${interestBarColors[index % interestBarColors.length]}`}
                      style={{ width: `${interest.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">ไม่พบตัวเลือกความสนใจที่ค้นหา</div>
            )}
          </div>

          <div className="shrink-0 pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>ผู้เลือก {summary.total_users_with_interests ?? 0} คน</span>
            <button
              type="button"
              onClick={() => setIsViewAllInterestsOpen(true)}
              className="flex items-center gap-0.5 font-extrabold text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              <span>ดูทั้งหมด ({userInterests.length})</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <MarketMapPreviewSection navigate={navigate} />

      {/* ── Add Category Modal Portal ── */}
      {isAddCategoryOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <FolderPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">เพิ่มหมวดหมู่สินค้าใหม่</h3>
                    <p className="text-xs text-slate-400">สำหรับจำแนกประเภทสินค้าของผู้ค้าในตลาด</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อหมวดหมู่สินค้า <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น กิฟต์ช็อป, งานแฮนด์เมด, ผักผลไม้สด"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    คำอธิบายหมวดหมู่ (ระบุหรือไม่ก็ได้)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="อธิบายสินค้าในหมวดหมู่นี้สั้นๆ..."
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCategory || !categoryName.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSubmittingCategory ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4" />
                        <span>บันทึกหมวดหมู่</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── Add User Interest Modal Portal ── */}
      {isAddInterestOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <Heart className="h-5 w-5 fill-rose-600/20" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">เพิ่มตัวเลือกความสนใจของผู้ใช้</h3>
                    <p className="text-xs text-slate-400">สำหรับตัวเลือกการสมัครสมาชิกบนแอปมือถือ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddInterestOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddInterest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อหมวดหมู่ความสนใจ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น แฟชั่น & ความงาม, อุปกรณ์อิเล็กทรอนิกส์, สินค้ามือสอง"
                    value={interestName}
                    onChange={(e) => setInterestName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddInterestOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInterest || !interestName.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    {isSubmittingInterest ? (
                      <span>กำลังบันทึก...</span>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        <span>บันทึกความสนใจ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ── View All Categories Modal Portal ── */}
      {isViewAllCategoriesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col justify-between space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">รายการหมวดหมู่สินค้าทั้งหมด ({categories.length})</h3>
                    <p className="text-xs text-slate-400">หมวดหมู่ร้านค้าทั้งหมดในระบบตลาดนัด</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewAllCategoriesOpen(false);
                      setIsAddCategoryOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>เพิ่มหมวดหมู่ใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewAllCategoriesOpen(false)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อหมวดหมู่สินค้า..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category, index) => (
                      <div key={`all-cat-${category.name}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-slate-800">{category.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-blue-700 shadow-2xs border border-slate-200/60">
                              {category.percentage}%
                            </span>
                            {category.id != null && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={deletingCategoryId === category.id}
                                className="rounded-full p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition"
                                title="ลบหมวดหมู่"
                              >
                                {deletingCategoryId === category.id ? (
                                  <span className="text-[10px] font-semibold">กำลังลบ</span>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{category.count} ร้านค้าในหมวดหมู่นี้</p>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${categoryBarColors[index % categoryBarColors.length]}`}
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center text-xs text-slate-400">ไม่พบหมวดหมู่สินค้าที่ค้นหา</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs font-medium text-slate-400">
                <span>แสดง {filteredCategories.length} จากทั้งหมด {categories.length} หมวดหมู่</span>
                <button
                  type="button"
                  onClick={() => setIsViewAllCategoriesOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── View All Interests Modal Portal ── */}
      {isViewAllInterestsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col justify-between space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <Heart className="h-6 w-6 fill-rose-600/20" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">ตัวเลือกความสนใจทั้งหมด ({userInterests.length})</h3>
                    <p className="text-xs text-slate-400">ความสนใจทั้งหมดที่ผู้ใช้สามารถเลือกได้เมื่อลงทะเบียน</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewAllInterestsOpen(false);
                      setIsAddInterestOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
                  >
                    <Heart className="h-4 w-4" />
                    <span>เพิ่มตัวเลือกใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewAllInterestsOpen(false)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตัวเลือกความสนใจ..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredInterests.length > 0 ? (
                    filteredInterests.map((interest, index) => (
                      <div key={`all-int-${interest.name}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-xs">🔥</span>}
                            <span className="font-bold text-sm text-slate-800">{interest.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-rose-600 shadow-2xs border border-slate-200/60">
                              {interest.percentage}%
                            </span>
                            {interest.id != null && (
                              <button
                                type="button"
                                onClick={() => handleDeleteInterest(interest.id)}
                                disabled={deletingInterestId === interest.id}
                                className="rounded-full p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition"
                                title="ลบตัวเลือกความสนใจ"
                              >
                                {deletingInterestId === interest.id ? (
                                  <span className="text-[10px] font-semibold">กำลังลบ</span>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{interest.count} คนเลือกสนใจ</p>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${interestBarColors[index % interestBarColors.length]}`}
                            style={{ width: `${interest.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center text-xs text-slate-400">ไม่พบตัวเลือกความสนใจที่ค้นหา</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs font-medium text-slate-400">
                <span>แสดง {filteredInterests.length} จากทั้งหมด {userInterests.length} ตัวเลือก</span>
                <button
                  type="button"
                  onClick={() => setIsViewAllInterestsOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
