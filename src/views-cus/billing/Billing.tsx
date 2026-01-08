'use client';

// React Imports
import { useEffect, useMemo, useRef, useState } from 'react';

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
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Radio,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { enUS, esES } from '@mui/x-data-grid/locales';

// Component Imports
import AddIcon from '@mui/icons-material/Add';
import LocalMallIcon from '@mui/icons-material/LocalMall';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientField from '@/components/custom/ClientField';

// Auth Imports
import { useAdmin } from '@/components/AdminProvider';
import { hasAllPermissions } from '@/helpers/permissions';

// Helpers Imports
import {
  requestGetBillingLines,
  requestNewUnownedPackage,
  requestPackagesReception,
  requestPackagesReceptionClient,
  requestPackagesReceptionTracking
} from '@/helpers/request';
import { currencies } from '@/libs/constants';
import { formatMoney, padStartZeros } from '@/libs/utils';
import { calculateShippingPrice } from '@/helpers/calculations';
import { useConfig } from '@/components/ConfigProvider';
import { Currency } from '@/prisma/generated/enums';

/** ---------- Types ---------- */
type SelectedItem = {
  id: string;
  type: 'package' | 'order_product' | 'custom' | 'product';
  ref: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: Currency;
  total: number;
};

/** ------- Default States ------- */
const defaultAlertState = { open: false, type: 'success', message: '' };
const defaultCustomDraft: SelectedItem = {
  id: '',
  type: 'custom',
  ref: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  currency: Currency.CRC,
  total: 0
};

// test

/** ---------- Utils ---------- */
function money(amount: number, currency: Currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'CRC' ? 0 : 2
  }).format(amount);
}

function lineTotal(quantity: number, unit_price: number) {
  return (quantity || 0) * (unit_price || 0);
}

/**
 * Convert amount in `from` currency to `to` currency using fxRate:
 * fxRate = CRC per 1 USD (common in CR).
 */
function convert(amount: number, from: Currency, to: Currency, fxRateCRCPerUSD: number) {
  if (from === to) return amount;
  if (from === 'USD' && to === 'CRC') return amount * fxRateCRCPerUSD;
  if (from === 'CRC' && to === 'USD') return fxRateCRCPerUSD ? amount / fxRateCRCPerUSD : 0;

  return amount;
}

/** ---------- Mock API placeholders (replace with your real calls) ---------- */
async function apiSearchProducts(q: string): Promise<Product[]> {
  // TODO: call your API
  await new Promise((r) => setTimeout(r, 200));
  const all: Product[] = [
    { id: 'prd1', sku: 'PKG-INS', name: 'Package Insurance', price: 3, currency: 'USD' },
    { id: 'prd2', sku: 'WRAP', name: 'Wrapping Service', price: 1500, currency: 'CRC' },
    { id: 'prd3', sku: 'DHL-FEE', name: 'DHL Handling Fee', price: 2, currency: 'USD' }
  ];
  if (!q.trim()) return all.slice(0, 10);

  return all.filter((p) => (p.sku + ' ' + p.name).toLowerCase().includes(q.toLowerCase()));
}

