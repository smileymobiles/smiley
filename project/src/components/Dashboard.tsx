import React, { useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DashboardMetrics } from '../types';

export function Dashboard() {
  const { state } = useApp();

  const metrics = useMemo((): DashboardMetrics => {
    if (!state.selectedBranch) {
      return {
        todayServiceCount: 0,
        tomorrowPendingServices: 0,
        inProcessCount: 0,
        readyForDeliveryCount: 0,
        overSixMonthCount: 0,
        branchWisePerformance: {},
      };
    }

    const branchServices = state.serviceEntries.filter(
      entry => entry.branchId === state.selectedBranch!.id
    );

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return {
      todayServiceCount: branchServices.filter(entry => 
        entry.entryDate.toDateString() === today.toDateString()
      ).length,
      tomorrowPendingServices: branchServices.filter(entry =>
        entry.expectedDeliveryDate.toDateString() === tomorrow.toDateString() && 
        entry.status !== 'delivered'
      ).length,
      inProcessCount: branchServices.filter(entry => entry.status === 'in-process').length,
      readyForDeliveryCount: branchServices.filter(entry => entry.status === 'ready').length,
      overSixMonthCount: branchServices.filter(entry => 
        entry.entryDate < sixMonthsAgo && entry.status !== 'delivered'
      ).length,
      branchWisePerformance: state.branches.reduce((acc, branch) => {
        acc[branch.id] = state.serviceEntries.filter(entry => entry.branchId === branch.id).length;
        return acc;
      }, {} as { [key: string]: number }),
    };
  }, [state.serviceEntries, state.selectedBranch, state.branches]);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    bgColor 
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (!state.selectedBranch) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Branch</h3>
          <p className="text-gray-600">Please select a branch from the dropdown above to view the dashboard metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <MetricCard
          title="Today's Services"
          value={metrics.todayServiceCount}
          icon={Calendar}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Tomorrow's Pending"
          value={metrics.tomorrowPendingServices}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <MetricCard
          title="In Process"
          value={metrics.inProcessCount}
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <MetricCard
          title="Ready for Delivery"
          value={metrics.readyForDeliveryCount}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <MetricCard
          title="6+ Month Delays"
          value={metrics.overSixMonthCount}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Recent Services */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Services</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.serviceEntries
                .filter(entry => entry.branchId === state.selectedBranch!.id)
                .slice(0, 10)
                .map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.billNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.deviceName}</div>
                      <div className="text-sm text-gray-500">{entry.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        entry.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'in-process' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.expectedDeliveryDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.technicianAssignment}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.serviceEntries.filter(entry => entry.branchId === state.selectedBranch!.id).length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No service entries found for this branch.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}