import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Clock, 
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ServiceEntry, ServiceStatus, StatusHistoryEntry } from '../types';

export function ServiceManagement() {
  const { state, dispatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');

  const [formData, setFormData] = useState({
    billNumber: '',
    deviceName: '',
    model: '',
    imei: '',
    problemDescription: '',
    technicianAssignment: '',
    expectedDeliveryDate: '',
    delayReason: '',
  });

  const branchServices = useMemo(() => {
    if (!state.selectedBranch) return [];
    
    return state.serviceEntries
      .filter(entry => entry.branchId === state.selectedBranch!.id)
      .filter(entry => {
        const matchesSearch = 
          entry.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (entry.technicianAssignment && entry.technicianAssignment.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [state.serviceEntries, state.selectedBranch, searchTerm, statusFilter]);

  const generateBillNumber = () => {
    if (!state.selectedBranch) return '';
    
    const billSetting = state.billSettings.find(s => s.branchId === state.selectedBranch!.id);
    if (!billSetting) return '';

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const number = billSetting.currentNumber.toString().padStart(4, '0');
    
    return billSetting.format
      .replace('{PREFIX}', billSetting.prefix)
      .replace('{YY}', year)
      .replace('{MM}', month)
      .replace('{####}', number);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedBranch) return;

    const billNumber = formData.billNumber || generateBillNumber();
    
    const serviceData: ServiceEntry = {
      id: editingService?.id || Date.now().toString(),
      billNumber,
      branchId: state.selectedBranch.id,
      deviceName: formData.deviceName,
      model: formData.model,
      imei: formData.imei,
      problemDescription: formData.problemDescription,
      technicianAssignment: formData.technicianAssignment,
      expectedDeliveryDate: new Date(formData.expectedDeliveryDate),
      entryDate: editingService?.entryDate || new Date(),
      status: editingService?.status || 'pending',
      statusHistory: editingService?.statusHistory || [{
        status: 'pending',
        timestamp: new Date(),
        user: state.currentUser.name,
        notes: 'Service entry created',
      }],
      delayReason: formData.delayReason,
    };

    if (editingService) {
      dispatch({ type: 'UPDATE_SERVICE_ENTRY', payload: serviceData });
    } else {
      dispatch({ type: 'ADD_SERVICE_ENTRY', payload: serviceData });
      // Increment bill number for next service
      if (!formData.billNumber) {
        dispatch({ type: 'INCREMENT_BILL_NUMBER', payload: state.selectedBranch.id });
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      billNumber: '',
      deviceName: '',
      model: '',
      imei: '',
      problemDescription: '',
      technicianAssignment: '',
      expectedDeliveryDate: '',
      delayReason: '',
    });
    setEditingService(null);
    setIsModalOpen(false);
  };

  const handleEdit = (service: ServiceEntry) => {
    setFormData({
      billNumber: service.billNumber,
      deviceName: service.deviceName,
      model: service.model,
      imei: service.imei || '',
      problemDescription: service.problemDescription,
      technicianAssignment: service.technicianAssignment || '',
      expectedDeliveryDate: service.expectedDeliveryDate.toISOString().split('T')[0],
      delayReason: service.delayReason || '',
    });
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service entry?')) {
      dispatch({ type: 'DELETE_SERVICE_ENTRY', payload: serviceId });
    }
  };

  const updateStatus = (serviceId: string, newStatus: ServiceStatus, notes?: string) => {
    const service = state.serviceEntries.find(s => s.id === serviceId);
    if (!service) return;

    const statusHistory: StatusHistoryEntry = {
      status: newStatus,
      timestamp: new Date(),
      user: state.currentUser.name,
      notes: notes || `Status changed to ${newStatus}`,
    };

    const updatedService: ServiceEntry = {
      ...service,
      status: newStatus,
      statusHistory: [...service.statusHistory, statusHistory],
    };

    // Auto-delete if delivered
    if (newStatus === 'delivered') {
      setTimeout(() => {
        dispatch({ type: 'DELETE_SERVICE_ENTRY', payload: serviceId });
      }, 1000);
    }

    dispatch({ type: 'UPDATE_SERVICE_ENTRY', payload: updatedService });
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-process': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: ServiceStatus): ServiceStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'in-process';
      case 'in-process': return 'ready';
      case 'ready': return 'delivered';
      default: return null;
    }
  };

  if (!state.selectedBranch) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Branch</h3>
          <p className="text-gray-600">Please select a branch to manage service entries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
            <p className="text-gray-600 mt-1">Track and manage mobile device services</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Service</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by bill number, device, or technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-process">In Process</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {branchServices.map((service) => {
          const nextStatus = getNextStatus(service.status);
          const isOverdue = new Date() > service.expectedDeliveryDate && service.status !== 'delivered';
          const daysDiff = Math.ceil((new Date().getTime() - service.entryDate.getTime()) / (1000 * 3600 * 24));
          
          return (
            <div key={service.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.billNumber}</h3>
                  <p className="text-sm text-gray-500">Entry: {service.entryDate.toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{service.deviceName}</p>
                  <p className="text-sm text-gray-500">{service.model}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 line-clamp-2">{service.problemDescription}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                    {service.status.replace('-', ' ').toUpperCase()}
                  </span>
                  {isOverdue && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Overdue</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Due: {service.expectedDeliveryDate.toLocaleDateString()}</span>
                  </div>
                  {service.technicianAssignment && (
                    <p className="mt-1">Technician: {service.technicianAssignment}</p>
                  )}
                </div>
              </div>

              {nextStatus && (
                <button
                  onClick={() => updateStatus(service.id, nextStatus)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Move to {nextStatus.replace('-', ' ')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {service.status === 'ready' && (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => updateStatus(service.id, 'delivered')}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Delivered</span>
                  </button>
                  <button
                    onClick={() => updateStatus(service.id, 'returned', 'Customer returned device')}
                    className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Mark as Returned
                  </button>
                </div>
              )}

              {daysDiff > 180 && service.status !== 'delivered' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center text-orange-600">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">6+ Months Old</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">Consider resale process</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {branchServices.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600">No service entries match your current filters.</p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingService ? 'Edit Service Entry' : 'Create New Service Entry'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Number
                  </label>
                  <input
                    type="text"
                    value={formData.billNumber}
                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                    placeholder={`Auto: ${generateBillNumber()}`}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMEI (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technician Assignment (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.technicianAssignment}
                    onChange={(e) => setFormData({ ...formData, technicianAssignment: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              {editingService && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delay Reason (if applicable)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.delayReason}
                    onChange={(e) => setFormData({ ...formData, delayReason: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}