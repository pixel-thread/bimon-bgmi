export const generateSixDigitNumber = (): number => {
  return Math.floor(100000 + Math.random() * 999999);
};
