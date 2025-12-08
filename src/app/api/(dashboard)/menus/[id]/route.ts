import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const PUT = withAuthApi(['menus.edit'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:menus', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      const exist = await tx.cmsMenu.findFirst({
        where: { NOT: { id: Number(id) }, locale: data.locale, slug: data.slug },
        select: { id: true }
      });

      if (exist) {
        throw new TransactionError(400, textT?.errors?.slug);
      }

      // delete relations
      await tx.cmsMenuItem.deleteMany({ where: { menu_id: Number(id) } });

      // load relations
      const items = data.items?.map((i: any) => ({
        title: i.title,
        url: i.url,
        target: i.target,
        order: i.order,
        subitems: {
          create:
            i.subitems?.map((si: any) => ({
              title: si.title,
              url: si.url,
              target: si.target,
              order: si.order
            })) || []
        }
      }));

      // update content
      const menu = await tx.cmsMenu.update({
        where: { id: Number(id) },
        data: {
          locale: data.locale,
          slug: data.slug,
          name: data.name,
          items: { create: items }
        }
      });

      if (!menu) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return menu;
    });

    // clean cache
    await cleanCache('/menus');

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const DELETE = withAuthApi(['menus.delete'], async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:menus', { returnObjects: true, default: {} });

  try {
    await withTransaction(async (tx) => {
      // delete content
      const result = await tx.cmsMenu.delete({
        where: { id: Number(id) }
      });

      if (!result) {
        throw new TransactionError(400, textT?.errors?.delete);
      }
    });

    // clean cache
    await cleanCache('/menus');

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.delete }, { status: 500 });
  }
});
