import { writeFileSync } from 'fs';

import data from './cr-data.json';

const idProvinciaIndex = 0;
const nameProvinciaIndex = 1;
const idCantonIndex = 2;
const nameCantonIndex = 3;
const idDistritoIndex = 4;
const nameDistritoIndex = 5;

const filename = './data/cr-data-output.json';

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  console.log(`\nInitializing script...`);

  const result: any = {};

  data.forEach((item) => {
    const idProvincia = item[idProvinciaIndex] as string;
    const idCanton = item[idCantonIndex] as string;
    const idDistrito = item[idDistritoIndex] as string;
    const nameProvincia = item[nameProvinciaIndex] as string;
    const nameCanton = item[nameCantonIndex] as string;
    const nameDistrito = item[nameDistritoIndex] as string;

    if (!result[idProvincia]) {
      result[idProvincia] = {
        id: parseInt(idProvincia),
        name: toTitleCase(nameProvincia),
        cantons: {}
      };
    }

    if (!result[idProvincia].cantons[idCanton]) {
      result[idProvincia].cantons[idCanton] = {
        id: parseInt(idCanton),
        name: toTitleCase(nameCanton),
        districts: {}
      };
    }

    if (!result[idProvincia].cantons[idCanton].districts[idDistrito]) {
      result[idProvincia].cantons[idCanton].districts[idDistrito] = {
        id: parseInt(idDistrito),
        name: toTitleCase(nameDistrito)
      };
    }
  });

  writeFileSync(filename, JSON.stringify(result, null, 2), 'utf8');

  console.log(`✅ JSON file written to: ${filename}`);
}

main()
  .then(async () => {
    process.exit();
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
