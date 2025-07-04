import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Branch, InventoryItem, ServiceEntry, User, BillSettings } from '../types';

interface AppState {
  selectedBranch: Branch | null;
  branches: Branch[];
  inventoryItems: InventoryItem[];
  serviceEntries: ServiceEntry[];
  currentUser: User;
  users: User[];
  billSettings: BillSettings[];
}

type AppAction =
  | { type: 'SET_SELECTED_BRANCH'; payload: Branch | null }
  | { type: 'ADD_BRANCH'; payload: Branch }
  | { type: 'UPDATE_BRANCH'; payload: Branch }
  | { type: 'DELETE_BRANCH'; payload: string }
  | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY_ITEM'; payload: InventoryItem }
  | { type: 'DELETE_INVENTORY_ITEM'; payload: string }
  | { type: 'BULK_ADD_INVENTORY'; payload: InventoryItem[] }
  | { type: 'ADD_SERVICE_ENTRY'; payload: ServiceEntry }
  | { type: 'UPDATE_SERVICE_ENTRY'; payload: ServiceEntry }
  | { type: 'DELETE_SERVICE_ENTRY'; payload: string }
  | { type: 'LOGIN_USER'; payload: User }
  | { type: 'LOGOUT_USER' }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'UPDATE_BILL_SETTINGS'; payload: BillSettings }
  | { type: 'INCREMENT_BILL_NUMBER'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> };

const initialState: AppState = {
  selectedBranch: null,
  branches: [
    { id: '1', name: 'Main Branch', code: 'MAIN', address: 'Main Street, City Center', phone: '+91 9876543210', manager: 'John Doe' },
    { id: '2', name: 'Thekkalur', code: 'THEK', address: 'Thekkalur Road, District', phone: '+91 9876543211', manager: 'Jane Smith' },
    { id: '3', name: 'KNG', code: 'KNG', address: 'KNG Complex, Downtown', phone: '+91 9876543212', manager: 'Mike Johnson' },
    { id: '4', name: 'Kozhikode', code: 'KOZ', address: 'Kozhikode Beach Road', phone: '+91 9876543213', manager: 'Sarah Wilson' },
  ],
  inventoryItems: [],
  serviceEntries: [],
  currentUser: { id: '', name: '', username: '', password: '', role: 'admin', isAuthenticated: false, createdAt: new Date() },
  users: [
    {
      id: 'admin',
      name: 'Administrator',
      username: 'admin',
      password: '4567',
      role: 'admin',
      isAuthenticated: false,
      createdAt: new Date(),
    }
  ],
  billSettings: [
    { branchId: '1', prefix: 'MAIN', currentNumber: 1, format: '{PREFIX}{YY}{MM}{####}' },
    { branchId: '2', prefix: 'THEK', currentNumber: 1, format: '{PREFIX}{YY}{MM}{####}' },
    { branchId: '3', prefix: 'KNG', currentNumber: 1, format: '{PREFIX}{YY}{MM}{####}' },
    { branchId: '4', prefix: 'KOZ', currentNumber: 1, format: '{PREFIX}{YY}{MM}{####}' },
  ],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_BRANCH':
      return { ...state, selectedBranch: action.payload };
    case 'ADD_BRANCH':
      const newBillSetting: BillSettings = {
        branchId: action.payload.id,
        prefix: action.payload.code,
        currentNumber: 1,
        format: '{PREFIX}{YY}{MM}{####}',
      };
      return { 
        ...state, 
        branches: [...state.branches, action.payload],
        billSettings: [...state.billSettings, newBillSetting],
      };
    case 'UPDATE_BRANCH':
      return {
        ...state,
        branches: state.branches.map(branch =>
          branch.id === action.payload.id ? action.payload : branch
        ),
        billSettings: state.billSettings.map(setting =>
          setting.branchId === action.payload.id 
            ? { ...setting, prefix: action.payload.code }
            : setting
        ),
      };
    case 'DELETE_BRANCH':
      return {
        ...state,
        branches: state.branches.filter(branch => branch.id !== action.payload),
        billSettings: state.billSettings.filter(setting => setting.branchId !== action.payload),
        selectedBranch: state.selectedBranch?.id === action.payload ? null : state.selectedBranch,
      };
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventoryItems: [...state.inventoryItems, action.payload] };
    case 'UPDATE_INVENTORY_ITEM':
      return {
        ...state,
        inventoryItems: state.inventoryItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE_INVENTORY_ITEM':
      return {
        ...state,
        inventoryItems: state.inventoryItems.filter(item => item.id !== action.payload),
      };
    case 'BULK_ADD_INVENTORY':
      return { ...state, inventoryItems: [...state.inventoryItems, ...action.payload] };
    case 'ADD_SERVICE_ENTRY':
      return { ...state, serviceEntries: [...state.serviceEntries, action.payload] };
    case 'UPDATE_SERVICE_ENTRY':
      return {
        ...state,
        serviceEntries: state.serviceEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'DELETE_SERVICE_ENTRY':
      return {
        ...state,
        serviceEntries: state.serviceEntries.filter(entry => entry.id !== action.payload),
      };
    case 'LOGIN_USER':
      return { 
        ...state, 
        currentUser: { 
          ...action.payload, 
          lastLogin: new Date() 
        },
        users: state.users.map(user =>
          user.id === action.payload.id 
            ? { ...user, lastLogin: new Date() }
            : user
        ),
      };
    case 'LOGOUT_USER':
      return { 
        ...state, 
        currentUser: { 
          id: '', 
          name: '', 
          username: '', 
          password: '', 
          role: 'admin', 
          isAuthenticated: false, 
          createdAt: new Date() 
        } 
      };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
        currentUser: state.currentUser.id === action.payload.id ? action.payload : state.currentUser,
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'UPDATE_BILL_SETTINGS':
      return {
        ...state,
        billSettings: state.billSettings.map(setting =>
          setting.branchId === action.payload.branchId ? action.payload : setting
        ),
      };
    case 'INCREMENT_BILL_NUMBER':
      return {
        ...state,
        billSettings: state.billSettings.map(setting =>
          setting.branchId === action.payload 
            ? { ...setting, currentNumber: setting.currentNumber + 1 }
            : setting
        ),
      };
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('smileyMobiles_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Convert date strings back to Date objects
        if (parsedData.inventoryItems) {
          parsedData.inventoryItems = parsedData.inventoryItems.map((item: any) => ({
            ...item,
            lastUpdated: new Date(item.lastUpdated),
          }));
        }
        if (parsedData.serviceEntries) {
          parsedData.serviceEntries = parsedData.serviceEntries.map((entry: any) => ({
            ...entry,
            entryDate: new Date(entry.entryDate),
            expectedDeliveryDate: new Date(entry.expectedDeliveryDate),
            statusHistory: entry.statusHistory.map((hist: any) => ({
              ...hist,
              timestamp: new Date(hist.timestamp),
            })),
          }));
        }
        if (parsedData.users) {
          parsedData.users = parsedData.users.map((user: any) => ({
            ...user,
            createdAt: new Date(user.createdAt),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          }));
        }
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      selectedBranch: state.selectedBranch,
      branches: state.branches,
      inventoryItems: state.inventoryItems,
      serviceEntries: state.serviceEntries,
      currentUser: state.currentUser,
      users: state.users,
      billSettings: state.billSettings,
    };
    localStorage.setItem('smileyMobiles_data', JSON.stringify(dataToSave));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}