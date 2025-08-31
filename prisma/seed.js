const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function generateApiKey(prefix) {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${randomPart}`;
}

async function main() {
  console.log('🌱 Seeding sBTC Gateway database...');

  // Create demo merchant
  const merchant = await prisma.merchant.upsert({
    where: { email: 'demo@merchant.test' },
    update: {},
    create: {
      email: 'demo@merchant.test',
      name: 'BitcoinBridge Demo Coffee',
      website: 'https://demo-coffee.sbtc-gateway.com',
      webhookUrl: 'https://demo-coffee.sbtc-gateway.com/webhooks/sbtc',
      webhookSecret: crypto.randomBytes(32).toString('hex'),
      defaultCurrency: 'USD',
      metadata: {
        industry: 'food-beverage',
        setupDate: new Date().toISOString(),
        testAccount: true
      }
    }
  });

  // Generate SECRET API key
  const secretKey = await generateApiKey('sk_test');
  const secretKeyHash = await bcrypt.hash(secretKey, 12);
  
  await prisma.apiKey.upsert({
    where: { keyHash: secretKeyHash },
    update: {},
    create: {
      merchantId: merchant.id,
      keyHash: secretKeyHash,
      keyPrefix: secretKey.substring(0, 12) + '...',
      name: 'Demo Store Secret Key',
      type: 'SECRET',
      isActive: true
    }
  });

  // Generate PUBLISHABLE API key  
  const publishableKey = await generateApiKey('pk_test');
  const publishableKeyHash = await bcrypt.hash(publishableKey, 12);
  
  await prisma.apiKey.upsert({
    where: { keyHash: publishableKeyHash },
    update: {},
    create: {
      merchantId: merchant.id,
      keyHash: publishableKeyHash,
      keyPrefix: publishableKey.substring(0, 12) + '...',
      name: 'Demo Store Publishable Key',
      type: 'PUBLISHABLE',
      isActive: true
    }
  });

  // Create demo transactions with realistic data
  const demoTransactions = [
    {
      amountUsd: 15.99,
      amountSbtc: 0.00032,
      exchangeRate: 49968.75,
      description: 'Cappuccino + Almond Croissant',
      customerEmail: 'alice@customer.test',
      customerName: 'Alice Johnson',
      status: 'CONFIRMED',
      txId: '0xabcdef1234567890abcdef1234567890abcdef12',
      blockHeight: 12845,
      confirmedAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      amountUsd: 4.50,
      amountSbtc: 0.00009,
      exchangeRate: 50000.00,
      description: 'Double Espresso',
      customerEmail: 'bob@customer.test',
      customerName: 'Bob Smith',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 1800000) // 30 min from now
    },
    {
      amountUsd: 28.75,
      amountSbtc: 0.000575,
      exchangeRate: 50000.00,
      description: 'Coffee Subscription (Monthly)',
      customerEmail: 'carol@customer.test',
      customerName: 'Carol Davis',
      status: 'CONFIRMED',
      txId: '0x9876543210fedcba9876543210fedcba98765432',
      blockHeight: 12844,
      confirmedAt: new Date(Date.now() - 7200000) // 2 hours ago
    }
  ];

  for (const txData of demoTransactions) {
    await prisma.transaction.create({
      data: {
        ...txData,
        merchantId: merchant.id,
        expiresAt: txData.expiresAt || new Date(Date.now() + 1800000),
        successUrl: 'https://demo-coffee.sbtc-gateway.com/success',
        cancelUrl: 'https://demo-coffee.sbtc-gateway.com/cancel',
        metadata: {
          source: 'demo-seed',
          deviceType: 'mobile',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
        }
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n🔑 API Keys Generated:');
  console.log(`Secret Key:      ${secretKey}`);
  console.log(`Publishable Key: ${publishableKey}`);
  console.log(`\n👤 Demo Merchant: ${merchant.email}`);
  console.log(`📧 Webhook URL:   ${merchant.webhookUrl}`);
  console.log('\n🚀 Ready to start building! Run: pnpm dev');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });