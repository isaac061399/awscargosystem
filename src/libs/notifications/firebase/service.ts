import admin, { type ServiceAccount } from 'firebase-admin';
import type { NotificationTopic } from '@/prisma/generated/client';

import appPushConfig from '@configs/appPushConfig';

if (appPushConfig.enabled && appPushConfig.provider === 'firebase') {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(appPushConfig.firebaseConfig as ServiceAccount)
    });
  }
}

const topics: Record<NotificationTopic, string> = {
  REGISTERED_USERS: 'registered-users',
  GUEST_USERS: 'guest-users'
};

export const subscribeDeviceToTopicFirebase = async (token: string | string[], topic: NotificationTopic) => {
  return new Promise((resolve) => {
    admin
      .messaging()
      .subscribeToTopic(token, topics[topic])
      .then((response) => {
        console.log(`Subscribed to topic ${topics[topic]}: `, response);
        resolve(response);
      })
      .catch((error) => {
        resolve(false);
        console.error(`Error subscribing to topic ${topics[topic]}: `, error);
      });
  });
};

export const unsubscribeDeviceFromTopicFirebase = async (token: string | string[], topic: NotificationTopic) => {
  return new Promise((resolve) => {
    admin
      .messaging()
      .unsubscribeFromTopic(token, topics[topic])
      .then((response) => {
        console.log(`Unsubscribed to topic ${topics[topic]}: `, response);
        resolve(response);
      })
      .catch((error) => {
        console.error(`Error unsubscribing to topic ${topics[topic]}: `, error);
        resolve(false);
      });
  });
};

export const sendMessageFirebase = async (token: string | string[], title: string, body: string, data?: any) => {
  const notificationStructure = getMessageStructure(title, body, data);

  if (Array.isArray(token)) {
    const message: admin.messaging.MulticastMessage = {
      ...notificationStructure,
      tokens: token
    };

    return new Promise((resolve) => {
      admin
        .messaging()
        .sendEachForMulticast(message)
        .then((response) => {
          console.log('Successfully sent message to tokens:', response);
          resolve(response);
        })
        .catch((error) => {
          console.error('Error sending message to tokens:', error);
          resolve(false);
        });
    });
  } else {
    const message: admin.messaging.Message = {
      ...notificationStructure,
      token
    };

    return new Promise((resolve) => {
      admin
        .messaging()
        .send(message)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          console.error('Error sending message to token:', error);
          resolve(false);
        });
    });
  }
};

export const sendMessageTopicFirebase = async (topic: NotificationTopic, title: string, body: string, data?: any) => {
  const notificationStructure = getMessageStructure(title, body, data);

  const message: admin.messaging.Message = {
    ...notificationStructure,
    topic: topics[topic]
  };

  return new Promise((resolve) => {
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log('Successfully sent message to topic:', response);
        resolve(response);
      })
      .catch((error) => {
        console.error('Error sending message to topic:', error);
        resolve(false);
      });
  });
};

const getMessageStructure = (title: string, body: string, data?: any) => {
  return {
    notification: {
      title,
      body
      // imageUrl: 'https://foo.bar.pizza-monster.png'
    },
    data,
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default'
        // imageUrl: 'https://foo.bar.pizza-monster.png'
      }
    },
    apns: {
      headers: {
        'apns-priority': '10'
      },
      payload: {
        aps: {
          alert: {
            title,
            body
          },
          sound: 'default',
          // badge: 1,
          contentAvailable: true,
          mutableContent: true
        }
      }
      // fcm_options: {
      //   image: 'https://foo.bar.pizza-monster.png'
      // }
    }
  };
};

export default admin;
