'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

// MUI Imports
import type { SnackbarCloseReason } from '@mui/material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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

// Other Imports
import moment from 'moment';

// Helpers Imports
import { requestDeleteMedia, requestGetMedia } from '@helpers/request';

// Components Imports
import FilterSearch from '@components/data-tables/FilterSearch';
import MediaLibraryAdd from './MediaLibraryAdd';

import { imageContentTypes } from '@libs/constants';
import { formatBytes } from '@libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

interface MediaLibrarySelectorProps {
  title?: string;
  canAdd?: boolean;
  canDelete?: boolean;
  onSelect?: (media: any) => void;
  onCancel?: () => void;
}

const MediaLibrarySelector = ({ title, canAdd, canDelete, onSelect, onCancel }: MediaLibrarySelectorProps) => {
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('media-selector:list', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const hasSelect = Boolean(onSelect);
  const hasCancel = Boolean(onCancel);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [itemSelected, setItemSelected] = useState<any>(false);
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    name: null
  });

  const [viewState, setViewState] = useState<any>({
    open: false,
    media: null
  });

  useEffect(() => {
    handleFetchMediaLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const handleFetchMediaLibrary = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState
    };

    const result = await requestGetMedia(params, i18n.language);

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

    const result = await requestDeleteMedia(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchMediaLibrary();
    }
  };

  const handleAdd = () => {
    handleFetchMediaLibrary();
  };

  const handledCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAlertState({ open: true, type: 'success', message: textT?.table?.actions?.copySuccessLabel });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setAlertState({ open: false, type: 'success', message: textT?.table?.actions?.copySuccessLabel });
    }
  };

  const handleViewOpen = (media: any) => {
    setViewState((prevState: any) => ({ ...prevState, open: true, media }));
  };

  const handleViewClose = () => {
    setViewState((prevState: any) => ({ ...prevState, open: false }));
  };

  const handleSelect = () => {
    if (!onSelect) return;

    onSelect(itemSelected);
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: textT?.table?.name?.title,
      flex: 1,
      minWidth: 400,
      renderCell: (params: any) => {
        return (
          <Box display="flex" alignItems="center" height="100%">
            <Image
              src={params.row.thumbnail}
              alt={params.row.name}
              width={75}
              height={75}
              style={{ objectFit: 'cover' }}
            />
            <Typography variant="body1" className="ml-2">
              {params.row.name}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'type',
      headerName: textT?.table?.type?.title,
      flex: 1,
      minWidth: 200,
      valueFormatter: (value) => imageContentTypes[value] || ''
    },
    {
      field: 'size',
      headerName: textT?.table?.size?.title,
      flex: 1,
      minWidth: 200,
      valueFormatter: (value) => formatBytes(value)
    },
    {
      field: 'updated_at',
      headerName: textT?.table?.updated_at?.title,
      flex: 1,
      minWidth: 200,
      type: 'dateTime',
      valueFormatter: (value) => moment(value).format(textT?.table?.updated_at?.format)
    },
    {
      field: '',
      type: 'actions',
      headerName: textT?.table?.actions?.title,
      headerAlign: 'center',
      renderCell: (params: any) => {
        return (
          <>
            <Tooltip title={textT?.table?.actions?.viewLabel} placement="top">
              <IconButton
                aria-label={textT?.table?.actions?.viewLabel}
                color="primary"
                size="small"
                onClick={() => handleViewOpen(params.row)}>
                <i className="ri-eye-line" />
              </IconButton>
            </Tooltip>
            <Tooltip title={textT?.table?.actions?.copyLabel} placement="top">
              <IconButton
                aria-label={textT?.table?.actions?.copyLabel}
                color="primary"
                size="small"
                onClick={() => handledCopy(params.row.src)}>
                <i className="ri-link-m" />
              </IconButton>
            </Tooltip>
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

  if (hasSelect) {
    columns.unshift({
      field: 'id',
      headerName: '',
      flex: 1,
      minWidth: 60,
      maxWidth: 60,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: any) => {
        return (
          <Checkbox
            checked={itemSelected && itemSelected.id === params.row.id}
            onChange={(e) => {
              if (e.target.checked) {
                setItemSelected(params.row);
              } else {
                setItemSelected(false);
              }
            }}
          />
        );
      }
    });
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className="flex justify-between mb-3">
          <Typography variant="h3">{title}</Typography>
          <div className="flex items-center gap-2">{canAdd && <MediaLibraryAdd onFinish={handleAdd} />}</div>
        </div>
        <Divider />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FilterSearch
          value={searchState}
          onChange={(e) => setSearchState(e.target.value)}
          onSearch={handleFetchMediaLibrary}
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
            rowHeight={85}
            density="standard"
            localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
            sx={{ minHeight: 500 }}
          />
        </Paper>

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

        <Dialog
          open={viewState.open}
          onClose={handleViewClose}
          maxWidth="xl"
          scroll="paper"
          aria-labelledby="media-create-title">
          <DialogTitle id="media-create-title">
            <Typography variant="h4" component="span">
              {viewState.media?.name}
            </Typography>
            <Typography variant="body1" component="span" sx={{ ml: 2 }}>
              {formatBytes(viewState.media?.size || 0)}
            </Typography>
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleViewClose}
            sx={(theme) => ({
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500]
            })}>
            <i className="ri-close-line" />
          </IconButton>
          <DialogContent dividers>
            <Image
              src={viewState.media?.src}
              alt={viewState.media?.name}
              width={viewState.media?.width}
              height={viewState.media?.height}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </DialogContent>
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
      </Grid>
      {(hasSelect || hasCancel) && (
        <Grid size={{ xs: 12 }}>
          <Divider />
          <div className="flex justify-end gap-3 mt-3">
            {hasCancel && (
              <Button variant="contained" color="secondary" onClick={onCancel}>
                {textT?.btnCancel}
              </Button>
            )}
            {hasSelect && (
              <Button variant="contained" color="primary" onClick={handleSelect} disabled={!itemSelected}>
                {textT?.btnSelect}
              </Button>
            )}
          </div>
        </Grid>
      )}
    </Grid>
  );
};

export default MediaLibrarySelector;
