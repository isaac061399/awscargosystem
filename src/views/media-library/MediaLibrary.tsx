'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// Components Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import MediaLibrarySelector from '@components/media-selector/MediaLibrarySelector';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

const MediaLibrary = () => {
  const { data: admin } = useAdmin();
  const canCreate = hasAllPermissions('media.create', admin.permissions);
  const canDelete = hasAllPermissions('media.delete', admin.permissions);

  const { t } = useTranslation();
  const textT: any = useMemo(() => t('media:text', { returnObjects: true, default: {} }), [t]);

  return (
    <DashboardLayout>
      <MediaLibrarySelector title={textT?.title} canAdd={canCreate} canDelete={canDelete} />
    </DashboardLayout>
  );
};

export default MediaLibrary;
