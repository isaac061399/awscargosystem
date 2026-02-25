import 'dotenv/config';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import util from 'node:util';
import csv from 'csv-parser';

import { PrismaPg } from '@prisma/adapter-pg';
import moment from 'moment';
import { PrismaClient } from '@/prisma/generated/client';

import { getHash } from '@/libs/argon2id';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
export const prisma = new PrismaClient({ adapter: adapter });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsPath = path.resolve(__dirname, 'migration.log');

const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

const writeLog = (level: 'LOG' | 'WARN' | 'ERROR', args: unknown[]) => {
  const timestamp = new Date().toISOString();
  const message = util.format(...args);
  fs.appendFileSync(logsPath, `[${timestamp}] [${level}] ${message}\n`);
};

console.log = (...args: unknown[]) => {
  writeLog('LOG', args);
  originalLog(...args);
};

console.warn = (...args: unknown[]) => {
  writeLog('WARN', args);
  originalWarn(...args);
};

console.error = (...args: unknown[]) => {
  writeLog('ERROR', args);
  originalError(...args);
};

fs.appendFileSync(logsPath, `\n--- Migration run started at ${new Date().toISOString()} ---\n`);

// CSV file paths
const clientesDataPath = path.resolve(__dirname, 'Clientes.csv');
const usuariosDataPath = path.resolve(__dirname, 'TBL_USUARIOS.csv');

// Default values
const defaultOfficeId = 1; // Default to ATENAS if no match found
const defaultFee = 7.08; // Default fee if TARIFA is missing or invalid
const defaultActivityCode = '00'; // Default activity code if missing

// Mapping values
const maps = {
  offices: { ATENAS: 1, OROTINA: 2 },
  mailboxPrefixes: { 1: 'AWS-', 2: 'AWS-OR-' },
  identificationTypes: { FISICA: 'PHYSICAL', JURIDICA: 'LEGAL', DIMEX: 'DIMEX', NITE: 'NITE', NULL: 'PHYSICAL' }
};

type Row = Record<string, string>;

const normalizeValue = (value: string | null | undefined) => {
  if (value == null) return null;

  const v = value.trim();

  // SQL NULL string
  if (v === '' || v.toUpperCase() === 'NULL') return null;

  // No data values
  if (v === '0' || v.toUpperCase() === 'SINDATO') return null;

  return v;
};

const normalizeHeader = (header: string) => {
  return header?.replace(/^\uFEFF/, '').trim(); // remove BOM
};

const readCsvFile = async (path: string): Promise<Row[]> => {
  return new Promise((resolve, reject) => {
    const results: Row[] = [];

    fs.createReadStream(path)
      .on('error', reject)
      .pipe(
        csv({
          mapHeaders: ({ header }) => normalizeHeader(header),
          mapValues: ({ value }) => normalizeValue(value)
        })
      )
      .on('data', (data: Row) => results.push(data))
      .on('error', reject)
      .on('end', () => resolve(results));
  });
};

const toTitleCase = (str: string) => {
  if (!str) return str;

  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getDistrictId = ({ provincia, canton, distrito }: { provincia?: string; canton?: string; distrito?: string }) => {
  if (!provincia || !canton || !distrito) {
    return null;
  }

  return parseInt(`${provincia}${canton}${distrito}`);
};

async function saveClients() {
  // clientes
  const resultClientes = await readCsvFile(clientesDataPath);

  // usuarios
  const resultUsuarios = await readCsvFile(usuariosDataPath);

  const clientIds: { [key: string]: number } = {};

  for (const cliente of resultClientes) {
    try {
      // get matching usuario for cliente
      let password = null;
      const usuario = resultUsuarios.find((u) => u.ID === cliente.ID_CLIENTE);
      if (usuario) {
        password = await getHash(usuario['CONTRASEÑA'] || '');
      } else {
        console.warn(`\No matching usuario found for cliente ID: ${cliente.ID_CLIENTE}`);
      }

      const officeId = maps.offices[cliente.SUCURSAL as keyof typeof maps.offices] || defaultOfficeId;
      const clientId = parseInt(cliente.CASILLERO.split('-')[1].trim()); // Extract mailbox number after the dash
      const districtId = getDistrictId({
        provincia: cliente.PROVINCIA,
        canton: cliente.CANTON,
        distrito: cliente.DISTRITO
      });
      const identificationType =
        maps.identificationTypes[cliente.TIPO_CEDULA as keyof typeof maps.identificationTypes] ||
        maps.identificationTypes.NULL;
      const billingIdentificationType =
        maps.identificationTypes[cliente.TIPOCEDULAFACT as keyof typeof maps.identificationTypes] || identificationType;

      let phone = `${cliente.CODIGO_PAIS?.trim()} `;
      if (cliente.TELEFONO_MOVIL) {
        phone = phone.concat(cliente.TELEFONO_MOVIL?.trim());
      } else if (cliente.TELEFONO_FIJO) {
        phone = phone.concat(cliente.TELEFONO_FIJO?.trim());
      } else {
        phone = ''; // Set to empty string if no valid phone number is available
      }

      let billingPhone = `${cliente.CODIGO_PAIS?.trim()} `;
      if (cliente.TELEFONOFACT) {
        billingPhone = billingPhone.concat(cliente.TELEFONOFACT?.trim());
      } else {
        billingPhone = phone; // Set to phone if no valid billing phone number is available
      }

      const createdCliente = await prisma.cusClient.create({
        data: {
          id: clientId,
          office_id: officeId,
          mailbox: `${maps.mailboxPrefixes[officeId as keyof typeof maps.mailboxPrefixes]}${clientId}`,
          full_name: toTitleCase(cliente.NOMBRE_COMPLETO || ''),
          identification_type: identificationType as any,
          identification: cliente.CEDULA || '',
          email: cliente.CORREO,
          phone: phone,
          notes: '',
          district_id: districtId,
          address: cliente.DIRECCION || '',
          password: password,
          billing_full_name: toTitleCase(cliente.NOMBREFACT || cliente.NOMBRE_COMPLETO || ''),
          billing_identification_type: billingIdentificationType || (identificationType as any),
          billing_identification: cliente.CEDULAFACT || cliente.CEDULA || '',
          billing_email: cliente.CORREOFACT || cliente.CORREO,
          billing_phone: billingPhone,
          billing_district_id: districtId,
          billing_address: cliente.DIRECCION || '',
          billing_activity_code: cliente.CODIGO_ACTIVIDAD_COMERCIAL || defaultActivityCode,
          pound_fee: cliente.TARIFA ? parseFloat(cliente.TARIFA) : defaultFee,
          status: 'ACTIVE',
          created_at: moment(cliente.FECHA_CREADO).toISOString()
        }
      });

      clientIds[cliente.ID_CLIENTE] = createdCliente.id;
    } catch (error) {
      console.error(
        `Error processing cliente ID: ${cliente.ID_CLIENTE} - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(
    `\Saved ${Object.keys(clientIds).length} clients to the database of ${resultClientes.length} total clientes`
  );

  return clientIds;
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clientIds = await saveClients();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
