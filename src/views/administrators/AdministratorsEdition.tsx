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
  InputAdornment,
  Switch,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';
import Select from '@components/Select';

// Helpers Imports
import { requestEditAdministrator, requestNewAdministrator } from '@helpers/request';
import { useConfig } from '@/components/ConfigProvider';

const defaultAlertState = { open: false, type: 'success', message: '' };

const AdministratorsEdition = ({ roles, admin }: { roles: { id: number; name: string }[]; admin?: any }) => {
  const router = useRouter();
  const { offices } = useConfig();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('administrators-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('administrators-edition:form', { returnObjects: true, default: {} }), [t]);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false);

  let passwordValidation = yup.string();
  let confirmPasswordValidation = yup.string().oneOf([yup.ref('password')], formT?.errors?.confirmPasswordMatch);

  if (!admin) {
    passwordValidation = passwordValidation.required(formT?.errors?.password);
    confirmPasswordValidation = confirmPasswordValidation.required(formT?.errors?.confirmPassword);
  }

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        first_name: admin ? `${admin.first_name}` : '',
        last_name: admin ? `${admin.last_name}` : '',
        email: admin ? `${admin.email}` : '',
        role: admin && admin.role ? `${admin.role?.id}` : '',
        office: admin && admin.office ? `${admin.office?.id}` : '0',
        password: '',
        confirmPassword: '',
        enabled: admin ? Boolean(admin.user?.enabled) : true
      }),
      [admin]
    ),
    validationSchema: yup.object({
      first_name: yup.string().required(formT?.errors?.first_name),
      last_name: yup.string().required(formT?.errors?.last_name),
      email: yup.string().required(formT?.errors?.email).email(formT?.errors?.invalidEmail),
      role: yup.number().required(formT?.errors?.role),
      office: yup.number(),
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const data = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role_id: values.role,
          office_id: values.office !== '0' ? values.office : undefined,
          password: values.password,
          enabled: values.enabled
        };

        const result = admin
          ? await requestEditAdministrator(admin.id, data, i18n.language)
          : await requestNewAdministrator(data, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (!admin) {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/administrators/edit/${result.id}`);
          }, 2000);
        } else {
          formik.setValues({ ...formik.values, password: '', confirmPassword: '' });
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
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/administrators">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {admin ? `${textT?.titleEdit} ${formik.values.first_name} ${formik.values.last_name}` : textT?.titleNew}
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
                      id="first_name"
                      name="first_name"
                      label={formT?.labels?.first_name}
                      placeholder={formT?.placeholders?.first_name}
                      value={formik.values.first_name}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.first_name && formik.errors.first_name)}
                      color={Boolean(formik.touched.first_name && formik.errors.first_name) ? 'error' : 'primary'}
                      helperText={formik.touched.first_name && formik.errors.first_name}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      id="last_name"
                      name="last_name"
                      label={formT?.labels?.last_name}
                      placeholder={formT?.placeholders?.last_name}
                      value={formik.values.last_name}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.last_name && formik.errors.last_name)}
                      color={Boolean(formik.touched.last_name && formik.errors.last_name) ? 'error' : 'primary'}
                      helperText={formik.touched.last_name && formik.errors.last_name}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {admin ? (
                      <TextField
                        fullWidth
                        type="email"
                        id="email"
                        name="email"
                        label={formT?.labels?.email}
                        placeholder={formT?.placeholders?.email}
                        value={admin.email}
                        disabled
                      />
                    ) : (
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
                        helperText={formik.touched.email && formik.errors.email}
                        disabled={formik.isSubmitting || isRedirecting}
                      />
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Select
                      options={roles.map((r) => ({ value: r.id, label: r.name }))}
                      fullWidth
                      required
                      id="role"
                      name="role"
                      label={formT?.labels?.role}
                      value={formik.values.role}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.role && formik.errors.role)}
                      color={Boolean(formik.touched.role && formik.errors.role) ? 'error' : 'primary'}
                      helperText={formik.touched.role && formik.errors.role}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Select
                      options={[{ value: 0, label: 'N/A' }].concat(
                        offices.map((o) => ({ value: o.id, label: o.name }))
                      )}
                      fullWidth
                      id="office"
                      name="office"
                      label={formT?.labels?.office}
                      value={formik.values.office}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.office && formik.errors.office)}
                      color={Boolean(formik.touched.office && formik.errors.office) ? 'error' : 'primary'}
                      helperText={formik.touched.office && formik.errors.office}
                      disabled={formik.isSubmitting || isRedirecting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required={!Boolean(admin)}
                      type={isPasswordShown ? 'text' : 'password'}
                      label={formT?.labels?.password}
                      id="password"
                      name="password"
                      placeholder="••••••"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.password && formik.errors.password)}
                      color={Boolean(formik.touched.password && formik.errors.password) ? 'error' : 'primary'}
                      helperText={formik.touched.password && formik.errors.password}
                      disabled={formik.isSubmitting || isRedirecting}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                edge="end"
                                onClick={() => setIsPasswordShown((prevState) => !prevState)}
                                onMouseDown={(e) => e.preventDefault()}
                                tabIndex={-1}>
                                <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      required={!Boolean(admin)}
                      type={isConfirmPasswordShown ? 'text' : 'password'}
                      label={formT?.labels?.confirmPassword}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                      color={
                        Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword) ? 'error' : 'primary'
                      }
                      helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                      disabled={formik.isSubmitting || isRedirecting}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                edge="end"
                                onClick={() => setIsConfirmPasswordShown((prevState) => !prevState)}
                                onMouseDown={(e) => e.preventDefault()}
                                tabIndex={-1}>
                                <i className={isConfirmPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
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

              {admin && (
                <>
                  <Divider />
                  <CardContent>
                    <Typography className="flex gap-2 items-center">
                      <i className="ri-key-fill text-2xl"></i>
                      <span className="font-bold">{textT?.label2fa}:</span>
                      <span className="flex gap-2 items-center">
                        {admin.enabled_2fa ? (
                          <>
                            {textT?.enabled2fa} <i className="ri-check-fill text-lg text-success"></i>
                          </>
                        ) : (
                          <>
                            {textT?.disabled2fa} <i className="ri-error-warning-line text-lg text-warning"></i>
                          </>
                        )}
                      </span>
                    </Typography>
                  </CardContent>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardLayout>
  );
};

export default AdministratorsEdition;
