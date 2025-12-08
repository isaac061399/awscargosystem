'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import Select from '@components/Select';
import ClearCacheButton from '@/components/layout/shared/ClearCacheButton';

// Helpers Imports
import { requestEditGlobalSettings } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

// Components Imports
import ImageField from '@components/ImageField';
import SortableComponent from '@components/SortableComponent';

import i18nConfigApp from '@/configs/i18nConfigApp';
import cmsConfig from '@/configs/cmsConfig';

const defaultAlertState = { open: false, type: 'success', message: '' };

const GlobalSettings = ({ lang, globalSettings }: { lang: string; globalSettings?: any }) => {
  const router = useRouter();
  const { data: admin } = useAdmin();
  const canEdit = hasAllPermissions('global-settings.edit', admin.permissions);
  const canCreateMedia = hasAllPermissions('media.create', admin.permissions);
  const canDeleteMedia = hasAllPermissions('media.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('global-settings:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('global-settings:form', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        locale: lang,
        website_name: globalSettings ? `${globalSettings.website_name}` : '',
        footer_text: globalSettings ? `${globalSettings.footer_text}` : '',
        analytics_code: globalSettings ? `${globalSettings.analytics_code}` : '',
        seo_title: globalSettings?.seo ? `${globalSettings.seo.title}` : '',
        seo_description: globalSettings?.seo ? `${globalSettings.seo.description}` : '',
        seo_media: globalSettings?.seo ? globalSettings.seo.media : null,
        seo_keywords: globalSettings?.seo ? `${globalSettings.seo.keywords}` : '',
        seo_robots: globalSettings?.seo ? `${globalSettings.seo.robots}` : '',
        contact_phone: globalSettings ? `${globalSettings.contact_phone}` : '',
        contact_mobile: globalSettings ? `${globalSettings.contact_mobile}` : '',
        contact_email: globalSettings ? `${globalSettings.contact_email}` : '',
        contact_address: globalSettings ? `${globalSettings.contact_address}` : '',
        contact_schedule: globalSettings ? `${globalSettings.contact_schedule}` : '',
        contact_maps_url: globalSettings ? `${globalSettings.contact_maps_url}` : '',
        social_facebook: globalSettings ? `${globalSettings.social_facebook}` : '',
        social_instagram: globalSettings ? `${globalSettings.social_instagram}` : '',
        social_twitter: globalSettings ? `${globalSettings.social_twitter}` : '',
        social_youtube: globalSettings ? `${globalSettings.social_youtube}` : '',
        social_whatsapp: globalSettings ? `${globalSettings.social_whatsapp}` : '',
        social_linkedin: globalSettings ? `${globalSettings.social_linkedin}` : '',
        social_tiktok: globalSettings ? `${globalSettings.social_tiktok}` : '',
        customValues: globalSettings ? globalSettings.custom_values : []
      }),
      [globalSettings, lang]
    ),
    validationSchema: yup.object({
      locale: yup.string().required(formT?.errors?.locale),
      website_name: yup.string().required(formT?.errors?.website_name),
      footer_text: yup.string(),
      analytics_code: yup.string(),
      seo_title: yup.string(),
      seo_description: yup.string(),
      seo_media: yup.object().nullable(),
      seo_keywords: yup.string(),
      seo_robots: yup.string(),
      contact_phone: yup.string(),
      contact_mobile: yup.string(),
      contact_email: yup.string(),
      contact_address: yup.string(),
      contact_schedule: yup.string(),
      contact_maps_url: yup.string(),
      social_facebook: yup.string(),
      social_instagram: yup.string(),
      social_twitter: yup.string(),
      social_youtube: yup.string(),
      social_whatsapp: yup.string(),
      social_linkedin: yup.string(),
      social_tiktok: yup.string(),
      customValues: yup.array(
        yup.object({
          key: yup.string().required(formT?.errors?.customValuesKey),
          value: yup.string().required(formT?.errors?.customValuesValue)
        })
      )
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const params: any = { ...values };

        params.customValues = values.customValues.map((cv: any, index: number) => ({
          key: cv.key,
          value: cv.value,
          order: index
        }));

        const result = await requestEditGlobalSettings(params, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const handleChangeLocale = (event: any) => {
    formik.handleChange(event);
    const newLang = event.target.value;
    if (newLang === i18nConfigApp.defaultLocale) {
      router.push(`/global-settings`);
    } else {
      router.push(`/global-settings/${newLang}`);
    }
  };

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                {textT?.title}
              </Typography>
              <div className="flex items-center gap-2">
                <ClearCacheButton size="small" variant="contained" />
                {canEdit && (
                  <Button
                    size="small"
                    type="submit"
                    variant="contained"
                    color="primary"
                    loading={formik.isSubmitting}
                    startIcon={<i className="ri-save-line" />}>
                    {textT?.btnSave}
                  </Button>
                )}
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
                    <Select
                      options={Object.keys(i18nConfigApp.localesLabel).map((l) => ({
                        value: l,
                        label: i18nConfigApp.localesLabel[l as keyof typeof i18nConfigApp.localesLabel]
                      }))}
                      id="locale"
                      name="locale"
                      label={formT?.labels?.locale}
                      value={lang}
                      onChange={handleChangeLocale}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="website_name"
                      name="website_name"
                      label={formT?.labels?.website_name}
                      placeholder={formT?.placeholders?.website_name}
                      value={formik.values.website_name}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.website_name && formik.errors.website_name)}
                      color={Boolean(formik.touched.website_name && formik.errors.website_name) ? 'error' : 'primary'}
                      helperText={formik.touched.website_name && formik.errors.website_name}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="text"
                      multiline
                      rows={3}
                      id="footer_text"
                      name="footer_text"
                      label={formT?.labels?.footer_text}
                      placeholder={formT?.placeholders?.footer_text}
                      value={formik.values.footer_text}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.footer_text && formik.errors.footer_text)}
                      color={Boolean(formik.touched.footer_text && formik.errors.footer_text) ? 'error' : 'primary'}
                      helperText={formik.touched.footer_text && formik.errors.footer_text}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="text"
                      multiline
                      rows={3}
                      id="analytics_code"
                      name="analytics_code"
                      label={formT?.labels?.analytics_code}
                      placeholder={formT?.placeholders?.analytics_code}
                      value={formik.values.analytics_code}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.analytics_code && formik.errors.analytics_code)}
                      color={
                        Boolean(formik.touched.analytics_code && formik.errors.analytics_code) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.analytics_code && formik.errors.analytics_code}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  {/* SEO Fields */}
                  {cmsConfig.seo.enabled && (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                          <Typography variant="h5">{formT?.labels?.seo}</Typography>
                        </Divider>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          type="text"
                          id="seo_title"
                          name="seo_title"
                          label={formT?.labels?.seo_title}
                          placeholder={formT?.placeholders?.seo_title}
                          value={formik.values.seo_title}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.seo_title && formik.errors.seo_title)}
                          color={Boolean(formik.touched.seo_title && formik.errors.seo_title) ? 'error' : 'primary'}
                          helperText={formik.touched.seo_title && formik.errors.seo_title}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          type="text"
                          multiline
                          rows={3}
                          id="seo_description"
                          name="seo_description"
                          label={formT?.labels?.seo_description}
                          placeholder={formT?.placeholders?.seo_description}
                          value={formik.values.seo_description}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.seo_description && formik.errors.seo_description)}
                          color={
                            Boolean(formik.touched.seo_description && formik.errors.seo_description)
                              ? 'error'
                              : 'primary'
                          }
                          helperText={formik.touched.seo_description && formik.errors.seo_description}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <ImageField
                          fullWidth
                          label={formT?.labels?.seo_media}
                          placeholder={formT?.placeholders?.seo_media}
                          value={formik.values.seo_media}
                          onChange={(media) => formik.setFieldValue('seo_media', media)}
                          error={Boolean(formik.touched.seo_media && formik.errors.seo_media)}
                          color={Boolean(formik.touched.seo_media && formik.errors.seo_media) ? 'error' : 'primary'}
                          helperText={
                            formik.touched.seo_media && formik.errors.seo_media ? `${formik.errors.seo_media}` : ''
                          }
                          disabled={formik.isSubmitting}
                          fileManager={{
                            title: textT?.titleImageSelector,
                            canAdd: canCreateMedia,
                            canDelete: canDeleteMedia
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          type="text"
                          multiline
                          rows={3}
                          id="seo_keywords"
                          name="seo_keywords"
                          label={formT?.labels?.seo_keywords}
                          placeholder={formT?.placeholders?.seo_keywords}
                          value={formik.values.seo_keywords}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.seo_keywords && formik.errors.seo_keywords)}
                          color={
                            Boolean(formik.touched.seo_keywords && formik.errors.seo_keywords) ? 'error' : 'primary'
                          }
                          helperText={formik.touched.seo_keywords && formik.errors.seo_keywords}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Select
                          options={cmsConfig.seo.robotsOptions.map((l: string) => ({ value: l, label: l }))}
                          fullWidth
                          multiple
                          id="seo_robots"
                          name="seo_robots"
                          label={formT?.labels?.seo_robots}
                          value={formik.values.seo_robots ? formik.values.seo_robots.split(',') : []}
                          onChange={(e) => {
                            formik.setFieldValue(
                              'seo_robots',
                              Array.isArray(e.target.value) ? e.target.value.join(',') : e.target.value
                            );
                          }}
                          error={Boolean(formik.touched.seo_robots && formik.errors.seo_robots)}
                          color={Boolean(formik.touched.seo_robots && formik.errors.seo_robots) ? 'error' : 'primary'}
                          helperText={formik.touched.seo_robots && formik.errors.seo_robots}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Contact Info Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{formT?.labels?.contact}</Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="contact_phone"
                      name="contact_phone"
                      label={formT?.labels?.contact_phone}
                      placeholder={formT?.placeholders?.contact_phone}
                      value={formik.values.contact_phone}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.contact_phone && formik.errors.contact_phone)}
                      color={Boolean(formik.touched.contact_phone && formik.errors.contact_phone) ? 'error' : 'primary'}
                      helperText={formik.touched.contact_phone && formik.errors.contact_phone}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="contact_mobile"
                      name="contact_mobile"
                      label={formT?.labels?.contact_mobile}
                      placeholder={formT?.placeholders?.contact_mobile}
                      value={formik.values.contact_mobile}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.contact_mobile && formik.errors.contact_mobile)}
                      color={
                        Boolean(formik.touched.contact_mobile && formik.errors.contact_mobile) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.contact_mobile && formik.errors.contact_mobile}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="contact_email"
                      name="contact_email"
                      label={formT?.labels?.contact_email}
                      placeholder={formT?.placeholders?.contact_email}
                      value={formik.values.contact_email}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.contact_email && formik.errors.contact_email)}
                      color={Boolean(formik.touched.contact_email && formik.errors.contact_email) ? 'error' : 'primary'}
                      helperText={formik.touched.contact_email && formik.errors.contact_email}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      multiline
                      rows={3}
                      id="contact_address"
                      name="contact_address"
                      label={formT?.labels?.contact_address}
                      placeholder={formT?.placeholders?.contact_address}
                      value={formik.values.contact_address}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.contact_address && formik.errors.contact_address)}
                      color={
                        Boolean(formik.touched.contact_address && formik.errors.contact_address) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.contact_address && formik.errors.contact_address}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      multiline
                      rows={3}
                      id="contact_schedule"
                      name="contact_schedule"
                      label={formT?.labels?.contact_schedule}
                      placeholder={formT?.placeholders?.contact_schedule}
                      value={formik.values.contact_schedule}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.contact_schedule && formik.errors.contact_schedule)}
                      color={
                        Boolean(formik.touched.contact_schedule && formik.errors.contact_schedule) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.contact_schedule && formik.errors.contact_schedule}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="text"
                      multiline
                      rows={3}
                      id="contact_maps_url"
                      name="contact_maps_url"
                      label={formT?.labels?.contact_maps_url}
                      placeholder={formT?.placeholders?.contact_maps_url}
                      value={formik.values.contact_maps_url}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.contact_maps_url && formik.errors.contact_maps_url)}
                      color={
                        Boolean(formik.touched.contact_maps_url && formik.errors.contact_maps_url) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.contact_maps_url && formik.errors.contact_maps_url}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  {/* Social Media Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{formT?.labels?.social}</Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_facebook"
                      name="social_facebook"
                      label={formT?.labels?.social_facebook}
                      placeholder={formT?.placeholders?.social_facebook}
                      value={formik.values.social_facebook}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_facebook && formik.errors.social_facebook)}
                      color={
                        Boolean(formik.touched.social_facebook && formik.errors.social_facebook) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.social_facebook && formik.errors.social_facebook}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_instagram"
                      name="social_instagram"
                      label={formT?.labels?.social_instagram}
                      placeholder={formT?.placeholders?.social_instagram}
                      value={formik.values.social_instagram}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_instagram && formik.errors.social_instagram)}
                      color={
                        Boolean(formik.touched.social_instagram && formik.errors.social_instagram) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.social_instagram && formik.errors.social_instagram}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_twitter"
                      name="social_twitter"
                      label={formT?.labels?.social_twitter}
                      placeholder={formT?.placeholders?.social_twitter}
                      value={formik.values.social_twitter}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_twitter && formik.errors.social_twitter)}
                      color={
                        Boolean(formik.touched.social_twitter && formik.errors.social_twitter) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.social_twitter && formik.errors.social_twitter}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_youtube"
                      name="social_youtube"
                      label={formT?.labels?.social_youtube}
                      placeholder={formT?.placeholders?.social_youtube}
                      value={formik.values.social_youtube}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_youtube && formik.errors.social_youtube)}
                      color={
                        Boolean(formik.touched.social_youtube && formik.errors.social_youtube) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.social_youtube && formik.errors.social_youtube}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_whatsapp"
                      name="social_whatsapp"
                      label={formT?.labels?.social_whatsapp}
                      placeholder={formT?.placeholders?.social_whatsapp}
                      value={formik.values.social_whatsapp}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_whatsapp && formik.errors.social_whatsapp)}
                      color={
                        Boolean(formik.touched.social_whatsapp && formik.errors.social_whatsapp) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.social_whatsapp && formik.errors.social_whatsapp}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_linkedin"
                      name="social_linkedin"
                      label={formT?.labels?.social_linkedin}
                      placeholder={formT?.placeholders?.social_linkedin}
                      value={formik.values.social_linkedin}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_linkedin && formik.errors.social_linkedin)}
                      color={
                        Boolean(formik.touched.social_linkedin && formik.errors.social_linkedin) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.social_linkedin && formik.errors.social_linkedin}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="social_tiktok"
                      name="social_tiktok"
                      label={formT?.labels?.social_tiktok}
                      placeholder={formT?.placeholders?.social_tiktok}
                      value={formik.values.social_tiktok}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.social_tiktok && formik.errors.social_tiktok)}
                      color={Boolean(formik.touched.social_tiktok && formik.errors.social_tiktok) ? 'error' : 'primary'}
                      helperText={formik.touched.social_tiktok && formik.errors.social_tiktok}
                      disabled={formik.isSubmitting}
                    />
                  </Grid>

                  {/* Custom Values Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography
                        variant="h5"
                        className={`${Boolean(formik.errors.customValues) ? 'text-error' : undefined}`}>
                        {formT?.labels?.customValues}
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <CustomValuesAccordionComponent formik={formik} formT={formT} />
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

const CustomValuesAccordionComponent = ({ formik, formT }: { formik: any; formT: any }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChangeExpanded = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleAdd = () => {
    const newValue = [...formik.values.customValues, { id: Date.now(), key: '', value: '' }];

    formik.setFieldValue('customValues', newValue);

    setExpanded(`customValues[${newValue.length - 1}]`);
  };

  const handleRemove = (index: number) => {
    const newValue = [...formik.values.customValues];

    newValue.splice(index, 1);

    formik.setFieldValue('customValues', newValue);

    setExpanded(false);
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          <SortableComponent
            strategy="vertical"
            items={formik.values.customValues}
            renderItem={({ item, index, containerProps, listenersProps }) => {
              const errors: any = Array.isArray(formik.errors.customValues)
                ? formik.errors.customValues[index] || {}
                : {};

              const touched: any = Array.isArray(formik.touched.customValues)
                ? formik.touched.customValues[index] || {}
                : {};

              const hasErrors = Object.keys(errors).length > 0;

              return (
                <Accordion
                  variant="outlined"
                  disableGutters
                  expanded={expanded === `customValues[${index}]`}
                  onChange={handleChangeExpanded(`customValues[${index}]`)}
                  sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}
                  {...containerProps}>
                  <AccordionSummary
                    component="div"
                    aria-controls={`customValues[${index}]-content`}
                    id={`customValues[${index}]-header`}
                    sx={{
                      flexDirection: 'row-reverse',
                      color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
                    }}>
                    <div className="flex items-center w-full justify-between">
                      <Typography component="span">{item.key}</Typography>
                      <div className="flex items-center gap-2">
                        <IconButton className="p-1" onClick={() => handleRemove(index)}>
                          <i className="ri-delete-bin-2-line" />
                        </IconButton>
                        <IconButton className="p-1" {...listenersProps}>
                          <i className="ri-more-2-fill" />
                        </IconButton>
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5} sx={{ mt: 2 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          required
                          type="text"
                          id={`customValues[${index}].key`}
                          name={`customValues[${index}].key`}
                          label={formT?.labels?.customValuesKey}
                          placeholder={formT?.placeholders?.customValuesKey}
                          value={item.key}
                          onChange={formik.handleChange}
                          error={Boolean(touched.key && errors.key)}
                          color={Boolean(touched.key && errors.key) ? 'error' : 'primary'}
                          helperText={touched.key && errors.key}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          required
                          type="text"
                          id={`customValues[${index}].value`}
                          name={`customValues[${index}].value`}
                          label={formT?.labels?.customValuesValue}
                          placeholder={formT?.placeholders?.customValuesValue}
                          value={item.value}
                          onChange={formik.handleChange}
                          error={Boolean(touched.value && errors.value)}
                          color={Boolean(touched.value && errors.value) ? 'error' : 'primary'}
                          helperText={touched.value && errors.value}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            }}
            onChange={(items) =>
              formik.setFieldValue('customValues', items).then(() => formik.validateField('customValues'))
            }
            onStart={() => setExpanded(false)}
          />
          <Accordion variant="outlined" disableGutters expanded>
            <AccordionDetails sx={{ py: 1, px: 5 }}>
              <div className="text-center">
                <Button type="button" variant="text" onClick={handleAdd}>
                  {formT?.addCustomValueBtn}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </Grid>
    </Grid>
  );
};

export default GlobalSettings;
