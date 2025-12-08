'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Chip, Divider, Grid, Paper, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Components Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import FilterSearch from '@components/data-tables/FilterSearch';

// Helpers Imports
import { requestGetUsers } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

const Users = () => {
  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('users.edit', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('users:text', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');

  useEffect(() => {
    handleFetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const handleFetchUsers = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState
    };

    const result = await requestGetUsers(params, i18n.language);

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

  // data
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: textT?.table?.name?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params) =>
        canEdit ? (
          <Link
            href={`/users/edit/${params.row.id}`}
            className="font-medium underline underline-offset-2 hover:no-underline hover:text-primary transition">
            {params.row.name}
          </Link>
        ) : (
          params.row.name
        )
    },
    {
      field: 'email',
      headerName: textT?.table?.email?.title,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'status',
      headerName: textT?.table?.status?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => {
        const label = params.row.enabled
          ? textT?.table?.status?.values?.active
          : textT?.table?.status?.values?.inactive;

        const color = params.row.enabled ? 'success' : 'error';

        return <Chip label={label} color={color} size="small" variant="outlined" />;
      }
    }
  ];

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex justify-between mb-3">
            <Typography variant="h3">{textT?.title}</Typography>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FilterSearch
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            onSearch={handleFetchUsers}
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
    </DashboardLayout>
  );
};

export default Users;
