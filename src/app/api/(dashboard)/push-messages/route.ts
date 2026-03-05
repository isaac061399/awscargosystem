import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { sendMessageTopic } from '@libs/notifications';

export const GET = withAuthApi(['push-messages.list'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:push-messages', { returnObjects: true, default: {} });

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    // filters
    const where: any = {};

    // query
    const pushMessages = await prismaRead.appTopicNotification.findMany({
      take: params.limit ? parseInt(params.limit) : 100,
      skip: params.offset ? parseInt(params.offset) : 0,
      where,
      orderBy: [{ id: 'desc' }],
      select: {
        id: true,
        topic: true,
        title: true,
        message: true,
        // data: true,
        created_at: true
      }
    });

    if (!pushMessages) {
      return NextResponse.json({ valid: true, data: [], pagination: { total: 0, count: 0 } }, { status: 200 });
    }

    const total = await prismaRead.appTopicNotification.count({ where });
    const pagination = { total: total || 0, count: pushMessages?.length || 0 };

    return NextResponse.json({ valid: true, data: pushMessages, pagination }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

export const POST = withAuthApi(['push-messages.send'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:push-messages', { returnObjects: true, default: {} });

  const data = await req.json();

  try {
    const result = await withTransaction(async (tx) => {
      // send message
      const serviceResultId = await sendMessageTopic(data.topic, data.title, data.message, data.data || {});

      if (!serviceResultId) {
        throw new TransactionError(400, textT?.errors?.send);
      }

      // save message
      const notification = await tx.appTopicNotification.create({
        data: {
          service_id: serviceResultId as string,
          topic: data.topic,
          title: data.title,
          message: data.message,
          data: {}
        }
      });

      if (!notification) {
        throw new TransactionError(400, textT?.errors?.send);
      }

      return notification;
    });

    return NextResponse.json({ valid: true, id: result.id }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});
