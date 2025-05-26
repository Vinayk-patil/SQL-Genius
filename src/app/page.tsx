
"use client";

import { SchemaEditorPanel } from '@/components/sql-genius/SchemaEditorPanel';
import { QueryWorkspacePanel } from '@/components/sql-genius/QueryWorkspacePanel';

export default function HomePage() {
  return (
    <div className="flex flex-col md:flex-row flex-grow min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] md:overflow-hidden">
      {/* On mobile, panels stack and take content height. Page scrolls. */}
      {/* On md+, panels are side-by-side, take full available height and scroll internally. */}
      <div className="w-full md:w-1/3 lg:w-2/5 p-3 md:p-4 flex-shrink-0 md:h-full md:overflow-y-auto">
        <SchemaEditorPanel />
      </div>
      <div className="w-full md:w-2/3 lg:w-3/5 p-3 md:p-4 flex-shrink-0 md:h-full md:overflow-y-auto">
        <QueryWorkspacePanel />
      </div>
    </div>
  );
}
