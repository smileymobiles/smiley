import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users,
  Package,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Reports() {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const reportData = useMemo(() => {
    if (!state.selectedBranch) return null;

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);

    const branchServices = state.serviceEntries.filter(
      entry => entry.branchId === state.selectedBranch!.id &&
      entry.entryDate >= fromDate &&
      entry.entryDate <= toDate
    );

    const branchInventory = state.inventoryItems.filter(
      item => item.branchId === state.selectedBranch!.id
    );

    // Service metrics
    const totalServices = branchServices.length;
    const completedServices = branchServices.filter(s => s.status === 'delivered').length;
    const pendingServices = branchServices.filter(s => s.status !== 'delivered').length;
    const completionRate = totalServices > 0 ? (completedServices / totalServices * 100) : 0;

    // Status breakdown
    const statusBreakdown = branchServices.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Technician performance
    const technicianPerformance = branchServices.reduce((acc, service) => {
      const tech = service.technicianAssignment;
      if (!acc[tech]) {
        acc[tech] = { total: 0, completed: 0 };
      }
      acc[tech].total++;
      if (service.status === 'delivered') {
        acc[tech].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Daily service counts
    const dailyServices = branchServices.reduce((acc, service) => {
      const date = service.entryDate.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Inventory metrics
    const totalInventoryValue = branchInventory.reduce(
      (acc, item) => acc + (item.stockQuantity * item.purchasePrice), 0
    );
    const lowStockItems = branchInventory.filter(
      item => item.stockQuantity <= (item.lowStockThreshold || 10)
    ).length;

    return {
      totalServices,
      completedServices,
      pendingServices,
      completionRate,
      statusBreakdown,
      technicianPerformance,
      dailyServices,
      totalInventoryValue,
      lowStockItems,
      totalInventoryItems: branchInventory.length,
    };
  }, [state.serviceEntries, state.inventoryItems, state.selectedBranch, dateRange]);

  const exportReport = () => {
    if (!reportData || !state.selectedBranch) return;

    const reportContent = [
      `Service Center Report - ${state.selectedBranch.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Period: ${dateRange.from} to ${dateRange.to}`,
      '',
      'SERVICE METRICS',
      `Total Services: ${reportData.totalServices}`,
      `Completed Services: ${reportData.completedServices}`,
      `Pending Services: ${reportData.pendingServices}`,
      `Completion Rate: ${reportData.completionRate.toFixed(1)}%`,
      '',
      'STATUS BREAKDOWN',
      ...Object.entries(reportData.statusBreakdown).map(([status, count]) => 
        `${status.toUpperCase()}: ${count}`
      ),
      '',
      'TECHNICIAN PERFORMANCE',
      ...Object.entries(reportData.technicianPerformance).map(([tech, data]) => 
        `${tech}: ${data.completed}/${data.total} (${((data.completed / data.total) * 100).toFixed(1)}%)`
      ),
      '',
      'INVENTORY METRICS',
      `Total Inventory Items: ${reportData.totalInventoryItems}`,
      `Total Inventory Value: ₹${reportData.totalInventoryValue.toFixed(2)}`,
      `Low Stock Items: ${reportData.lowStockItems}`,
    ].join('\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${state.selectedBranch.code}_${dateRange.from}_to_${dateRange.to}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!state.selectedBranch) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Branch</h3>
          <p className="text-gray-600">Please select a branch to view reports and analytics.</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Services</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.totalServices}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{reportData.completionRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Inventory Value</p>
              <p className="text-3xl font-bold text-gray-900">₹{(reportData.totalInventoryValue / 1000).toFixed(0)}K</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Technicians</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(reportData.technicianPerformance).length}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-100">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(reportData.statusBreakdown).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                status === 'delivered' ? 'bg-green-100' :
                status === 'ready' ? 'bg-blue-100' :
                status === 'in-process' ? 'bg-purple-100' :
                status === 'pending' ? 'bg-yellow-100' :
                'bg-red-100'
              }`}>
                <span className={`text-2xl font-bold ${
                  status === 'delivered' ? 'text-green-600' :
                  status === 'ready' ? 'text-blue-600' :
                  status === 'in-process' ? 'text-purple-600' :
                  status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {count}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {status.replace('-', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Technician Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
        <div className="space-y-4">
          {Object.entries(reportData.technicianPerformance).map(([technician, data]) => {
            const completionRate = (data.completed / data.total) * 100;
            return (
              <div key={technician} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">{technician}</h4>
                  <p className="text-sm text-gray-600">
                    {data.completed} completed out of {data.total} total
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{completionRate.toFixed(1)}%</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Services Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Service Volume</h3>
        <div className="flex items-end space-x-2 h-48 overflow-x-auto">
          {Object.entries(reportData.dailyServices).map(([date, count]) => {
            const maxCount = Math.max(...Object.values(reportData.dailyServices));
            const height = (count / maxCount) * 100;
            return (
              <div key={date} className="flex flex-col items-center min-w-0">
                <div
                  className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                />
                <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs font-medium text-gray-900 mt-1">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}