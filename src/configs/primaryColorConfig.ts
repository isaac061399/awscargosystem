export type PrimaryColorConfig = {
  name?: string;
  main: string;
  light?: string;
  dark?: string;
};

// Primary color config object
const primaryColorConfig: PrimaryColorConfig[] = [
  {
    name: 'primary-1',
    main: '#004B95',
    light: '#1C73C9',
    dark: '#012447'
  }
];

export default primaryColorConfig;
