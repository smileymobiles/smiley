import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw,
  FileText,
  Hash
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BillSettings as BillSettingsType } from '../types';

export function BillSettings() {
  const { state, dispatch } = useApp();
  const [editingSettings, setEditingSettings] = useState<{ [branchId: string]: BillSettingsType }>({});

  const handleSettingsChange = (branchId: string, field: keyof BillSettingsType, value: string | number) => {
    setEditingSettings(prev => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [field]: value,
      }
    }));
  };

  const saveSettings = (branchId: string) => {
    const settings = editingSettings[branchId];
    if (settings) {
      dispatch({ type: 'UPDATE_BILL_SETTINGS', payload: settings });
      setEditingSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[branchId];
        return newSettings;
      });
    }
  };

  const resetSettings = (branchId: string) => {
    setEditingSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[branchId];
      return newSettings;
    });
  };

  const getCurrentSettings = (branchId: string): BillSettingsType => {
    return editingSettings[branchId] || 
           state.billSettings.find(s => s.branchId === branchId) || 
           { branchId, prefix: '', currentNumber: 1, format: '{PREFIX}{YY}{MM}{####}' };
  };

  const generatePreview = (settings: BillSettingsType): string => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const number = settings.currentNumber.toString().padStart(4, '0');
    
    return settings.format
      .replace('{PREFIX}', settings.prefix)
      .replace('{YY}', year)
      .replace('{MM}', month)
      .replace('{####}', number);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Settings className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bill Number Settings</h2>
            <p className="text-gray-600 mt-1">Configure automatic bill number generation for each branch</p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.branches.map((branch) => {
          const settings = getCurrentSettings(branch.id);
          const isEditing = !!editingSettings[branch.id];
          const preview = generatePreview(settings);

          return (
            <div key={branch.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {branch.code}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveSettings(branch.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Save Changes"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => resetSettings(branch.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Cancel Changes"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingSettings(prev => ({ ...prev, [branch.id]: { ...settings } }))}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.prefix}
                    onChange={(e) => handleSettingsChange(branch.id, 'prefix', e.target.value.toUpperCase())}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.currentNumber}
                    onChange={(e) => handleSettingsChange(branch.id, 'currentNumber', parseInt(e.target.value) || 1)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={settings.format}
                    onChange={(e) => handleSettingsChange(branch.id, 'format', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-50"
                  >
                    <option value="{PREFIX}{YY}{MM}{####}">{settings.prefix}YYMM####</option>
                    <option value="{PREFIX}-{YY}-{MM}-{####}">{settings.prefix}-YY-MM-####</option>
                    <option value="{PREFIX}{####}">{settings.prefix}####</option>
                    <option value="{PREFIX}-{####}">{settings.prefix}-####</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Available placeholders: {'{PREFIX}'}, {'{YY}'}, {'{MM}'}, {'{####}'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-mono font-bold text-blue-600">{preview}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Next bill number to be generated</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format Guide */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Format Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Available Placeholders:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><code className="bg-gray-100 px-1 rounded">{'{PREFIX}'}</code> - Branch prefix (e.g., MAIN)</li>
              <li><code className="bg-gray-100 px-1 rounded">{'{YY}'}</code> - 2-digit year (e.g., 25)</li>
              <li><code className="bg-gray-100 px-1 rounded">{'{MM}'}</code> - 2-digit month (e.g., 01)</li>
              <li><code className="bg-gray-100 px-1 rounded">{'{####}'}</code> - 4-digit auto-increment number</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Example Formats:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><code className="bg-gray-100 px-1 rounded">MAIN250101</code> - {'{PREFIX}{YY}{MM}{####}'}</li>
              <li><code className="bg-gray-100 px-1 rounded">MAIN-25-01-01</code> - {'{PREFIX}-{YY}-{MM}-{####}'}</li>
              <li><code className="bg-gray-100 px-1 rounded">MAIN0001</code> - {'{PREFIX}{####}'}</li>
              <li><code className="bg-gray-100 px-1 rounded">MAIN-0001</code> - {'{PREFIX}-{####}'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}