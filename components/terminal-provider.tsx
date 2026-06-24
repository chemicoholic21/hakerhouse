'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TerminalContextType {
  isOpen: boolean;
  openTerminal: () => void;
  closeTerminal: () => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TerminalContext.Provider
      value={{
        isOpen,
        openTerminal: () => setIsOpen(true),
        closeTerminal: () => setIsOpen(false),
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}
