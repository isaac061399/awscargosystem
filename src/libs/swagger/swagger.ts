import { createSwaggerSpec } from 'next-swagger-doc';

import siteConfig from '@/configs/siteConfig';
import i18nConfigApp from '@/configs/i18nConfigApp';

export const getApiDocs = async (version: string) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const definitions = require(`@libs/swagger/${version}/definitions.json`);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const components = require(`@libs/swagger/${version}/components.json`);

  components.parameters = {
    language: {
      name: 'Accept-Language',
      in: 'header',
      description: 'Language preference',
      required: false,
      schema: {
        type: 'string',
        enum: i18nConfigApp.locales
      }
    }
  };

  const spec = createSwaggerSpec({
    apiFolder: `src/app/api/(app)/${version}`,
    definition: {
      openapi: '3.0.0',
      info: {
        title: `${siteConfig.appName} API Documentation`,
        description: `${siteConfig.appName} API is a RESTful service that enables seamless integration with external applications, allowing them to access and interact with data efficiently.`,
        version: '1.0',
        contact: {
          name: 'Pangea Holdings',
          email: 'info@pangea.cr',
          url: 'https://pangea.cr'
        },
        termsOfService: 'https://pangea.cr/terms-and-conditions'
      },
      grouping: 'tags',
      definitions,
      components,
      security: [],
      consumes: ['application/x-www-form-urlencoded', 'application/json'],
      produces: ['application/json']
    }
  });

  return spec;
};
