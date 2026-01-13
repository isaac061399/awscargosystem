'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import MoneyField from '@/components/MoneyField';
import Select from '@/components/Select';

// Helpers Imports
import { requestEditProduct, requestNewProduct } from '@helpers/request';
import { currencies } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const ProductsEdition = ({ product }: { product?: any }) => {
  const router = useRouter();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('products-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('products-edition:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        code: product ? product.code : '',
        name: product ? product.name : '',
        cabys: product ? product.cabys : '',
        currency: product ? product.currency : Object.keys(labelsT?.currency)[0] || '',
        price: product ? product.price : '',
        enabled: product ? product.enabled : true
      }),
      [product, labelsT]
    ),
    validationSchema: yup.object({
      code: yup.string().required(formT?.errors?.code),
      name: yup.string().required(formT?.errors?.name),
      cabys: yup.string().required(formT?.errors?.cabys),
      currency: yup.string().required(formT?.errors?.currency),
      price: yup.number().typeError(formT?.errors?.invalidAmount).required(formT?.errors?.price),
      enabled: yup.boolean()
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = product
          ? await requestEditProduct(product.id, values, i18n.language)
          : await requestNewProduct(values, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (!product) {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/products/edit/${result.id}`);
          }, 2000);
        } else {
          setTimeout(() => {
            setAlertState({ ...defaultAlertState });
          }, 5000);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/products">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {product ? `${textT?.titleEdit} ${formik.values.name}` : textT?.titleNew}
              </Typography>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting || isRedirecting}
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
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="code"
                      name="code"
                      label={formT?.labels?.code}
                      placeholder={formT?.placeholders?.code}
                      value={formik.values.code}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.code && formik.errors.code)}
                      color={Boolean(formik.touched.code && formik.errors.code) ? 'error' : 'primary'}
                      helperText={formik.touched.code && (formik.errors.code as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="name"
                      name="name"
                      label={formT?.labels?.name}
                      placeholder={formT?.placeholders?.name}
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.name && formik.errors.name)}
                      color={Boolean(formik.touched.name && formik.errors.name) ? 'error' : 'primary'}
                      helperText={formik.touched.name && (formik.errors.name as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="cabys"
                      name="cabys"
                      label={formT?.labels?.cabys}
                      placeholder={formT?.placeholders?.cabys}
                      value={formik.values.cabys}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.cabys && formik.errors.cabys)}
                      color={Boolean(formik.touched.cabys && formik.errors.cabys) ? 'error' : 'primary'}
                      helperText={formik.touched.cabys && (formik.errors.cabys as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
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
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <MoneyField
                      fullWidth
                      required
                      type="text"
                      decimalScale={2}
                      decimalSeparator="."
                      thousandSeparator=","
                      prefix={`${currencies[formik.values.currency]?.symbol || ''} `}
                      id="price"
                      name="price"
                      label={formT?.labels?.price}
                      placeholder={formT?.placeholders?.price}
                      value={formik.values.price}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.price && formik.errors.price)}
                      color={Boolean(formik.touched.price && formik.errors.price) ? 'error' : 'primary'}
                      helperText={formik.touched.price && (formik.errors.price as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.enabled}
                          onChange={(e) => {
                            formik.setFieldValue('enabled', e.target.checked);
                          }}
                        />
                      }
                      label={formT?.labels?.enabled}
                    />
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

export default ProductsEdition;
