'use client';

// React Imports
import { useMemo, useRef, useState } from 'react';

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
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
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
import { requestEditOrder, requestNewOrder, requestSearchClients, requestStatusOrder } from '@helpers/request';

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

const statusColors: any = {
  PENDING: 'warning',
  ON_THE_WAY: 'primary',
  READY: 'info',
  DELIVERED: 'success'
};

const paymentStatusColors: any = {
  PENDING: 'warning',
  PAID: 'success'
};

const formatOption = (option: any) => {
  const extras = [];

  if (option.box_number) {
    extras.push(option.box_number);
  }

  if (option.identification) {
    extras.push(option.identification);
  }

  if (option.email) {
    extras.push(option.email);
  }

  if (extras.length === 0) {
    return `${option.full_name}`;
  }

  return `${option.full_name} (${extras.join(' - ')})`;
};

const OrdersEdition = ({ order }: { order?: any }) => {
  const router = useRouter();
  const { data: admin } = useAdmin();
  const canCreateMedia = hasAllPermissions('media.create', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('orders-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('orders-edition:form', { returnObjects: true, default: {} }), [t]);
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [isEditing] = useState(order);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientOptions, setClientOptions] = useState<any[]>(order ? [order.client] : []);

  // const [openDialogPublish, setOpenDialogPublish] = useState(false);
  // const [isPublished, setIsPublished] = useState(Boolean(order?.published_at));
  // const [publishAt, setPublishAt] = useState<any>(order?.published_at ? moment(order?.published_at) : null);
  // const [publishAtError, setPublishAtError] = useState(false);
  // const [openDialogUnpublish, setOpenDialogUnpublish] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        client_id: order ? order.client?.id : null,
        number: order ? `${order.number}` : '',
        purchase_page: order ? `${order.purchase_page}` : '',
        products: order ? order.products : []
      }),
      [order]
    ),
    validationSchema: yup.object({
      client_id: yup.number().required(formT?.errors?.client_id),
      number: yup.string().required(formT?.errors?.number),
      purchase_page: yup.string().required(formT?.errors?.purchase_page),

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

        // delete params.category;
        // params.category_id = values.category?.id;
        // delete params.page;
        // params.page_id = values.page?.id;
        // params.thumbnail = values.thumbnail
        //   ? { media_id: values.thumbnail.media.id, title: values.thumbnail.title, link: values.thumbnail.link }
        //   : null;
        // params.images = values.images.map((img: any, index: number) => ({
        //   media_id: img.media.id,
        //   title: img.title,
        //   link: img.link,
        //   order: index
        // }));
        // params.customValues = values.customValues.map((cv: any, index: number) => ({
        //   key: cv.key,
        //   value: cv.value,
        //   order: index
        // }));

        const result = isEditing
          ? await requestEditOrder(order.id, params, i18n.language)
          : await requestNewOrder(params, i18n.language);

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
            router.push(`/orders/edit/${result.id}`);
          }, 2000);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const fetchClients = async (search: string) => {
    if (!search.trim()) {
      setClientOptions([]);

      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setClientLoading(true);

      const result = await requestSearchClients({ search }, i18n.language);

      setClientOptions(result.valid ? result.data : []);

      setClientLoading(false);
    }, 500); // 500ms debounce
  };

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
      const result = await requestStatusOrder(order.id, { type, value }, i18n.language);

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

  const paymentStatusChip: any = { label: '', color: 'info' };

  const statusChip: any = { label: '', color: 'info' };

  if (isEditing) {
    paymentStatusChip.label = labelsT?.orderPaymentStatus?.[order.status] || 'Unknown';
    paymentStatusChip.color = paymentStatusColors[order.status] || 'info';

    statusChip.label = labelsT?.orderStatus?.[order.status] || 'Unknown';
    statusChip.color = statusColors[order.status] || 'info';
  }

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/orders">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {isEditing ? (
                  <>
                    {`${textT?.titleEdit} ${order.id}`}
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
                      href={`/orders/new?ref=${order.id}`}
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
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Autocomplete
                      options={clientOptions}
                      isOptionEqualToValue={(option, v) => option.id === v.id}
                      value={clientOptions.find((option) => option.id === formik.values.client_id) || null}
                      getOptionLabel={(option) => formatOption(option)}
                      onInputChange={(event, value, reason) => {
                        if (['input', 'clear'].includes(reason)) {
                          fetchClients(value);
                        }
                      }}
                      onChange={(event, value) => {
                        formik.setFieldValue('client_id', value?.id || null);
                      }}
                      loading={clientLoading}
                      loadingText={textT?.loading}
                      noOptionsText={textT?.noOptions}
                      disabled={formik.isSubmitting || isRedirecting}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          id="client_id"
                          name="client_id"
                          label={formT?.labels?.client_id}
                          placeholder={formT?.placeholders?.client_id}
                          error={Boolean(formik.touched.client_id && formik.errors.client_id)}
                          color={Boolean(formik.touched.client_id && formik.errors.client_id) ? 'error' : 'primary'}
                          helperText={formik.touched.client_id && (formik.errors.client_id as string)}
                          disabled={formik.isSubmitting || isRedirecting}
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {clientLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              )
                            }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="number"
                      name="number"
                      label={formT?.labels?.number}
                      placeholder={formT?.placeholders?.number}
                      value={formik.values.number}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.number && formik.errors.number)}
                      color={Boolean(formik.touched.number && formik.errors.number) ? 'error' : 'primary'}
                      helperText={formik.touched.number && formik.errors.number}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="purchase_page"
                      name="purchase_page"
                      label={formT?.labels?.purchase_page}
                      placeholder={formT?.placeholders?.purchase_page}
                      value={formik.values.purchase_page}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.purchase_page && formik.errors.purchase_page)}
                      color={Boolean(formik.touched.purchase_page && formik.errors.purchase_page) ? 'error' : 'primary'}
                      helperText={formik.touched.purchase_page && formik.errors.purchase_page}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>

                  {/* Custom Values Fields */}
                  {/* <Grid size={{ xs: 12 }}>
                    <Divider textAlign="left" sx={{ '&::before': { width: 0 }, '&::after': { flex: 1 } }}>
                      <Typography variant="h5" className={`${Boolean(formik.errors.customValues) ? 'text-error' : ''}`}>
                        {formT?.labels?.customValues}
                      </Typography>
                    </Divider>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <CustomValuesAccordionComponent formik={formik} formT={formT} isRedirecting={isRedirecting} />
                  </Grid> */}
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

