import { mockAnnouncements, mockDashboardMetrics, mockMarketZones, mockOrders, mockPaymentTransactions, mockSellers } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function requestJson<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = (await response.json()) as T;
    return data;
  } catch {
    return fallback;
  }
}

export const adminApi = {
  getDashboardSummary: () => requestJson('/dashboard', mockDashboardMetrics),
  getStores: () => requestJson('/stores', []),
  getSellers: () => requestJson('/sellers', mockSellers),
  getPayments: () => requestJson('/payments', mockPaymentTransactions),
  getOrders: () => requestJson('/orders', mockOrders),
  getMarketZones: () => requestJson('/market-map', mockMarketZones),
  getAnnouncements: () => requestJson('/announcements', mockAnnouncements),
};
