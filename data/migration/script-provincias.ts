import 'dotenv/config';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import util from 'node:util';
import csv from 'csv-parser';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/prisma/generated/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
export const prisma = new PrismaClient({ adapter: adapter });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsPath = path.resolve(__dirname, 'distritos.log');

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

fs.appendFileSync(logsPath, `\n--- Run started at ${new Date().toISOString()} ---\n`);

// CSV file paths
const provinciasDataPath = path.resolve(__dirname, 'Provincias.csv');

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

async function loadProvincias() {
  // provincias
  const resultProvincias = await readCsvFile(provinciasDataPath);

  const districtMap: { [key: string]: any } = {};
  const districtNotExist: { [key: string]: any } = {};

  for (const provincia of resultProvincias) {
    try {
      const idDistrict = getDistrictId({
        provincia: provincia.CodProvincia,
        canton: provincia.CodCanton,
        distrito: provincia.CodDistrito
      });

      if (!idDistrict || districtMap[idDistrict]) {
        continue;
      } else {
        districtMap[idDistrict] = {
          id_provincia: provincia.CodProvincia,
          provincia: toTitleCase(provincia.Provincia),
          id_canton: provincia.CodCanton,
          canton: toTitleCase(provincia.Canton),
          id_distrito: provincia.CodDistrito,
          distrito: toTitleCase(provincia.Distrito)
        };
      }

      const exist = await prisma.cusDistrict.findUnique({ where: { id: idDistrict } });

      if (!exist) {
        districtNotExist[idDistrict] = districtMap[idDistrict];
      }

      // clientIds[cliente.ID_CLIENTE] = createdCliente.id;
    } catch (error) {
      console.error(
        `Error processing provincia ID: ${provincia.ID_Provincia} - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(districtNotExist);

  return districtMap;
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const districtMap = await loadProvincias();
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
