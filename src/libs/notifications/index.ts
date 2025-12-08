import type { NotificationTopic } from '@/prisma/generated/client';
import {
  sendMessageFirebase,
  sendMessageTopicFirebase,
  subscribeDeviceToTopicFirebase,
  unsubscribeDeviceFromTopicFirebase
} from './firebase/service';

import appPushConfig from '@configs/appPushConfig';

const pushService = appPushConfig.provider;

export const subscribeDeviceToTopic = async (token: string | string[], topic: NotificationTopic) => {
  switch (pushService) {
    case 'firebase':
      return subscribeDeviceToTopicFirebase(token, topic);
    default:
      return false;
  }
};

export const unsubscribeDeviceFromTopic = async (token: string | string[], topic: NotificationTopic) => {
  switch (pushService) {
    case 'firebase':
      return unsubscribeDeviceFromTopicFirebase(token, topic);
    default:
      return false;
  }
};

export const sendMessage = async (token: string | string[], title: string, body: string, data?: any) => {
  switch (pushService) {
    case 'firebase':
      return sendMessageFirebase(token, title, body, data);
    default:
      return false;
  }
};

export const sendMessageTopic = async (topic: NotificationTopic, title: string, body: string, data?: any) => {
  switch (pushService) {
    case 'firebase':
      return sendMessageTopicFirebase(topic, title, body, data);
    default:
      return false;
  }
};
