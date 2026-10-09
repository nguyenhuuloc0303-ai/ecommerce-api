require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('[PostgreSQL] Connected successfully to database via Prisma ORM.');

    // Auto seed initial essential records
    try {
      const roleCount = await prisma.role.count();
      if (roleCount === 0) {
        await prisma.role.createMany({
          data: [{ rolename: 'normal' }, { rolename: 'admin' }],
        });
        console.log('[Seed] Roles created.');
      }

      const memCount = await prisma.memberShip.count();
      if (memCount === 0) {
        await prisma.memberShip.createMany({
          data: [{ mname: 'normal', score: 10 }, { mname: 'vip', score: 50 }],
        });
        console.log('[Seed] Memberships created.');
      }
    } catch (seedErr) {
      console.warn('[Seed Warning] Could not auto-seed default tables:', seedErr.message);
    }

  } catch (error) {
    console.error('[Database Error] Failed to connect to PostgreSQL:', error.message);
  }

  app.listen(PORT, () => {
    console.log('======================================================');
    console.log(`🚀 E-Commerce Monolithic API running on port: ${PORT}`);
    console.log(`📡 Database: PostgreSQL via Prisma ORM`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`🔑 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`);
    console.log('======================================================');
  });
};

startServer();
