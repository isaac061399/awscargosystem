'use client';

// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper';
import VerticalLayout from '@layouts/VerticalLayout';

// Type Imports
import type { ChildrenType } from '@core/types';

// Component Imports
import Navigation from '@components/layout/vertical/Navigation';
import Navbar from '@components/layout/vertical/Navbar';
import VerticalFooter from '@components/layout/vertical/Footer';

const DashboardLayout = ({ children }: ChildrenType) => {
  return (
    <LayoutWrapper
      verticalLayout={
        <VerticalLayout navigation={<Navigation />} navbar={<Navbar />} footer={<VerticalFooter />}>
          {children}
        </VerticalLayout>
      }
    />
  );
};

export default DashboardLayout;
