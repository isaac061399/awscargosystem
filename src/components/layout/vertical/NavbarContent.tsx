// Third-party Imports
import classnames from 'classnames';

// Component Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses';
import NavToggle from './NavToggle';
import ModeDropdown from '@components/layout/shared/ModeDropdown';
import UserDropdown from '@components/layout/shared/UserDropdown';
import LangSelector from '@libs/translate/LangSelector';
import OfficeSelector from '@/components/OfficeSelector';
import ExchangeComponent from '@/components/ExchangeComponent';

// Util Imports

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className="flex items-center gap-2 sm:gap-4">
        <NavToggle />
      </div>
      <div className="flex items-center">
        <ExchangeComponent />
        <OfficeSelector />
        <LangSelector />
        <ModeDropdown />
        <UserDropdown />
      </div>
    </div>
  );
};

export default NavbarContent;
