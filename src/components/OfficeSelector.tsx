'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, Skeleton, Typography } from '@mui/material';

import { officeCookie } from '@/libs/constants';

import { useAdmin } from './AdminProvider';
import { useConfig } from './ConfigProvider';

const saveCookie = (value: string) => {
  document.cookie = `${officeCookie.name}=${value}; path=/; max-age=${officeCookie.maxAge}`;
};

export default function OfficeSelector() {
  const router = useRouter();
  const { data: admin } = useAdmin();
  const { offices } = useConfig();

  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('navbar', { returnObjects: true, default: {} }), [t]);

  const defaultOfficeId = admin?.office ? String(admin.office.id) : '0';

  const [selectedOffice, setSelectedOffice] = useState<string>(defaultOfficeId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSelectedOffice = async () => {
      try {
        const savedOffice = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${officeCookie.name}=`))
          ?.split('=')[1];

        if (savedOffice) {
          setSelectedOffice(savedOffice);
        } else {
          saveCookie(defaultOfficeId);
        }
      } catch (error) {
        console.error('Failed to fetch offices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSelectedOffice();
  }, [defaultOfficeId]);

  const handleOfficeChange = (officeId: string) => {
    setSelectedOffice(officeId);
    saveCookie(officeId);

    router.refresh();
  };

  if (loading) return <Skeleton variant="rounded" width={124} height={25} />;

  return (
    <Select
      variant="standard"
      disableUnderline
      value={selectedOffice}
      onChange={(e) => handleOfficeChange(e.target.value)}>
      <MenuItem value={0}>
        <Typography className="text-text-primary flex items-center gap-2">
          <i className="ri-building-line" style={{ fontSize: '1.3em' }}></i> {textT.allLabel}
        </Typography>
      </MenuItem>
      {offices
        .filter((o) => o.enabled)
        .map((o) => (
          <MenuItem key={`${o.id}`} value={o.id}>
            <Typography className="text-text-primary flex items-center gap-2">
              <i className="ri-building-line" style={{ fontSize: '1.3em' }}></i> {o.name}
            </Typography>
          </MenuItem>
        ))}
    </Select>
  );
}
