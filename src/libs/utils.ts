export const rgbaToHex = (colorStr: string, forceRemoveAlpha: boolean = false) => {
  // Check if the input string contains '/'
  const hasSlash = colorStr.includes('/');

  if (hasSlash) {
    // Extract the RGBA values from the input string
    const rgbaValues = colorStr.match(/(\d+)\s+(\d+)\s+(\d+)\s+\/\s+([\d.]+)/);

    if (!rgbaValues) {
      return colorStr; // Return the original string if it doesn't match the expected format
    }

    const [red, green, blue, alpha] = rgbaValues.slice(1, 5).map(parseFloat);

    // Convert the RGB values to hexadecimal format
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');

    // Convert alpha to a hexadecimal format (assuming it's already a decimal value in the range [0, 1])
    const alphaHex = forceRemoveAlpha
      ? ''
      : Math.round(alpha * 255)
          .toString(16)
          .padStart(2, '0');

    // Combine the hexadecimal values to form the final hex color string
    const hexColor = `#${redHex}${greenHex}${blueHex}${alphaHex}`;

    return hexColor;
  } else {
    // Use the second code block for the case when '/' is not present
    return (
      '#' +
      colorStr
        .replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
        .split(',') // splits them at ","
        .filter((string, index) => !forceRemoveAlpha || index !== 3)
        .map((string) => parseFloat(string)) // Converts them to numbers
        .map((number, index) => (index === 3 ? Math.round(number * 255) : number)) // Converts alpha to 255 number
        .map((number) => number.toString(16)) // Converts numbers to hex
        .map((string) => (string.length === 1 ? '0' + string : string)) // Adds 0 when length of one number is 1
        .join('')
    );
  }
};

export const stringToColor = (string: string): string => {
  let hash = 0;

  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  return `#${[0, 1, 2].map((i) => `00${((hash >> (i * 8)) & 0xff).toString(16)}`.slice(-2)).join('')}`;
};

export const stringAvatar = (name: string) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('');

  return {
    sx: {
      bgcolor: stringToColor(name)
    },
    children: initials
  };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const parseSort = (params: Record<string, string>, validFields: string[]) => {
  if (!params.sort) return undefined;

  return params.sort
    .split(',')
    .map((field) => {
      const [key, order] = field.split(':');

      if (!validFields.includes(key)) {
        return null;
      }

      return { [key]: order === 'desc' ? 'desc' : 'asc' };
    })
    .filter((item) => item !== null);
};

export const parsePopulate = (params: Record<string, string>) => {
  if (!params.populate) return undefined;

  return params.populate.split(',').reduce(
    (acc, rel) => {
      acc[rel] = true;

      return acc;
    },
    {} as Record<string, boolean>
  );
};

export const formatFileSize = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));

  return `${size} ${sizes[i]}`;
};

export const getTelInputValue = (value: string): string => {
  if (!value) return '';

  const digitsOnly = value.replace(/\D/g, '');

  return digitsOnly.length > 4 ? value : '';
};

export const formatMoney = (value: number | string): string => {
  const prefix = '₡ ';
  const suffix = '';
  const decimalSeparator = '.';
  const thousandSeparator = ',';
  const decimalScale = 2;

  const num = Number(value);

  if (isNaN(num)) return '';

  let [intPart, decPart = ''] = num.toString().split('.');

  // Add thousand separator
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  // If original number has decimals
  const hasDecimal = value.toString().includes('.');

  let decimalOutput = '';

  if (hasDecimal && decimalScale !== undefined) {
    decPart = (decPart + '0'.repeat(decimalScale)).slice(0, decimalScale);
    decimalOutput = decimalSeparator + decPart;
  }

  return `${prefix}${intPart}${decimalOutput}${suffix}`;
};

export const padStartZeros = (num: number | string, length: number): string => {
  const strNum = typeof num === 'number' ? num.toString() : num;

  return strNum.padStart(length, '0');
};

export const generateUrl = (baseUrl: string, params: Record<string, any>) => {
  const query = new URLSearchParams(params).toString();

  return `${baseUrl}?${query}`;
};
