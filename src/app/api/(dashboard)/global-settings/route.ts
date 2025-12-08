import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { TransactionError, withTransaction } from '@libs/prisma';
import { cleanCache } from '@/libs/app/cache';

export const PUT = withAuthApi(['global-settings.edit'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:global-settings', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      // delete relations
      await tx.cmsCustomValue.deleteMany({ where: { global_settings: { locale: data.locale } } });

      // load relations
      const customValues = data.customValues?.map((cv: any) => ({
        key: cv.key,
        value: cv.value,
        order: cv.order
      }));

      const settings = await tx.cmsGlobalSettings.upsert({
        where: { locale: data.locale },
        update: {
          website_name: data.website_name,
          footer_text: data.footer_text,
          analytics_code: data.analytics_code,
          contact_phone: data.contact_phone,
          contact_mobile: data.contact_mobile,
          contact_email: data.contact_email,
          contact_address: data.contact_address,
          contact_schedule: data.contact_schedule,
          contact_maps_url: data.contact_maps_url,
          social_facebook: data.social_facebook,
          social_instagram: data.social_instagram,
          social_twitter: data.social_twitter,
          social_youtube: data.social_youtube,
          social_whatsapp: data.social_whatsapp,
          social_linkedin: data.social_linkedin,
          social_tiktok: data.social_tiktok,
          seo: {
            update: {
              title: data.seo_title,
              description: data.seo_description,
              media_id: data.seo_media?.id || null,
              keywords: data.seo_keywords,
              robots: data.seo_robots
            }
          },
          custom_values: { create: customValues }
        },
        create: {
          locale: data.locale,
          website_name: data.website_name,
          footer_text: data.footer_text,
          analytics_code: data.analytics_code,
          contact_phone: data.contact_phone,
          contact_mobile: data.contact_mobile,
          contact_email: data.contact_email,
          contact_address: data.contact_address,
          contact_schedule: data.contact_schedule,
          contact_maps_url: data.contact_maps_url,
          social_facebook: data.social_facebook,
          social_instagram: data.social_instagram,
          social_twitter: data.social_twitter,
          social_youtube: data.social_youtube,
          social_whatsapp: data.social_whatsapp,
          social_linkedin: data.social_linkedin,
          social_tiktok: data.social_tiktok,
          seo: {
            create: {
              title: data.seo_title,
              description: data.seo_description,
              media_id: data.seo_media?.id || null,
              keywords: data.seo_keywords,
              robots: data.seo_robots
            }
          },
          custom_values: { create: customValues }
        }
      });

      if (!settings) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      return settings;
    });

    // clean cache
    await cleanCache('/global-settings');

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
