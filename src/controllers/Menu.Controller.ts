import { prismaRead } from '@libs/prisma';

interface SchemaOptions {
  populateItems?: boolean;
  populateSubitems?: boolean;
}

export const getMenu = async (id: number) => {
  try {
    const schemaOptions = {
      populateItems: true,
      populateSubitems: true
    };

    const menuSchema = getMenuSchema(schemaOptions);

    const menu = await prismaRead.cmsMenu.findUnique({
      where: { id },
      select: menuSchema
    });

    if (!menu) {
      return;
    }

    return { ...menu };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const getMenuSchema = (options?: SchemaOptions) => {
  const schema: any = {
    id: true,
    locale: true,
    slug: true,
    name: true,
    published_at: true,
    created_at: true,
    updated_at: true
  };

  if (options?.populateItems) {
    schema.items = {
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        target: true
      }
    };

    if (options?.populateSubitems) {
      schema.items.select.subitems = {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          url: true,
          target: true
        }
      };
    }
  }

  return schema;
};
