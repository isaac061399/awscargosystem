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
import { requestDeleteOrder, requestGetOrders } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  PENDING: 'warning',
  ON_THE_WAY: 'primary',
  READY: 'info',
  DELIVERED: 'success'
};

const paymentStatusColors: any = {
  PENDING: 'warning',
  PAID: 'success'
};

const Orders = () => {
  const { data: admin } = useAdmin();
  const canCreate = hasAllPermissions('orders.create', admin.permissions);
  const canEdit = hasAllPermissions('orders.edit', admin.permissions);
  const canDelete = hasAllPermissions('orders.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('orders:text', { returnObjects: true, default: {} }), [t]);
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
    title: null
  });

  useEffect(() => {
    handleFetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, paymentStatusState, statusState]);

  const handleFetchOrders = async () => {
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

    const result = await requestGetOrders(params, i18n.language);

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

  const handleDeleteOpen = (id: number, title: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, id, title }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setAlertState({ ...defaultAlertState });
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestDeleteOrder(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchOrders();
    }
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: textT?.table?.id?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {canEdit ? (
            <Link
              href={`/orders/edit/${params.row.id}`}
              className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
              {params.row.id}
            </Link>
          ) : (
            params.row.id
          )}
        </div>
      )
    },
    {
      field: 'number',
      headerName: textT?.table?.number?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">{params.row.number}</div>
      )
    },
    {
      field: 'client',
      headerName: textT?.table?.client?.title,
      flex: 1,
      minWidth: 300,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>{params.row.client.full_name}</span>
          <span>
            <strong>{textT?.table?.client?.box_number}</strong>: {params.row.client.box_number}
          </span>
          <span>
            <strong>{textT?.table?.client?.identification}</strong>: {params.row.client.identification}
          </span>
          <span>
            <strong>{textT?.table?.client?.email}</strong>: {params.row.client.email}
          </span>
        </div>
      )
    },
    {
      field: 'payment_status',
      headerName: textT?.table?.payment_status?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => {
        const label = labelsT?.orderPaymentStatus?.[params.row.payment_status] || 'Unknown';
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
      field: 'status',
      headerName: textT?.table?.status?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => {
        const label = labelsT?.orderStatus?.[params.row.status] || 'Unknown';
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
      field: 'created_at',
      headerName: textT?.table?.created_at?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment.utc(params.row.created_at).format(textT?.table?.created_at?.dateFormat)}
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
                    handleDeleteOpen(params.row.id, params.row.title);
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
      Object.keys(labelsT?.orderPaymentStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.orderPaymentStatus?.[key] || key
      })),
    [labelsT]
  );

  const statusOptions = useMemo(
    () =>
      Object.keys(labelsT?.orderStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.orderStatus?.[key] || key
      })),
    [labelsT]
  );

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex justify-between mb-3">
            <Typography variant="h3">{textT?.title}</Typography>
            <div className="flex items-center gap-2">
              {canCreate && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  LinkComponent={Link}
                  href="/orders/new"
                  startIcon={<i className="ri-add-large-line" />}>
                  {textT?.btnCreate}
                </Button>
              )}
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <div className="flex gap-2">
            <FilterSearch
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              onSearch={handleFetchOrders}
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
            {textT?.dialogDeleteMessage?.replace('{{ title }}', deleteState.title)}
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

export default Orders;
