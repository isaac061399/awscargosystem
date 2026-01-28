'use client';

// React Imports
import { useEffect, useMemo, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import { MuiTelInput } from 'mui-tel-input';

// Component Imports
import Select from '@/components/Select';
import MoneyField from '@/components/MoneyField';

// Helpers Imports
import { requestEditClient, requestNewClient, requestSearchActivityCodesClients } from '@/helpers/request';
import { getAddressOptions } from '@/helpers/address';
import { useConfig } from '@/components/ConfigProvider';

// Utility Imports
import { getTelInputValue } from '@/libs/utils';
import { currencies, billingDefaultActivityCode } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Info = ({ provinces, client }: { provinces: any[]; client?: any }) => {
  const router = useRouter();
  const { offices, configuration } = useConfig();
  const poundFee = configuration?.pound_fee ?? 0;

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('clients-edition:tabs.info.text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('clients-edition:tabs.info.form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  // addresses data
  const cantonId = client?.district?.canton?.id;
  const provinceId = client?.district?.canton?.province?.id;
  const billingCantonId = client?.billing_district?.canton?.id;
  const billingProvinceId = client?.billing_district?.canton?.province?.id;

  const addressData = getAddressOptions({ provinces, provinceId, cantonId });
  const billingAddressData = getAddressOptions({ provinces, provinceId: billingProvinceId, cantonId: billingCantonId });
  const provincesOptions = addressData.provinces;
  const billingProvincesOptions = billingAddressData.provinces;

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [cantonsOptions, setCantonsOptions] = useState<any[]>(addressData.cantons);
  const [districtsOptions, setDistrictsOptions] = useState<any[]>(addressData.districts);
  const [billingCantonsOptions, setBillingCantonsOptions] = useState<any[]>(billingAddressData.cantons);
  const [billingDistrictsOptions, setBillingDistrictsOptions] = useState<any[]>(billingAddressData.districts);
  const [useSameBilling, setUseSameBilling] = useState<boolean>(!client ? true : false);

  const [activityCodesState, setActivityCodesStates] = useState<{
    open: boolean;
    loading: boolean;
    codes: { code: string; description: string }[];
  }>({ open: false, loading: false, codes: [] });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        office_id: client ? client.office_id : '',
        full_name: client ? client.full_name : '',
        identification_type: client ? client.identification_type : '',
        identification: client ? client.identification : '',
        email: client ? client.email : '',
        phone: client ? client.phone : '',
        notes: client ? client.notes : '',

        province_id: client ? client.district?.canton?.province?.id : '',
        canton_id: client ? client.district?.canton?.id : '',
        district_id: client ? client.district?.id : '',
        address: client ? client.address : '',

        billing_full_name: client ? client.billing_full_name : '',
        billing_identification_type: client ? client.billing_identification_type : '',
        billing_identification: client ? client.billing_identification : '',
        billing_email: client ? client.billing_email : '',
        billing_phone: client ? client.billing_phone : '',
        billing_province_id: client ? client.billing_district?.canton?.province?.id : '',
        billing_canton_id: client ? client.billing_district?.canton?.id : '',
        billing_district_id: client ? client.billing_district?.id : '',
        billing_address: client ? client.billing_address : '',
        billing_activity_code: client ? client.billing_activity_code : billingDefaultActivityCode,

        pound_fee: client ? client.pound_fee : poundFee,
        status: client ? client.status : Object.keys(labelsT?.clientStatus)[0] || ''
      }),
      [poundFee, client, labelsT]
    ),
    validationSchema: yup.object({
      office_id: yup.string().required(formT?.errors?.office_id),
      full_name: yup.string().required(formT?.errors?.full_name),
      identification_type: yup.string().required(formT?.errors?.identification_type),
      identification: yup.string().required(formT?.errors?.identification),
      email: yup.string().required(formT?.errors?.email).email(formT?.errors?.invalidEmail),
      phone: yup
        .string()
        .required(formT?.errors?.phone)
        .test('validPhone', formT?.errors?.phone, (value) => {
          return getTelInputValue(value) !== '';
        }),
      notes: yup.string(),

      billing_full_name: useSameBilling ? yup.string() : yup.string().required(formT?.errors?.billing_full_name),
      billing_identification_type: useSameBilling
        ? yup.string()
        : yup.string().required(formT?.errors?.billing_identification_type),
      billing_identification: useSameBilling
        ? yup.string()
        : yup.string().required(formT?.errors?.billing_identification),
      billing_email: useSameBilling
        ? yup.string()
        : yup.string().required(formT?.errors?.billing_email).email(formT?.errors?.invalidEmail),
      billing_phone: useSameBilling
        ? yup.string()
        : yup
            .string()
            .required(formT?.errors?.billing_phone)
            .test('validBillingPhone', formT?.errors?.billing_phone, (value) => {
              return getTelInputValue(value) !== '';
            }),

      pound_fee: yup.number().required(formT?.errors?.pound_fee),
      status: yup.string().required(formT?.errors?.status)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const data = {
          office_id: values.office_id,
          full_name: values.full_name,
          identification_type: values.identification_type,
          identification: values.identification,
          email: values.email,
          phone: getTelInputValue(values.phone),
          notes: values.notes,
          district_id: values.district_id,
          address: values.address,

          billing_full_name: values.billing_full_name,
          billing_identification_type: values.billing_identification_type,
          billing_identification: values.billing_identification,
          billing_email: values.billing_email,
          billing_phone: getTelInputValue(values.billing_phone),
          billing_district_id: values.billing_district_id,
          billing_address: values.billing_address,
          billing_activity_code: values.billing_activity_code,

          pound_fee: values.pound_fee,
          status: values.status,
          use_same_billing: useSameBilling
        };

        const result = client
          ? await requestEditClient(client.id, data, i18n.language)
          : await requestNewClient(data, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (!client) {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/clients/edit/${result.id}`);
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

  useEffect(() => {
    if (client) return;

    formik.setFieldValue('billing_full_name', '');
    formik.setFieldValue('billing_identification_type', '');
    formik.setFieldValue('billing_identification', '');
    formik.setFieldValue('billing_email', '');
    formik.setFieldValue('billing_phone', '');
    formik.setFieldValue('billing_province_id', '');
    formik.setFieldValue('billing_canton_id', '');
    formik.setFieldValue('billing_district_id', '');
    formik.setFieldValue('billing_address', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSameBilling]);

  const handleActivityCodesOpen = async () => {
    setActivityCodesStates((prevState) => ({ ...prevState, loading: true }));

    const identification =
      formik.values.billing_identification !== '' ? formik.values.billing_identification : formik.values.identification;

    const response = await requestSearchActivityCodesClients({ identification }, i18n.language);

    const codes = response.valid ? response.data : [];

    setActivityCodesStates((prevState) => ({
      ...prevState,
      codes,
      loading: false,
      open: true
    }));
  };

  const handleActivityCodesClose = () => {
    setActivityCodesStates((prevState) => ({ ...prevState, open: false }));
  };

  const handleActivityCodeSelect = (code: string) => {
    formik.setFieldValue('billing_activity_code', code);
    handleActivityCodesClose();
  };

  return (
    <Box sx={{ p: 5 }}>
      <form noValidate onSubmit={formik.handleSubmit}>
        <div className="flex items-center justify-between mb-5">
          <div>
            {client && (
              <Typography variant="h4">
                {textT?.mailboxLabel}: {`${client.office?.mailbox_prefix}${client.id}`}
              </Typography>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
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

        <Divider sx={{ my: 5 }} />

        {alertState.open && (
          <Alert severity={alertState.type} sx={{ mb: 5 }}>
            {alertState.message}
          </Alert>
        )}

        {/* Personal data */}
        <Divider textAlign="left" sx={{ my: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
          <Typography variant="h6">{textT?.personalDataLabel}</Typography>
        </Divider>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Select
              options={offices.map((o) => ({ value: o.id, label: o.name }))}
              fullWidth
              required
              id="office_id"
              name="office_id"
              label={formT?.labels?.office_id}
              value={formik.values.office_id}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.office_id && formik.errors.office_id)}
              color={Boolean(formik.touched.office_id && formik.errors.office_id) ? 'error' : 'primary'}
              helperText={
                formik.touched.office_id && formik.errors.office_id ? (formik.errors.office_id as string) : ''
              }
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              required
              type="text"
              id="full_name"
              name="full_name"
              label={formT?.labels?.full_name}
              placeholder={formT?.placeholders?.full_name}
              value={formik.values.full_name}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.full_name && formik.errors.full_name)}
              color={Boolean(formik.touched.full_name && formik.errors.full_name) ? 'error' : 'primary'}
              helperText={formik.touched.full_name && (formik.errors.full_name as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Select
              options={Object.keys(labelsT?.identificationType).map((value) => ({
                value,
                label: labelsT?.identificationType[value]
              }))}
              fullWidth
              required
              id="identification_type"
              name="identification_type"
              label={formT?.labels?.identification_type}
              placeholder={formT?.placeholders?.identification_type}
              value={formik.values.identification_type}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.identification_type && formik.errors.identification_type)}
              color={
                Boolean(formik.touched.identification_type && formik.errors.identification_type) ? 'error' : 'primary'
              }
              helperText={formik.touched.identification_type && (formik.errors.identification_type as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              required
              type="text"
              id="identification"
              name="identification"
              label={formT?.labels?.identification}
              placeholder={formT?.placeholders?.identification}
              value={formik.values.identification}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.identification && formik.errors.identification)}
              color={Boolean(formik.touched.identification && formik.errors.identification) ? 'error' : 'primary'}
              helperText={formik.touched.identification && (formik.errors.identification as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              required
              type="email"
              id="email"
              name="email"
              label={formT?.labels?.email}
              placeholder={formT?.placeholders?.email}
              value={formik.values.email}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.email && formik.errors.email)}
              color={Boolean(formik.touched.email && formik.errors.email) ? 'error' : 'primary'}
              helperText={formik.touched.email && (formik.errors.email as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <MuiTelInput
              fullWidth
              required
              id="phone"
              name="phone"
              defaultCountry="CR"
              label={formT?.labels?.phone}
              placeholder={formT?.placeholders?.phone}
              value={formik.values.phone}
              onChange={(value) => formik.setFieldValue('phone', value)}
              error={Boolean(formik.touched.phone && formik.errors.phone)}
              color={Boolean(formik.touched.phone && formik.errors.phone) ? 'error' : 'primary'}
              helperText={formik.touched.phone && (formik.errors.phone as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <MoneyField
              fullWidth
              required
              type="text"
              decimalScale={2}
              decimalSeparator="."
              thousandSeparator=","
              prefix={`${currencies.USD.symbol} `}
              id="pound_fee"
              name="pound_fee"
              label={formT?.labels?.pound_fee}
              placeholder={formT?.placeholders?.pound_fee}
              value={formik.values.pound_fee}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.pound_fee && formik.errors.pound_fee)}
              color={Boolean(formik.touched.pound_fee && formik.errors.pound_fee) ? 'error' : 'primary'}
              helperText={formik.touched.pound_fee && (formik.errors.pound_fee as string)}
              disabled={formik.isSubmitting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Select
              options={Object.keys(labelsT?.clientStatus).map((value) => ({
                value,
                label: labelsT?.clientStatus[value]
              }))}
              fullWidth
              id="status"
              name="status"
              label={formT?.labels?.status}
              placeholder={formT?.placeholders?.status}
              value={formik.values.status}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.status && formik.errors.status)}
              color={Boolean(formik.touched.status && formik.errors.status) ? 'error' : 'primary'}
              helperText={formik.touched.status && (formik.errors.status as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              type="text"
              id="notes"
              name="notes"
              label={formT?.labels?.notes}
              placeholder={formT?.placeholders?.notes}
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.notes && formik.errors.notes)}
              color={Boolean(formik.touched.notes && formik.errors.notes) ? 'error' : 'primary'}
              helperText={formik.touched.notes && (formik.errors.notes as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
        </Grid>

        {/* Address data */}
        <Divider textAlign="left" sx={{ my: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
          <Typography variant="h6">{textT?.addressLabel}</Typography>
        </Divider>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Select
              options={provincesOptions}
              fullWidth
              id="province_id"
              name="province_id"
              label={formT?.labels?.province_id}
              placeholder={formT?.placeholders?.province_id}
              value={formik.values.province_id}
              onChange={(e) => {
                const value = e.target.value as string;

                formik.setFieldValue('province_id', value);
                formik.setFieldValue('canton_id', '');
                formik.setFieldValue('district_id', '');
                const addressOptions = getAddressOptions({ provinces, provinceId: parseInt(value) });

                setCantonsOptions(addressOptions.cantons);
                setDistrictsOptions(addressOptions.districts);
              }}
              error={Boolean(formik.touched.province_id && formik.errors.province_id)}
              color={Boolean(formik.touched.province_id && formik.errors.province_id) ? 'error' : 'primary'}
              helperText={formik.touched.province_id && (formik.errors.province_id as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Select
              options={cantonsOptions}
              fullWidth
              id="canton_id"
              name="canton_id"
              label={formT?.labels?.canton_id}
              placeholder={formT?.placeholders?.canton_id}
              value={formik.values.canton_id}
              onChange={(e) => {
                const value = e.target.value as string;

                formik.setFieldValue('canton_id', value);
                formik.setFieldValue('district_id', '');

                const addressOptions = getAddressOptions({
                  provinces,
                  provinceId: formik.values.province_id,
                  cantonId: parseInt(value)
                });

                setDistrictsOptions(addressOptions.districts);
              }}
              error={Boolean(formik.touched.canton_id && formik.errors.canton_id)}
              color={Boolean(formik.touched.canton_id && formik.errors.canton_id) ? 'error' : 'primary'}
              helperText={formik.touched.canton_id && (formik.errors.canton_id as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Select
              options={districtsOptions}
              fullWidth
              id="district_id"
              name="district_id"
              label={formT?.labels?.district_id}
              placeholder={formT?.placeholders?.district_id}
              value={formik.values.district_id}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.district_id && formik.errors.district_id)}
              color={Boolean(formik.touched.district_id && formik.errors.district_id) ? 'error' : 'primary'}
              helperText={formik.touched.district_id && (formik.errors.district_id as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              type="text"
              id="address"
              name="address"
              label={formT?.labels?.address}
              placeholder={formT?.placeholders?.address}
              value={formik.values.address}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.address && formik.errors.address)}
              color={Boolean(formik.touched.address && formik.errors.address) ? 'error' : 'primary'}
              helperText={formik.touched.address && (formik.errors.address as string)}
              disabled={formik.isSubmitting || isRedirecting}
            />
          </Grid>
        </Grid>

        {/* Billing data */}
        <Divider textAlign="left" sx={{ my: 7, '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
          <Typography variant="h6">{textT?.billingLabel}</Typography>
        </Divider>
        <Grid container spacing={5}>
          {!client && (
            <Grid size={{ xs: 12, md: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useSameBilling}
                    onChange={(e) => setUseSameBilling(e.target.checked)}
                    color="primary"
                  />
                }
                label={textT?.useSameBillingLabel}
              />
            </Grid>
          )}

          {!useSameBilling && (
            <>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  type="text"
                  id="billing_full_name"
                  name="billing_full_name"
                  label={formT?.labels?.billing_full_name}
                  placeholder={formT?.placeholders?.billing_full_name}
                  value={formik.values.billing_full_name}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.billing_full_name && formik.errors.billing_full_name)}
                  color={
                    Boolean(formik.touched.billing_full_name && formik.errors.billing_full_name) ? 'error' : 'primary'
                  }
                  helperText={formik.touched.billing_full_name && (formik.errors.billing_full_name as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Select
                  options={Object.keys(labelsT?.identificationType).map((value) => ({
                    value,
                    label: labelsT?.identificationType[value]
                  }))}
                  fullWidth
                  required
                  id="billing_identification_type"
                  name="billing_identification_type"
                  label={formT?.labels?.billing_identification_type}
                  placeholder={formT?.placeholders?.billing_identification_type}
                  value={formik.values.billing_identification_type}
                  onChange={formik.handleChange}
                  error={Boolean(
                    formik.touched.billing_identification_type && formik.errors.billing_identification_type
                  )}
                  color={
                    Boolean(formik.touched.billing_identification_type && formik.errors.billing_identification_type)
                      ? 'error'
                      : 'primary'
                  }
                  helperText={
                    formik.touched.billing_identification_type && (formik.errors.billing_identification_type as string)
                  }
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  type="text"
                  id="billing_identification"
                  name="billing_identification"
                  label={formT?.labels?.billing_identification}
                  placeholder={formT?.placeholders?.billing_identification}
                  value={formik.values.billing_identification}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.billing_identification && formik.errors.billing_identification)}
                  color={
                    Boolean(formik.touched.billing_identification && formik.errors.billing_identification)
                      ? 'error'
                      : 'primary'
                  }
                  helperText={formik.touched.billing_identification && (formik.errors.billing_identification as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  id="billing_email"
                  name="billing_email"
                  label={formT?.labels?.billing_email}
                  placeholder={formT?.placeholders?.billing_email}
                  value={formik.values.billing_email}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.billing_email && formik.errors.billing_email)}
                  color={Boolean(formik.touched.billing_email && formik.errors.billing_email) ? 'error' : 'primary'}
                  helperText={formik.touched.billing_email && (formik.errors.billing_email as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <MuiTelInput
                  fullWidth
                  required
                  id="billing_phone"
                  name="billing_phone"
                  defaultCountry="CR"
                  label={formT?.labels?.billing_phone}
                  placeholder={formT?.placeholders?.billing_phone}
                  value={formik.values.billing_phone}
                  onChange={(value) => formik.setFieldValue('billing_phone', value)}
                  error={Boolean(formik.touched.billing_phone && formik.errors.billing_phone)}
                  color={Boolean(formik.touched.billing_phone && formik.errors.billing_phone) ? 'error' : 'primary'}
                  helperText={formik.touched.billing_phone && (formik.errors.billing_phone as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Select
                  options={billingProvincesOptions}
                  fullWidth
                  id="billing_province_id"
                  name="billing_province_id"
                  label={formT?.labels?.billing_province_id}
                  placeholder={formT?.placeholders?.billing_province_id}
                  value={formik.values.billing_province_id}
                  onChange={(e) => {
                    const value = e.target.value as string;

                    formik.setFieldValue('billing_province_id', value);
                    formik.setFieldValue('billing_canton_id', '');
                    formik.setFieldValue('billing_district_id', '');
                    const billingAddressOptions = getAddressOptions({ provinces, provinceId: parseInt(value) });

                    setBillingCantonsOptions(billingAddressOptions.cantons);
                    setBillingDistrictsOptions(billingAddressOptions.districts);
                  }}
                  error={Boolean(formik.touched.billing_province_id && formik.errors.billing_province_id)}
                  color={
                    Boolean(formik.touched.billing_province_id && formik.errors.billing_province_id)
                      ? 'error'
                      : 'primary'
                  }
                  helperText={formik.touched.billing_province_id && (formik.errors.billing_province_id as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Select
                  options={billingCantonsOptions}
                  fullWidth
                  id="billing_canton_id"
                  name="billing_canton_id"
                  label={formT?.labels?.billing_canton_id}
                  placeholder={formT?.placeholders?.billing_canton_id}
                  value={formik.values.billing_canton_id}
                  onChange={(e) => {
                    const value = e.target.value as string;

                    formik.setFieldValue('billing_canton_id', value);
                    formik.setFieldValue('billing_district_id', '');

                    const billingAddressOptions = getAddressOptions({
                      provinces,
                      provinceId: formik.values.billing_province_id,
                      cantonId: parseInt(value)
                    });

                    setBillingDistrictsOptions(billingAddressOptions.districts);
                  }}
                  error={Boolean(formik.touched.billing_canton_id && formik.errors.billing_canton_id)}
                  color={
                    Boolean(formik.touched.billing_canton_id && formik.errors.billing_canton_id) ? 'error' : 'primary'
                  }
                  helperText={formik.touched.billing_canton_id && (formik.errors.billing_canton_id as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Select
                  options={billingDistrictsOptions}
                  fullWidth
                  id="billing_district_id"
                  name="billing_district_id"
                  label={formT?.labels?.billing_district_id}
                  placeholder={formT?.placeholders?.billing_district_id}
                  value={formik.values.billing_district_id}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.billing_district_id && formik.errors.billing_district_id)}
                  color={
                    Boolean(formik.touched.billing_district_id && formik.errors.billing_district_id)
                      ? 'error'
                      : 'primary'
                  }
                  helperText={formik.touched.billing_district_id && (formik.errors.billing_district_id as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  type="text"
                  id="billing_address"
                  name="billing_address"
                  label={formT?.labels?.billing_address}
                  placeholder={formT?.placeholders?.billing_address}
                  value={formik.values.billing_address}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.billing_address && formik.errors.billing_address)}
                  color={Boolean(formik.touched.billing_address && formik.errors.billing_address) ? 'error' : 'primary'}
                  helperText={formik.touched.billing_address && (formik.errors.billing_address as string)}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="text"
              id="billing_activity_code"
              name="billing_activity_code"
              label={formT?.labels?.billing_activity_code}
              placeholder={formT?.placeholders?.billing_activity_code}
              value={formik.values.billing_activity_code}
              onChange={formik.handleChange}
              error={Boolean(formik.touched.billing_activity_code && formik.errors.billing_activity_code)}
              color={
                Boolean(formik.touched.billing_activity_code && formik.errors.billing_activity_code)
                  ? 'error'
                  : 'primary'
              }
              helperText={formik.touched.billing_activity_code && (formik.errors.billing_activity_code as string)}
              disabled={formik.isSubmitting || isRedirecting}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton
                      color="primary"
                      onClick={handleActivityCodesOpen}
                      disabled={formik.isSubmitting || isRedirecting || activityCodesState.loading}>
                      {activityCodesState.loading ? (
                        <i className="ri-loader-4-line animate-spin" />
                      ) : (
                        <i className="ri-search-eye-line" />
                      )}
                    </IconButton>
                  )
                }
              }}
            />
          </Grid>
        </Grid>
      </form>

      <Dialog
        open={activityCodesState.open}
        onClose={handleActivityCodesClose}
        aria-labelledby="dialog-add-balance-title"
        maxWidth="sm"
        fullWidth>
        <DialogTitle id="dialog-add-balance-title">{textT?.activityCodesDialog?.title}</DialogTitle>
        <DialogContent dividers className="flex flex-col gap-6">
          <Select
            options={activityCodesState.codes.map((c) => ({
              value: c.code,
              label: `${c.code} - ${c.description}`
            }))}
            fullWidth
            id="code"
            name="code"
            label={textT?.activityCodesDialog?.codesTitle}
            value=""
            onChange={(e) => handleActivityCodeSelect(e.target.value as string)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={handleActivityCodesClose} disabled={formik.isSubmitting}>
            {textT?.btnCancel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Info;
