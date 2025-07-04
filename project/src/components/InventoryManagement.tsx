import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Download,
  Filter,
  Package,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import * as XLSX from 'xlsx';

export function InventoryManagement() {
  const { state, dispatch } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    itemName: '',
    brand: '',
    model: '',
    stockQuantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    lowStockThreshold: 10,
  });

  const branchInventory = useMemo(() => {
    if (!state.selectedBranch) return [];
    
    return state.inventoryItems
      .filter(item => item.branchId === state.selectedBranch!.id)
      .filter(item => {
        const matchesSearch = 
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.model.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = !showLowStock || 
          item.stockQuantity <= (item.lowStockThreshold || 10);
        
        return matchesSearch && matchesFilter;
      });
  }, [state.inventoryItems, state.selectedBranch, searchTerm, showLowStock]);

  const lowStockItems = useMemo(() => {
    return branchInventory.filter(item => 
      item.stockQuantity <= (item.lowStockThreshold || 10)
    );
  }, [branchInventory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedBranch) return;

    const itemData: InventoryItem = {
      id: editingItem?.id || Date.now().toString(),
      ...formData,
      branchId: state.selectedBranch.id,
      lastUpdated: new Date(),
    };

    if (editingItem) {
      dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: itemData });
    } else {
      dispatch({ type: 'ADD_INVENTORY_ITEM', payload: itemData });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      brand: '',
      model: '',
      stockQuantity: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      lowStockThreshold: 10,
    });
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      itemName: item.itemName,
      brand: item.brand,
      model: item.model,
      stockQuantity: item.stockQuantity,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      lowStockThreshold: item.lowStockThreshold || 10,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      dispatch({ type: 'DELETE_INVENTORY_ITEM', payload: itemId });
    }
  };

  const exportToCSV = () => {
    const headers = ['Item Name', 'Brand', 'Model', 'Stock Quantity', 'Purchase Price', 'Selling Price', 'Low Stock Threshold', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...branchInventory.map(item => [
        item.itemName,
        item.brand,
        item.model,
        item.stockQuantity,
        item.purchasePrice,
        item.sellingPrice,
        item.lowStockThreshold || 10,
        item.lastUpdated.toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${state.selectedBranch?.code}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !state.selectedBranch) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const inventoryItems: InventoryItem[] = jsonData.map((row: any, index: number) => ({
          id: `import_${Date.now()}_${index}`,
          itemName: row['Item Name'] || row['itemName'] || '',
          brand: row['Brand'] || row['brand'] || '',
          model: row['Model'] || row['model'] || '',
          stockQuantity: parseInt(row['Stock Quantity'] || row['stockQuantity'] || '0'),
          purchasePrice: parseFloat(row['Purchase Price'] || row['purchasePrice'] || '0'),
          sellingPrice: parseFloat(row['Selling Price'] || row['sellingPrice'] || '0'),
          lowStockThreshold: parseInt(row['Low Stock Threshold'] || row['lowStockThreshold'] || '10'),
          branchId: state.selectedBranch!.id,
          lastUpdated: new Date(),
        })).filter(item => item.itemName && item.brand && item.model);

        if (inventoryItems.length > 0) {
          dispatch({ type: 'BULK_ADD_INVENTORY', payload: inventoryItems });
          alert(`Successfully imported ${inventoryItems.length} items!`);
        } else {
          alert('No valid items found in the file. Please check the format.');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check the format and try again.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Item Name', 'Brand', 'Model', 'Stock Quantity', 'Purchase Price', 'Selling Price', 'Low Stock Threshold'],
      ['iPhone Screen', 'Apple', 'iPhone 12', '10', '2500', '3500', '5'],
      ['Samsung Battery', 'Samsung', 'Galaxy S21', '15', '800', '1200', '3'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template');
    XLSX.writeFile(wb, 'inventory_template.xlsx');
  };

  if (!state.selectedBranch) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
          <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Branch</h3>
          <p className="text-gray-600">Please select a branch to manage inventory items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 font-medium">
              {lowStockItems.length} item(s) are running low on stock
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
            <p className="text-gray-600 mt-1">Manage your stock items and track inventory levels</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Template</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
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
                placeholder="Search items, brands, or models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
              showLowStock 
                ? 'bg-red-100 text-red-600 border-2 border-red-200' 
                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branchInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      <div className="text-sm text-gray-500">{item.brand} - {item.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        item.stockQuantity <= (item.lowStockThreshold || 10) 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {item.stockQuantity}
                      </span>
                      {item.stockQuantity <= (item.lowStockThreshold || 10) && (
                        <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₹{item.purchasePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₹{item.sellingPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.lastUpdated.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {branchInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No inventory items found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
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
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}