'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import moment from 'moment';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import AdministratorField from '@/components/custom/AdministratorField';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

// Helpers Imports
import { requestGetSpecialPackageManifestItems, requestNewSpecialPackageManifest } from '@helpers/request';
import { useConfig } from '@/components/ConfigProvider';
import { formatMoney } from '@/libs/utils';
import { currencies } from '@/libs/constants';
import { calculateManifestTotal } from '@/helpers/calculations';

const defaultAlertState = { open: false, type: 'success', message: '' };

const SpecialPackageManifestsNew = () => {
  const router = useRouter();

  const { configuration } = useConfig();
  const amountPerPackage = configuration?.special_package_amount ?? 0;
  const amountPerManifest = configuration?.special_package_manifest_amount ?? 0;

  const { data: admin } = useAdmin();
  const isAdmin = hasAllPermissions('special-package-manifests.admin', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('special-package-manifests-new:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('special-package-manifests-new:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [items, setItems] = useState<any[]>([]);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        owner: null as any,
        description: ''
      }),
      []
    ),
    validationSchema: yup.object({
      owner: isAdmin ? yup.object().required(formT?.errors?.owner) : yup.object().nullable().notRequired(),
      description: yup.string()
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      const newValues = { ...values, owner_id: values.owner?.id || null };
      delete newValues.owner;

      try {
        const result = await requestNewSpecialPackageManifest(newValues, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        setIsRedirecting(true);
        setTimeout(() => {
          router.push(`/special-package-manifests/view/${result.id}`);
        }, 2000);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const fetchItems = async () => {
    formik.setTouched({ owner: true, description: true });
    const errors = await formik.validateForm();

    if (Object.keys(errors).length) return;

    setIsLoading(true);

    const { valid, data } = await requestGetSpecialPackageManifestItems(
      {
        owner_id: formik.values.owner?.id || null
      },
      i18n.language
    );

    setIsLoading(false);

    if (!valid) {
      return setAlertState({ open: true, type: 'error', message: formT?.fetchItemsErrorMessage });
    }

    setItems(data || []);
  };

  const totalAmount = useMemo(
    () => calculateManifestTotal(items.length, amountPerPackage, amountPerManifest),
    [items.length, amountPerPackage, amountPerManifest]
  );

  /** --- grids --- */
  const itemsCols: GridColDef[] = [
    {
      field: 'id',
      headerName: textT?.itemsTable?.index?.title,
      width: 100,
      sortable: false,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
    },
    { field: 'tracking', headerName: textT?.itemsTable?.tracking?.title, width: 200, sortable: false },
    {
      field: 'mailbox',
      headerName: textT?.itemsTable?.mailbox?.title,
      width: 200,
      sortable: false
    },
    {
      field: 'type',
      headerName: textT?.itemsTable?.type?.title,
      width: 200,
      sortable: false,
      valueGetter: (value, row) => labelsT?.specialPackageType?.[row.type] || row.type
    },
    {
      field: 'status',
      headerName: textT?.itemsTable?.status?.title,
      width: 200,
      sortable: false,
      valueGetter: (value, row) => labelsT?.specialPackageStatus?.[row.status] || row.status
    },
    {
      field: 'status_date',
      headerName: textT?.itemsTable?.status_date?.title,
      width: 200,
      sortable: false,
      valueGetter: (value, row) => moment(row.status_date).format(textT?.itemsTable?.status_date?.dateFormat)
    }
  ];

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/special-package-manifests">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {textT?.title}
              </Typography>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting || isLoading || isRedirecting}
                  startIcon={<i className="ri-save-line" />}>
                  {textT?.btnSave}
                </Button>
              </div>
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card>
              {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}

              <CardContent>
                <Grid container spacing={3} alignItems="top">
                  {/* Amount per package */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.amountPerPackageLabel}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {formatMoney(amountPerPackage, `${currencies.USD.symbol} `)}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Amount per manifest */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.amountPerManifestLabel}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {formatMoney(amountPerManifest, `${currencies.USD.symbol} `)}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Quantity */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.quantityLabel}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {items.length}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Total */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="overline" color="text.secondary">
                        {textT?.totalLabel}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {formatMoney(totalAmount, `${currencies.USD.symbol} `)}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 5 }} />
              </CardContent>

              <CardContent>
                <Grid container spacing={5}>
                  {isAdmin && (
                    <>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <AdministratorField
                          initialOptions={[]}
                          isOptionEqualToValue={(option, v) => option.id === v.id}
                          loadingText={textT?.loading}
                          noOptionsText={textT?.noOptions}
                          value={formik.values.owner}
                          onChange={(value) => {
                            formik.setFieldValue('owner', value || null);
                          }}
                          id="owner"
                          name="owner"
                          label={formT?.labels?.owner}
                          placeholder={formT?.placeholders?.owner}
                          error={Boolean(formik.touched.owner && formik.errors.owner)}
                          color={Boolean(formik.touched.owner && formik.errors.owner) ? 'error' : 'primary'}
                          helperText={formik.touched.owner && (formik.errors.owner as string)}
                          disabled={formik.isSubmitting || isLoading || isRedirecting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    </>
                  )}

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      type="text"
                      id="description"
                      name="description"
                      label={formT?.labels?.description}
                      placeholder={formT?.placeholders?.description}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.description && formik.errors.description)}
                      color={Boolean(formik.touched.description && formik.errors.description) ? 'error' : 'primary'}
                      helperText={formik.touched.description && formik.errors.description}
                      disabled={formik.isSubmitting || isLoading || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ mb: 5 }} />

                    <Typography variant="h5" className="flex gap-3 items-center">
                      {textT?.itemsTitle}
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<i className={`ri-refresh-line ${isLoading ? 'animate-spin' : ''}`} />}
                        onClick={() => fetchItems()}
                        loading={formik.isSubmitting || isLoading || isRedirecting}>
                        {textT?.btnFetchItems}
                      </Button>
                    </Typography>

                    {items.length === 0 && (
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
                        {textT?.noItemsMessage}
                      </Typography>
                    )}
                    {items.length > 0 && (
                      <Box className="h-105" sx={{ mt: 5 }}>
                        <DataGrid
                          rows={items}
                          columns={itemsCols}
                          checkboxSelection={false}
                          disableRowSelectionOnClick
                          hideFooterPagination
                          hideFooter
                          density="compact"
                          // pagination
                          // pageSizeOptions={[5, 10, 25]}
                          // initialState={{
                          //   pagination: { paginationModel: { pageSize: 10, page: 0 } }
                          // }}
                          localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

export default SpecialPackageManifestsNew;
