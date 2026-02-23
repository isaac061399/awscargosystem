import 'dotenv/config';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import csv from 'csv-parser';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import moment from 'moment';
import { PrismaClient } from '../../src/prisma/generated/client';
import { getHash } from '@/libs/argon2id';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientesDataPath = path.resolve(__dirname, 'Clientes.csv');
const usuariosDataPath = path.resolve(__dirname, 'TBL_USUARIOS.csv');
// const paquetesDataPath = path.resolve(__dirname, 'TBL_PAQUETES.csv');
// const pedidosDataPath = path.resolve(__dirname, 'TBL_PEDIDOS.csv');
// const detallePedidoDataPath = path.resolve(__dirname, 'TBL_DETALLE_PEDIDO.csv');
// const provinciasDataPath = path.resolve(__dirname, 'Provincias.csv');

type Row = Record<string, string>;

const readCsvFile = async (path: string): Promise<Row[]> => {
  return new Promise((resolve, reject) => {
    const results: Row[] = [];

    fs.createReadStream(path)
      .on('error', reject)
      .pipe(csv())
      .on('data', (data: Row) => results.push(data))
      .on('error', reject)
      .on('end', () => resolve(results));
  });
};

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

async function main() {
  console.log(`\nInitializing script...`);

  // clientes
  const resultClientes = await readCsvFile(clientesDataPath);
  console.log(`\Read ${resultClientes.length} rows from ${clientesDataPath}`);

  // usuarios
  const resultUsuarios = await readCsvFile(usuariosDataPath);
  console.log(`\Read ${resultUsuarios.length} rows from ${usuariosDataPath}`);

  const clientesResult: { [key: string]: number } = {};

  for (const cliente of resultClientes) {
    // get matching usuario for cliente
    let password = null;
    const usuario = resultUsuarios.find((u) => u.ID === cliente.ID_CLIENTE);
    if (usuario) {
      password = await getHash(usuario['CONTRASEÑA'] || '');
    } else {
      console.warn(`\ xxxxxx -> No matching usuario found for cliente ID: ${cliente.ID_CLIENTE}`);
    }

    const officeId = maps.offices[cliente.SUCURSAL as keyof typeof maps.offices] || defaultOfficeId;
    const clientId = parseInt(cliente.CASILLERO.split('-')[1].trim()); // Extract mailbox number after the dash
    const districtId = parseInt(`${cliente.PROVINCIA.trim()}${cliente.CANTON.trim()}${cliente.DISTRITO.trim()}`); // Combine province, canton, and district codes
    const identificationType =
      maps.identificationTypes[cliente.TIPO_CEDULA as keyof typeof maps.identificationTypes] ||
      maps.identificationTypes.NULL;
    const billingIdentificationType =
      maps.identificationTypes[cliente.TIPOCEDULAFACT as keyof typeof maps.identificationTypes];

    let phone = `${cliente.CODIGO_PAIS.trim()} `;
    if (cliente.TELEFONO_MOVIL && cliente.TELEFONO_MOVIL !== '0') {
      phone = phone.concat(cliente.TELEFONO_MOVIL.trim());
    } else if (cliente.TELEFONO_FIJO && cliente.TELEFONO_FIJO !== '0') {
      phone = phone.concat(cliente.TELEFONO_FIJO.trim());
    } else {
      phone = ''; // Set to empty string if no valid phone number is available
    }

    let billingPhone = `${cliente.CODIGO_PAIS.trim()} `;
    if (cliente.TELEFONOFACT && cliente.TELEFONOFACT !== '0') {
      billingPhone = billingPhone.concat(cliente.TELEFONOFACT.trim());
    } else {
      billingPhone = phone; // Set to phone if no valid billing phone number is available
    }

    const createdCliente = await prisma.cusClient.create({
      data: {
        id: clientId,
        office_id: officeId,
        mailbox: `${maps.mailboxPrefixes[officeId as keyof typeof maps.mailboxPrefixes]}${clientId}`,
        full_name: cliente.NOMBRE_COMPLETO,
        identification_type: identificationType as any,
        identification: cliente.CEDULA,
        email: cliente.CORREO,
        phone: phone,
        notes: '',
        district_id: districtId,
        address: cliente.DIRECCION,
        password: password,
        billing_full_name: cliente.NOMBREFACT || cliente.NOMBRE_COMPLETO,
        billing_identification_type: billingIdentificationType || (identificationType as any),
        billing_identification: cliente.CEDULAFACT || cliente.CEDULA,
        billing_email: cliente.CORREOFACT || cliente.CORREO,
        billing_phone: billingPhone,
        billing_district_id: districtId,
        billing_address: cliente.DIRECCION,
        billing_activity_code: cliente.CODIGO_ACTIVIDAD_COMERCIAL || defaultActivityCode,
        pound_fee: cliente.TARIFA ? parseFloat(cliente.TARIFA) : defaultFee,
        status: 'ACTIVE',
        created_at: moment(cliente.FECHA_CREADO).toISOString()
      }
    });

    clientesResult[cliente.ID_CLIENTE] = createdCliente.id;
  }

  console.log('Clientes data:', JSON.stringify(resultClientes, null, 2));
  console.log('Usuarios data:', JSON.stringify(resultUsuarios, null, 2));

  // // paquetes
  // const resultPaquetes = await readCsvFile(paquetesDataPath);
  // console.log(`\Read ${resultPaquetes.length} rows from ${paquetesDataPath}`);

  // // pedidos
  // const resultPedidos = await readCsvFile(pedidosDataPath);
  // console.log(`\Read ${resultPedidos.length} rows from ${pedidosDataPath}`);

  // // detalle pedido
  // const resultDetallePedido = await readCsvFile(detallePedidoDataPath);
  // console.log(`\Read ${resultDetallePedido.length} rows from ${detallePedidoDataPath}`);

  // // provincias
  // const resultProvincias = await readCsvFile(provinciasDataPath);
  // console.log(`\Read ${resultProvincias.length} rows from ${provinciasDataPath}`);

  // for (const province of Object.values(typedData)) {
  //   console.log(`\Saving province: ${province.name}`);

  //   // save province
  //   await prisma.cusProvince.create({
  //     data: {
  //       id: province.id,
  //       name: province.name
  //     }
  //   });

  //   console.log(`\Saving cantons of: ${province.name}`);

  //   for (const canton of Object.values(province.cantons)) {
  //     console.log(`\Saving canton: ${canton.name}`);
  //     // save canton
  //     await prisma.cusCanton.create({
  //       data: {
  //         id: canton.id,
  //         name: canton.name,
  //         province_id: province.id
  //       }
  //     });

  //     console.log(`\Saving districts of: ${canton.name}`);

  //     for (const district of Object.values(canton.districts)) {
  //       console.log(`\Saving district: ${district.name}`);
  //       // save district
  //       await prisma.cusDistrict.create({
  //         data: {
  //           id: district.id,
  //           name: district.name,
  //           canton_id: canton.id
  //         }
  //       });
  //     }
  //   }
  // }
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
