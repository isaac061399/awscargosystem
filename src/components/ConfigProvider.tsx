'use client';

import { useContext, createContext, type ReactNode, useMemo } from 'react';

interface ConfigContextProps {
  offices: any[];
  configuration: any;
}

interface ConfigProviderProps {
  children: ReactNode;
  offices: any[];
  configuration: any;
}

export const ConfigContext = createContext<ConfigContextProps>({
  offices: [],
  configuration: {}
});

export const useConfig = () => {
  return useContext(ConfigContext);
};

const ConfigProvider = (props: ConfigProviderProps) => {
  const value: any = useMemo(
    () => ({
      offices: props.offices,
      configuration: props.configuration
    }),
    [props.offices, props.configuration]
  );

  return <ConfigContext.Provider value={value}>{props.children}</ConfigContext.Provider>;
};

export default ConfigProvider;
