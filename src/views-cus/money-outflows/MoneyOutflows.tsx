'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import moment from 'moment';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

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
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Components Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import FilterSearch from '@/components/data-tables/FilterSearch';
import Select from '@/components/Select';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestDeleteMoneyOutflow, requestGetMoneyOutflows, requestNewMoneyOutflow } from '@/helpers/request';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Utility Imports
import { formatMoney, generateUrl } from '@/libs/utils';
import { Currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const MoneyOutflows = () => {
  const { data: admin } = useAdmin();
  const canCreate = hasAllPermissions('money-outflows.create', admin.permissions);
  const canDelete = hasAllPermissions('money-outflows.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('money-outflows:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('money-outflows:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [searchState, setSearchState] = useState('');
  const [createState, setCreateState] = useState({ open: false });

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    description: null
  });

  useEffect(() => {
    handleFetchMoneyOutflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState]);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        currency: Object.keys(labelsT?.currency)[0] || '',
        amount: '',
        description: '',
        method: Object.keys(labelsT?.paymentMethod)[0] || ''
      }),
      [labelsT]
    ),
    validationSchema: yup.object({
      currency: yup.string().required(formT?.errors?.currency),
      amount: yup.number().typeError(formT?.errors?.invalidAmount).required(formT?.errors?.amount),
      description: yup.string().required(formT?.errors?.description),
      method: yup.string().required(formT?.errors?.method)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const data = {
          currency: values.currency,
          amount: values.amount,
          method: values.method,
          description: values.description
        };

        const result = await requestNewMoneyOutflow(data, i18n.language);

        handleCreateClose();

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        handleFetchMoneyOutflows();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        handleCreateClose();

        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const handleFetchMoneyOutflows = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      s: searchState
    };

    const result = await requestGetMoneyOutflows(params, i18n.language);

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

  const handleCreateOpen = async () => {
    setAlertState({ ...defaultAlertState });

    setCreateState({ open: true });
  };

  const handleCreateClose = () => {
    setCreateState({ open: false });
    formik.resetForm();
  };

  const handleDeleteOpen = (id: number, description: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, id, description }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setAlertState({ ...defaultAlertState });
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestDeleteMoneyOutflow(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchMoneyOutflows();
    }
  };

  const handleExport = async () => {
    const exportUrl = generateUrl('/api/money-outflows/export', {
      s: searchState
    });

    window.open(exportUrl, '_blank');
  };

  // data
  const columns: GridColDef[] = [
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
      field: 'amount',
      headerName: textT?.table?.amount?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {formatMoney(params.row.amount, `${Currencies[params.row.currency]?.symbol || ''} `)}
        </div>
      )
    },
    {
      field: 'description',
      headerName: textT?.table?.description?.title,
      flex: 1,
      minWidth: 200,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">{params.row.description}</div>
      )
    },
    {
      field: 'method',
      headerName: textT?.table?.method?.title,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <div className="h-full inline-flex flex-col justify-center py-2">
          {labelsT?.paymentMethod[params.row.method]}
        </div>
      )
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
                    handleDeleteOpen(params.row.id, params.row.description);
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
              {canCreate && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<i className="ri-add-large-line" />}
                  onClick={() => handleCreateOpen()}>
                  {textT?.btnCreate}
                </Button>
              )}
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterSearch
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                onSearch={handleFetchMoneyOutflows}
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

      {canCreate && (
        <Dialog
          open={createState.open}
          onClose={handleCreateClose}
          aria-labelledby="dialog-add-balance-title"
          maxWidth="sm"
          fullWidth>
          <form noValidate onSubmit={formik.handleSubmit}>
            <DialogTitle id="dialog-add-balance-title">{textT?.dialogCreateTitle}</DialogTitle>
            <DialogContent dividers className="flex flex-col gap-6">
              <Select
                options={Object.keys(labelsT?.currency).map((value) => ({
                  value,
                  label: labelsT?.currency[value]
                }))}
                fullWidth
                required
                id="currency"
                name="currency"
                label={formT?.labels?.currency}
                placeholder={formT?.placeholders?.currency}
                value={formik.values.currency}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.currency && formik.errors.currency)}
                color={Boolean(formik.touched.currency && formik.errors.currency) ? 'error' : 'primary'}
                helperText={formik.touched.currency && (formik.errors.currency as string)}
                disabled={formik.isSubmitting}
              />
              <MoneyField
                fullWidth
                required
                type="text"
                decimalScale={2}
                decimalSeparator="."
                thousandSeparator=","
                prefix={`${Currencies[formik.values.currency]?.symbol || ''} `}
                id="amount"
                name="amount"
                label={formT?.labels?.amount}
                placeholder={formT?.placeholders?.amount}
                value={formik.values.amount}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.amount && formik.errors.amount)}
                color={Boolean(formik.touched.amount && formik.errors.amount) ? 'error' : 'primary'}
                helperText={formik.touched.amount && (formik.errors.amount as string)}
                disabled={formik.isSubmitting}
              />
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                type="text"
                id="description"
                name="description"
                label={formT?.labels?.description}
                placeholder={formT?.placeholders?.description}
                value={formik.values.description}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.description && formik.errors.description)}
                color={Boolean(formik.touched.description && formik.errors.description) ? 'error' : 'primary'}
                helperText={formik.touched.description && (formik.errors.description as string)}
                disabled={formik.isSubmitting}
              />
              <Select
                options={Object.keys(labelsT?.paymentMethod).map((value) => ({
                  value,
                  label: labelsT?.paymentMethod[value]
                }))}
                fullWidth
                required
                id="method"
                name="method"
                label={formT?.labels?.method}
                placeholder={formT?.placeholders?.method}
                value={formik.values.method}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.method && formik.errors.method)}
                color={Boolean(formik.touched.method && formik.errors.method) ? 'error' : 'primary'}
                helperText={formik.touched.method && (formik.errors.method as string)}
                disabled={formik.isSubmitting}
              />
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={handleCreateClose} disabled={formik.isSubmitting}>
                {textT?.btnCancel}
              </Button>
              <Button type="submit" variant="text" color="primary" loading={formik.isSubmitting}>
                {textT?.btnSave}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteState.open}
          onClose={handleDeleteClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">{textT?.dialogDeleteTitle}</DialogTitle>
          <DialogContent dividers>
            <DialogContentText id="alert-dialog-description">
              {textT?.dialogDeleteMessage?.replace('{{ description }}', deleteState.description)}
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
      )}

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

export default MoneyOutflows;
