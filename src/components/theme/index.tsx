'use client';

// React Imports
import { useMemo } from 'react';

// MUI Imports
import { deepmerge } from '@mui/utils';
import { ThemeProvider, extendTheme, lighten, darken, StyledEngineProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import type {} from '@mui/material/themeCssVarsAugmentation'; //! Do not remove this import otherwise you will get type errors while making a production build
import type {} from '@mui/lab/themeAugmentation'; //! Do not remove this import otherwise you will get type errors while making a production build

// Type Imports
import type { ChildrenType, Direction } from '@core/types';

// Hook Imports
import { useSettings } from '@core/hooks/useSettings';

// Core Theme Imports
import defaultCoreTheme from '@core/theme';

// Config Imports
import siteConfig from '@configs/siteConfig';
import primaryColorConfig from '@configs/primaryColorConfig';

// Component Imports
import ModeChanger from './ModeChanger';

type Props = ChildrenType & {
  direction: Direction;
};

const ThemeProviderCustom = (props: Props) => {
  // Props
  const { children, direction } = props;

  // Hooks
  const { settings } = useSettings();

  // Merge the primary color scheme override with the core theme
  const theme = useMemo(() => {
    const newColorScheme = {
      colorSchemeSelector: 'class',
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: primaryColorConfig[0].main,
              light: lighten(primaryColorConfig[0].main as string, 0.2),
              dark: darken(primaryColorConfig[0].main as string, 0.1)
            }
          }
        },
        dark: {
          palette: {
            primary: {
              main: primaryColorConfig[0].main,
              light: lighten(primaryColorConfig[0].main as string, 0.2),
              dark: darken(primaryColorConfig[0].main as string, 0.1)
            }
          }
        }
      }
    };

    const coreTheme = deepmerge(defaultCoreTheme(settings.mode || 'light', direction), newColorScheme);

    return extendTheme(coreTheme);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode]);

  return (
    <StyledEngineProvider injectFirst>
      <AppRouterCacheProvider options={{ prepend: true }}>
        <ThemeProvider
          theme={theme}
          defaultMode={settings.mode}
          modeStorageKey={`${siteConfig.siteName.toLowerCase().split(' ').join('-')}-mui-template-mode`}>
          <>
            <ModeChanger />
            <CssBaseline />
            {children}
          </>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </StyledEngineProvider>
  );
};

export default ThemeProviderCustom;
