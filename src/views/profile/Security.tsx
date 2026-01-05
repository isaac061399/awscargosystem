'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Menu,
  TextField,
  Typography
} from '@mui/material';

// Helpers Imports
import { requestEditPassword, requestGenerate2FA, requestRemove2FA, requestVerify2FA } from '@helpers/request';
import { useAdmin } from '@components/AdminProvider';
import PasswordField from '@/components/PasswordField';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Security = () => {
  const { data: admin } = useAdmin();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('profile:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('profile:tabs.security.form', { returnObjects: true, default: {} }), [t]);
  const form2faAT: any = useMemo(() => t('profile:tabs.security.form2faA', { returnObjects: true, default: {} }), [t]);
  const form2faDT: any = useMemo(() => t('profile:tabs.security.form2faD', { returnObjects: true, default: {} }), [t]);

  // password
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  // 2fa
  const [alert2faState, setAlert2faState] = useState<any>({ ...defaultAlertState });
  const [is2faActive, setIs2faActive] = useState(admin.enabled_2fa);
  const [open2faD, setOpen2faD] = useState(false);
  const [open2faA, setOpen2faA] = useState(false);
  const [loading2fa, setLoading2fa] = useState(false);
  const [data2fa, setData2fa] = useState({ qrcode: '', secret: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const anchorOpen = Boolean(anchorEl);

  const handleOpen2fa = async (isActive: boolean) => {
    setAlert2faState({ ...defaultAlertState });
    setLoading2fa(true);

    if (isActive) {
      // disable 2fa
      setOpen2faD(true);
    } else {
      // enable 2fa
      const result = await requestGenerate2FA(i18n.language);

      if (!result.valid) {
        setAlert2faState({ open: true, type: 'error', message: result.message || form2faAT?.errorMessage });
      } else {
        setData2fa({ qrcode: result.qrcode, secret: result.secret });
        setOpen2faA(true);
      }
    }

    setLoading2fa(false);
  };

  const handleClose2fa = () => {
    setOpen2faA(false);
    setData2fa({ qrcode: '', secret: '' });
    formik2faA.resetForm();
  };

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        password: '',
        new_password: '',
        confirmNewPassword: ''
      }),
      []
    ),
    validationSchema: yup.object({
      password: yup.string().required(formT?.errors?.password),
      new_password: yup.string().required(formT?.errors?.new_password),
      confirmNewPassword: yup
        .string()
        .required(formT?.errors?.confirmNewPassword)
        .oneOf([yup.ref('new_password')], formT?.errors?.confirmNewPasswordMatch)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const data = {
          password: values.password,
          new_password: values.new_password
        };

        const result = await requestEditPassword(data, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        formik.resetForm();

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

  const formik2faA = useFormik({
    initialValues: {
      code: ''
    },
    validationSchema: yup.object({
      code: yup.string().required(form2faAT.errors.code)
    }),
    onSubmit: async (values) => {
      setAlert2faState({ ...defaultAlertState });

      try {
        const data = {
          code: values.code
        };

        const result = await requestVerify2FA(data, i18n.language);

        if (!result.valid) {
          formik2faA.setFieldError('code', result.message || form2faAT?.errorMessage);

          return;
        }

        handleClose2fa();
        setIs2faActive(true);

        setAlert2faState({ open: true, type: 'success', message: form2faAT?.successMessage });
        setTimeout(() => {
          setAlert2faState({ ...defaultAlertState });
        }, 5000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        formik2faA.setFieldError('code', form2faAT?.errorMessage);
      }
    }
  });

  const formik2faD = useFormik({
    initialValues: {
      password: ''
    },
    validationSchema: yup.object({
      password: yup.string().required(form2faDT.errors.password)
    }),
    onSubmit: async (values) => {
      setAlert2faState({ ...defaultAlertState });

      try {
        const data = {
          password: values.password
        };

        const result = await requestRemove2FA(data, i18n.language);

        if (!result.valid) {
          formik2faD.setFieldError('password', result.message || form2faDT?.errorMessage);

          return;
        }

        setOpen2faD(false);
        setIs2faActive(false);

        setAlert2faState({ open: true, type: 'success', message: form2faDT?.successMessage });
        setTimeout(() => {
          setAlert2faState({ ...defaultAlertState });
        }, 5000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(error);
        formik2faD.setFieldError('password', form2faDT?.errorMessage);
      }
    }
  });

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <form noValidate onSubmit={formik.handleSubmit}>
              <Grid container spacing={5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container spacing={5}>
                    <Grid size={{ xs: 12 }}>
                      <PasswordField
                        fullWidth
                        label={formT?.labels?.password}
                        id="password"
                        name="password"
                        placeholder="••••••"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        error={Boolean(formik.touched.password && formik.errors.password)}
                        color={Boolean(formik.touched.password && formik.errors.password) ? 'error' : 'primary'}
                        helperText={formik.touched.password && formik.errors.password}
                        disabled={formik.isSubmitting}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <PasswordField
                        fullWidth
                        label={formT?.labels?.new_password}
                        id="new_password"
                        name="new_password"
                        placeholder="••••••"
                        value={formik.values.new_password}
                        onChange={formik.handleChange}
                        error={Boolean(formik.touched.new_password && formik.errors.new_password)}
                        color={Boolean(formik.touched.new_password && formik.errors.new_password) ? 'error' : 'primary'}
                        helperText={formik.touched.new_password && formik.errors.new_password}
                        disabled={formik.isSubmitting}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <PasswordField
                        fullWidth
                        label={formT?.labels?.confirmNewPassword}
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        placeholder="••••••"
                        value={formik.values.confirmNewPassword}
                        onChange={formik.handleChange}
                        error={Boolean(formik.touched.confirmNewPassword && formik.errors.confirmNewPassword)}
                        color={
                          Boolean(formik.touched.confirmNewPassword && formik.errors.confirmNewPassword)
                            ? 'error'
                            : 'primary'
                        }
                        helperText={formik.touched.confirmNewPassword && formik.errors.confirmNewPassword}
                        disabled={formik.isSubmitting}
                      />
                    </Grid>
                    {alertState.open && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity={alertState.type}>{alertState.message}</Alert>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12 }} className="flex gap-4 flex-wrap">
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        loading={formik.isSubmitting}
                        startIcon={<i className="ri-save-line" />}>
                        {textT?.btnSave}
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant="h4" className="flex gap-3 items-center mb-4">
              <i className="ri-key-fill text-3xl"></i> {textT?.text2fa?.title}
            </Typography>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} offset={{ sm: 3, md: 4 }} sx={{ textAlign: 'center' }}>
                <Typography variant="h5" className="mb-4">
                  <i className="ri-lock-2-line text-4xl"></i>
                </Typography>
                <Typography variant="h5" className="mb-4">
                  {!is2faActive ? textT?.text2fa?.subtitleDisabled : textT?.text2fa?.subtitleEnabled}
                </Typography>
                {!is2faActive && <Typography className="mb-4">{textT?.text2fa?.textDisabled}</Typography>}
                <Button
                  variant="contained"
                  onClick={() => handleOpen2fa(is2faActive)}
                  loading={loading2fa}
                  startIcon={<i className={is2faActive ? 'ri-close-large-line' : 'ri-check-line'} />}>
                  {is2faActive ? textT?.btnDisable : textT?.btnEnable}
                </Button>
              </Grid>
              {alert2faState.open && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} offset={{ sm: 3, md: 4 }}>
                  <Alert severity={alert2faState.type}>{alert2faState.message}</Alert>
                </Grid>
              )}
            </Grid>

            <Dialog open={open2faA} onClose={handleClose2fa} aria-labelledby="alert-dialog-title">
              <form noValidate onSubmit={formik2faA.handleSubmit}>
                <DialogTitle id="alert-dialog-title">{textT?.text2fa?.dialog?.title}</DialogTitle>
                <DialogContent>
                  <Typography variant="h5" className="mb-4">
                    {textT?.text2fa?.dialog?.subtitle}
                  </Typography>
                  <Typography variant="body1" className="mb-3">
                    {textT?.text2fa?.dialog?.text1}
                  </Typography>
                  <Typography variant="body1" className="mb-3">
                    {textT?.text2fa?.dialog?.text2[0]}
                    <a
                      style={{ textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={(event: any) => setAnchorEl(event.currentTarget)}>
                      {textT?.text2fa?.dialog?.text2[1]}
                    </a>
                    {textT?.text2fa?.dialog?.text2[2]}
                    <Menu
                      id="basic-menu"
                      anchorEl={anchorEl}
                      open={anchorOpen}
                      onClose={() => setAnchorEl(null)}
                      slotProps={{
                        list: {
                          'aria-labelledby': 'view-button'
                        }
                      }}>
                      <Typography variant="button" sx={{ p: 2 }}>
                        {data2fa.secret}
                      </Typography>
                    </Menu>
                  </Typography>
                  <Box sx={{ width: 196, height: 196, borderRadius: 1, bgcolor: 'white', my: 5 }}>
                    {Boolean(data2fa.qrcode) && (
                      <Image src={data2fa.qrcode} alt="2FA QRCode" width={196} height={196} />
                    )}
                  </Box>
                  <Typography variant="body1" className="mb-3 font-bold">
                    {form2faAT?.labels?.code}
                  </Typography>
                  <TextField
                    type="text"
                    id="code"
                    name="code"
                    placeholder={form2faAT?.placeholders?.code}
                    value={formik2faA.values.code}
                    onChange={formik2faA.handleChange}
                    error={Boolean(formik2faA.touched.code && formik2faA.errors.code)}
                    color={Boolean(formik2faA.touched.code && formik2faA.errors.code) ? 'error' : 'primary'}
                    helperText={formik2faA.touched.code && formik2faA.errors.code}
                    disabled={formik2faA.isSubmitting}
                  />
                </DialogContent>
                <Divider />
                <DialogActions>
                  <Button variant="contained" color="secondary" onClick={handleClose2fa}>
                    {textT?.btnCancel}
                  </Button>
                  <Button type="submit" variant="contained" loading={formik2faA.isSubmitting}>
                    {textT?.btnContinue}
                  </Button>
                </DialogActions>
              </form>
            </Dialog>

            <Dialog open={open2faD} onClose={() => setOpen2faD(false)} aria-labelledby="alert-dialog-disable-title">
              <form noValidate onSubmit={formik2faD.handleSubmit}>
                <DialogTitle id="alert-dialog-disable-title">{textT?.text2fa?.dialogDisable?.title}</DialogTitle>
                <DialogContent>
                  <Typography variant="body1" className="mb-3">
                    {textT?.text2fa?.dialogDisable?.text}
                  </Typography>
                  <PasswordField
                    fullWidth
                    label={form2faDT.labels.password}
                    id="password"
                    name="password"
                    placeholder="••••••"
                    value={formik2faD.values.password}
                    onChange={formik2faD.handleChange}
                    error={Boolean(formik2faD.touched.password && formik2faD.errors.password)}
                    color={Boolean(formik2faD.touched.password && formik2faD.errors.password) ? 'error' : 'primary'}
                    helperText={formik2faD.touched.password && formik2faD.errors.password}
                    disabled={formik2faD.isSubmitting}
                  />
                </DialogContent>
                <Divider />
                <DialogActions>
                  <Button variant="contained" color="secondary" onClick={() => setOpen2faD(false)}>
                    {textT?.btnCancel}
                  </Button>
                  <Button type="submit" variant="contained" loading={formik2faD.isSubmitting}>
                    {textT?.btnContinue}
                  </Button>
                </DialogActions>
              </form>
            </Dialog>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Security;