const Billing = ({ cashRegister }: { cashRegister?: any }) => {
  const { offices, configuration } = useConfig();
  const { data: admin } = useAdmin();

  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('billing:text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('billing:form', { returnObjects: true, default: {} }), [t]);
  const dgLocale = i18n.language === 'en' ? enUS : esES;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [billableLines, setBillableLines] = useState<any[]>([]);
  const [billableLinesSelected, setBillableLinesSelected] = useState<any[]>([]);
  const [selectedLines, setSelectedLines] = useState<SelectedItem[]>([]);

  // FX: CRC per 1 USD
  const [fxRate, setFxRate] = useState<number>(520);

  // Custom line dialog
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<SelectedItem>(defaultCustomDraft);

  // Product dialog
  const [productOpen, setProductOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [productQty, setProductQty] = useState<number>(1);

  const clientFieldRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    initialValues: useMemo(
      () => ({
        office_id: offices[0]?.id || '',
        cut_number: '',
        tracking: '',
        package_id: '',
        order_id: '',
        box_number: '',
        client: null as any,
        weight: '',
        shelf: '',
        row: ''
      }),
      [offices]
    ),
    validationSchema: yup.object({
      client: yup.object().required(formT?.errors?.client)
    }),
    onSubmit: async (values) => {
      setAlertState({ ...defaultAlertState });

      try {
        const newValues = {
          client_id: values.client.id
        };

        const result = await requestPackagesReception(newValues, i18n.language);

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

  // focus client field on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      clientFieldRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (formik.values.client) {
      const fetchLinesData = async () => {
        setIsLoading(true);

        const result = await requestGetBillingLines(formik.values.client?.id || 0, i18n.language);

        setIsLoading(false);
        setBillableLines(result.lines || []);
      };

      fetchLinesData();
    } else {
      setBillableLines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.client]);

  const resetProcess = () => {
    setShowAllOtherFields(false);
    formik.resetForm();

    setTimeout(() => {
      if (clientFieldRef.current) {
        clientFieldRef.current.focus();
      }
    }, 100);
  };

  // test
  /** --- when selection changes, build "Selected/Billed lines" --- */
  useEffect(() => {
    const selected = billableLines.filter((b) => billableLinesSelected.includes(b.id));
    setSelectedLines((prev) => {
      // keep any previously added custom/product lines
      const extras = prev.filter((x) => x.type !== 'package' && x.type !== 'order_product');

      return [...selected, ...extras];
    });
  }, [billableLinesSelected, billableLines]);

  function removeSelectedLine(id: string) {
    // If it’s a base billable line, unselect it from ToBill
    if (billableLines.some((b) => b.id === id)) {
      setBillableLinesSelected((prev) => prev.filter((x) => x !== id));

      return;
    }

    // If it’s an extra line (custom/product), remove from selectedLines
    setSelectedLines((prev) => prev.filter((x) => x.id !== id));
  }

  /** --- totals --- */
  const subtotalUSD = useMemo(() => {
    const sum = selectedLines.reduce((acc, line) => acc + convert(lineTotal(line), line.currency, 'USD', fxRate), 0);

    return sum;
  }, [selectedLines, fxRate]);

  const subtotalCRC = useMemo(() => {
    const sum = selectedLines.reduce((acc, line) => acc + convert(lineTotal(line), line.currency, 'CRC', fxRate), 0);

    return sum;
  }, [selectedLines, fxRate]);

  // You can add taxes/discounts here later
  const totalUSD = subtotalUSD;
  const totalCRC = subtotalCRC;

  /** --- grids --- */
  const billableCols: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => <Chip size="small" label={params.value} />
    },
    { field: 'tracking', headerName: 'Tracking', width: 200 },
    { field: 'description', headerName: 'Descripción', flex: 1, minWidth: 250 },
    {
      field: 'billing_amount',
      headerName: 'Monto',
      width: 120,
      valueGetter: (value, row) => formatMoney(row.billing_amount, `${currencies.USD.symbol}`),
      sortable: false
    },
    {
      field: 'location_shelf',
      headerName: 'Ubicación',
      width: 200,
      renderCell: (params) =>
        params.row.location_shelf && params.row.location_row
          ? `Estante ${params.row.location_shelf} - Fila ${params.row.location_row}`
          : 'Pendiente',
      sortable: false
    }
  ];

  const selectedCols: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Tipo',
      width: 120,
      renderCell: (p) => <Chip size="small" label={p.value} />
    },
    { field: 'ref', headerName: 'Ref', width: 200 },
    { field: 'description', headerName: 'Descripción', flex: 1, minWidth: 250 },
    { field: 'quantity', headerName: 'Cant', width: 80, type: 'number' },
    {
      field: 'unit_price',
      headerName: 'Precio Unitario',
      width: 120,
      valueGetter: (value, row) => formatMoney(row.unit_price, `${currencies[row.currency].symbol} `),
      sortable: false
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      valueGetter: (value, row) => formatMoney(row.total, `${currencies[row.currency].symbol} `),
      sortable: false
    },
    {
      field: 'actions',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton aria-label="remove line" onClick={() => removeSelectedLine(params.row.id)}>
          <i className="ri-delete-bin-2-fill" />
        </IconButton>
      )
    }
  ];

  /** --- custom line handling --- */
  const openCustom = () => {
    setCustomDraft(defaultCustomDraft);
    setCustomOpen(true);
  };

  function addCustomLine() {
    const id = `custom_${Date.now()}`;
    const line: SelectedItem = { ...customDraft, id };
    if (!line.description.trim()) return;
    setSelectedLines((prev) => [...prev, line]);
    setCustomOpen(false);
  }

  /** --- product handling --- */
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!productOpen) return;
      const res = await apiSearchProducts(productQuery);
      if (active) setProductResults(res);
    }, 250);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [productQuery, productOpen]);

  function addProductAsLine(p: any) {
    const line: SelectedItem = {
      id: `product-${p.id}-${Date.now()}`,
      type: 'product',
      ref: p.code,
      description: p.name,
      quantity: productQty || 1,
      unit_price: p.price,
      currency: Currency.CRC,
      total: lineTotal(productQty || 1, p.price)
    };
    setSelectedLines((prev) => [...prev, line]);
    setProductOpen(false);
    setProductQuery('');
    setProductQty(1);
  }

  return (
    <DashboardLayout>
      <form noValidate onSubmit={formik.handleSubmit}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <div className="flex items-center justify-between mb-3">
              <Typography variant="h3" className="flex items-center gap-1">
                {textT?.title}
              </Typography>
              <div className="flex items-center gap-2"></div>
            </div>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            {!cashRegister && (
              <Alert severity="info">
                La caja aún no ha sido abierta para el día de hoy. Por favor, abra la caja para poder registrar
                facturas.
                <Link href="/cash-control?r=billing" className="underline ml-2">
                  Abrir caja
                </Link>
              </Alert>
            )}

            {alertState.open && <Alert severity={alertState.type}>{alertState.message}</Alert>}
          </Grid>
        </Grid>

        <Stack spacing={2}>
          {/* Top row: Client + FX */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title="Cliente"
                  subheader="Busque y seleccione un cliente para cargar paquetes/pedidos listos para retirar/facturar."
                  avatar={<i className="ri-user-search-line"></i>}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={1}>
                    <ClientField
                      inputRef={clientFieldRef}
                      language={i18n.language}
                      initialOptions={[]}
                      isOptionEqualToValue={(option, v) => option.id === v.id}
                      loadingText={textT?.loading}
                      noOptionsText={textT?.noOptions}
                      value={formik.values.client}
                      onChange={(value) => {
                        formik.setFieldValue('client', value || null);
                      }}
                      id="client"
                      name="client"
                      label={formT?.labels?.client}
                      placeholder={formT?.placeholders?.client}
                      error={Boolean(formik.touched.client && formik.errors.client)}
                      color={Boolean(formik.touched.client && formik.errors.client) ? 'error' : 'primary'}
                      helperText={formik.touched.client && (formik.errors.client as string)}
                      disabled={formik.isSubmitting || isLoading}
                    />

                    {formik.values.client ? (
                      <Alert severity="success">
                        Cliente seleccionado:{' '}
                        <b>
                          {formik.values.client.full_name} - {formik.values.client.box_number}
                        </b>
                      </Alert>
                    ) : (
                      <Alert severity="info">Seleccione un cliente para cargar las líneas disponibles.</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title="Información de facturación"
                  subheader="Seleccione los datos necesarios para facturar."
                  avatar={<i className="ri-file-info-line"></i>}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    <TextField
                      label="FX rate (CRC / USD)"
                      type="number"
                      value={fxRate}
                      onChange={(e) => setFxRate(Number(e.target.value))}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Main content: left = To bill, right = Selected lines + Totals */}
          <Grid container spacing={2} className="items-stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="h-full">
                <CardHeader
                  title="Líneas a facturar"
                  subheader="Estos son los paquetes/pedidos encontrados para el cliente. Seleccione/deseleccione lo que desea facturar."
                />
                <Divider />
                <CardContent>
                  <Box className="h-105">
                    <DataGrid
                      loading={isLoading}
                      rows={billableLines}
                      columns={billableCols}
                      checkboxSelection
                      disableRowSelectionOnClick
                      // rowSelectionModel={{type: 'include', ids: billableLinesSelected}}
                      // onRowSelectionModelChange={(m) => setToBillSelection(m)}
                      pagination
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{
                        pagination: { paginationModel: { pageSize: 10, page: 0 } }
                      }}
                      localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2} className="h-full">
                <Card>
                  <CardHeader
                    title="Selected / billed lines"
                    subheader="Add extras (custom lines or products) and review before finalizing."
                  />
                  <Divider />
                  <CardContent>
                    <Stack direction="row" spacing={1} className="mb-3">
                      <Button variant="contained" startIcon={<AddIcon />} onClick={openCustom}>
                        Add custom line
                      </Button>
                      <Button variant="outlined" startIcon={<LocalMallIcon />} onClick={() => setProductOpen(true)}>
                        Add product
                      </Button>
                    </Stack>

                    <Box className="h-90">
                      <DataGrid
                        rows={selectedLines}
                        columns={selectedCols}
                        checkboxSelection={false}
                        disableRowSelectionOnClick
                        pagination
                        pageSizeOptions={[5, 10, 25]}
                        initialState={{
                          pagination: { paginationModel: { pageSize: 10, page: 0 } }
                        }}
                        localeText={dgLocale?.components?.MuiDataGrid?.defaultProps?.localeText}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Totals" subheader="Shown in USD and CRC" />
                  <Divider />
                  <CardContent>
                    <Stack spacing={1}>
                      <Row label="Subtotal (USD)" value={money(subtotalUSD, 'USD')} />
                      <Row label="Subtotal (CRC)" value={money(subtotalCRC, 'CRC')} />
                      <Divider className="my-2" />
                      <Row label="Total (USD)" value={money(totalUSD, 'USD')} strong />
                      <Row label="Total (CRC)" value={money(totalCRC, 'CRC')} strong />

                      <Stack direction="row" spacing={1} className="pt-3">
                        <Button
                          variant="contained"
                          disabled={
                            formik.isSubmitting || isLoading || !formik.values.client || selectedLines.length === 0
                          }
                          onClick={() => {
                            // TODO: submit invoice / create billing transaction
                            // You likely want to send:
                            // - clientId
                            // - selectedLines
                            // - fxRate
                            console.log('Submit billing', {
                              clientId: formik.values.client?.id,
                              selectedLines,
                              fxRate
                            });
                          }}
                          fullWidth>
                          Create invoice / Bill now
                        </Button>
                      </Stack>

                      {!formik.values.client && (
                        <Typography variant="caption" color="text.secondary">
                          Select a client to enable billing.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </form>

      {/* Custom line dialog */}
      <Dialog open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add custom line</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              label="Description"
              value={customDraft.description}
              onChange={(e) => setCustomDraft((p) => ({ ...p, description: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Qty"
                type="number"
                value={customDraft.qty}
                onChange={(e) => setCustomDraft((p) => ({ ...p, qty: Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Unit price"
                type="number"
                value={customDraft.unitPrice}
                onChange={(e) => setCustomDraft((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Currency"
                value={customDraft.currency}
                onChange={(e) => setCustomDraft((p) => ({ ...p, currency: e.target.value as Currency }))}
                fullWidth
                select
                SelectProps={{ native: true }}>
                <option value="USD">USD</option>
                <option value="CRC">CRC</option>
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addCustomLine} disabled={!customDraft.description.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product dialog */}
      <Dialog open={productOpen} onClose={() => setProductOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select product</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              label="Search products"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              fullWidth
            />
            <TextField
              label="Qty"
              type="number"
              value={productQty}
              onChange={(e) => setProductQty(Number(e.target.value))}
              className="max-w-[160px]"
            />

            <Box className="rounded-xl border border-slate-200">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-3 hover:bg-slate-50 flex items-center justify-between"
                  onClick={() => addProductAsLine(p)}>
                  <div>
                    <div className="font-medium">
                      {p.sku} — {p.name}
                    </div>
                    <div className="text-sm text-slate-500">{money(p.price, p.currency)}</div>
                  </div>
                  <Chip size="small" label="Add" />
                </button>
              ))}
              {productResults.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-500">No products found.</div>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => {
  return (
    <Stack direction="row" className="items-center justify-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" className={strong ? 'font-semibold' : ''}>
        {value}
      </Typography>
    </Stack>
  );
};

export default Billing;
