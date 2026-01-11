'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

import moment from 'moment';

// MUI Imports
import type { SnackbarCloseReason } from '@mui/material';
import {
  Alert,
  Button,
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
import { requestDeleteUnownedPackage, requestGetUnownedPackages } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

const defaultAlertState = { open: false, type: 'success', message: '' };

const UnownedPackages = () => {
  const { data: admin } = useAdmin();
  const canDelete = hasAllPermissions('unowned-packages.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('unowned-packages:text', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    tracking: null
  });

  useEffect(() => {
    handleFetchUnownedPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const handleFetchUnownedPackages = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState
    };

    const result = await requestGetUnownedPackages(params, i18n.language);

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

    const result = await requestDeleteUnownedPackage(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchUnownedPackages();
    }
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'tracking',
      headerName: textT?.table?.tracking?.title,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'office_id',
      headerName: textT?.table?.office_id?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => params.row.office?.name || ''
    },
    {
      field: 'description',
      headerName: textT?.table?.description?.title,
      flex: 1,
      minWidth: 400,
      renderCell: (params: any) => (
        <Tooltip title={params.row.description || ''} arrow>
          <span>{params.row.description || ''}</span>
        </Tooltip>
      )
    },
    {
      field: 'created_at',
      headerName: textT?.table?.created_at?.title,
      flex: 1,
      minWidth: 200,
      valueFormatter: (value) => moment(value).format(textT?.table?.created_at?.format)
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
          <FilterSearch
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            onSearch={handleFetchUnownedPackages}
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

export default UnownedPackages;
