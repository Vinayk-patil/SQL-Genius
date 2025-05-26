"use client";

import { SchemaEditorPanel } from '@/components/sql-genius/SchemaEditorPanel';
import { QueryWorkspacePanel } from '@/components/sql-genius/QueryWorkspacePanel';

export default function HomePage() {
  return (
    <div className="flex flex-col md:flex-row flex-grow h-[calc(100vh-4rem)]"> {/* Adjust height if header height changes */}
      <div className="w-full md:w-1/3 lg:w-2/5 p-1 md:p-2 flex-shrink-0 overflow-y-auto h-full">
        <SchemaEditorPanel />
      </div>
      <div className="w-full md:w-2/3 lg:w-3/5 p-1 md:p-2 flex-shrink-0 overflow-y-auto h-full">
        <QueryWorkspacePanel />
      </div>
    </div>
  );
}