// const ThumbnailComponent = ({
//   formik,
//   formT,
//   isRedirecting,
//   fileManager
// }: {
//   formik: any;
//   formT: any;
//   isRedirecting: boolean;
//   fileManager: { title: string; canAdd: boolean; canDelete: boolean };
// }) => {
//   const handleAdd = () => {
//     const newValue = { id: Date.now(), media: null, title: '', link: '' };

//     formik.setFieldValue('thumbnail', newValue);
//   };

//   const handleRemove = () => {
//     formik.setFieldValue('thumbnail', null);
//   };

//   const handleChangeMedia = (media?: any) => {
//     const newValue: any = { ...formik.values.thumbnail };

//     if (media) {
//       newValue.media = media;
//     } else {
//       newValue.media = null;
//     }

//     formik.setFieldValue('thumbnail', newValue);
//   };

//   return (
//     <Grid container spacing={5}>
//       <Grid size={{ xs: 12 }}>
//         <div>
//           {formik.values.thumbnail && (
//             <Accordion variant="outlined" disableGutters expanded>
//               <AccordionDetails sx={{ p: 5 }}>
//                 <Grid container spacing={5}>
//                   <Grid size={{ xs: 12 }}>
//                     <Box display="flex" alignItems="center" width="100%" justifyOrder="end">
//                       <IconButton className="p-0" onClick={() => handleRemove()}>
//                         <i className="ri-delete-bin-2-line" />
//                       </IconButton>
//                     </Box>
//                   </Grid>
//                   <Grid size={{ xs: 12 }}>
//                     <ImageField
//                       fullWidth
//                       required
//                       label={formT?.labels?.imagesImage}
//                       placeholder={formT?.placeholders?.imagesImage}
//                       value={formik.values.thumbnail?.media}
//                       onChange={handleChangeMedia}
//                       error={Boolean(formik.touched.thumbnail?.media && formik.errors.thumbnail?.media)}
//                       color={
//                         Boolean(formik.touched.thumbnail?.media && formik.errors.thumbnail?.media) ? 'error' : 'primary'
//                       }
//                       helperText={formik.touched.thumbnail?.media && formik.errors.thumbnail?.media}
//                       disabled={formik.isSubmitting || isRedirecting}
//                       fileManager={fileManager}
//                     />
//                   </Grid>
//                   <Grid size={{ xs: 12, md: 6 }}>
//                     <TextField
//                       fullWidth
//                       type="text"
//                       id="thumbnail.title"
//                       name="thumbnail.title"
//                       label={formT?.labels?.imagesTitle}
//                       placeholder={formT?.placeholders?.imagesTitle}
//                       value={formik.values.thumbnail?.title}
//                       onChange={formik.handleChange}
//                       error={Boolean(formik.touched.thumbnail?.title && formik.errors.thumbnail?.title)}
//                       color={
//                         Boolean(formik.touched.thumbnail?.title && formik.errors.thumbnail?.title) ? 'error' : 'primary'
//                       }
//                       helperText={formik.touched.thumbnail?.title && formik.errors.thumbnail?.title}
//                       disabled={formik.isSubmitting || isRedirecting}
//                     />
//                   </Grid>
//                   <Grid size={{ xs: 12, md: 6 }}>
//                     <TextField
//                       fullWidth
//                       type="text"
//                       id="thumbnail.link"
//                       name="thumbnail.link"
//                       label={formT?.labels?.imagesLink}
//                       placeholder={formT?.placeholders?.imagesLink}
//                       value={formik.values.thumbnail?.link}
//                       onChange={formik.handleChange}
//                       error={Boolean(formik.touched.thumbnail?.link && formik.errors.thumbnail?.link)}
//                       color={
//                         Boolean(formik.touched.thumbnail?.link && formik.errors.thumbnail?.link) ? 'error' : 'primary'
//                       }
//                       helperText={formik.touched.thumbnail?.link && formik.errors.thumbnail?.link}
//                       disabled={formik.isSubmitting || isRedirecting}
//                     />
//                   </Grid>
//                 </Grid>
//               </AccordionDetails>
//             </Accordion>
//           )}
//           {!formik.values.thumbnail && (
//             <Accordion variant="outlined" disableGutters expanded>
//               <AccordionDetails sx={{ py: 1, px: 5 }}>
//                 <div className="text-center">
//                   <Button type="button" variant="text" onClick={handleAdd}>
//                     {formT?.addThumbnailBtn}
//                   </Button>
//                 </div>
//               </AccordionDetails>
//             </Accordion>
//           )}
//         </div>
//       </Grid>
//     </Grid>
//   );
// };

