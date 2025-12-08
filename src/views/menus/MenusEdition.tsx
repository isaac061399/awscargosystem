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

// Helpers Imports
import { requestEditMenu, requestNewMenu, requestStatusMenu } from '@helpers/request';

// Components Imports
import DateTimeField from '@components/DateTimeField';
import SortableComponent from '@components/SortableComponent';

import i18nConfigApp from '@/configs/i18nConfigApp';
import cmsConfig from '@/configs/cmsConfig';

const defaultAlertState = { open: false, type: 'success', message: '' };

const MenusEdition = ({ menu, isDuplicated }: { menu?: any; isDuplicated?: boolean }) => {
  const router = useRouter();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('menus-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('menus-edition:form', { returnObjects: true, default: {} }), [t]);

  const [isEditing] = useState(menu && !isDuplicated);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [openDialogPublish, setOpenDialogPublish] = useState(false);
  const [isPublished, setIsPublished] = useState(Boolean(menu?.published_at));
  const [publishAt, setPublishAt] = useState<any>(menu?.published_at ? moment(menu?.published_at) : null);
  const [publishAtError, setPublishAtError] = useState(false);
  const [openDialogUnpublish, setOpenDialogUnpublish] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        locale: menu ? `${menu.locale}` : i18nConfigApp.defaultLocale,
        slug: menu ? `${menu.slug}` : '',
        name: menu ? `${menu.name}` : '',
        items: menu ? menu.items : []
      }),
      [menu]
    ),
    validationSchema: yup.object({
      locale: yup.string().required(formT?.errors?.locale),
      slug: yup.string().required(formT?.errors?.slug),
      name: yup.string().required(formT?.errors?.name),
      items: yup.array(
        yup.object({
          title: yup.string().required(formT?.errors?.itemsTitle),
          url: yup.string().required(formT?.errors?.itemsUrl),
          target: yup.string().required(formT?.errors?.itemsTarget),
          subitems: yup.array(
            yup.object({
              title: yup.string().required(formT?.errors?.itemsTitle),
              url: yup.string().required(formT?.errors?.itemsUrl),
              target: yup.string().required(formT?.errors?.itemsTarget)
            })
          )
        })
      )
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const params: any = { ...values };

        params.items = values.items.map((item: any, index: number) => ({
          title: item.title,
          url: item.url,
          target: item.target,
          order: index,
          subitems: item.subitems.map((subitem: any, index2: number) => ({
            title: subitem.title,
            url: subitem.url,
            target: subitem.target,
            order: index2
          }))
        }));

        const result = isEditing
          ? await requestEditMenu(menu.id, params, i18n.language)
          : await requestNewMenu(params, i18n.language);

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
            router.push(`/menus/edit/${result.id}`);
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
      const result = await requestStatusMenu(menu.id, { type, value }, i18n.language);

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
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/menus">
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
                      href={`/menus/new?ref=${menu.id}`}
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

                  {/* Items Fields */}
                  <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5" className={`${Boolean(formik.errors.items) ? 'text-error' : ''}`}>
                        {formT?.labels?.items}
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <ItemsAccordionComponent formik={formik} formT={formT} isRedirecting={isRedirecting} />
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

const ItemsAccordionComponent = ({
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
    const newValue = [...formik.values.items, { id: Date.now(), title: '', url: '', target: '', subitems: [] }];

    formik.setFieldValue('items', newValue);

    setExpanded(`items[${newValue.length - 1}]`);
  };

  const handleRemove = (index: number) => {
    const newValue = [...formik.values.items];

    newValue.splice(index, 1);

    formik.setFieldValue('items', newValue);

    setExpanded(false);
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          <SortableComponent
            strategy="vertical"
            items={formik.values.items}
            renderItem={({ item, index, containerProps, listenersProps }) => {
              const errors: any = Array.isArray(formik.errors.items) ? formik.errors.items[index] || {} : {};

              const touched: any = Array.isArray(formik.touched.items) ? formik.touched.items[index] || {} : {};

              const hasErrors = Object.keys(errors).length > 0;

              return (
                <Accordion
                  variant="outlined"
                  disableGutters
                  expanded={expanded === `items[${index}]`}
                  onChange={handleChangeExpanded(`items[${index}]`)}
                  sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}
                  {...containerProps}>
                  <AccordionSummary
                    component="div"
                    aria-controls={`items[${index}]-menu`}
                    id={`items[${index}]-header`}
                    sx={{
                      flexDirection: 'row-reverse',
                      color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
                    }}>
                    <div className="flex items-center w-full justify-between">
                      <Typography component="span">{item.title}</Typography>
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
                          id={`items[${index}].title`}
                          name={`items[${index}].title`}
                          label={formT?.labels?.itemsTitle}
                          placeholder={formT?.placeholders?.itemsTitle}
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
                          required
                          type="text"
                          id={`items[${index}].url`}
                          name={`items[${index}].url`}
                          label={formT?.labels?.itemsUrl}
                          placeholder={formT?.placeholders?.itemsUrl}
                          value={item.url}
                          onChange={formik.handleChange}
                          error={Boolean(touched.url && errors.url)}
                          color={Boolean(touched.url && errors.url) ? 'error' : 'primary'}
                          helperText={touched.url && errors.url}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Select
                          options={cmsConfig.menus.targetOptions.map((t) => ({ value: t, label: t }))}
                          fullWidth
                          required
                          id={`items[${index}].target`}
                          name={`items[${index}].target`}
                          label={formT?.labels?.itemsTarget}
                          value={item.target}
                          onChange={formik.handleChange}
                          error={Boolean(touched.target && errors.target)}
                          color={Boolean(touched.target && errors.target) ? 'error' : 'primary'}
                          helperText={touched.target && errors.target}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      </Grid>

                      {/* Subitems Fields */}
                      <Grid size={{ xs: 12 }}>
                        <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                          <Typography
                            variant="h5"
                            className={`${Boolean(formik.errors.items?.[index]?.subitems) ? 'text-error' : ''}`}>
                            {formT?.labels?.subitems}
                          </Typography>
                        </Divider>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <SubitemsAccordionComponent
                          itemIndex={index}
                          formik={formik}
                          formT={formT}
                          isRedirecting={isRedirecting}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            }}
            onChange={async (items) => {
              await formik.setFieldValue('items', items);
              await formik.validateField('items');
            }}
            onStart={() => setExpanded(false)}
          />
          <Accordion variant="outlined" disableGutters expanded>
            <AccordionDetails sx={{ py: 1, px: 5 }}>
              <div className="text-center">
                <Button type="button" variant="text" onClick={handleAdd}>
                  {formT?.addItemsBtn}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </Grid>
    </Grid>
  );
};

const SubitemsAccordionComponent = ({
  itemIndex,
  formik,
  formT,
  isRedirecting
}: {
  itemIndex: number;
  formik: any;
  formT: any;
  isRedirecting: boolean;
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChangeExpanded = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleAdd = () => {
    const newValue = [...formik.values.items[itemIndex].subitems, { id: Date.now(), title: '', url: '', target: '' }];

    formik.setFieldValue(`items[${itemIndex}].subitems`, newValue);

    setExpanded(`items[${itemIndex}].subitems[${newValue.length - 1}]`);
  };

  const handleRemove = (index: number) => {
    const newValue = [...formik.values.items[itemIndex].subitems];

    newValue.splice(index, 1);

    formik.setFieldValue(`items[${itemIndex}].subitems`, newValue);

    setExpanded(false);
  };

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12 }}>
        <div>
          <SortableComponent
            strategy="vertical"
            items={formik.values.items[itemIndex].subitems}
            renderItem={({ item, index, containerProps, listenersProps }) => {
              const errors: any = Array.isArray(formik.errors.items?.[itemIndex]?.subitems)
                ? formik.errors.items?.[itemIndex]?.subitems[index] || {}
                : {};

              const touched: any = Array.isArray(formik.touched.items?.[itemIndex]?.subitems)
                ? formik.touched.items?.[itemIndex]?.subitems[index] || {}
                : {};

              const hasErrors = Object.keys(errors).length > 0;

              return (
                <Accordion
                  variant="outlined"
                  disableGutters
                  expanded={expanded === `items[${itemIndex}].subitems[${index}]`}
                  onChange={handleChangeExpanded(`items[${itemIndex}].subitems[${index}]`)}
                  sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}
                  {...containerProps}>
                  <AccordionSummary
                    component="div"
                    aria-controls={`items[${itemIndex}].subitems[${index}]-menu`}
                    id={`items[${itemIndex}].subitems[${index}]-header`}
                    sx={{
                      flexDirection: 'row-reverse',
                      color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
                    }}>
                    <div className="flex items-center w-full justify-between">
                      <Typography component="span">{item.title}</Typography>
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
                          id={`items[${itemIndex}].subitems[${index}].title`}
                          name={`items[${itemIndex}].subitems[${index}].title`}
                          label={formT?.labels?.itemsTitle}
                          placeholder={formT?.placeholders?.itemsTitle}
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
                          required
                          type="text"
                          id={`items[${itemIndex}].subitems[${index}].url`}
                          name={`items[${itemIndex}].subitems[${index}].url`}
                          label={formT?.labels?.itemsUrl}
                          placeholder={formT?.placeholders?.itemsUrl}
                          value={item.url}
                          onChange={formik.handleChange}
                          error={Boolean(touched.url && errors.url)}
                          color={Boolean(touched.url && errors.url) ? 'error' : 'primary'}
                          helperText={touched.url && errors.url}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Select
                          options={cmsConfig.menus.targetOptions.map((t) => ({ value: t, label: t }))}
                          fullWidth
                          required
                          id={`items[${itemIndex}].subitems[${index}].target`}
                          name={`items[${itemIndex}].subitems[${index}].target`}
                          label={formT?.labels?.itemsTarget}
                          value={item.target}
                          onChange={formik.handleChange}
                          error={Boolean(touched.target && errors.target)}
                          color={Boolean(touched.target && errors.target) ? 'error' : 'primary'}
                          helperText={touched.target && errors.target}
                          disabled={formik.isSubmitting || isRedirecting}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            }}
            onChange={async (items) => {
              await formik.setFieldValue(`items[${itemIndex}].subitems`, items);
              await formik.validateField(`items[${itemIndex}].subitems`);
            }}
            onStart={() => setExpanded(false)}
          />
          <Accordion variant="outlined" disableGutters expanded>
            <AccordionDetails sx={{ py: 1, px: 5 }}>
              <div className="text-center">
                <Button type="button" variant="text" onClick={handleAdd}>
                  {formT?.addSubitemsBtn}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </Grid>
    </Grid>
  );
};

export default MenusEdition;
