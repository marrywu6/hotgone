const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing Neon PostgreSQL connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Neon PostgreSQL successfully');

    // Test table creation (will create if not exists)
    console.log('🔄 Testing database schema...');
    
    // Test creating a sample event
    console.log('🔄 Testing event creation...');
    const testEvent = await prisma.event.create({
      data: {
        title: '测试事件 - Neon数据库连接',
        description: '这是一个测试Neon PostgreSQL数据库连接的事件',
        category: '技术测试',
        status: 'ACTIVE',
        importance: 5,
        keywords: ['测试', 'Neon', 'PostgreSQL'],
        sources: ['本地测试']
      }
    });
    console.log('✅ Test event created:', testEvent.id);

    // Test querying events
    console.log('🔄 Testing event query...');
    const events = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Found ${events.length} events in database`);

    // Test adding timeline
    console.log('🔄 Testing timeline creation...');
    const timeline = await prisma.timeline.create({
      data: {
        eventId: testEvent.id,
        date: new Date(),
        title: '测试时间线',
        content: '这是一个测试时间线项目',
        type: 'MILESTONE'
      }
    });
    console.log('✅ Timeline created:', timeline.id);

    // Test full event with timeline
    const fullEvent = await prisma.event.findUnique({
      where: { id: testEvent.id },
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      }
    });
    console.log('✅ Event with timeline:', {
      id: fullEvent.id,
      title: fullEvent.title,
      timelineCount: fullEvent.timeline.length
    });

    console.log('\n🎉 All database tests passed!');
    console.log('📊 Database is ready for production use');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'P1001') {
      console.error('🔧 Connection issue - check DATABASE_URL in .env file');
    } else if (error.code === 'P2002') {
      console.error('🔧 Unique constraint violation');
    } else if (error.code === 'P2025') {
      console.error('🔧 Record not found');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testDatabaseConnection();