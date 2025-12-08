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
import LocaleFilter from '@components/LocaleFilter';
import ClearCacheButton from '@/components/layout/shared/ClearCacheButton';

// Helpers Imports
import { requestDeleteMenu, requestGetMenus } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

import i18nConfigApp from '@/configs/i18nConfigApp';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Menus = () => {
  const { data: admin } = useAdmin();
  const canCreate = hasAllPermissions('menus.create', admin.permissions);
  const canEdit = hasAllPermissions('menus.edit', admin.permissions);
  const canDelete = hasAllPermissions('menus.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('menus:text', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');
  const [localeState, setLocaleState] = useState('all');

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    name: null
  });

  useEffect(() => {
    handleFetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, localeState]);

  const handleFetchMenus = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      locale: localeState !== 'all' ? localeState : undefined,
      s: searchState
    };

    const result = await requestGetMenus(params, i18n.language);

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

    const result = await requestDeleteMenu(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchMenus();
    }
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'slug',
      headerName: textT?.table?.slug?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params) =>
        canEdit ? (
          <Link
            href={`/menus/edit/${params.row.id}`}
            className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
            {params.row.slug}
          </Link>
        ) : (
          params.row.slug
        )
    },
    {
      field: 'name',
      headerName: textT?.table?.name?.title,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'locale',
      headerName: textT?.table?.locale?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params) =>
        `${i18nConfigApp.localesLabel[params.row.locale as keyof typeof i18nConfigApp.localesLabel]}`
    },
    {
      field: 'published_at',
      headerName: textT?.table?.published_at?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => {
        const statusChip: any = {
          label: textT?.table?.published_at?.values?.draft,
          color: 'info'
        };

        if (params.row.published_at) {
          const publishAt = moment(params.row.published_at);

          if (moment().isAfter(publishAt)) {
            statusChip.label = textT?.table?.published_at?.values?.published;
            statusChip.color = 'success';
          } else {
            statusChip.label = `${textT?.table?.published_at?.values?.publishAt}:\n${publishAt.format(textT?.table?.published_at?.dateFormat)}`;
            statusChip.color = 'warning';
          }
        }

        return <Chip label={statusChip.label} color={statusChip.color} size="small" variant="outlined" />;
      }
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
            {canCreate && (
              <Tooltip title={textT?.table?.actions?.duplicateLabel} placement="top">
                <IconButton
                  aria-label={textT?.table?.actions?.duplicateLabel}
                  color="primary"
                  size="small"
                  LinkComponent={Link}
                  href={`/menus/new?ref=${params.row.id}`}>
                  <i className="ri-file-copy-fill" />
                </IconButton>
              </Tooltip>
            )}
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
              <ClearCacheButton size="small" variant="contained" />
              {canCreate && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  LinkComponent={Link}
                  href="/menus/new"
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
              onSearch={handleFetchMenus}
            />
            <LocaleFilter
              value={localeState}
              onChange={(e) => {
                setLocaleState(e.target.value);
              }}
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

export default Menus;