// const ImagesAccordionComponent = ({
//   formik,
//   formT,
//   isRedirecting,
//   fileManager
// }: {
//   formik: any;
//   formT: any;
//   isRedirecting: boolean;
//   fileManager: { title: string; canAdd: boolean; canDelete: boolean };
// }) => {
//   const [expanded, setExpanded] = useState<string | false>(false);

//   const handleChangeExpanded = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
//     setExpanded(newExpanded ? panel : false);
//   };

//   const handleAdd = () => {
//     const newValue = [...formik.values.images, { id: Date.now(), media: null, title: '', link: '' }];

//     formik.setFieldValue('images', newValue);

//     setExpanded(`images[${newValue.length - 1}]`);
//   };

//   const handleRemove = (index: number) => {
//     const newValue = [...formik.values.images];

//     newValue.splice(index, 1);

//     formik.setFieldValue('images', newValue);

//     setExpanded(false);
//   };

//   const handleChangeMedia = (index: number, media?: any) => {
//     const newValues = [...formik.values.images];

//     if (!newValues[index]) {
//       return;
//     }

//     if (media) {
//       newValues[index].media = media;
//     } else {
//       newValues[index].media = null;
//     }

//     formik.setFieldValue(`images`, newValues);
//   };

//   return (
//     <Grid container spacing={5}>
//       <Grid size={{ xs: 12 }}>
//         <div>
//           <SortableComponent
//             strategy="vertical"
//             items={formik.values.images}
//             renderItem={({ item, index, containerProps, listenersProps }) => {
//               const errors: any = Array.isArray(formik.errors.images) ? formik.errors.images[index] || {} : {};

//               const touched: any = Array.isArray(formik.touched.images) ? formik.touched.images[index] || {} : {};

//               const hasErrors = Object.keys(errors).length > 0;

