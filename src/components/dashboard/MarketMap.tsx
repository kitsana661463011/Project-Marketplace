import React, { useState } from 'react';
import type { LocationZone } from '../../types';

interface MarketMapProps {
  zones: LocationZone[];
  onZoneClick?: (zone: LocationZone) => void;
}

const getZoneStatusColor = (
  status: string
): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} => {
  const statusMap: Record<
    string,
    { bg: string; border: string; text: string; badge: string }
  > = {
    available: {
      bg: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
      badge: 'bg-green-600',
    },
    occupied: {
      bg: 'bg-red-50 hover:bg-red-100',
      border: 'border-red-300',
      text: 'text-red-700',
      badge: 'bg-red-600',
    },
    pending: {
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      badge: 'bg-yellow-600',
    },
  };
  return statusMap[status] || statusMap.available;
};

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    available: 'ว่าง',
    occupied: 'ครอบครัว',
    pending: 'รอการอนุมัติ',
  };
  return labelMap[status] || status;
};

export const MarketMap: React.FC<MarketMapProps> = ({ zones, onZoneClick }) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Sort zones by code for grid display
  const sortedZones = [...zones].sort((a, b) => a.code.localeCompare(b.code));

  // Count statistics
  const stats = {
    total: zones.length,
    available: zones.filter((z) => z.status === 'available').length,
    occupied: zones.filter((z) => z.status === 'occupied').length,
    pending: zones.filter((z) => z.status === 'pending').length,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">แผนที่ตลาด</h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span className="text-sm text-gray-700">ว่าง ({stats.available})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded" />
          <span className="text-sm text-gray-700">ครอบครัว ({stats.occupied})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 rounded" />
          <span className="text-sm text-gray-700">รอการอนุมัติ ({stats.pending})</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-semibold text-gray-700">รวม: {stats.total}</span>
        </div>
      </div>

      {/* Market Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 min-w-max p-2">
          {sortedZones.map((zone) => {
            const colors = getZoneStatusColor(zone.status);
            const isHovered = hoveredZone === zone.id;

            return (
              <button
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${colors.bg} ${colors.border}`}
                aria-label={`Zone ${zone.code} - ${getStatusLabel(zone.status)}`}
              >
                {/* Zone Code */}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{zone.code}</h3>
                  <p className={`text-xs font-semibold mt-1 ${colors.text}`}>
                    {getStatusLabel(zone.status)}
                  </p>
                </div>

                {/* Status Badge */}
                <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${colors.badge}`} />

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    <p className="font-semibold">{zone.code}</p>
                    {zone.size && <p>{zone.size}</p>}
                    <p>{getStatusLabel(zone.status)}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zones Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-xs text-gray-500 mt-1">ว่าง</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
            <div className="text-xs text-gray-500 mt-1">ครอบครัว</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500 mt-1">รอการอนุมัติ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">รวม</div>
          </div>
        </div>
      </div>

      {/* Zone Details (if selected) */}
      {hoveredZone && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {sortedZones
            .filter((z) => z.id === hoveredZone)
            .map((zone) => (
              <div key={zone.id}>
                <h3 className="font-semibold text-gray-900 mb-2">รายละเอียด Zone {zone.code}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  {zone.floor && (
                    <>
                      <span className="font-medium">ชั้น:</span>
                      <span>{zone.floor}</span>
                    </>
                  )}
                  {zone.section && (
                    <>
                      <span className="font-medium">ส่วน:</span>
                      <span>{zone.section}</span>
                    </>
                  )}
                  {zone.size && (
                    <>
                      <span className="font-medium">ขนาด:</span>
                      <span>{zone.size}</span>
                    </>
                  )}
                  <span className="font-medium">สถานะ:</span>
                  <span className={getZoneStatusColor(zone.status).text}>
                    {getStatusLabel(zone.status)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
