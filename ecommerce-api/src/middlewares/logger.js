const logger = (req, res, next) => {
  const dateTime = new Date();
  console.log(`${dateTime.toISOString()} | ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/products')) {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
  }
  next();
};

export default logger;
