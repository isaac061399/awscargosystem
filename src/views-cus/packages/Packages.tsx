'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// MUI Imports
import type { SnackbarCloseReason } from '@mui/material';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Others Imports
import moment from 'moment';

// Components Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import FilterSearch from '@components/data-tables/FilterSearch';
import FilterSelect from '@/components/data-tables/FilterSelect';

// Helpers Imports
import { requestDeletePackage, requestGetPackages } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

import { generateUrl } from '@/libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  PRE_ALERTED: 'warning',
  ON_THE_WAY: 'primary',
  READY: 'info',
  DELIVERED: 'success'
};

const paymentStatusColors: any = {
  PENDING: 'warning',
  PAID: 'success'
};

const Packages = () => {
  const { data: admin } = useAdmin();
  const canView = hasAllPermissions('packages.view', admin.permissions);
  const canDelete = hasAllPermissions('packages.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('packages:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');
  const [paymentStatusState, setPaymentStatusState] = useState('');
  const [statusState, setStatusState] = useState('');

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    tracking: ''
  });

  useEffect(() => {
    handleFetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, paymentStatusState, statusState]);

  const handleFetchPackages = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState,
      payment_status: paymentStatusState,
      status: statusState
    };

    const result = await requestGetPackages(params, i18n.language);

    if (result.valid) {
      setRowsState((prevState) => ({
        ...prevState,
        isLoading: false,
        data: result.data || [],
        total: result.pagination?.total || 0
      }));
    } else {
      setRowsState((prevState) => ({
        ...prevState,
        isLoading: false,
        data: [],
        total: 0
      }));
    }
  };

  const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }

    setAlertState({ ...defaultAlertState });
  };

  const handleDeleteOpen = (id: number, tracking: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, id, tracking }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setAlertState({ ...defaultAlertState });
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestDeletePackage(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchPackages();
    }
  };

  const handleExport = async () => {
    const exportUrl = generateUrl('/api/packages/export', {
      s: searchState,
      payment_status: paymentStatusState,
      status: statusState
    });

    window.open(exportUrl, '_blank');
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'tracking',
      headerName: textT?.table?.tracking?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {canView ? (
            <Link
              href={`/packages/view/${params.row.id}`}
              className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
              {params.row.tracking}
            </Link>
          ) : (
            params.row.tracking
          )}
        </div>
      )
    },
    {
      field: 'client.office',
      headerName: textT?.table?.office?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">{params.row.client?.office?.name}</div>
      )
    },
    {
      field: 'client',
      headerName: textT?.table?.client?.title,
      flex: 1,
      minWidth: 300,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>{params.row.client?.full_name}</span>
          <span>
            <strong>{textT?.table?.client?.box_number}</strong>: {params.row.client?.box_number}
          </span>
          <span>
            <strong>{textT?.table?.client?.identification}</strong>: {params.row.client?.identification}
          </span>
          <span>
            <strong>{textT?.table?.client?.email}</strong>: {params.row.client?.email}
          </span>
        </div>
      )
    },
    {
      field: 'status',
      headerName: textT?.table?.status?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => {
        const label = labelsT?.packageStatus?.[params.row.status] || 'Unknown';
        const status: keyof typeof statusColors = params.row.status as keyof typeof statusColors;
        const color = (statusColors[status] as any) || 'info';

        return (
          <div className="h-full inline-flex flex-col justify-center py-2">
            <Chip label={label} color={color} size="small" variant="outlined" />
          </div>
        );
      }
    },
    {
      field: 'payment_status',
      headerName: textT?.table?.payment_status?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => {
        const label = labelsT?.paymentStatus?.[params.row.payment_status] || 'Unknown';
        const status: keyof typeof paymentStatusColors = params.row.payment_status as keyof typeof paymentStatusColors;
        const color = (paymentStatusColors[status] as any) || 'info';

        return (
          <div className="h-full inline-flex flex-col justify-center py-2">
            <Chip label={label} color={color} size="small" variant="outlined" />
          </div>
        );
      }
    },
    {
      field: 'created_at',
      headerName: textT?.table?.created_at?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment(params.row.created_at).format(textT?.table?.created_at?.dateFormat)}
        </div>
      )
    },
    {
      field: '',
      type: 'actions',
      headerName: textT?.table?.actions?.title,
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      renderCell: (params: any) => {
        return (
          <>
            {canDelete && (
              <Tooltip title={textT?.table?.actions?.deleteLabel} placement="top">
                <IconButton
                  aria-label={textT?.table?.actions?.deleteLabel}
                  color="primary"
                  size="small"
                  onClick={() => {
                    handleDeleteOpen(params.row.id, params.row.tracking);
                  }}>
                  <i className="ri-delete-bin-2-fill" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      }
    }
  ];

  const paymentStatusOptions = useMemo(
    () =>
      Object.keys(labelsT?.paymentStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.paymentStatus?.[key] || key
      })),
    [labelsT]
  );

  const statusOptions = useMemo(
    () =>
      Object.keys(labelsT?.packageStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.packageStatus?.[key] || key
      })),
    [labelsT]
  );

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex justify-between mb-3">
            <Typography variant="h3">{textT?.title}</Typography>
            <div className="flex items-center gap-2"></div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterSearch
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                onSearch={handleFetchPackages}
              />
              <FilterSelect
                allLabel={textT?.filterPaymentStatus}
                options={paymentStatusOptions}
                value={paymentStatusState}
                onChange={(e) => setPaymentStatusState(e.target.value)}
              />
              <FilterSelect
                allLabel={textT?.filterStatus}
                options={statusOptions}
                value={statusState}
                onChange={(e) => setStatusState(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                size="small"
                type="button"
                variant="contained"
                color="primary"
                startIcon={<i className="ri-file-download-line" />}
                onClick={() => handleExport()}>
                {textT?.btnExport}
              </Button>
            </div>
          </div>
          <Paper>
            <DataGrid
              loading={rowsState.isLoading}
              rows={rowsState.data}
              columns={columns}
              rowCount={rowsState.total}
              pagination
              paginationMode="server"
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationState}
              onPaginationModelChange={setPaginationState}
              checkboxSelection={false}
              disableRowSelectionOnClick
              disableColumnMenu
              density="standard"
              localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
              sx={{ minHeight: 500 }}
              getRowHeight={() => 'auto'}
            />
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={deleteState.open}
        onClose={handleDeleteClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{textT?.dialogDeleteTitle}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText id="alert-dialog-description">
            {textT?.dialogDeleteMessage?.replace('{{ tracking }}', deleteState.tracking)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={handleDeleteClose} disabled={deleteState.loading}>
            {textT?.btnCancel}
          </Button>
          <Button variant="text" color="primary" onClick={handleDelete} loading={deleteState.loading}>
            {textT?.btnContinue}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={alertState.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity={alertState.type} variant="filled" sx={{ width: '100%' }}>
          {alertState.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default Packages;
