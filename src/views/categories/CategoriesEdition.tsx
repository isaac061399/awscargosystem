'use client';

// React Imports
import { Fragment, useMemo, useState } from 'react';

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
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@mui/material';

// Others Imports
import moment from 'moment';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import Select from '@components/Select';

// Helpers Imports
import { requestEditCategory, requestNewCategory, requestStatusCategory } from '@helpers/request';

// Components Imports
import DateTimeField from '@components/DateTimeField';

import i18nConfigApp from '@/configs/i18nConfigApp';

const defaultAlertState = { open: false, type: 'success', message: '' };

const CategoriesEdition = ({ category, isDuplicated }: { category?: any; isDuplicated?: boolean }) => {
  const router = useRouter();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('categories-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('categories-edition:form', { returnObjects: true, default: {} }), [t]);

  const [isEditing] = useState(category && !isDuplicated);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [openDialogPublish, setOpenDialogPublish] = useState(false);
  const [isPublished, setIsPublished] = useState(Boolean(category?.published_at));
  const [publishAt, setPublishAt] = useState<any>(category?.published_at ? moment(category?.published_at) : null);
  const [publishAtError, setPublishAtError] = useState(false);
  const [openDialogUnpublish, setOpenDialogUnpublish] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        locale: category ? `${category.locale}` : i18nConfigApp.defaultLocale,
        slug: category ? `${category.slug}` : '',
        name: category ? `${category.name}` : '',
        title: category ? `${category.title}` : '',
        subtitle: category ? `${category.subtitle}` : '',
        description: category ? `${category.description}` : ''
      }),
      [category]
    ),
    validationSchema: yup.object({
      locale: yup.string().required(formT?.errors?.locale),
      slug: yup.string().required(formT?.errors?.slug),
      name: yup.string().required(formT?.errors?.name),
      title: yup.string(),
      subtitle: yup.string(),
      description: yup.string()
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = isEditing
          ? await requestEditCategory(category.id, values, i18n.language)
          : await requestNewCategory(values, i18n.language);

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
            router.push(`/categories/edit/${result.id}`);
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
      const result = await requestStatusCategory(category.id, { type, value }, i18n.language);

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
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/categories">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {isEditing ? (
                  <>
                    {`${textT?.titleEdit} ${formik.values.name}`}
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
                      href={`/categories/new?ref=${category.id}`}
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
                      onChange={formik.handleChange}
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
                  <Grid size={{ xs: 12, md: 4 }}>
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
                      helperText={formik.touched.name && formik.errors.name}
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
                </Grid>
              </CardContent>

              {isEditing && category?.contents?.length > 0 && (
                <CardContent>
                  <Divider />
                  <Typography variant="h5" sx={{ my: 3 }}>
                    {textT?.relatedContents}
                  </Typography>

                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12, sm: 12, md: 8, lg: 6 }}>
                      <List>
                        {category.contents.map((c: any, index: number) => {
                          const title = c.title && c.title !== '' ? `${c.title} (${c.slug})` : c.slug;
                          const color = c.published_at ? 'success' : 'info';

                          return (
                            <Fragment key={`content${index}`}>
                              <ListItem
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    LinkComponent={Link}
                                    href={`/contents/edit/${c.id}`}>
                                    <i className="ri-link-m" />
                                  </IconButton>
                                }>
                                <ListItemText
                                  primary={
                                    <>
                                      <i className={`ri-circle-fill text-xs mr-1 text-${color}`} /> {title}
                                    </>
                                  }
                                />
                              </ListItem>
                              <Divider component="li" />
                            </Fragment>
                          );
                        })}
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              )}
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

export default CategoriesEdition;
