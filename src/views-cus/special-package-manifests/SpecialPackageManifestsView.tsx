'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import moment from 'moment';

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

// Helpers Imports
import { requestPaySpecialPackageManifest } from '@helpers/request';
import { formatMoney, padStartZeros } from '@/libs/utils';
import { currencies } from '@/libs/constants';
import { PaymentStatus } from '@/prisma/generated/enums';

const defaultAlertState = { open: false, type: 'success', message: '' };

const paymentStatusColors: any = {
  PENDING: 'warning',
  PAID: 'success'
};

const SpecialPackageManifestsNew = ({ manifest }: { manifest: any }) => {
  const router = useRouter();

  const { data: admin } = useAdmin();
  const isAdmin = hasAllPermissions('special-package-manifests.admin', admin.permissions);
  const canPay = hasAllPermissions('special-package-manifests.pay', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('special-package-manifests-view:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [isLoading, setIsLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const handlePay = async () => {
    setAlertState({ ...defaultAlertState });
    setIsLoading(true);

    const result = await requestPaySpecialPackageManifest(manifest?.id, i18n.language);

    setIsLoading(false);
    setPayOpen(false);

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message || textT?.errors?.status });
    } else {
      router.refresh();
    }
  };

  /** --- grids --- */
  const itemsCols: GridColDef[] = [
    {
      field: 'id',
      headerName: textT?.itemsTable?.index?.title,
      width: 100,
      sortable: false,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
    },
    { field: 'tracking', headerName: textT?.itemsTable?.tracking?.title, width: 200, sortable: false },
    {
      field: 'mailbox',
      headerName: textT?.itemsTable?.mailbox?.title,
      width: 200,
      sortable: false
    },
    {
      field: 'type',
      headerName: textT?.itemsTable?.type?.title,
      width: 200,
      sortable: false,
      valueGetter: (value, row) => labelsT?.specialPackageType?.[row.type] || row.type
    },
    {
      field: 'status',
      headerName: textT?.itemsTable?.status?.title,
      width: 200,
      sortable: false,
      valueGetter: (value, row) => labelsT?.specialPackageStatus?.[row.status] || row.status
    },
    {
      field: 'status_date',
      headerName: textT?.itemsTable?.status_date?.title,
      width: 200,
      sortable: false,
      valueGetter: (value, row) => moment(row.status_date).format(textT?.itemsTable?.status_date?.dateFormat)
    }
  ];

  const isPayable = manifest.payment_status === PaymentStatus.PENDING && canPay;

  const paymentStatusChip: any = {
    label: labelsT?.paymentStatus?.[manifest.payment_status] || 'Unknown',
    color: paymentStatusColors[manifest.payment_status] || 'info'
  };

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              <IconButton className="p-1" color="default" LinkComponent={Link} href="/special-package-manifests">
                <i className="ri-arrow-left-s-line text-4xl" />
              </IconButton>
              {textT?.title} {`# ${padStartZeros(manifest.id, 4)}`}
            </Typography>
            <div className="flex items-center gap-2">
              {isPayable && (
                <Button
                  size="small"
                  type="button"
                  variant="contained"
                  color="success"
                  startIcon={<i className="ri-wallet-3-line"></i>}
                  onClick={() => setPayOpen(true)}>
                  {textT?.btnPay}
                </Button>
              )}
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}

            <CardContent>
              <Grid container spacing={3} alignItems="top">
                {/* Amount per package */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {textT?.amountPerPackageLabel}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {formatMoney(manifest.package_amount, `${currencies.USD.symbol} `)}
                    </Typography>
                  </Stack>
                </Grid>

                {/* Amount per manifest */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {textT?.amountPerManifestLabel}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {formatMoney(manifest.manifest_amount, `${currencies.USD.symbol} `)}
                    </Typography>
                  </Stack>
                </Grid>

                {/* Quantity */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {textT?.quantityLabel}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {manifest.package_quantity}
                    </Typography>
                  </Stack>
                </Grid>

                {/* Total */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {textT?.totalLabel}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {formatMoney(manifest.amount, `${currencies.USD.symbol} `)}
                    </Typography>
                  </Stack>
                </Grid>

                {/* Payment status */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      {textT?.paymentStatusLabel}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Chip label={paymentStatusChip.label} color={paymentStatusChip.color} size="small" />
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
              <Divider sx={{ mt: 5 }} />
            </CardContent>

            <CardContent>
              <Grid container spacing={5}>
                <Grid size={{ xs: 12 }}>
                  {isAdmin && (
                    <Typography variant="body1" gutterBottom>
                      {textT?.ownerLabel}:{' '}
                      <strong>
                        {manifest?.owner?.full_name} ({manifest?.owner?.email})
                      </strong>
                    </Typography>
                  )}
                  <Typography variant="body1" gutterBottom>
                    {textT?.descriptionLabel}: <strong>{manifest?.description || '--'}</strong>
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ mb: 5 }} />

                  <Typography variant="h5" className="flex gap-3 items-center">
                    {textT?.itemsTitle}
                  </Typography>

                  <Box className="h-105" sx={{ mt: 5 }}>
                    <DataGrid
                      rows={manifest.special_packages}
                      columns={itemsCols}
                      checkboxSelection={false}
                      disableRowSelectionOnClick
                      hideFooterPagination
                      hideFooter
                      density="compact"
                      // pagination
                      // pageSizeOptions={[5, 10, 25]}
                      // initialState={{
                      //   pagination: { paginationModel: { pageSize: 10, page: 0 } }
                      // }}
                      localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isPayable && (
        <>
          <Dialog
            open={payOpen}
            onClose={() => setPayOpen(false)}
            aria-labelledby="dialog-pay-title"
            aria-describedby="dialog-pay-description">
            <DialogTitle id="dialog-pay-title">{textT?.dialogPay?.title}</DialogTitle>
            <DialogContent dividers>
              <DialogContentText id="dialog-pay-description">{textT?.dialogPay?.message}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={() => setPayOpen(false)} disabled={isLoading}>
                {textT?.btnCancel}
              </Button>
              <Button variant="text" color="primary" onClick={handlePay} loading={isLoading}>
                {textT?.btnContinue}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

export default SpecialPackageManifestsNew;
