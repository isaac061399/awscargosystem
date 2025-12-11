'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem, Select, Skeleton, Typography } from '@mui/material';

import { requestGetOfficesNavbar } from '@/helpers/request';
import { officeCookie } from '@/libs/constants';

interface Office {
  id: string;
  name: string;
}

const saveCookie = (value: string) => {
  document.cookie = `${officeCookie.name}=${value}; path=/; max-age=${officeCookie.maxAge}`;
};

export default function OfficeSelector() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>(officeCookie.defaultValue);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await requestGetOfficesNavbar();
        if (response.valid) {
          setOffices(response.data);
        }

        const savedOffice = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${officeCookie.name}=`))
          ?.split('=')[1];

        if (savedOffice) {
          setSelectedOffice(savedOffice);
        } else {
          saveCookie(officeCookie.defaultValue);
        }
      } catch (error) {
        console.error('Failed to fetch offices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffices();
  }, []);

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
      {offices.map((o) => (
        <MenuItem key={`${o.id}`} value={o.id}>
          <Typography className="text-text-primary flex items-center gap-2">
            <i className="ri-building-line" style={{ fontSize: '1.3em' }}></i> {o.name}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
}
