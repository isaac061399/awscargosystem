'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';

import { useTranslation } from 'react-i18next';
import moment from 'moment';

// MUI Imports
import type { SnackbarCloseReason } from '@mui/material';
import { Alert, Chip, Divider, Grid, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Components Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import FilterSearch from '@/components/data-tables/FilterSearch';
import FilterSelect from '@/components/data-tables/FilterSelect';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Helpers Imports
import { requestGetCashRegisters } from '@/helpers/request';
import { padStartZeros } from '@/libs/utils';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  OPEN: 'primary',
  CLOSED: 'success'
};

const CashRegisters = () => {
  const { data: admin } = useAdmin();
  const canView = hasAllPermissions('cash-registers.view', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('cash-registers:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');
  const [statusState, setStatusState] = useState('');

  useEffect(() => {
    handleFetchCashRegisters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, statusState]);

  const handleFetchCashRegisters = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState,
      status: statusState
    };

    const result = await requestGetCashRegisters(params, i18n.language);

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

  const handlePrintTicket = async (id: number) => {
    const pdfUrl = `/api/cash-registers/${id}/ticket`;
    const win = window.open(pdfUrl, '_blank');

    if (win) {
      // Auto print when the new tab loads
      win.onload = () => {
        win.print();
      };
    }
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: textT?.table?.id?.title,
      flex: 1,
      minWidth: 100,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {canView ? (
            <Link
              href={`/cash-registers/view/${params.row.id}`}
              className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
              {padStartZeros(params.row.id, 4)}
            </Link>
          ) : (
            padStartZeros(params.row.id, 4)
          )}
        </div>
      )
    },
    {
      field: 'administrator',
      headerName: textT?.table?.administrator?.title,
      flex: 1,
      minWidth: 300,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>{params.row.administrator.full_name}</span>
          <span>
            <strong>{textT?.table?.administrator?.email}</strong>: {params.row.administrator.email}
          </span>
        </div>
      )
    },
    {
      field: 'office',
      headerName: textT?.table?.office?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">{params.row.office?.name}</div>
      )
    },
    {
      field: 'open_date',
      headerName: textT?.table?.open_date?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment(params.row.open_date).format(textT?.table?.open_date?.dateFormat)}
        </div>
      )
    },
    {
      field: 'close_date',
      headerName: textT?.table?.close_date?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {params.row.close_date ? moment(params.row.close_date).format(textT?.table?.close_date?.dateFormat) : ''}
        </div>
      )
    },
    {
      field: 'status',
      headerName: textT?.table?.status?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => {
        const label = labelsT?.cashRegisterStatus?.[params.row.status] || 'Unknown';
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
      field: '',
      type: 'actions',
      headerName: textT?.table?.actions?.title,
      headerAlign: 'center',
      renderCell: (params: any) => {
        return (
          <>
            <Tooltip title={textT?.table?.actions?.printLabel} placement="top">
              <IconButton
                aria-label={textT?.table?.actions?.printLabel}
                color="primary"
                size="small"
                onClick={() => handlePrintTicket(params.row.id)}>
                <i className="ri-printer-fill" />
              </IconButton>
            </Tooltip>
          </>
        );
      }
    }
  ];

  const statusOptions = useMemo(
    () =>
      Object.keys(labelsT?.cashRegisterStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.cashRegisterStatus?.[key] || key
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
                onSearch={handleFetchCashRegisters}
              />
              <FilterSelect
                options={statusOptions}
                value={statusState}
                onChange={(e) => setStatusState(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 mb-2"></div>
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

export default CashRegisters;
