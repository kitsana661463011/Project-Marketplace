import React, { useState } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { mockOrders } from '../data/mockData';
import type { Order } from '../types';
import { formatImageUrl } from '../utils/imageUtils';

const OrdersPage: React.FC = () => {
  const [orders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'เสร็จสิ้น',
      confirmed: 'ยืนยันแล้ว',
      pending: 'รอการยืนยัน',
      cancelled: 'ยกเลิก',
    };
    return labels[status] || status;
  };

  const filteredOrders = orders.filter(
    order =>
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">รายการสั่งซื้อ</h1>
        <p className="text-gray-600">ดูและจัดการรายการสั่งซื้อทั้งหมด</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหารหัสสั่งซื้อหรือชื่อผู้ขาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Filter size={20} />
          <span>ตัวเลือก</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Download size={20} />
          <span>ส่งออก</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">รหัสสั่งซื้อ</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ผู้ขาย</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">โซน</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">วันที่</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">จำนวนเงิน</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">สถานะ</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">

                      <img
                        src={formatImageUrl(order.seller.avatar)}
                        alt={order.seller.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-900">{order.seller.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 bg-blue-100 text-blue-800 px-3 py-1 rounded">
                      {order.zone}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">฿{order.amount.toLocaleString('th-TH')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      ดู
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          แสดง <span className="font-bold">{filteredOrders.length}</span> จาก <span className="font-bold">{orders.length}</span> รายการ
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            ←
          </button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
