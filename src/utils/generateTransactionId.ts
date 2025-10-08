export const generateTransactionId = () => {
  const now = new Date();
  return `TXN-${now.getTime()}`; // e.g., TXN-1716390001234
};

export const generatePaymentId = () => {
  const now = new Date();
  return `PAY-${now.getTime()}`; // e.g., TXN-1716390001234
};
