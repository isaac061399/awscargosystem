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
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@components/layout/DashboardLayout';

// Helpers Imports
import { requestEditRole, requestNewRole } from '@helpers/request';

const defaultAlertState = { open: false, type: 'success', message: '' };

const RolesEdition = ({ permissions, role }: { permissions: { [key: string]: string[] }; role?: any }) => {
  const router = useRouter();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('roles-edition:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('roles-edition:form', { returnObjects: true, default: {} }), [t]);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  let permissionOrdered = Object.keys(permissions).map((module) => ({ module, label: textT?.modules[module] }));

  permissionOrdered = permissionOrdered.sort((a, b) => {
    const x = a.label.toLowerCase();
    const y = b.label.toLowerCase();

    if (x > y) return 1;

    if (x < y) return -1;

    return 0;
  });

  const handleOnChangePermissions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = [...formik.values.permissions];

    if (e.target.checked) {
      values.push(e.target.value);
    } else {
      values.splice(values.indexOf(e.target.value), 1);
    }

    formik.setFieldValue('permissions', values);
  };

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        name: role ? `${role.name}` : '',
        description: role ? `${role.description}` : '',
        permissions: role ? (role.permissions as string[]) : ([] as string[])
      }),
      [role]
    ),
    validationSchema: yup.object({
      name: yup.string().required(formT?.errors?.name),
      description: yup.string(),
      permissions: yup.array().of(yup.string())
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const result = role
          ? await requestEditRole(role.id, values, i18n.language)
          : await requestNewRole(values, i18n.language);

        if (!result.valid) {
          return setAlertState({ open: true, type: 'error', message: result.message || formT?.errorMessage });
        }

        setAlertState({ open: true, type: 'success', message: formT?.successMessage });

        if (!role) {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/roles/edit/${result.id}`);
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
                <IconButton className="p-1" color="default" LinkComponent={Link} href="/roles">
                  <i className="ri-arrow-left-s-line text-4xl" />
                </IconButton>
                {role ? `${textT?.titleEdit} ${formik.values.name}` : textT?.titleNew}
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                <Divider sx={{ mt: 4, mb: 2 }} />
                <Typography variant="h4">{textT?.titlePermissions}</Typography>
                <Grid container spacing={5}>
                  <Grid size={{ xs: 12 }}>
                    <Table sx={{ width: '100%' }}>
                      <TableBody>
                        {permissionOrdered.map(({ module, label }) => (
                          <TableRow key={`module_${module}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row" sx={{ width: '1px', whiteSpace: 'nowrap' }}>
                              <Typography variant="body1">
                                <strong>{label}</strong>
                              </Typography>
                            </TableCell>
                            <TableCell align="left">
                              {permissions[module].map((permission) => (
                                <FormControlLabel
                                  key={`permission_${module}.${permission}`}
                                  control={
                                    <Checkbox
                                      value={`${module}.${permission}`}
                                      onChange={handleOnChangePermissions}
                                      checked={formik.values.permissions.includes(`${module}.${permission}`)}
                                    />
                                  }
                                  label={textT?.permissions[permission]}
                                  sx={{ mx: 4 }}
                                />
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

export default RolesEdition;
