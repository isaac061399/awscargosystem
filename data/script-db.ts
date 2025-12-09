import 'dotenv/config';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/prisma/generated/client';

import data from './cr-data-output.json';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter });

interface Province {
  [provinceId: string]: {
    id: number;
    name: string;
    cantons: {
      [cantonId: string]: {
        id: number;
        name: string;
        districts: {
          [districtId: string]: {
            id: number;
            name: string;
          };
        };
      };
    };
  };
}

const typedData: Province = data;

async function main() {
  console.log(`\nInitializing script...`);

  for (const province of Object.values(typedData)) {
    console.log(`\Saving province: ${province.name}`);

    // save province
    await prisma.cusProvince.create({
      data: {
        id: province.id,
        name: province.name
      }
    });

    console.log(`\Saving cantons of: ${province.name}`);

    for (const canton of Object.values(province.cantons)) {
      console.log(`\Saving canton: ${canton.name}`);
      // save canton
      await prisma.cusCanton.create({
        data: {
          id: canton.id,
          name: canton.name,
          province_id: province.id
        }
      });

      console.log(`\Saving districts of: ${canton.name}`);

      for (const district of Object.values(canton.districts)) {
        console.log(`\Saving district: ${district.name}`);
        // save district
        await prisma.cusDistrict.create({
          data: {
            id: district.id,
            name: district.name,
            canton_id: canton.id
          }
        });
      }
    }
  }
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
