import React, { useState } from 'react';
import { Plus, Trash2, Search, Sliders } from 'lucide-react';
import { mockMarketZones } from '../data/mockData';
import type { MarketZone } from '../types';

const MarketMapPage: React.FC = () => {
  const [zones] = useState<MarketZone[]>(mockMarketZones);
  const [selectedZone, setSelectedZone] = useState<MarketZone | null>(null);

  const getZoneColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600';
      case 'repair':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'ว่าง';
      case 'occupied':
        return 'จองแล้ว';
      case 'repair':
        return 'ซ่อมแซม';
      default:
        return status;
    }
  };

  // Group zones by row
  const zonesByRow = zones.reduce((acc, zone) => {
    if (!acc[zone.row]) acc[zone.row] = [];
    acc[zone.row].push(zone);
    return acc;
  }, {} as Record<number, MarketZone[]>);

  const stats = {
    available: zones.filter(z => z.status === 'available').length,
    occupied: zones.filter(z => z.status === 'occupied').length,
    repair: zones.filter(z => z.status === 'repair').length,
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ผังตลาดและโซน</h1>
        <p className="text-gray-600">จัดการพื้นที่ร้านค้าและสถานะโซน</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus size={18} />
          <span>เพิ่มโซน</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
          <Trash2 size={18} />
          <span>ลบ</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
          <Search size={18} />
          <span>ค้นหา</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
          <Sliders size={18} />
          <span>ตัวเลือก</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">ว่าง (Available)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">จองแล้ว (Occupied)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">ซ่อมแซม (Repair)</span>
        </div>
      </div>

      {/* Market Grid */}
      <div className="bg-white rounded-lg p-6 mb-6 overflow-x-auto">
        <div className="space-y-4">
          {[1, 2, 3].map(row => (
            <div key={row} className="flex gap-3 flex-wrap">
              {zonesByRow[row]?.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`
                    w-16 h-16 rounded-lg font-bold text-white text-sm
                    transition-all hover:scale-105 hover:shadow-lg cursor-pointer
                    ${getZoneColor(zone.status)}
                  `}
                >
                  {zone.code}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">ทั้งหมด</div>
          <div className="text-3xl font-bold text-gray-900">{zones.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200 bg-green-50">
          <div className="text-sm font-medium text-green-700 mb-2">ว่าง</div>
          <div className="text-3xl font-bold text-green-600">{stats.available}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-700 mb-2">จองแล้ว</div>
          <div className="text-3xl font-bold text-red-600">{stats.occupied}</div>
        </div>
      </div>

      {/* Zone Detail Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">โซน {selectedZone.code}</h3>
                <p className="text-sm text-gray-600">สถานะ: {getStatusLabel(selectedZone.status)}</p>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {selectedZone.seller && (
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">ชื่อร้านค้า</p>
                  <p className="font-medium text-gray-900">{selectedZone.seller.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">เบอร์โทร</p>
                  <p className="font-medium text-gray-900">{selectedZone.seller.phone}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                แก้ไข
              </button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketMapPage;
