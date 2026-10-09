const prisma = require('../config/prisma');

const checkHealth = async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'CONNECTED';
  } catch (err) {
    dbStatus = 'ERROR';
  }

  const isHealthy = dbStatus === 'CONNECTED';
  const healthData = {
    status: isHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'ecommerce-monolithic-api',
    database: {
      type: 'PostgreSQL',
      status: dbStatus,
    },
  };

  return res.status(isHealthy ? 200 : 503).json(healthData);
};

module.exports = {
  checkHealth,
};