//               return (
//                 <Accordion
//                   variant="outlined"
//                   disableGutters
//                   expanded={expanded === `images[${index}]`}
//                   onChange={handleChangeExpanded(`images[${index}]`)}
//                   sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}
//                   {...containerProps}>
//                   <AccordionSummary
//                     component="div"
//                     aria-controls={`images[${index}]-order`}
//                     id={`images[${index}]-header`}
//                     sx={{
//                       flexDirection: 'row-reverse',
//                       color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
//                     }}>
//                     <div className="flex items-center w-full justify-between">
//                       <Typography component="span">{item.media?.name}</Typography>
//                       <div className="flex items-center gap-2">
//                         <IconButton className="p-0" onClick={() => handleRemove(index)}>
//                           <i className="ri-delete-bin-2-line" />
//                         </IconButton>
//                         <IconButton className="p-1" {...listenersProps}>
//                           <i className="ri-more-2-fill" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   </AccordionSummary>
//                   <AccordionDetails>
//                     <Grid container spacing={5} sx={{ mt: 2 }}>
//                       <Grid size={{ xs: 12 }}>
//                         <ImageField
//                           fullWidth
//                           required
//                           label={formT?.labels?.imagesImage}
//                           placeholder={formT?.placeholders?.imagesImage}
//                           value={item.media}
//                           onChange={(media) => handleChangeMedia(index, media)}
//                           error={Boolean(touched.media && errors.media)}
//                           color={Boolean(touched.media && errors.media) ? 'error' : 'primary'}
//                           helperText={touched.media && errors.media}
//                           disabled={formik.isSubmitting || isRedirecting}
//                           fileManager={fileManager}
//                         />
//                       </Grid>
//                       <Grid size={{ xs: 12, md: 6 }}>
//                         <TextField
//                           fullWidth
//                           type="text"
//                           id={`images[${index}].title`}
//                           name={`images[${index}].title`}
//                           label={formT?.labels?.imagesTitle}
//                           placeholder={formT?.placeholders?.imagesTitle}
//                           value={item.title}
//                           onChange={formik.handleChange}
//                           error={Boolean(touched.title && errors.title)}
//                           color={Boolean(touched.title && errors.title) ? 'error' : 'primary'}
//                           helperText={touched.title && errors.title}
//                           disabled={formik.isSubmitting || isRedirecting}
//                         />
//                       </Grid>
//                       <Grid size={{ xs: 12, md: 6 }}>
//                         <TextField
//                           fullWidth
//                           type="text"
//                           id={`images[${index}].link`}
//                           name={`images[${index}].link`}
//                           label={formT?.labels?.imagesLink}
//                           placeholder={formT?.placeholders?.imagesLink}
//                           value={item.link}
//                           onChange={formik.handleChange}
//                           error={Boolean(touched.link && errors.link)}
//                           color={Boolean(touched.link && errors.link) ? 'error' : 'primary'}
//                           helperText={touched.link && errors.link}
//                           disabled={formik.isSubmitting || isRedirecting}
//                         />
//                       </Grid>
//                     </Grid>
//                   </AccordionDetails>
//                 </Accordion>
//               );
//             }}
//             onChange={(items) => formik.setFieldValue('images', items).then(() => formik.validateField('images'))}
//             onStart={() => setExpanded(false)}
//           />
//           <Accordion variant="outlined" disableGutters expanded>
//             <AccordionDetails sx={{ py: 1, px: 5 }}>
//               <div className="text-center">
//                 <Button type="button" variant="text" onClick={handleAdd}>
//                   {formT?.addImageBtn}
//                 </Button>
//               </div>
//             </AccordionDetails>
//           </Accordion>
//         </div>
//       </Grid>
//     </Grid>
//   );
// };

// const CustomValuesAccordionComponent = ({
//   formik,
//   formT,
//   isRedirecting
// }: {
//   formik: any;
//   formT: any;
//   isRedirecting: boolean;
// }) => {
//   const [expanded, setExpanded] = useState<string | false>(false);

//   const handleChangeExpanded = (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
//     setExpanded(newExpanded ? panel : false);
//   };

//   const handleAdd = () => {
//     const newValue = [...formik.values.customValues, { id: Date.now(), key: '', value: '' }];

//     formik.setFieldValue('customValues', newValue);

