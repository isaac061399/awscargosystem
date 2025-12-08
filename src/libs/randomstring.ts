import randomstring from 'randomstring';

export const generateCode = () => {
  const random = randomstring.generate({
    length: 6,
    charset: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  });

  return random;
};
