'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface InventoryItem {
  id: string;
  item_name: string;
  brand_name: string;
  category: string;
  current_stock: number;
  initial_stock: number;
  avg_daily_consumption: number;
  predicted_stockout_date: string;
  low_stock_alert: number;
  price_per_unit: number;
}

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  inventory_item_id: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [newItem, setNewItem] = useState({
    name: '',
    brand: '',
    category: 'spirit',
    initialStock: 50,
    costPerUnit: 0,
    pricePerUnit: 0
  });

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    
    // Mock data
    const mockItems: InventoryItem[] = [
      { id: '1', item_name: 'Grey Goose Vodka', brand_name: 'Grey Goose', category: 'spirit', current_stock: 8, initial_stock: 24, avg_daily_consumption: 3, predicted_stockout_date: '2026-02-28T23:00:00', low_stock_alert: 5, price_per_unit: 350000 },
      { id: '2', item_name: 'Jack Daniel\'s', brand_name: 'Jack Daniel\'s', category: 'spirit', current_stock: 12, initial_stock: 30, avg_daily_consumption: 4, predicted_stockout_date: '2026-03-02T20:00:00', low_stock_alert: 8, price_per_unit: 280000 },
      { id: '3', item_name: 'Heineken Draught', brand_name: 'Heineken', category: 'beer', current_stock: 45, initial_stock: 100, avg_daily_consumption: 15, predicted_stockout_date: '2026-02-28T18:00:00', low_stock_alert: 20, price_per_unit: 85000 },
      { id: '4', item_name: 'Mojito Cocktail', brand_name: 'House', category: 'cocktail', current_stock: 25, initial_stock: 60, avg_daily_consumption: 8, predicted_stockout_date: '2026-03-01T22:00:00', low_stock_alert: 15, price_per_unit: 120000 },
      { id: '5', item_name: 'Chandon Sparkling', brand_name: 'Chandon', category: 'wine', current_stock: 18, initial_stock: 24, avg_daily_consumption: 2, predicted_stockout_date: '2026-03-10T21:00:00', low_stock_alert: 6, price_per_unit: 450000 }
    ];
    
    const mockAlerts: Alert[] = [
      { id: '1', alert_type: 'critical_stock', message: 'Grey Goose Vodka is critically low!', severity: 'critical', inventory_item_id: '1' },
      { id: '2', alert_type: 'predicted_stockout', message: 'Heineken Draught predicted to run out by 6 PM today', severity: 'high', inventory_item_id: '3' },
      { id: '3', alert_type: 'low_stock', message: 'Jack Daniel\'s below reorder threshold', severity: 'medium', inventory_item_id: '2' }
    ];
    
    setItems(mockItems);
    setAlerts(mockAlerts);
    setLoading(false);
  }

  function getStockPercentage(item: InventoryItem) {
    return (item.current_stock / item.initial_stock) * 100;
  }

  function getStockColor(item: InventoryItem) {
    const pct = getStockPercentage(item);
    if (pct < 20) return 'bg-red-500';
    if (pct < 40) return 'bg-orange-500';
    if (pct < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function getSeverityBadge(severity: string) {
    const badges: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-300',
      high: 'bg-orange-500/20 text-orange-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-blue-500/20 text-blue-300'
    };
    return badges[severity] || badges.low;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📦 Smart Inventory</h1>
            <p className="text-purple-300">AI-Powered Stock Prediction & Management</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            + Add Item
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">🚨 Active Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border ${getSeverityBadge(alert.severity)}`}>
                  <div className="font-medium mb-1 capitalize">{alert.alert_type.replace('_', ' ')}</div>
                  <div className="text-sm">{alert.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-purple-400 text-sm">Total Items</div>
            <div className="text-2xl font-bold">{items.length}</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-green-400 text-sm">Healthy Stock</div>
            <div className="text-2xl font-bold">{items.filter(i => getStockPercentage(i) > 40).length}</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-orange-400 text-sm">Low Stock</div>
            <div className="text-2xl font-bold">{items.filter(i => getStockPercentage(i) <= 40 && getStockPercentage(i) > 20).length}</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700">
            <div className="text-red-400 text-sm">Critical</div>
            <div className="text-2xl font-bold">{items.filter(i => getStockPercentage(i) <= 20).length}</div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-400">Item</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400">Category</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Stock</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Usage/Day</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Predicted Out</th>
                <th className="px-4 py-3 text-right text-sm text-gray-400">Price</th>
                <th className="px-4 py-3 text-center text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-xs text-gray-400">{item.brand_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-gray-400">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStockColor(item)} rounded-full`}
                          style={{ width: `${getStockPercentage(item)}%` }}
                        />
                      </div>
                      <span className="text-sm">{item.current_stock}/{item.initial_stock}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    ~{item.avg_daily_consumption}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.predicted_stockout_date ? (
                      <span className={`text-sm ${
                        new Date(item.predicted_stockout_date) < new Date(Date.now() + 86400000)
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                        {new Date(item.predicted_stockout_date).toLocaleString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    Rp {item.price_per_unit.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-purple-400 hover:text-purple-300 text-sm">
                      Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Smart Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold mb-4">🤖 AI Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-2xl">💡</span>
              <div>
                <div className="font-medium">Bundle Heineken with House Cocktails</div>
                <div className="text-sm text-gray-400">Your beer stock is running low. Offer cocktail promos to reduce beer demand and increase margin.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-2xl">📈</span>
              <div>
                <div className="font-medium">Premium Spirits Trending</div>
                <div className="text-sm text-gray-400">Grey Goose demand is up 40% this week. Consider restocking before weekend.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Brand</label>
                <input
                  type="text"
                  value={newItem.brand}
                  onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                >
                  <option value="spirit">Spirit</option>
                  <option value="beer">Beer</option>
                  <option value="wine">Wine</option>
                  <option value="cocktail">Cocktail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={newItem.initialStock}
                  onChange={(e) => setNewItem({ ...newItem, initialStock: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cost/Unit</label>
                  <input
                    type="number"
                    value={newItem.costPerUnit}
                    onChange={(e) => setNewItem({ ...newItem, costPerUnit: parseInt(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price/Unit</label>
                  <input
                    type="number"
                    value={newItem.pricePerUnit}
                    onChange={(e) => setNewItem({ ...newItem, pricePerUnit: parseInt(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