//     setExpanded(`customValues[${newValue.length - 1}]`);
//   };

//   const handleRemove = (index: number) => {
//     const newValue = [...formik.values.customValues];

//     newValue.splice(index, 1);

//     formik.setFieldValue('customValues', newValue);

//     setExpanded(false);
//   };

//   return (
//     <Grid container spacing={5}>
//       <Grid size={{ xs: 12 }}>
//         <div>
//           <SortableComponent
//             strategy="vertical"
//             items={formik.values.customValues}
//             renderItem={({ item, index, containerProps, listenersProps }) => {
//               const errors: any = Array.isArray(formik.errors.customValues)
//                 ? formik.errors.customValues[index] || {}
//                 : {};

//               const touched: any = Array.isArray(formik.touched.customValues)
//                 ? formik.touched.customValues[index] || {}
//                 : {};

//               const hasErrors = Object.keys(errors).length > 0;

//               return (
//                 <Accordion
//                   variant="outlined"
//                   disableGutters
//                   expanded={expanded === `customValues[${index}]`}
//                   onChange={handleChangeExpanded(`customValues[${index}]`)}
//                   sx={hasErrors ? { borderColor: 'var(--mui-palette-error-main)' } : undefined}
//                   {...containerProps}>
//                   <AccordionSummary
//                     component="div"
//                     aria-controls={`customValues[${index}]-order`}
//                     id={`customValues[${index}]-header`}
//                     sx={{
//                       flexDirection: 'row-reverse',
//                       color: hasErrors ? 'var(--mui-palette-error-main) !important' : undefined
//                     }}>
//                     <div className="flex items-center w-full justify-between">
//                       <Typography component="span">{item.key}</Typography>
//                       <div className="flex items-center gap-2">
//                         <IconButton className="p-1" onClick={() => handleRemove(index)}>
//                           <i className="ri-delete-bin-2-line" />
//                         </IconButton>
//                         <IconButton className="p-1" {...listenersProps}>
//                           <i className="ri-more-2-fill" />
//                         </IconButton>
//                       </div>
//                     </div>
//                   </AccordionSummary>
//                   <AccordionDetails>
//                     <Grid container spacing={5} sx={{ mt: 2 }}>
//                       <Grid size={{ xs: 12, md: 6 }}>
//                         <TextField
//                           fullWidth
//                           required
//                           type="text"
//                           id={`customValues[${index}].key`}
//                           name={`customValues[${index}].key`}
//                           label={formT?.labels?.customValuesKey}
//                           placeholder={formT?.placeholders?.customValuesKey}
//                           value={item.key}
//                           onChange={formik.handleChange}
//                           error={Boolean(touched.key && errors.key)}
//                           color={Boolean(touched.key && errors.key) ? 'error' : 'primary'}
//                           helperText={touched.key && errors.key}
//                           disabled={formik.isSubmitting || isRedirecting}
//                         />
//                       </Grid>
//                       <Grid size={{ xs: 12, md: 6 }}>
//                         <TextField
//                           fullWidth
//                           required
//                           type="text"
//                           id={`customValues[${index}].value`}
//                           name={`customValues[${index}].value`}
//                           label={formT?.labels?.customValuesValue}
//                           placeholder={formT?.placeholders?.customValuesValue}
//                           value={item.value}
//                           onChange={formik.handleChange}
//                           error={Boolean(touched.value && errors.value)}
//                           color={Boolean(touched.value && errors.value) ? 'error' : 'primary'}
//                           helperText={touched.value && errors.value}
//                           disabled={formik.isSubmitting || isRedirecting}
//                         />
//                       </Grid>
//                     </Grid>
//                   </AccordionDetails>
//                 </Accordion>
//               );
//             }}
//             onChange={(items) =>
//               formik.setFieldValue('customValues', items).then(() => formik.validateField('customValues'))
//             }
//             onStart={() => setExpanded(false)}
//           />
//           <Accordion variant="outlined" disableGutters expanded>
//             <AccordionDetails sx={{ py: 1, px: 5 }}>
//               <div className="text-center">
//                 <Button type="button" variant="text" onClick={handleAdd}>
//                   {formT?.addCustomValueBtn}
//                 </Button>
//               </div>
//             </AccordionDetails>
//           </Accordion>
//         </div>
//       </Grid>
//     </Grid>
//   );
// };

export default OrdersEdition;
