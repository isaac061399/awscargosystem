'use client';

import { useState, useContext, createContext, type ReactNode, useMemo } from 'react';

interface AdminContextProps {
  data?: any;
  status: 'authenticated' | 'unauthenticated';
  update: (data: any) => any;
}

interface AdminProviderProps {
  children: ReactNode;
  admin?: any;
}

export const AdminContext = createContext<AdminContextProps>({
  data: undefined,
  status: 'unauthenticated',
  update: () => {}
});

export const useAdmin = () => {
  return useContext(AdminContext);
};

const AdminProvider = (props: AdminProviderProps) => {
  const [admin, setAdmin] = useState(props.admin);

  const value: any = useMemo(
    () => ({
      data: admin,
      status: admin ? 'authenticated' : 'unauthenticated',
      async update(data: any) {
        setAdmin(data);

        return data;
      }
    }),
    [admin]
  );

  return <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>;
};

export default AdminProvider;
