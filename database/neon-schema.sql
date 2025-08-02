-- Neon PostgreSQL 数据库表结构
-- 免费套餐：512MB存储，适合大量数据

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    importance INTEGER DEFAULT 5,
    keywords TEXT[], -- PostgreSQL数组类型
    sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_timeline (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'development',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_importance ON events(importance);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_keywords ON events USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_timeline_event_id ON event_timeline(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON event_timeline(date);

-- 插入示例数据
INSERT INTO events (title, description, category, status, importance, keywords, sources) VALUES
('2024年人工智能技术突破', 'GPT-4、Claude等大语言模型的重大技术突破，推动AI在各行业的应用普及，改变工作方式和生产效率。', '科技', 'active', 9, ARRAY['人工智能', 'GPT-4', 'Claude', '大语言模型'], ARRAY['https://openai.com', 'https://anthropic.com']),
('全球气候变化加剧', '2024年全球平均气温再创新高，极端天气事件频发，国际社会加强气候行动合作。', '环境', 'ongoing', 10, ARRAY['气候变化', '全球变暖', '极端天气', '环境保护'], ARRAY['https://unfccc.int', 'https://ipcc.ch']),
('全球经济复苏与挑战', '2024年全球经济在后疫情时代逐步复苏，但面临通胀、供应链等多重挑战。', '经济', 'active', 8, ARRAY['经济复苏', '通胀', '货币政策', 'GDP'], ARRAY['https://imf.org', 'https://worldbank.org']),
('太空探索新进展', '2024年各国太空探索项目取得重大进展，商业太空旅游蓬勃发展。', '科技', 'active', 7, ARRAY['太空探索', '嫦娥六号', 'SpaceX', '商业太空'], ARRAY['https://nasa.gov', 'https://spacex.com']),
('新能源汽车市场爆发', '2024年全球新能源汽车销量大幅增长，充电基础设施建设加速，传统车企加速转型。', '科技', 'active', 8, ARRAY['新能源汽车', '电动汽车', '充电桩', '绿色出行'], ARRAY['https://tesla.com', 'https://iea.org']);

-- 插入时间线数据
INSERT INTO event_timeline (event_id, date, title, content, type) VALUES
(1, '2024-01-15', 'GPT-4 Turbo发布', 'OpenAI发布GPT-4 Turbo，性能提升显著，成本降低', 'development'),
(1, '2024-03-01', 'Claude 3发布', 'Anthropic发布Claude 3系列模型，在多项基准测试中表现优异', 'development'),
(2, '2024-02-01', '联合国气候报告', '联合国发布最新气候变化报告，警告全球变暖趋势加速', 'incident'),
(2, '2024-06-15', '极端高温事件', '多地出现创纪录高温，引发全球对气候变化的关注', 'incident'),
(3, '2024-01-20', 'IMF经济预测', '国际货币基金组织发布2024年全球经济展望', 'development'),
(3, '2024-04-10', '美联储政策调整', '美联储调整货币政策，影响全球经济走向', 'development'),
(4, '2024-03-15', '嫦娥六号发射', '中国成功发射嫦娥六号月球探测器', 'development'),
(4, '2024-05-20', 'SpaceX新突破', 'SpaceX成功完成载人太空任务，推进商业太空发展', 'development'),
(5, '2024-02-28', '特斯拉销量突破', '特斯拉2024年Q1销量创新高', 'development'),
(5, '2024-04-05', '充电网络扩张', '全球充电桩数量突破500万个里程碑', 'development');