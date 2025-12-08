'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

// MUI Imports
import { Card, CardContent, Grid, Paper } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Helpers Imports
import { requestGetNotifications } from '@helpers/request';

const Notifications = ({ user }: { user: any }) => {
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('users-edition:tabs.notifications', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });

  useEffect(() => {
    handleFetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const handleFetchNotifications = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page
    };

    const result = await requestGetNotifications(user.id, params, i18n.language);

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
      field: 'title',
      headerName: textT?.table?.title?.title,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'message',
      headerName: textT?.table?.message?.title,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'created_at',
      headerName: textT?.table?.created_at?.title,
      flex: 1,
      minWidth: 200,
      type: 'dateTime',
      valueFormatter: (value) => moment(value).format(textT?.table?.created_at?.format)
    }
  ];

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
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

export default Notifications;
