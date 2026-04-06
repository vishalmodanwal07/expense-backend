const getCurrentMonth = () => {
  const now = new Date();
  return now.toISOString().slice(0, 7); // YYYY-MM
};
 export {getCurrentMonth};