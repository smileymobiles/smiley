import React from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function BranchSelector() {
  const { state, dispatch } = useApp();

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Branch
      </label>
      <div className="relative">
        <select
          value={state.selectedBranch?.id || ''}
          onChange={(e) => {
            const branch = state.branches.find(b => b.id === e.target.value) || null;
            dispatch({ type: 'SET_SELECTED_BRANCH', payload: branch });
          }}
          className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300"
        >
          <option value="">Choose a branch...</option>
          {state.branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      </div>
      {!state.selectedBranch && (
        <p className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          Please select a branch to continue with operations
        </p>
      )}
    </div>
  );
}