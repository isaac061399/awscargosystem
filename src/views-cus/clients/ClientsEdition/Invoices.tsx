'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';

import { useTranslation } from 'react-i18next';
import moment from 'moment';

// MUI Imports
import { Button, Card, CardContent, Chip, Grid, Paper } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Helpers Imports
import { requestGetInvoices } from '@/helpers/request';

// Components Imports
import FilterSearch from '@/components/data-tables/FilterSearch';
import FilterSelect from '@/components/data-tables/FilterSelect';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Utils Imports
import { generateUrl } from '@libs/utils';
import { InvoicePaymentCondition } from '@/prisma/generated/enums';

const statusColors: any = {
  PENDING: 'warning',
  PAID: 'success',
  CANCELED: 'error'
};

const Invoices = ({ client }: { client?: any }) => {
  const { data: admin } = useAdmin();
  const canView = hasAllPermissions('invoices.view', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('clients-edition:tabs.invoices', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

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
      s: searchState,
      status: statusState,
      client_id: client?.id || 0
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

  const handleExport = async () => {
    const exportUrl = generateUrl('/api/invoices/export', {
      s: searchState,
      status: statusState,
      client_id: client?.id || 0
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
              target="_blank"
              rel="noopener noreferrer"
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
            {params.row.payment_condition !== InvoicePaymentCondition.CASH
              ? ` (${params.row.payment_condition_days} ${textT?.table?.type?.paymentConditionDays})`
              : ''}
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
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment(params.row.created_at).format(textT?.table?.created_at?.dateFormat)}
        </div>
      )
    }
  ];

  const statusOptions = useMemo(
    () =>
      Object.keys(labelsT?.invoiceStatus || {}).map((key) => ({
        value: key,
        label: labelsT?.invoiceStatus?.[key] || key
      })),
    [labelsT]
  );

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
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
                  {textT?.text?.btnExport}
                </Button>
              </div>
            </div>

            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Invoices;
