'use client';

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Toast, { ToastProps } from './Toast';

interface ToastContextType {
  addToast: (message: string, type?: ToastProps['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastMessage extends ToastProps {
  id: string;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastProps['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, onDismiss: () => removeToast(id) }]);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {mounted && createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] space-y-3 pointer-events-none">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} />
          ))}
        </div>,
        document.body
      )}

    </ToastContext.Provider>
  );
};
