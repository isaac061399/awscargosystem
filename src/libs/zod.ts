import { z as zod, type ZodType } from 'zod';

export const z = zod;

export const validateParams = (schema: ZodType, data: object, messages: { [key: string]: string }) => {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    const errors: any = validation.error.format();
    const formattedErrors = formatErrors(errors, messages);

    return { valid: false, params: formattedErrors };
  }

  return { valid: true, data: validation.data };
};

const formatErrors = (errors: { [key: string]: { _errors: string[] } }, messages: { [key: string]: string }) => {
  const formattedErrors: { [key: string]: string } = {};

  for (const key in errors) {
    if (errors[key]._errors && errors[key]._errors.length > 0) {
      formattedErrors[key] = errors[key]._errors.map((m) => messages[m] || m).join(', ');
    }
  }

  return formattedErrors;
};
