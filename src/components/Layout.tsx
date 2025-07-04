import React, { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { BranchSelector } from './BranchSelector';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                {state.selectedBranch && (
                  <div className="flex items-center text-blue-600">
                    <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium">
                      {state.selectedBranch.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-full lg:w-80">
                <BranchSelector />
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}