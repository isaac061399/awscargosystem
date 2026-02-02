'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// MUI Imports
import type { SnackbarCloseReason } from '@mui/material';
import { Alert, Button, Chip, Divider, Grid, Paper, Snackbar, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Others Imports
import moment from 'moment';

// Components Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import FilterSearch from '@components/data-tables/FilterSearch';
import FilterSelect from '@/components/data-tables/FilterSelect';

// Helpers Imports
import { requestGetInvoices } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

import { generateUrl } from '@/libs/utils';
import { paymentConditionsDays } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const statusColors: any = {
  PENDING: 'warning',
  PAID: 'success',
  CANCELED: 'error'
};

const Invoices = ({ credits }: { credits: boolean }) => {
  const { data: admin } = useAdmin();
  const canView = hasAllPermissions('invoices.view', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('invoices:text', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');
  const [statusState, setStatusState] = useState('');

  useEffect(() => {
    handleFetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, statusState]);

  const handleFetchInvoices = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      credits: credits ? 'true' : undefined,
      cash: !credits ? 'true' : undefined,
      s: searchState,
      status: statusState
    };

    const result = await requestGetInvoices(params, i18n.language);

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

  const handleExport = async () => {
    const exportUrl = generateUrl('/api/invoices/export', {
      credits: credits ? 'true' : undefined,
      cash: !credits ? 'true' : undefined,
      s: searchState,
      status: statusState
    });

    window.open(exportUrl, '_blank');
  };

  // data
  const columns: GridColDef[] = [
    {
      field: 'consecutive',
      headerName: textT?.table?.consecutive?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {canView ? (
            <Link
              href={`/invoices/view/${params.row.id}`}
              className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
              {params.row.consecutive}
            </Link>
          ) : (
            params.row.consecutive
          )}
        </div>
      )
    },
    {
      field: 'cash_register.office',
      headerName: textT?.table?.office?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">{params.row.cash_register?.office?.name}</div>
      )
    },
    {
      field: 'client',
      headerName: textT?.table?.client?.title,
      flex: 1,
      minWidth: 300,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>
            <strong>
              {`${params.row.client?.office?.mailbox_prefix}${params.row.client?.id}`} | {params.row.client?.full_name}
            </strong>
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
      field: 'type',
      headerName: textT?.table?.type?.title,
      flex: 1,
      minWidth: 300,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>
            <strong>{textT?.table?.type?.type}</strong>: {labelsT?.invoiceType?.[params.row.type]}
          </span>
          <span>
            <strong>{textT?.table?.type?.paymentCondition}</strong>:{' '}
            {labelsT?.invoicePaymentCondition?.[params.row.payment_condition]}
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
        const label = labelsT?.invoiceStatus?.[params.row.status] || 'Unknown';
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
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment(params.row.created_at).format(textT?.table?.created_at?.dateFormat)}
        </div>
      )
    }
  ];

  if (credits) {
    columns.push({
      field: 'expired_at',
      headerName: textT?.table?.expired_at?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment(params.row.created_at)
            .add(paymentConditionsDays[params.row.payment_condition as keyof typeof paymentConditionsDays], 'days')
            .format(textT?.table?.expired_at?.dateFormat)}
        </div>
      )
    });
  }

  const statusOptions = useMemo(
    () =>
      Object.keys(labelsT?.invoiceStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.invoiceStatus?.[key] || key
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
                onSearch={handleFetchInvoices}
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

export default Invoices;
