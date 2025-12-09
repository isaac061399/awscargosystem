'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';

import { useTranslation } from 'react-i18next';
import moment from 'moment';

// MUI Imports
import { Button, Card, CardContent, Chip, Divider, Grid, IconButton, Paper, Tooltip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Helpers Imports
// import { requestGetPackages } from '@/helpers/request';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Utils Imports
import { formatMoney, generateUrl } from '@libs/utils';

const statusColors: any = {
  PENDING: 'warning',
  APPROVED: 'primary',
  PAID: 'success',
  CANCELED: 'error'
};

const Packages = ({ client }: { client?: any }) => {
  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('packages.edit', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('clients-edition:tabs.packages', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });

  useEffect(() => {
    handleFetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const handleFetchPackages = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      client_id: client?.id || 0
    };

    // const result = await requestGetPackages(params, i18n.language);
    const result = { valid: false };

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
    const exportUrl = generateUrl('/api/packages/export', {
      client_id: client?.id || 0
    });

    window.open(exportUrl, '_blank');
  };

  // data
  const columns: GridColDef[] = [
    {
      field: '',
      type: 'actions',
      headerName: textT?.table?.actions?.title,
      headerAlign: 'center',
      renderCell: (params: any) => {
        return (
          <>
            {canEdit && (
              <Tooltip title={textT?.table?.actions?.editLabel} placement="top">
                <IconButton
                  aria-label={textT?.table?.actions?.editLabel}
                  color="primary"
                  size="small"
                  LinkComponent={Link}
                  href={`/packages/edit/${params.row.id}`}>
                  <i className="ri-edit-box-fill" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      }
    },
    {
      field: 'beneficiary',
      headerName: textT?.table?.beneficiary?.title,
      flex: 1,
      minWidth: 300,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>{params.row.beneficiary.full_name}</span>
          <span>
            <strong>{textT?.table?.beneficiary?.identification}</strong>: {params.row.beneficiary.identification}
          </span>
          <span>
            <strong>{textT?.table?.beneficiary?.email}</strong>: {params.row.beneficiary.email}
          </span>
        </div>
      )
    },
    {
      field: 'amount',
      headerName: textT?.table?.detail?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          <span>
            <strong>{textT?.table?.detail?.amount}</strong>: {formatMoney(params.row.amount)}
          </span>
          <span>
            <strong>{textT?.table?.detail?.interest}</strong>: {params.row.interest}%
          </span>
          <span>
            <strong>{textT?.table?.detail?.installments}</strong>: {params.row.installments}
          </span>
        </div>
      )
    },
    {
      field: 'balance',
      headerName: textT?.table?.balance?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">{formatMoney(params.row.balance)}</div>
      )
    },
    {
      field: 'start_date',
      headerName: textT?.table?.start_date?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment.utc(params.row.start_date).format(textT?.table?.start_date?.dateFormat)}
        </div>
      )
    },
    {
      field: 'next_payment',
      headerName: textT?.table?.next_payment?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {moment.utc(params.row.next_payment).format(textT?.table?.next_payment?.dateFormat)}
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
    }
  ];

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <div className="flex items-center justify-end mb-6">
              <div className="flex items-center gap-2">
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

            <Divider sx={{ my: 6 }} />

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

export default Packages;
