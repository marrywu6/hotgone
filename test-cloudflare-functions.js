// 本地测试Cloudflare Functions的脚本

// 模拟Cloudflare环境
const mockContext = {
  request: null,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || null,
    NODE_ENV: 'development'
  }
};

// 导入Functions
async function testCloudflareFunction() {
  console.log('🧪 Testing Cloudflare Functions locally...\n');

  // 动态导入functions
  const { onRequestGet, onRequestPost } = await import('./functions/api/[[route]].js');

  // 测试GET /api/health
  console.log('1. Testing GET /api/health');
  try {
    const healthRequest = new Request('http://localhost/api/health');
    const healthContext = { ...mockContext, request: healthRequest };
    const healthResponse = await onRequestGet(healthContext);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Available endpoints:', healthData.availableEndpoints.length);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // 测试GET /api/events
  console.log('\n2. Testing GET /api/events');
  try {
    const eventsRequest = new Request('http://localhost/api/events');
    const eventsContext = { ...mockContext, request: eventsRequest };
    const eventsResponse = await onRequestGet(eventsContext);
    const eventsData = await eventsResponse.json();
    console.log('✅ Events list:', eventsData.events.length + ' events');
    console.log('   Hot events:', eventsData.events.map(e => e.title).slice(0, 2));
  } catch (error) {
    console.log('❌ Events list failed:', error.message);
  }

  // 测试POST /api/crawl/trigger
  console.log('\n3. Testing POST /api/crawl/trigger');
  try {
    const crawlRequest = new Request('http://localhost/api/crawl/trigger', { method: 'POST' });
    const crawlContext = { ...mockContext, request: crawlRequest };
    const crawlResponse = await onRequestPost(crawlContext);
    const crawlData = await crawlResponse.json();
    console.log('✅ Crawl trigger:', crawlData.success ? 'Success' : 'Failed');
    console.log('   Events found:', crawlData.demo_data?.events_found || 0);
    console.log('   Hot events:', crawlData.demo_data?.hot_events?.slice(0, 2) || []);
  } catch (error) {
    console.log('❌ Crawl trigger failed:', error.message);
  }

  // 测试GET /api/events/hot/ranking
  console.log('\n4. Testing GET /api/events/hot/ranking');
  try {
    const rankingRequest = new Request('http://localhost/api/events/hot/ranking');
    const rankingContext = { ...mockContext, request: rankingRequest };
    const rankingResponse = await onRequestGet(rankingContext);
    const rankingData = await rankingResponse.json();
    console.log('✅ Hot ranking:', rankingData.length + ' events');
    console.log('   Top event:', rankingData[0]?.title || 'None');
  } catch (error) {
    console.log('❌ Hot ranking failed:', error.message);
  }

  // 测试GET /api/events/by-date/2025-08-04
  console.log('\n5. Testing GET /api/events/by-date/2025-08-04');
  try {
    const dateRequest = new Request('http://localhost/api/events/by-date/2025-08-04');
    const dateContext = { ...mockContext, request: dateRequest };
    const dateResponse = await onRequestGet(dateContext);
    const dateData = await dateResponse.json();
    console.log('✅ Date query:', dateData.total + ' events found');
    console.log('   Summary:', dateData.summary);
  } catch (error) {
    console.log('❌ Date query failed:', error.message);
  }

  console.log('\n🎉 Cloudflare Functions testing completed!');
  console.log('\n📝 Ready for deployment to Cloudflare Pages');
}

// 全局Request如果不存在则创建
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map();
    }
  };
}

// 运行测试
testCloudflareFunction().catch(console.error);