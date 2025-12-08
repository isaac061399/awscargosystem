// React Imports
import { useMemo } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// MUI Imports
import { useTheme } from '@mui/material/styles';

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar';

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu';

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu';

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav';

//Helpers Imports
import { hasAtLeastOnePermission } from '@helpers/permissions';

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles';
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles';

import i18nConfig from '@/configs/i18nConfig';

type RenderExpandIconProps = {
  open?: boolean;
  transitionDuration?: VerticalMenuContextProps['transitionDuration'];
};

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className="ri-arrow-right-s-line" />
  </StyledVerticalNavExpandIcon>
);

const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
  // Hooks
  const theme = useTheme();
  const { isBreakpointReached, transitionDuration } = useVerticalNav();
  const { data: admin } = useAdmin();

  const { t, i18n } = useTranslation('common');
  const textT: any = useMemo(() => t('sidebar', { returnObjects: true, default: {} }), [t]);
  const menu = textT?.menu || [];
  const langPrefix = i18n.language === i18nConfig.defaultLocale ? '' : `/${i18n.language}`;

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar;

  return (
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: (container) => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: (container) => scrollMenu(container, true)
          })}>
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className="ri-circle-line" /> }}
        menuSectionStyles={menuSectionStyles(theme)}>
        {menu.map((section: any, sectionIndex: number) => {
          if (!hasAtLeastOnePermission(section.permissions, admin.permissions)) return null;

          return (
            <MenuSection key={`Section${sectionIndex}`} label={section.sectionTitle}>
              {section.items?.map((item: any, itemIndex: number) => {
                if (!hasAtLeastOnePermission(item.permissions, admin.permissions)) return null;

                if (!Boolean(item.subItems)) {
                  return (
                    <MenuItem
                      key={`Section${sectionIndex}Item${itemIndex}`}
                      href={item.link ? `${langPrefix}${item.link}` : `${langPrefix}/`}
                      icon={item.icon ? <i className={`${item.icon}`} /> : undefined}
                      suffix={item.externalLink ? <i className="ri-external-link-line text-xl" /> : undefined}
                      target={item.externalLink ? `_blank` : undefined}
                      activeUrl={item.activeUrl}
                      exactMatch={item.exactMatch}>
                      {item.label}
                    </MenuItem>
                  );
                }

                return (
                  <SubMenu
                    key={`Section${sectionIndex}Item${itemIndex}`}
                    label={item.label}
                    icon={item.icon ? <i className={`${item.icon}`} /> : undefined}>
                    {item.subItems?.map((subItem: any, subItemIndex: number) => {
                      if (!hasAtLeastOnePermission(subItem.permissions, admin.permissions)) return null;

                      return (
                        <MenuItem
                          key={`Section${sectionIndex}Item${itemIndex}SubItem${subItemIndex}`}
                          href={subItem.link ? `${langPrefix}${subItem.link}` : `${langPrefix}/`}
                          icon={subItem.icon ? <i className={`${subItem.icon}`} /> : undefined}
                          suffix={subItem.externalLink ? <i className="ri-external-link-line text-xl" /> : undefined}
                          target={subItem.externalLink ? `_blank` : undefined}
                          activeUrl={subItem.activeUrl}
                          exactMatch={subItem.exactMatch}>
                          {subItem.label}
                        </MenuItem>
                      );
                    })}
                  </SubMenu>
                );
              })}
            </MenuSection>
          );
        })}
      </Menu>
    </ScrollWrapper>
  );
};

export default VerticalMenu;
