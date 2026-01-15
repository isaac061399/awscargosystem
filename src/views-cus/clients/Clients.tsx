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

// Components Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import FilterSearch from '@/components/data-tables/FilterSearch';
import FilterSelect from '@/components/data-tables/FilterSelect';

// Helpers Imports
import { requestDeleteClient, requestGetClients } from '@/helpers/request';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

import { generateUrl } from '@/libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors = {
  ACTIVE: 'success',
  INACTIVE: 'error'
};

const Clients = () => {
  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('clients.edit', admin.permissions);
  const canDelete = hasAllPermissions('clients.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('clients:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');
  const [statusState, setStatusState] = useState('');

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    full_name: null
  });

  useEffect(() => {
    handleFetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, statusState]);

  const handleFetchClients = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState,
      status: statusState
    };

    const result = await requestGetClients(params, i18n.language);

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

  const handleDeleteOpen = (id: number, full_name: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, id, full_name }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setAlertState({ ...defaultAlertState });
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestDeleteClient(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchClients();
    }
  };

  const handleExport = async () => {
    const exportUrl = generateUrl('/api/clients/export', {
      s: searchState,
      status: statusState
    });

    window.open(exportUrl, '_blank');
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: textT?.table?.mailbox?.title,
      flex: 1,
      minWidth: 100,
      renderCell: (params) =>
        canEdit ? (
          <Link
            href={`/clients/edit/${params.row.id}`}
            className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
            {`${params.row.office?.mailbox_prefix}${params.row.id}`}
          </Link>
        ) : (
          `${params.row.office?.mailbox_prefix}${params.row.id}`
        )
    },
    {
      field: 'office',
      headerName: textT?.table?.office?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => `${params.row.office?.name || ''}`
    },
    {
      field: 'full_name',
      headerName: textT?.table?.full_name?.title,
      flex: 1,
      minWidth: 250
    },
    {
      field: 'identification',
      headerName: textT?.table?.identification?.title,
      flex: 1,
      minWidth: 250,
      renderCell: (params: any) =>
        `${labelsT?.identificationType?.[params.row.identification_type]}: ${params.row.identification}`
    },
    {
      field: 'email',
      headerName: textT?.table?.email?.title,
      flex: 1,
      minWidth: 250
    },
    {
      field: 'status',
      headerName: textT?.table?.status?.title,
      flex: 1,
      minWidth: 100,
      renderCell: (params: any) => {
        const label = labelsT?.clientStatus?.[params.row.status] || 'Unknown';
        const status: keyof typeof statusColors = params.row.status as keyof typeof statusColors;
        const color = (statusColors[status] as any) || 'info';

        return <Chip label={label} color={color} size="small" variant="outlined" />;
      }
    },
    {
      field: '',
      type: 'actions',
      headerName: textT?.table?.actions?.title,
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
                    handleDeleteOpen(params.row.id, params.row.full_name);
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

  const statusOptions = useMemo(
    () =>
      Object.keys(labelsT?.clientStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.clientStatus?.[key] || key
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
              <Button
                size="small"
                variant="contained"
                color="primary"
                LinkComponent={Link}
                href="/clients/new"
                startIcon={<i className="ri-add-large-line" />}>
                {textT?.btnCreate}
              </Button>
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterSearch
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                onSearch={handleFetchClients}
              />
              <FilterSelect
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
            {textT?.dialogDeleteMessage?.replace('{{ full_name }}', deleteState.full_name)}
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

export default Clients;
