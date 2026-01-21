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
import DashboardLayout from '@components/layout/DashboardLayout';
import FilterSearch from '@components/data-tables/FilterSearch';

// Helpers Imports
import { requestDeleteOffice, requestGetOffices } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';
import { padStartZeros } from '@/libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Offices = () => {
  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('offices.edit', admin.permissions);
  const canDelete = hasAllPermissions('offices.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('offices:text', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    name: null
  });

  useEffect(() => {
    handleFetchOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const handleFetchOffices = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState
    };

    const result = await requestGetOffices(params, i18n.language);

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

  const handleDeleteOpen = (id: number, name: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, id, name }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setAlertState({ ...defaultAlertState });
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestDeleteOffice(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchOffices();
    }
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      flex: 1,
      minWidth: 100,
      renderCell: (params) =>
        canEdit ? (
          <Link
            href={`/offices/edit/${params.row.id}`}
            className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
            {padStartZeros(params.row.id, 3)}
          </Link>
        ) : (
          padStartZeros(params.row.id, 3)
        )
    },
    {
      field: 'name',
      headerName: textT?.table?.name?.title,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'mailbox_prefix',
      headerName: textT?.table?.mailbox_prefix?.title,
      flex: 1,
      minWidth: 100
    },
    {
      field: 'enabled',
      headerName: textT?.table?.enabled?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => {
        const statusChip: any = {
          label: params.row.enabled ? textT?.table?.enabled?.active : textT?.table?.enabled?.inactive,
          color: params.row.enabled ? 'success' : 'error'
        };

        return <Chip label={statusChip.label} color={statusChip.color} size="small" variant="outlined" />;
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
                    handleDeleteOpen(params.row.id, params.row.name);
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
                href="/offices/new"
                startIcon={<i className="ri-add-large-line" />}>
                {textT?.btnCreate}
              </Button>
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FilterSearch
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            onSearch={handleFetchOffices}
          />
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
            {textT?.dialogDeleteMessage?.replace('{{ name }}', deleteState.name)}
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

export default Offices;
