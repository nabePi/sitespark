import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/auth';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  const demoPassword = await hashPassword('demo123456');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@tapsite.com' },
    update: {},
    create: {
      email: 'demo@tapsite.com',
      password: demoPassword,
      name: 'Demo User',
      tier: 'pro',
      tokensBalance: 1000,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create a demo website
  const demoWebsite = await prisma.website.upsert({
    where: { subdomain: 'demo-site' },
    update: {},
    create: {
      name: 'Demo Business Site',
      subdomain: 'demo-site',
      description: 'A demo business website showcasing our AI builder',
      userId: demoUser.id,
      status: 'published',
      aiModel: 'kimi-k2',
      config: {
        name: 'Demo Business Site',
        pages: ['home', 'about', 'services', 'contact'],
        seo: {
          title: 'Demo Business Site - Built with AI',
          description: 'This is a demo website created with TapSite AI',
        },
      },
      generatedHtml: `<!DOCTYPE html>
<html>
<head>
  <title>Demo Business Site</title>
</head>
<body>
  <h1>Welcome to Demo Business Site</h1>
  <p>This is a demo website created with TapSite AI.</p>
</body>
</html>`,
      generatedCss: 'body { font-family: system-ui; }',
      publishedAt: new Date(),
    },
  });

  console.log(`✅ Created demo website: ${demoWebsite.subdomain}`);

  // Create demo blog posts
  const blogPost1 = await prisma.blogPost.create({
    data: {
      websiteId: demoWebsite.id,
      title: 'Getting Started with AI Website Building',
      slug: 'getting-started-with-ai-website-building',
      content: 'AI-powered website builders are revolutionizing how we create websites...',
      excerpt: 'Learn how to create stunning websites with AI in minutes.',
      status: 'published',
      publishedAt: new Date(),
    },
  });

  const blogPost2 = await prisma.blogPost.create({
    data: {
      websiteId: demoWebsite.id,
      title: '10 Tips for Better Web Design',
      slug: '10-tips-for-better-web-design',
      content: 'Good web design is essential for user engagement...',
      excerpt: 'Discover the top tips for creating beautiful, functional websites.',
      status: 'published',
      publishedAt: new Date(Date.now() - 86400000), // Yesterday
    },
  });

  console.log(`✅ Created ${2} demo blog posts`);

  // Create demo form submissions
  await prisma.formSubmission.createMany({
    data: [
      {
        websiteId: demoWebsite.id,
        formName: 'contact',
        data: { name: 'John Doe', email: 'john@example.com', message: 'Great website!' },
      },
      {
        websiteId: demoWebsite.id,
        formName: 'contact',
        data: { name: 'Jane Smith', email: 'jane@example.com', message: 'Interested in your services.' },
      },
    ],
  });

  console.log(`✅ Created demo form submissions`);

  // Create demo token transactions
  await prisma.tokenTransaction.createMany({
    data: [
      {
        userId: demoUser.id,
        amount: 100,
        type: 'signup_bonus',
        description: 'Welcome bonus: 100 tokens',
      },
      {
        userId: demoUser.id,
        amount: 50,
        type: 'daily_login',
        description: 'Daily login bonus: 50 tokens',
      },
      {
        userId: demoUser.id,
        amount: -50,
        type: 'website_generation',
        description: 'Website generation: 50 tokens',
        metadata: { websiteId: demoWebsite.id },
      },
    ],
  });

  console.log(`✅ Created demo token transactions`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: demo@tapsite.com');
  console.log('  Password: demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });