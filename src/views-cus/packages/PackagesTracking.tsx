'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

import moment from 'moment';

// MUI Imports
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';

// Helpers Imports
import { requestPackagesTracking } from '@/helpers/request';

const defaultAlertState = { open: false, type: 'success', message: '' };

const PackagesTracking = ({ trackingLoaded }: { trackingLoaded?: string }) => {
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('packages-tracking:text', { returnObjects: true, default: {} }), [t]);
  const jetcargoT: any = useMemo(() => t('constants:jetcargo', { returnObjects: true, default: {} }), [t]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [tracking, setTracking] = useState<string>(trackingLoaded || '');
  const [trackingSearched, setTrackingSearched] = useState<string>('');
  const [trackingData, setTrackingData] = useState<any[] | null>(null);

  // focus tracking field on mount
  useEffect(() => {
    if (trackingLoaded && trackingLoaded.trim().length > 0) {
      fetchTrackingInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTrackingInfo = async () => {
    if (tracking.trim().length === 0) {
      setTrackingSearched('');
      setTrackingData(null);

      return;
    }

    setIsLoading(true);

    const result = await requestPackagesTracking(tracking, i18n.language);

    setIsLoading(false);

    if (!result.valid) {
      return setAlertState({ open: true, type: 'error', message: result.message || textT?.errorMessage });
    }

    setTrackingSearched(tracking);
    setTrackingData(result.data || []);
  };

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              {textT?.title}
            </Typography>
            <div className="flex items-center gap-2"></div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}
            <CardContent>
              {/* Tracking Field */}
              <form
                noValidate
                className="mb-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchTrackingInfo();
                }}>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      required
                      type="text"
                      id="tracking"
                      name="tracking"
                      label={textT?.tracking?.label}
                      placeholder={textT?.tracking?.placeholder}
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      disabled={isLoading}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <i className="ri-search-line"></i>
                            </InputAdornment>
                          ),
                          endAdornment: isLoading ? (
                            <i className="ri-loader-4-line animate-spin" />
                          ) : (
                            <InputAdornment position="end">
                              <IconButton edge="end" type="submit">
                                <i className="ri-arrow-right-line"></i>
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </form>
              <Divider className="my-5" />
              <Grid container spacing={5}>
                {trackingData !== null && trackingData.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography className="text-gray-600">{textT?.noData}</Typography>
                  </Grid>
                )}
                {trackingData !== null && trackingData.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Typography className="mt-2 text-xl! font-semibold! text-gray-900">
                            {textT?.tracking?.label}: <span className="font-extrabold">{trackingSearched}</span>
                          </Typography>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="px-6 py-5">
                      {trackingData?.map((mov, index) => (
                        <TimelineRow
                          key={index}
                          date={moment(mov.date).format(textT?.dateFormat)}
                          status={jetcargoT?.status?.[mov.status] || mov.status}
                        />
                      ))}
                    </div>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default PackagesTracking;

const TimelineRow = ({ date, status }: { date: string; status: string }) => {
  return (
    <div className="grid grid-cols-[160px_18px_1fr] gap-4 my-5">
      {/* Left date */}
      <div className="text-gray-900 font-medium py-3">{date}</div>

      {/* Middle line */}
      <div className="relative flex justify-center">
        {/* vertical line */}
        <div className="w-px h-full bg-gray-300" />
      </div>

      {/* Right content */}
      <div className="text-gray-900 font-semibold py-3">{status}</div>
    </div>
  );
};
