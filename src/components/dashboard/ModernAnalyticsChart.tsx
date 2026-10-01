import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export interface ChartDataItem {
  id?: string | number;
  label: string;
  value: number;
  percentage: number;
  color?: string;
  subItems?: string[];
}

export const MODERN_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#e11d48', // rose
  '#64748b', // slate (for 'others')
];

export const BAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-slate-400 to-slate-500',
];

interface HighVolumeChartProps {
  data: ChartDataItem[];
  totalCount: number;
  unit: string;
  centerLabel: string;
  viewMode?: 'donut' | 'bar';
  onToggleViewMode?: (mode: 'donut' | 'bar') => void;
  maxDisplay?: number;
}

/**
 * ModernAnalyticsChart
 * รองรับข้อมูลจำนวนมาก (High-cardinality data เช่น 15-50 รายการ)
 * โดยใช้เทคนิค Smart Grouping: แสดง Top N + "อื่นๆ" อัตโนมัติ
 * และมีระบบ Hover Tooltip แบบ Rich Popover สำหรับดูข้อมูลยิบย่อย
 */
export const ModernAnalyticsChart: React.FC<HighVolumeChartProps> = ({
  data,
  totalCount,
  unit,
  centerLabel,
  viewMode = 'donut',
  maxDisplay = 5,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // เตรียมข้อมูลด้วย Smart Grouping
  const processedData: ChartDataItem[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // เรียงตามค่าจากมากไปน้อย
    const sorted = [...data].sort((a, b) => b.value - a.value);

    if (sorted.length <= maxDisplay) {
      return sorted.map((item, idx) => ({
        ...item,
        color: item.color || MODERN_PALETTE[idx % MODERN_PALETTE.length],
      }));
    }

    // มีข้อมูลเยอะเกิน maxDisplay -> ทำ Top N + อื่นๆ (Others)
    const topItems = sorted.slice(0, maxDisplay).map((item, idx) => ({
      ...item,
      color: item.color || MODERN_PALETTE[idx % MODERN_PALETTE.length],
    }));

    const otherItems = sorted.slice(maxDisplay);
    const otherValue = otherItems.reduce((sum, item) => sum + (item.value || 0), 0);
    const otherPct = Math.round(
      otherItems.reduce((sum, item) => sum + (item.percentage || 0), 0)
    );
    const subItemNames = otherItems.map((item) => item.label);

    topItems.push({
      id: 'others_group',
      label: `อื่นๆ (${otherItems.length} รายการ)`,
      value: otherValue,
      percentage: otherPct,
      color: '#94a3b8', // slate-400
      subItems: subItemNames,
    });

    return topItems;
  }, [data, maxDisplay]);

  const activeItem = hoveredIdx !== null ? processedData[hoveredIdx] : null;

  // คำนวณ Donut Slices
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.7
  const validData = processedData.filter((d) => d.percentage > 0);
  let accumulatedPercent = 0;

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  if (processedData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
        ไม่มีข้อมูล
      </div>
    );
  }

  return (
    <div
      className="relative flex-1 flex flex-col justify-center select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoveredIdx(null);
        setTooltipPos(null);
      }}
    >
      {viewMode === 'donut' ? (
        /* ──── Donut Chart View ──── */
        <div className="flex items-center justify-between gap-3">
          {/* Donut Chart SVG */}
          <div className="relative flex items-center justify-center shrink-0 w-[130px] h-[130px]">
            <svg
              width={130}
              height={130}
              viewBox="0 0 140 140"
              className="-rotate-90 transform drop-shadow-xs"
            >
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="18"
              />
              {validData.map((item, index) => {
                const strokeDash = (item.percentage / 100) * circumference;
                const strokeOffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += item.percentage;
                const isHovered = hoveredIdx === index;
                const isDimmed = hoveredIdx !== null && !isHovered;

                return (
                  <circle
                    key={`${item.label}-${index}`}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? 23 : 18}
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: isDimmed ? 0.35 : 1,
                      filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none',
                    }}
                    onMouseEnter={() => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Dynamic Center Hub */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1.5 transition-all duration-200">
              {activeItem ? (
                <>
                  <span className="text-[10px] font-black text-slate-800 truncate max-w-[80px]">
                    {activeItem.label}
                  </span>
                  <span className="text-base font-black text-blue-600 leading-tight">
                    {activeItem.percentage}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {activeItem.value} {unit}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                    {totalCount}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                    {centerLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Compact Side Legend */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {processedData.slice(0, 5).map((item, idx) => {
              const isHovered = hoveredIdx === idx;
              const isDimmed = hoveredIdx !== null && !isHovered;
              return (
                <div
                  key={`${item.label}-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`group flex items-center justify-between text-xs px-2 py-1 rounded-xl cursor-pointer transition-all duration-200 ${
                    isHovered
                      ? 'bg-blue-50/80 shadow-2xs scale-[1.02]'
                      : isDimmed
                      ? 'opacity-40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span
                      className="h-2 w-2 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span
                      className={`truncate font-bold text-[11px] ${
                        isHovered ? 'text-blue-700 font-extrabold' : 'text-slate-700'
                      }`}
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ({item.value})
                    </span>
                    <span
                      className={`text-[11px] font-black rounded-md px-1.5 py-0.2 ${
                        isHovered
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ──── Horizontal Ranking Bar Chart View ──── */
        <div className="space-y-2 py-0.5">
          {processedData.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const isDimmed = hoveredIdx !== null && !isHovered;
            const isTopRank = idx < 3;
            const rankBadges = ['🥇', '🥈', '🥉'];
            const barGradient = BAR_GRADIENTS[idx % BAR_GRADIENTS.length];

            return (
              <div
                key={`bar-${item.label}-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`group cursor-pointer rounded-xl px-2 py-1 transition-all duration-200 ${
                  isHovered
                    ? 'bg-blue-50/80 shadow-2xs scale-[1.01]'
                    : isDimmed
                    ? 'opacity-40'
                    : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="text-[10px] shrink-0 font-bold">
                      {isTopRank ? rankBadges[idx] : <span className="text-slate-400 font-semibold">{idx + 1}.</span>}
                    </span>
                    <span
                      className={`font-bold truncate ${
                        isHovered ? 'text-blue-700 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {item.value} {unit}
                    </span>
                    <span
                      className={`font-black text-[10px] px-1.5 py-0.2 rounded-md ${
                        isHovered
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                    style={{ width: `${Math.max(item.percentage, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──── Rich Hover Tooltip (ลอยตามเมาส์ ผ่าน Portal กันจม 100%) ──── */}
      {activeItem && tooltipPos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[999999] w-max max-w-[280px] rounded-2xl border border-slate-700/90 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x, 150), typeof window !== 'undefined' ? window.innerWidth - 150 : 200)}px`,
              top: `${tooltipPos.y < 180 ? tooltipPos.y + 18 : tooltipPos.y - 12}px`,
              transform: tooltipPos.y < 180 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-2 border-b border-slate-700/70 pb-2 mb-2.5">
              <span
                className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/30"
                style={{ backgroundColor: activeItem.color }}
              />
              <span className="font-extrabold text-sm text-white truncate max-w-[230px]">
                {activeItem.label}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4 text-slate-200">
                <span className="text-[11px] font-semibold text-slate-300">จำนวน:</span>
                <span className="font-black text-white text-xs">
                  {activeItem.value} {unit}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-200">
                <span className="text-[11px] font-semibold text-slate-300">สัดส่วน:</span>
                <span className="font-black text-amber-400 text-xs">{activeItem.percentage}%</span>
              </div>
            </div>

            {activeItem.subItems && activeItem.subItems.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-700/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-sky-400 font-extrabold text-xs">
                  <span>📋</span>
                  <span>{centerLabel === 'ความสนใจ' ? 'ตัวเลือกในกลุ่มนี้:' : 'หมวดหมู่ในกลุ่มนี้:'}</span>
                </div>
                <div className="rounded-xl bg-slate-800/90 border border-slate-700/70 p-2.5 shadow-inner">
                  <p className="text-xs leading-relaxed text-slate-100 font-medium">
                    {activeItem.subItems.slice(0, 5).join(', ')}
                    {activeItem.subItems.length > 5 ? (
                      <span className="text-sky-300 font-bold"> และอีก {activeItem.subItems.length - 5} รายการ</span>
                    ) : ''}
                  </p>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

/**
 * ZoneOccupancyChart
 * สำหรับการ์ด "ความหนาแน่นโซนตลาด"
 * รองรับการดูแบบ ภาพรวม (Overall Donut) หรือ เปรียบเทียบรายโซน (Zone Bars)
 */
export const ZoneOccupancyChart: React.FC<{
  zones: Array<{
    zone_id: string | number;
    zone_name: string;
    occupied_count: number;
    available_count: number;
    total_stalls: number;
  }>;
  totalStalls: number;
  occupiedStalls: number;
  availableStalls: number;
  viewMode: 'donut' | 'bar';
  navigate: (path: string) => void;
}> = ({
  zones,
  totalStalls,
  occupiedStalls,
  availableStalls,
  viewMode,
  navigate,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredZoneInfo, setHoveredZoneInfo] = useState<{
    name: string;
    occupied: number;
    available: number;
    total: number;
    pct: number;
  } | null>(null);
  const [zoneMousePos, setZoneMousePos] = useState<{ x: number; y: number } | null>(null);

  const occPct = totalStalls > 0 ? Math.round((occupiedStalls / totalStalls) * 100) : 0;
  const availPct = 100 - occPct;

  const donutData = [
    { label: 'มีผู้เช่าแล้ว', value: occupiedStalls, percentage: occPct, color: '#f43f5e' },
    { label: 'แผงว่างพร้อมจอง', value: availableStalls, percentage: availPct, color: '#10b981' },
  ];

  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.7
  let accumulatedPercent = 0;

  return (
    <div className="relative flex-1 flex flex-col justify-center select-none">
      {viewMode === 'donut' ? (
        /* ภาพรวม Donut View */
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex items-center justify-center shrink-0 w-[130px] h-[130px]">
            <svg
              width={130}
              height={130}
              viewBox="0 0 140 140"
              className="-rotate-90 transform drop-shadow-xs"
            >
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="18"
              />
              {donutData.map((item, index) => {
                const strokeDash = (item.percentage / 100) * circumference;
                const strokeOffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += item.percentage;
                const isHovered = hoveredIdx === index;

                return (
                  <circle
                    key={item.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? 23 : 18}
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Center Hub */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
              {hoveredIdx !== null ? (
                <>
                  <span className="text-[10px] font-black text-slate-800">
                    {donutData[hoveredIdx].label}
                  </span>
                  <span className="text-base font-black text-blue-600 leading-tight">
                    {donutData[hoveredIdx].percentage}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {donutData[hoveredIdx].value} แผง
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base font-black text-slate-900 leading-none">
                    {totalStalls}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                    แผงทั้งหมด
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Status Summary & Top Zones */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 space-y-1.5">
              <div
                className="flex items-center justify-between text-xs cursor-pointer hover:opacity-80"
                onMouseEnter={() => setHoveredIdx(0)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-bold text-slate-700 text-[11px]">มีผู้เช่าแล้ว</span>
                </div>
                <span className="font-black text-rose-600 text-xs">{occupiedStalls} แผง</span>
              </div>
              <div
                className="flex items-center justify-between text-xs cursor-pointer hover:opacity-80"
                onMouseEnter={() => setHoveredIdx(1)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700 text-[11px]">แผงว่างพร้อมจอง</span>
                </div>
                <span className="font-black text-emerald-600 text-xs">{availableStalls} แผง</span>
              </div>
            </div>

            {/* Zone pills with hover */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                อัตราการครองแผงรายโซน
              </span>
              <div className="flex flex-wrap gap-1.5">
                {zones.slice(0, 4).map((zone) => {
                  const zTotal = zone.total_stalls || 1;
                  const zOccPct = Math.round((zone.occupied_count / zTotal) * 100);
                  return (
                    <div
                      key={zone.zone_id}
                      onClick={() => navigate('/stores')}
                      onMouseEnter={(e) => {
                        setHoveredZoneInfo({
                          name: zone.zone_name,
                          occupied: zone.occupied_count,
                          available: zone.available_count,
                          total: zTotal,
                          pct: zOccPct,
                        });
                        setZoneMousePos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => setZoneMousePos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => {
                        setHoveredZoneInfo(null);
                        setZoneMousePos(null);
                      }}
                      className="group cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs hover:border-blue-400 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <span className="truncate max-w-[70px]">{zone.zone_name}</span>
                      <span className="font-black text-blue-600">{zOccPct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* เปรียบเทียบรายโซน Stacked Bars */
        <div className="space-y-2 py-0.5">
          {zones.map((zone) => {
            const zTotal = zone.total_stalls || 1;
            const zOccPct = Math.round((zone.occupied_count / zTotal) * 100);
            const zAvailPct = 100 - zOccPct;

            return (
              <div
                key={zone.zone_id}
                onClick={() => navigate('/stores')}
                onMouseEnter={(e) => {
                  setHoveredZoneInfo({
                    name: zone.zone_name,
                    occupied: zone.occupied_count,
                    available: zone.available_count,
                    total: zTotal,
                    pct: zOccPct,
                  });
                  setZoneMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setZoneMousePos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => {
                  setHoveredZoneInfo(null);
                  setZoneMousePos(null);
                }}
                className="group cursor-pointer rounded-xl border border-slate-100 bg-slate-50/70 p-2 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-200"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-extrabold text-slate-800 group-hover:text-blue-600 transition truncate">
                    {zone.zone_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className="text-rose-600 font-bold">เช่า {zone.occupied_count}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-emerald-600 font-bold">ว่าง {zone.available_count}</span>
                    <span className="bg-slate-200/80 text-slate-700 px-1 rounded font-black text-[9px]">
                      {zOccPct}%
                    </span>
                  </div>
                </div>

                {/* Stacked bar: Rose (เช่า) + Emerald (ว่าง) */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 flex">
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${zOccPct}%` }}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${zAvailPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──── Zone Hover Portal Tooltip ──── */}
      {hoveredZoneInfo && zoneMousePos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[999999] w-max max-w-[240px] rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${Math.min(Math.max(zoneMousePos.x, 130), typeof window !== 'undefined' ? window.innerWidth - 130 : 200)}px`,
              top: `${zoneMousePos.y < 180 ? zoneMousePos.y + 18 : zoneMousePos.y - 12}px`,
              transform: zoneMousePos.y < 180 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-2 border-b border-slate-700/70 pb-1.5 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0 ring-2 ring-white/30" />
              <span className="font-extrabold text-xs text-white truncate max-w-[190px]">
                {hoveredZoneInfo.name}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4 text-slate-200">
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  มีผู้เช่าแล้ว:
                </span>
                <span className="font-black text-rose-300">{hoveredZoneInfo.occupied} แผง</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-200">
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  แผงว่างพร้อมจอง:
                </span>
                <span className="font-black text-emerald-300">{hoveredZoneInfo.available} แผง</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-200 pt-1.5 border-t border-slate-700/70">
                <span className="text-[11px] font-medium text-slate-300">อัตราครองแผง:</span>
                <span className="font-black text-amber-400">{hoveredZoneInfo.pct}% (จาก {hoveredZoneInfo.total} แผง)</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
