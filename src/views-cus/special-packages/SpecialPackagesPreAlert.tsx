'use client';

// React Imports
import { useMemo, useRef, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import {
  Alert,
  Autocomplete,
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import AdministratorField from '@/components/custom/AdministratorField';
import Select from '@/components/Select';
import Dropzone from '@/components/Dropzone';

// Helpers Imports
import {
  requestGetSpecialPackageDocumentSignedUrl,
  requestGetSpecialPackagesByTracking,
  requestPreAlertSpecialPackage,
  requestUploadSpecialPackageDocument
} from '@helpers/request';

// Auth Imports
import { useAdmin } from '@components/AdminProvider';
import { hasAllPermissions } from '@helpers/permissions';
import { specialPackageDocumentTypes } from '@/libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const maxFileSizeUpload = 50 * 1024 * 1024; // 50MB

const SpecialPackagesPreAlert = () => {
  const { data: admin } = useAdmin();
  const isAdmin = hasAllPermissions('special-packages.admin', admin.permissions);

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('special-packages-pre-alert:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('special-packages-pre-alert:form', { returnObjects: true, default: {} }), [t]);
  const formDocumentT: any = useMemo(
    () => t('special-packages-pre-alert:formDocument', { returnObjects: true, default: {} }),
    [t]
  );
  const labelsT: any = useMemo(() => t('constants:labels', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFields, setShowFields] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);

  const trackingFieldRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        id: null as any,
        owner: null as any,
        tracking: '',
        mailbox: '',
        type: '',
        indications: '',
        documents: [] as any,
        documentsToAdd: [] as any,
        documentsToDelete: [] as any
      }),
      []
    ),
    validationSchema: yup.object({
      owner: isAdmin ? yup.object().required(formT?.errors?.owner) : yup.object().nullable().notRequired(),
      tracking: yup.string().required(formT?.errors?.tracking),
      mailbox: yup.string(),
      type: yup.string().required(formT?.errors?.type),
      indications: yup.string()
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        // upload files and replace file objects with uploaded file info
        const uploadedDocuments = [];
        for (const doc of values.documentsToAdd) {
          const uploadResult = await uploadDocumentFile(doc.file);
          if (uploadResult) {
            uploadedDocuments.push({ description: doc.description, ...uploadResult });
          }
        }

        const newValues = { ...values, owner_id: values.owner?.id || null, documentsToAdd: uploadedDocuments };
        delete newValues.owner;

        const result = await requestPreAlertSpecialPackage(newValues, i18n.language);
        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });
        setTimeout(() => {
          setAlertState({ ...defaultAlertState });
        }, 5000);

        resetProcess();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        return setAlertState({ open: true, type: 'error', message: formT?.errorMessage });
      }
    }
  });

  const formikDocument = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        description: '',
        file: null
      }),
      []
    ),
    validationSchema: yup.object({
      description: yup.string().required(formDocumentT?.errors?.description),
      file: yup.mixed().required(formDocumentT?.errors?.file)
    }),
    onSubmit: async (values) => {
      formik.values.documentsToAdd.push(values);

      handleDocumentDialogClose();
    }
  });

  const onTrackingSearch = async () => {
    const fetchTrackingInfo = async (tracking: string) => {
      setIsLoading(true);

      const { valid, data } = await requestGetSpecialPackagesByTracking(tracking, i18n.language);

      setIsLoading(false);

      if (!valid) {
        clearFields();
      } else {
        formik.setFieldValue('id', data?.id || null);
        formik.setFieldValue('owner', data?.owner || null);
        formik.setFieldValue('mailbox', data?.mailbox || '');
        formik.setFieldValue('type', data?.type || '');
        formik.setFieldValue('indications', data?.indications || '');
        formik.setFieldValue('documents', data?.special_package_documents || []);
      }

      setShowFields(true);
    };

    if (formik.values.tracking && formik.values.tracking.length > 0) {
      fetchTrackingInfo(formik.values.tracking);
    } else {
      resetProcess();
    }
  };

  const clearFields = (clearTracking?: boolean) => {
    formik.setValues({
      ...formik.values,
      id: null,
      owner: null,
      tracking: clearTracking ? '' : formik.values.tracking,
      mailbox: '',
      type: '',
      indications: '',
      documents: [],
      documentsToAdd: [],
      documentsToDelete: []
    });
  };

  const resetProcess = () => {
    clearFields(true);
    setShowFields(false);

    setTimeout(() => {
      trackingFieldRef.current?.focus();
    }, 100);
  };

  const uploadDocumentFile = async (file: File) => {
    // get signed url for upload
    const signedUrlResult = await requestGetSpecialPackageDocumentSignedUrl(
      {
        fileName: file.name,
        fileType: file.type
      },
      i18n.language
    );

    if (!signedUrlResult.valid) {
      return null;
    }

    // upload file to s3
    const uploadResult = await requestUploadSpecialPackageDocument(signedUrlResult.url, file);

    if (!uploadResult) {
      return null;
    }

    return {
      file: signedUrlResult.key,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type
    };
  };

  const handleRemoveNewDocument = (index: number) => {
    const newDocuments = [...formik.values.documentsToAdd];
    newDocuments.splice(index, 1);
    formik.setFieldValue('documentsToAdd', newDocuments);
  };

  const handleRemoveExistingDocument = (id: number, index: number) => {
    const newDocuments = [...formik.values.documents];
    newDocuments.splice(index, 1);
    formik.setFieldValue('documents', newDocuments);
    formik.values.documentsToDelete.push(id);
  };

  const handleDocumentDialogClose = () => {
    setShowDocumentDialog(false);
    formikDocument.resetForm();
  };

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex flex-col sm:flex-row sm:justify-between justify-start items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Typography variant="h3" className="flex items-center gap-1">
                  <IconButton className="p-1" color="default" LinkComponent={Link} href="/special-packages">
                    <i className="ri-arrow-left-s-line text-4xl" />
                  </IconButton>
                  {textT?.title}
                </Typography>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={formik.isSubmitting}
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
                      inputRef={trackingFieldRef}
                      autoFocus
                      fullWidth
                      required
                      type="text"
                      id="tracking"
                      name="tracking"
                      label={formT?.labels?.tracking}
                      placeholder={formT?.placeholders?.tracking}
                      value={formik.values.tracking}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.tracking && formik.errors.tracking)}
                      color={Boolean(formik.touched.tracking && formik.errors.tracking) ? 'error' : 'primary'}
                      helperText={formik.touched.tracking && formik.errors.tracking}
                      disabled={formik.isSubmitting}
                      slotProps={{
                        input: {
                          readOnly: isLoading,
                          endAdornment: isLoading ? (
                            <i className="ri-loader-4-line animate-spin" />
                          ) : (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => onTrackingSearch()}
                                disabled={formik.isSubmitting || isLoading}>
                                <i className="ri-arrow-right-line"></i>
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;

                        e.preventDefault();
                        onTrackingSearch();
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                  {showFields && isAdmin && (
                    <>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <AdministratorField
                          required
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
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    </>
                  )}

                  {showFields && (
                    <>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Select
                          options={Object.keys(labelsT?.specialPackageType).map((value) => ({
                            value,
                            label: labelsT?.specialPackageType[value]
                          }))}
                          fullWidth
                          required
                          id="type"
                          name="type"
                          label={formT?.labels?.type}
                          placeholder={formT?.placeholders?.type}
                          value={formik.values.type}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.type && formik.errors.type)}
                          color={Boolean(formik.touched.type && formik.errors.type) ? 'error' : 'primary'}
                          helperText={formik.touched.type && (formik.errors.type as string)}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          type="text"
                          id="mailbox"
                          name="mailbox"
                          label={formT?.labels?.mailbox}
                          placeholder={formT?.placeholders?.mailbox}
                          value={formik.values.mailbox}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.mailbox && formik.errors.mailbox)}
                          color={Boolean(formik.touched.mailbox && formik.errors.mailbox) ? 'error' : 'primary'}
                          helperText={formik.touched.mailbox && formik.errors.mailbox}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          type="text"
                          id="indications"
                          name="indications"
                          label={formT?.labels?.indications}
                          placeholder={formT?.placeholders?.indications}
                          value={formik.values.indications}
                          onChange={formik.handleChange}
                          error={Boolean(formik.touched.indications && formik.errors.indications)}
                          color={Boolean(formik.touched.indications && formik.errors.indications) ? 'error' : 'primary'}
                          helperText={formik.touched.indications && formik.errors.indications}
                          disabled={formik.isSubmitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }} />

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Divider sx={{ mb: 5 }} />

                        <Typography variant="h5" className="flex gap-3 items-center">
                          {textT?.documentsLabel}
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<i className="ri-add-line" />}
                            onClick={() => setShowDocumentDialog(true)}>
                            {textT?.btnAddDocument}
                          </Button>
                        </Typography>

                        <List sx={{ mb: 2 }}>
                          {formik.values.documents.map((doc: any, idx: any) => (
                            <ListItem
                              key={`doc-${idx}`}
                              secondaryAction={
                                <IconButton edge="end" onClick={() => handleRemoveExistingDocument(doc.id, idx)}>
                                  <i className="ri-close-circle-fill" />
                                </IconButton>
                              }>
                              <ListItemAvatar>
                                <Avatar variant="rounded" sx={{ bgcolor: 'grey.300' }}>
                                  <i className="ri-file-list-fill" />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={doc.description}
                                secondary={
                                  <Link
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline">
                                    {doc.file_name}
                                  </Link>
                                }
                              />
                            </ListItem>
                          ))}
                          {formik.values.documentsToAdd.map((doc: any, idx: any) => (
                            <ListItem
                              key={`doc-to-add-${idx}`}
                              secondaryAction={
                                <IconButton edge="end" onClick={() => handleRemoveNewDocument(idx)}>
                                  <i className="ri-close-circle-fill" />
                                </IconButton>
                              }>
                              <ListItemAvatar>
                                <Avatar variant="rounded" sx={{ bgcolor: 'grey.300' }}>
                                  <i className="ri-file-list-fill" />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText primary={doc.description} secondary={doc.file.name} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

      <Dialog
        open={showDocumentDialog}
        onClose={handleDocumentDialogClose}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby="dialog-document-title">
        <form onSubmit={formikDocument.handleSubmit} noValidate>
          <DialogTitle id="dialog-document-title">{textT?.documentDialog?.title}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  freeSolo
                  clearOnBlur={false}
                  options={specialPackageDocumentTypes}
                  filterOptions={(x) => x}
                  inputValue={formikDocument.values.description}
                  onInputChange={(_, newValue) => {
                    // newValue is always a string (or null)
                    formikDocument.setFieldValue('description', newValue ?? '');
                  }}
                  disabled={formikDocument.isSubmitting}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id="description"
                      name="description"
                      label={formDocumentT?.labels?.description}
                      placeholder={formDocumentT?.placeholders?.description}
                      error={Boolean(formikDocument.touched.description && formikDocument.errors.description)}
                      color={
                        Boolean(formikDocument.touched.description && formikDocument.errors.description)
                          ? 'error'
                          : 'primary'
                      }
                      helperText={formikDocument.touched.description && (formikDocument.errors.description as string)}
                      disabled={formikDocument.isSubmitting}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required error={Boolean(formikDocument.errors.file)}>
                  <Dropzone
                    acceptedFiles={[
                      'image/*',
                      'application/pdf',
                      'application/msword', // .doc
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                      'application/vnd.ms-excel', // .xls
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
                    ]}
                    dropzoneText={textT?.documentDialog?.dropzone?.text}
                    dropzoneMaxSizeText={textT?.documentDialog?.dropzone?.maxSizeText}
                    onChange={(files) => formikDocument.setFieldValue('file', files[0])}
                    maxFiles={1}
                    maxFileSize={maxFileSizeUpload}
                    showPreviews
                  />
                  {formikDocument.errors.file && <FormHelperText>{formikDocument.errors.file}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleDocumentDialogClose}
              disabled={formikDocument.isSubmitting}>
              {textT?.documentDialog?.btnCancel}
            </Button>
            <Button type="submit" variant="contained" color="primary" loading={formikDocument.isSubmitting}>
              {textT?.documentDialog?.btnAdd}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardLayout>
  );
};

export default SpecialPackagesPreAlert;
