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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material';

// Others Imports
import moment from 'moment';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import Select from '@components/Select';
import SelectAutocomplete from '@components/SelectAutocomplete';

// Helpers Imports
import { requestEditContent, requestNewContent, requestStatusContent } from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';

// Components Imports
import EditorField from '@components/EditorField';
import ImageField from '@components/ImageField';
import DateTimeField from '@components/DateTimeField';
import SortableComponent from '@components/SortableComponent';

import i18nConfigApp from '@/configs/i18nConfigApp';
import cmsConfig from '@/configs/cmsConfig';

const defaultAlertState = { open: false, type: 'success', message: '' };

const ContentsEdition = ({
  categories,
  pages,
  content,
  isDuplicated
}: {
  categories: any;
  pages: any;
  content?: any;
  isDuplicated?: boolean;
}) => {
  const router = useRouter();
  const { data: admin } = useAdmin();
  const canCreateMedia = hasAllPermissions('media.create', admin.permissions);
  const canDeleteMedia = hasAllPermissions('media.delete', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('contents-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('contents-edition:form', { returnObjects: true, default: {} }), [t]);

  const [isEditing] = useState(content && !isDuplicated);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [openDialogPublish, setOpenDialogPublish] = useState(false);
  const [isPublished, setIsPublished] = useState(Boolean(content?.published_at));
  const [publishAt, setPublishAt] = useState<any>(content?.published_at ? moment(content?.published_at) : null);
  const [publishAtError, setPublishAtError] = useState(false);
  const [openDialogUnpublish, setOpenDialogUnpublish] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        locale: content ? `${content.locale}` : i18nConfigApp.defaultLocale,
        slug: content ? `${content.slug}` : '',
        title: content ? `${content.title}` : '',
        subtitle: content ? `${content.subtitle}` : '',
        description: content ? `${content.description}` : '',
        content: content ? `${content.content}` : '',
        seo_title: content?.seo ? `${content.seo.title}` : '',
        seo_description: content?.seo ? `${content.seo.description}` : '',
        seo_media: content?.seo ? content.seo.media : null,
        seo_keywords: content?.seo ? `${content.seo.keywords}` : '',
        seo_robots: content?.seo ? `${content.seo.robots}` : '',
        category: content ? content.category : null,
        page: content ? content.page : null,
        thumbnail: content ? content.thumbnail : null,
        images: content ? content.images : [],
        customValues: content ? content.custom_values : []
      }),
      [content]
    ),
    validationSchema: yup.object({
      locale: yup.string().required(formT?.errors?.locale),
      slug: yup.string().required(formT?.errors?.slug),
      title: yup.string(),
      subtitle: yup.string(),
      description: yup.string(),
      content: yup.string(),
      seo_title: yup.string(),
      seo_description: yup.string(),
      seo_media: yup.object().nullable(),
      seo_keywords: yup.string(),
      seo_robots: yup.string(),
      thumbnail: yup
        .object({
          media: yup.object().required(formT?.errors?.imagesImage),
          title: yup.string(),
          link: yup.string()
        })
        .nullable(),
      images: yup.array(
        yup.object({
          media: yup.object().required(formT?.errors?.imagesImage),
          title: yup.string(),
          link: yup.string()
        })
      ),
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

        delete params.category;
        params.category_id = values.category?.id;
        delete params.page;
        params.page_id = values.page?.id;
        params.thumbnail = values.thumbnail
          ? { media_id: values.thumbnail.media.id, title: values.thumbnail.title, link: values.thumbnail.link }
          : null;
        params.images = values.images.map((img: any, index: number) => ({
          media_id: img.media.id,
          title: img.title,
          link: img.link,
          order: index
        }));
        params.customValues = values.customValues.map((cv: any, index: number) => ({
          key: cv.key,
          value: cv.value,
          order: index
        }));

        const result = isEditing
          ? await requestEditContent(content.id, params, i18n.language)
          : await requestNewContent(params, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (isEditing) {
          setTimeout(() => {
            setAlertState({ ...defaultAlertState });
          }, 5000);
        } else {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/contents/edit/${result.id}`);
          }, 2000);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const handleUnpublish = async () => {
    setOpenDialogUnpublish(true);
  };

  const handleBtnUnpublish = async () => {
    handleRequestStatus('unpublish');
    setOpenDialogUnpublish(false);
  };

  const handlePublish = async () => {
    setPublishAt(null);
    setPublishAtError(false);
    setOpenDialogPublish(true);
  };

  const handleBtnPublish = async (publishNow: boolean) => {
    setPublishAtError(false);

    if (publishNow) {
      handleRequestStatus('publishNow');
      setOpenDialogPublish(false);
    } else if (!publishAt) {
      setPublishAtError(true);
    } else {
      handleRequestStatus('publishAt', publishAt.toISOString());
      setOpenDialogPublish(false);
    }
  };

  const handleRequestStatus = async (type: 'unpublish' | 'publishNow' | 'publishAt', value?: string) => {
    setIsStatusLoading(true);
    setAlertState({ ...defaultAlertState });

    try {
      const result = await requestStatusContent(content.id, { type, value }, i18n.language);

      setIsStatusLoading(false);

      if (!result.valid) {
        return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
      }

      if (type === 'unpublish') {
        setIsPublished(false);
        setPublishAt(null);
      } else if (type === 'publishNow') {
        setIsPublished(true);
        setPublishAt(moment());
      } else if (type === 'publishAt') {
        setIsPublished(true);
        setPublishAt(moment(value));
      }

      setAlertState({
        open: true,
        type: 'success',
        message: type !== 'unpublish' ? textT?.publishSuccessMessage : textT?.unpublishSuccessMessage
      });

      setTimeout(() => {
        setAlertState({ ...defaultAlertState });
      }, 5000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error(error);
      return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
    }
  };

  const statusChip: any = {
    label: textT?.draft,
    color: 'info'
  };

  if (isPublished) {
    if (moment().isAfter(publishAt)) {
      statusChip.label = textT?.published;
      statusChip.color = 'success';
    } else {
      statusChip.label = `${textT?.publishAt}: ${publishAt.format(textT?.dateFormat)}`;
      statusChip.color = 'warning';
    }
  }

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/contents">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {isEditing ? (
                  <>
                    {`${textT?.titleEdit} ${formik.values.title}`}
                    <Chip
                      label={statusChip.label}
                      color={statusChip.color}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 2 }}
                    />
                  </>
                ) : (
                  textT?.titleNew
                )}
              </Typography>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <>
                    <Button
                      size="small"
                      type="button"
                      variant="contained"
                      color="primary"
                      LinkComponent={Link}
                      href={`/contents/new?ref=${content.id}`}
                      startIcon={<i className="ri-file-copy-line" />}>
                      {textT?.btnDuplicate}
                    </Button>
                    <Button
                      size="small"
                      type="button"
                      variant={isPublished ? 'outlined' : 'contained'}
                      color="primary"
                      loading={isStatusLoading}
                      onClick={isPublished ? handleUnpublish : handlePublish}
                      startIcon={<i className="ri-check-line" />}>
                      {isPublished ? textT?.btnUnpublish : textT?.btnPublish}
                    </Button>
                  </>
                )}
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
                    <Select
                      options={Object.keys(i18nConfigApp.localesLabel).map((l) => ({
                        value: l,
                        label: i18nConfigApp.localesLabel[l as keyof typeof i18nConfigApp.localesLabel]
                      }))}
                      fullWidth
                      required
                      id="locale"
                      name="locale"
                      label={formT?.labels?.locale}
                      value={formik.values.locale}
                      onChange={(e) => {
                        formik.handleChange(e);
                        formik.setFieldValue('category', null);
                        formik.setFieldValue('page', null);
                      }}
                      error={Boolean(formik.touched.locale && formik.errors.locale)}
                      color={Boolean(formik.touched.locale && formik.errors.locale) ? 'error' : 'primary'}
                      helperText={formik.touched.locale && formik.errors.locale}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="slug"
                      name="slug"
                      label={formT?.labels?.slug}
                      placeholder={formT?.placeholders?.slug}
                      value={formik.values.slug}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.slug && formik.errors.slug)}
                      color={Boolean(formik.touched.slug && formik.errors.slug) ? 'error' : 'primary'}
                      helperText={formik.touched.slug && formik.errors.slug}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="title"
                      name="title"
                      label={formT?.labels?.title}
                      placeholder={formT?.placeholders?.title}
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.title && formik.errors.title)}
                      color={Boolean(formik.touched.title && formik.errors.title) ? 'error' : 'primary'}
                      helperText={formik.touched.title && formik.errors.title}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="subtitle"
                      name="subtitle"
                      label={formT?.labels?.subtitle}
                      placeholder={formT?.placeholders?.subtitle}
                      value={formik.values.subtitle}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.subtitle && formik.errors.subtitle)}
                      color={Boolean(formik.touched.subtitle && formik.errors.subtitle) ? 'error' : 'primary'}
                      helperText={formik.touched.subtitle && formik.errors.subtitle}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      type="text"
                      multiline
                      rows={3}
                      id="description"
                      name="description"
                      label={formT?.labels?.description}
                      placeholder={formT?.placeholders?.description}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.description && formik.errors.description)}
                      color={Boolean(formik.touched.description && formik.errors.description) ? 'error' : 'primary'}
                      helperText={formik.touched.description && formik.errors.description}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <EditorField
                      locale={i18n.language}
                      fullWidth
                      id="content"
                      label={formT?.labels?.content}
                      placeholder={formT?.placeholders?.content}
                      value={formik.values.content}
                      onChange={(event, editor) => {
                        formik.setFieldValue('content', editor.getData());
                      }}
                      error={Boolean(formik.touched.content && formik.errors.content)}
                      color={Boolean(formik.touched.content && formik.errors.content) ? 'error' : 'primary'}
                      helperText={formik.touched.content && formik.errors.content}
                      disabled={formik.isSubmitting || isRedirecting}
                      fileManager={{
                        title: textT?.titleImageSelector,
                        canAdd: canCreateMedia,
                        canDelete: canDeleteMedia
                      }}
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

                  {/* Thumbnail Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{formT?.labels?.thumbnail}</Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <ThumbnailComponent
                      formik={formik}
                      formT={formT}
                      isRedirecting={isRedirecting}
                      fileManager={{
                        title: textT?.titleImageSelector,
                        canAdd: canCreateMedia,
                        canDelete: canDeleteMedia
                      }}
                    />
                  </Grid>

                  {/* Images Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5" className={`${Boolean(formik.errors.images) ? 'text-error' : ''}`}>
                        {formT?.labels?.images}
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <ImagesAccordionComponent
                      formik={formik}
                      formT={formT}
                      isRedirecting={isRedirecting}
                      fileManager={{
                        title: textT?.titleImageSelector,
                        canAdd: canCreateMedia,
                        canDelete: canDeleteMedia
                      }}
                    />
                  </Grid>

                  {/* Custom Values Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5" className={`${Boolean(formik.errors.customValues) ? 'text-error' : ''}`}>
                        {formT?.labels?.customValues}
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <CustomValuesAccordionComponent formik={formik} formT={formT} isRedirecting={isRedirecting} />
                  </Grid>

                  {/* Relations Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5">{formT?.labels?.relations}</Typography>
                    </Divider>
                  </Grid>

                  {/* Category Field */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SelectAutocomplete
                      fullWidth
                      options={categories[formik.values.locale]}
                      id="category"
                      name="category"
                      label={formT?.labels?.category}
                      placeholder={formT?.placeholders?.category}
                      value={formik.values.category}
                      error={Boolean(formik.touched.category && formik.errors.category)}
                      color={Boolean(formik.touched.category && formik.errors.category) ? 'error' : 'primary'}
                      helperText={formik.touched.category && (formik.errors.category as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                      noOptionsText={formT?.noOptions}
                      getOptionLabel={(option) => option.name}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        const color = option.published_at ? 'success' : 'info';

                        return (
                          <Box key={key} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...optionProps}>
                            <i className={`ri-circle-fill text-xs mr-1 text-${color}`} />
                            {option.name}
                          </Box>
                        );
                      }}
                      onChange={(_, newValue) => formik.setFieldValue('category', newValue)}
                    />
                  </Grid>

                  {/* Page Field */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SelectAutocomplete
                      fullWidth
                      options={pages[formik.values.locale]}
                      id="page"
                      name="page"
                      label={formT?.labels?.page}
                      placeholder={formT?.placeholders?.page}
                      value={formik.values.page}
                      error={Boolean(formik.touched.page && formik.errors.page)}
                      color={Boolean(formik.touched.page && formik.errors.page) ? 'error' : 'primary'}
                      helperText={formik.touched.page && (formik.errors.page as string)}
                      disabled={formik.isSubmitting || isRedirecting}
                      noOptionsText={formT?.noOptions}
                      getOptionLabel={(option) => option.name}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        const color = option.published_at ? 'success' : 'info';

                        return (
                          <Box key={key} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...optionProps}>
                            <i className={`ri-circle-fill text-xs mr-1 text-${color}`} />
                            {option.name}
                          </Box>
                        );
                      }}
                      onChange={(_, newValue) => formik.setFieldValue('page', newValue)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      {isEditing && (
        <>
          <Dialog
            open={openDialogUnpublish}
            onClose={() => setOpenDialogUnpublish(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{textT?.dialogUnpublish?.title}</DialogTitle>
            <DialogContent dividers>
              <DialogContentText id="alert-dialog-description">{textT?.dialogUnpublish?.message}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={() => setOpenDialogUnpublish(false)}>
                {textT?.dialogUnpublish?.btnNo}
              </Button>
              <Button variant="text" color="primary" onClick={handleBtnUnpublish}>
                {textT?.dialogUnpublish?.btnYes}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openDialogPublish}
            onClose={() => setOpenDialogPublish(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{textT?.dialogPublish?.title}</DialogTitle>
            <DialogContent dividers>
              <div className="text-center">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleBtnPublish(true);
                  }}>
                  {textT?.dialogPublish?.btnPublishNow}
                </Button>
              </div>
              <Divider sx={{ my: 4 }}>{textT?.dialogPublish?.orLabel}</Divider>
              <div className="text-center">
                <DateTimeField
                  locale={i18n.language}
                  disablePast
                  name="publish-at"
                  label={textT?.dialogPublish?.inputLabel}
                  defaultValue={publishAt}
                  onChange={(value) => setPublishAt(value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: publishAtError,
                      color: publishAtError ? 'error' : 'primary',
                      disabled: formik.isSubmitting || isRedirecting
                    }
                  }}
                  sx={{ mb: 5 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleBtnPublish(false);
                  }}>
                  {textT?.dialogPublish?.btnPublish}
                </Button>
              </div>
            </DialogContent>
            <DialogActions>
              <Button variant="text" color="secondary" onClick={() => setOpenDialogPublish(false)}>
                {textT?.dialogPublish?.btnCancel}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

const ThumbnailComponent = ({
  formik,
  formT,
  isRedirecting,
  fileManager
}: {
  formik: any;
  formT: any;
  isRedirecting: boolean;
  fileManager: { title: string; canAdd: boolean; canDelete: boolean };
}) => {
  const handleAdd = () => {
    const newValue = { id: Date.now(), media: null, title: '', link: '' };

    formik.setFieldValue('thumbnail', newValue);
  };

  const handleRemove = () => {
    formik.setFieldValue('thumbnail', null);
  };

  const handleChangeMedia = (media?: any) => {
    const newValue: any = { ...formik.values.thumbnail };

    if (media) {
      newValue.media = media;
    } else {
      newValue.media = null;
    }

    formik.setFieldValue('thumbnail', newValue);
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          {formik.values.thumbnail && (
            <Accordion variant="outlined" disableGutters expanded>
              <AccordionDetails sx={{ p: 5 }}>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" alignItems="center" width="100%" justifyContent="end">
                      <IconButton className="p-0" onClick={() => handleRemove()}>
                        <i className="ri-delete-bin-2-line" />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <ImageField
                      fullWidth
                      required
                      label={formT?.labels?.imagesImage}
                      placeholder={formT?.placeholders?.imagesImage}
                      value={formik.values.thumbnail?.media}
                      onChange={handleChangeMedia}
                      error={Boolean(formik.touched.thumbnail?.media && formik.errors.thumbnail?.media)}
                      color={
                        Boolean(formik.touched.thumbnail?.media && formik.errors.thumbnail?.media) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.thumbnail?.media && formik.errors.thumbnail?.media}
                      disabled={formik.isSubmitting || isRedirecting}
                      fileManager={fileManager}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="thumbnail.title"
                      name="thumbnail.title"
                      label={formT?.labels?.imagesTitle}
                      placeholder={formT?.placeholders?.imagesTitle}
                      value={formik.values.thumbnail?.title}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.thumbnail?.title && formik.errors.thumbnail?.title)}
                      color={
                        Boolean(formik.touched.thumbnail?.title && formik.errors.thumbnail?.title) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.thumbnail?.title && formik.errors.thumbnail?.title}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="text"
                      id="thumbnail.link"
                      name="thumbnail.link"
                      label={formT?.labels?.imagesLink}
                      placeholder={formT?.placeholders?.imagesLink}
                      value={formik.values.thumbnail?.link}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.thumbnail?.link && formik.errors.thumbnail?.link)}
                      color={
                        Boolean(formik.touched.thumbnail?.link && formik.errors.thumbnail?.link) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.thumbnail?.link && formik.errors.thumbnail?.link}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
          {!formik.values.thumbnail && (
            <Accordion variant="outlined" disableGutters expanded>
              <AccordionDetails sx={{ py: 1, px: 5 }}>
                <div className="text-center">
                  <Button type="button" variant="text" onClick={handleAdd}>
                    {formT?.addThumbnailBtn}
                  </Button>
                </div>
              </AccordionDetails>
            </Accordion>
          )}
        </div>
      </Grid>
    </Grid>
  );
};

const ImagesAccordionComponent = ({
  formik,
  formT,
  isRedirecting,
  fileManager
}: {
  formik: any;
  formT: any;
  isRedirecting: boolean;
  fileManager: { title: string; canAdd: boolean; canDelete: boolean };
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChangeExpanded = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleAdd = () => {
    const newValue = [...formik.values.images, { id: Date.now(), media: null, title: '', link: '' }];

    formik.setFieldValue('images', newValue);

    setExpanded(`images[${newValue.length - 1}]`);
  };

  const handleRemove = (index: number) => {
    const newValue = [...formik.values.images];

    newValue.splice(index, 1);

    formik.setFieldValue('images', newValue);

    setExpanded(false);
  };

  const handleChangeMedia = (index: number, media?: any) => {
    const newValues = [...formik.values.images];

    if (!newValues[index]) {
      return;
    }

    if (media) {
      newValues[index].media = media;
    } else {
      newValues[index].media = null;
    }

    formik.setFieldValue(`images`, newValues);
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          <SortableComponent
            strategy="vertical"
            items={formik.values.images}
            renderItem={({ item, index, containerProps, listenersProps }) => {
              const errors: any = Array.isArray(formik.errors.images) ? formik.errors.images[index] || {} : {};

              const touched: any = Array.isArray(formik.touched.images) ? formik.touched.images[index] || {} : {};

              const hasErrors = Object.keys(errors).length > 0;

              return (
                <Accordion
                  variant="outlined"
                  disableGutters
                  expanded={expanded === `images[${index}]`}
                  onChange={handleChangeExpanded(`images[${index}]`)}
                  sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}
                  {...containerProps}>
                  <AccordionSummary
                    component="div"
                    aria-controls={`images[${index}]-content`}
                    id={`images[${index}]-header`}
                    sx={{
                      flexDirection: 'row-reverse',
                      color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
                    }}>
                    <div className="flex items-center w-full justify-between">
                      <Typography component="span">{item.media?.name}</Typography>
                      <div className="flex items-center gap-2">
                        <IconButton className="p-0" onClick={() => handleRemove(index)}>
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
                      <Grid size={{ xs: 12 }}>
                        <ImageField
                          fullWidth
                          required
                          label={formT?.labels?.imagesImage}
                          placeholder={formT?.placeholders?.imagesImage}
                          value={item.media}
                          onChange={(media) => handleChangeMedia(index, media)}
                          error={Boolean(touched.media && errors.media)}
                          color={Boolean(touched.media && errors.media) ? 'error' : 'primary'}
                          helperText={touched.media && errors.media}
                          disabled={formik.isSubmitting || isRedirecting}
                          fileManager={fileManager}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          type="text"
                          id={`images[${index}].title`}
                          name={`images[${index}].title`}
                          label={formT?.labels?.imagesTitle}
                          placeholder={formT?.placeholders?.imagesTitle}
                          value={item.title}
                          onChange={formik.handleChange}
                          error={Boolean(touched.title && errors.title)}
                          color={Boolean(touched.title && errors.title) ? 'error' : 'primary'}
                          helperText={touched.title && errors.title}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          type="text"
                          id={`images[${index}].link`}
                          name={`images[${index}].link`}
                          label={formT?.labels?.imagesLink}
                          placeholder={formT?.placeholders?.imagesLink}
                          value={item.link}
                          onChange={formik.handleChange}
                          error={Boolean(touched.link && errors.link)}
                          color={Boolean(touched.link && errors.link) ? 'error' : 'primary'}
                          helperText={touched.link && errors.link}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            }}
            onChange={(items) => formik.setFieldValue('images', items).then(() => formik.validateField('images'))}
            onStart={() => setExpanded(false)}
          />
          <Accordion variant="outlined" disableGutters expanded>
            <AccordionDetails sx={{ py: 1, px: 5 }}>
              <div className="text-center">
                <Button type="button" variant="text" onClick={handleAdd}>
                  {formT?.addImageBtn}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </Grid>
    </Grid>
  );
};

const CustomValuesAccordionComponent = ({
  formik,
  formT,
  isRedirecting
}: {
  formik: any;
  formT: any;
  isRedirecting: boolean;
}) => {
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
                          disabled={formik.isSubmitting || isRedirecting}
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
                          disabled={formik.isSubmitting || isRedirecting}
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

export default ContentsEdition;
