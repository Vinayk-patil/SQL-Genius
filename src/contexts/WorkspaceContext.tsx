
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type {
  TableDefinition,
  SampleData,
  PracticeProblem,
  QueryHistoryItem,
  QueryValidationResult,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Define the type for the item passed to addQueryToHistory
type AddQueryHistoryItemInput = {
  sql: string;
  status: QueryHistoryItem['status']; // Use the refined status from types
  feedback?: string; // Optional top-level feedback
  validationResult?: QueryValidationResult; // The detailed validation result
};


interface WorkspaceContextType {
  tables: TableDefinition[];
  setTables: React.Dispatch<React.SetStateAction<TableDefinition[]>>;
  sampleData: SampleData;
  setSampleData: React.Dispatch<React.SetStateAction<SampleData>>;
  currentProblem: PracticeProblem | null;
  setCurrentProblem: React.Dispatch<React.SetStateAction<PracticeProblem | null>>;
  queryHistory: QueryHistoryItem[];
  addQueryToHistory: (item: AddQueryHistoryItemInput) => void;
  clearHistory: () => void;
  currentQuery: string;
  setCurrentQuery: React.Dispatch<React.SetStateAction<string>>;
  validationResult: QueryValidationResult | null;
  setValidationResult: React.Dispatch<React.SetStateAction<QueryValidationResult | null>>;
  isLoadingAi: boolean;
  setIsLoadingAi: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: 'schema' | 'data';
  setActiveTab: React.Dispatch<React.SetStateAction<'schema' | 'data'>>;
  selectedTableIdForData: string | null;
  setSelectedTableIdForData: React.Dispatch<React.SetStateAction<string | null>>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [sampleData, setSampleData] = useState<SampleData>({});
  const [currentProblem, setCurrentProblem] = useState<PracticeProblem | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [validationResult, setValidationResult] = useState<QueryValidationResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'data'>('schema');
  const [selectedTableIdForData, setSelectedTableIdForData] = useState<string | null>(null);


  const addQueryToHistory = useCallback((item: AddQueryHistoryItemInput) => {
    setQueryHistory(prev => [{ ...item, id: uuidv4(), timestamp: new Date() }, ...prev].slice(0, 50));
  }, []);

  const clearHistory = useCallback(() => {
    setQueryHistory([]);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        tables,
        setTables,
        sampleData,
        setSampleData,
        currentProblem,
        setCurrentProblem,
        queryHistory,
        addQueryToHistory,
        clearHistory,
        currentQuery,
        setCurrentQuery,
        validationResult,
        setValidationResult,
        isLoadingAi,
        setIsLoadingAi,
        activeTab,
        setActiveTab,
        selectedTableIdForData,
        setSelectedTableIdForData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
