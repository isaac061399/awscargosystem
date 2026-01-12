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
import DashboardLayout from '@components/layout/DashboardLayout';
import FilterSelect from '@components/data-tables/FilterSelect';
import Select from '@components/Select';

// Helpers Imports
import { requestDeletePushMessage, requestGetPushMessages, requestSendPushMessage } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

const defaultAlertState = { open: false, type: 'success', message: '' };

const PushMessages = () => {
  const { data: admin } = useAdmin();
  const canSend = hasAllPermissions('push-messages.send', admin.permissions);
  const canDelete = hasAllPermissions('push-messages.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('push-messages:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('push-messages:form', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [rowsState, setRowsState] = useState({ isLoading: false, data: [], total: 0 });
  const [paginationState, setPaginationState] = useState({ page: 0, pageSize: 10 });
  const [topicState, setTopicState] = useState('');
  const [createState, setCreateState] = useState({ open: false });

  const [deleteState, setDeleteState] = useState({
    open: false,
    loading: false,
    id: null,
    title: null
  });

  useEffect(() => {
    handleFetchPushMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState, topicState]);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        title: '',
        message: '',
        topic: Object.keys(textT?.topics)[0] || ''
      }),
      [textT]
    ),
    validationSchema: yup.object({
      title: yup.string().required(formT?.errors?.title).max(47, formT?.errors?.titleMax),
      message: yup.string().required(formT?.errors?.message).max(150, formT?.errors?.messageMax),
      topic: yup.string().required(formT?.errors?.topic)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const data = {
          title: values.title,
          message: values.message,
          topic: values.topic
        };

        const result = await requestSendPushMessage(data, i18n.language);

        handleCreateClose();

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        handleFetchPushMessages();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        handleCreateClose();

        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const handleFetchPushMessages = async () => {
    // start loading
    setRowsState((prevState) => ({ ...prevState, isLoading: true }));

    // params
    const params: any = {
      limit: paginationState.pageSize,
      offset: paginationState.pageSize * paginationState.page,
      topic: topicState
    };

    const result = await requestGetPushMessages(params, i18n.language);

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

  const handleDeleteOpen = (id: number, title: string) => {
    setDeleteState((prevState: any) => ({ ...prevState, open: true, id, title }));
  };

  const handleDeleteClose = () => {
    setDeleteState((prevState: any) => ({ ...prevState, open: false, loading: false }));
  };

  const handleDelete = async () => {
    setAlertState({ ...defaultAlertState });
    setDeleteState((prevState: any) => ({ ...prevState, loading: true }));

    const result = await requestDeletePushMessage(deleteState.id || 0, i18n.language);

    handleDeleteClose();

    if (!result.valid) {
      setAlertState({ open: true, type: 'error', message: result.message });
    } else {
      handleFetchPushMessages();
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
    },
    {
      field: 'topic',
      headerName: textT?.table?.topic?.title,
      flex: 1,
      minWidth: 200,
      type: 'dateTime',
      valueFormatter: (value) => textT?.topics?.[value] || value
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
                    handleDeleteOpen(params.row.id, params.row.title);
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

  const topicOptions = useMemo(
    () =>
      Object.keys(textT?.topics || {}).map((key) => ({
        value: key,
        label: textT?.topics?.[key] || key
      })),
    [textT]
  );

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex justify-between mb-3">
            <Typography variant="h3">{textT?.title}</Typography>
            <div className="flex items-center gap-2">
              {canSend && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<i className="ri-send-plane-fill"></i>}
                  onClick={handleCreateOpen}>
                  {textT?.btnSend}
                </Button>
              )}
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FilterSelect options={topicOptions} value={topicState} onChange={(e) => setTopicState(e.target.value)} />
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

      {canSend && (
        <Dialog
          open={createState.open}
          onClose={handleCreateClose}
          aria-labelledby="dialog-send-push-message-title"
          maxWidth="sm"
          fullWidth>
          <form noValidate onSubmit={formik.handleSubmit}>
            <DialogTitle id="dialog-send-push-message-title">{textT?.dialogSendTitle}</DialogTitle>
            <DialogContent dividers className="flex flex-col gap-6">
              <TextField
                fullWidth
                required
                type="text"
                id="title"
                name="title"
                label={formT?.labels?.title}
                placeholder={formT?.placeholders?.title}
                value={formik.values.title}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.title && formik.errors.title)}
                color={Boolean(formik.touched.title && formik.errors.title) ? 'error' : 'primary'}
                helperText={formik.touched.title && (formik.errors.title as string)}
                disabled={formik.isSubmitting}
              />
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                type="text"
                id="message"
                name="message"
                label={formT?.labels?.message}
                placeholder={formT?.placeholders?.message}
                value={formik.values.message}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.message && formik.errors.message)}
                color={Boolean(formik.touched.message && formik.errors.message) ? 'error' : 'primary'}
                helperText={formik.touched.message && (formik.errors.message as string)}
                disabled={formik.isSubmitting}
              />
              <Select
                options={topicOptions}
                fullWidth
                required
                id="topic"
                name="topic"
                label={formT?.labels?.topic}
                placeholder={formT?.placeholders?.topic}
                value={formik.values.topic}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.topic && formik.errors.topic)}
                color={Boolean(formik.touched.topic && formik.errors.topic) ? 'error' : 'primary'}
                helperText={formik.touched.topic && (formik.errors.topic as string)}
                disabled={formik.isSubmitting}
              />
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={handleCreateClose} disabled={formik.isSubmitting}>
                {textT?.btnCancel}
              </Button>
              <Button type="submit" variant="text" color="primary" loading={formik.isSubmitting}>
                {textT?.btnSend}
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
              {textT?.dialogDeleteMessage?.replace('{{ title }}', deleteState.title)}
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

export default PushMessages;
