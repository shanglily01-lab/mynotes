export interface SubjectConfig {
  id: string;
  name: string;
  icon: string;
  rssFeeds: { url: string; name: string }[];
  foundations: string[]; // 系统性基础主题，AI 生成计划时参考
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id: "psychology",
    name: "心理学",
    icon: "brain",
    rssFeeds: [
      { url: "https://feeds.feedburner.com/PsychologyToday", name: "Psychology Today" },
      { url: "https://export.arxiv.org/rss/q-bio.NC", name: "ArXiv Neuroscience" },
    ],
    foundations: [
      "心理学研究方法：实验法、观察法、问卷法",
      "生物基础：神经元、突触、神经递质、大脑结构与功能",
      "感知与意识：感觉、知觉、注意力、意识状态",
      "学习与记忆：经典条件反射、操作性条件反射、记忆编码与提取",
      "认知心理学：思维、语言、问题解决、决策与偏见",
      "发展心理学：皮亚杰认知发展阶段、依恋理论、青春期与老年",
      "人格理论：弗洛伊德、人本主义、大五人格模型",
      "社会心理学：态度、从众、服从、群体动力",
      "动机与情绪：马斯洛需求层次、情绪理论、压力与应对",
      "心理障碍：分类诊断、常见障碍（抑郁、焦虑、精神分裂）",
      "心理治疗：认知行为疗法、精神分析、人本主义疗法",
    ],
  },
  {
    id: "biology",
    name: "生物学",
    icon: "leaf",
    rssFeeds: [
      { url: "https://www.nature.com/nature.rss", name: "Nature" },
      { url: "https://feeds.feedburner.com/sciencedaily/top_news", name: "Science Daily" },
    ],
    foundations: [
      "细胞生物学：细胞结构、细胞膜、细胞器功能",
      "分子生物学：DNA 结构、复制、转录、翻译（中心法则）",
      "遗传学：孟德尔遗传、基因连锁、突变、遗传病",
      "进化论：自然选择、物种形成、进化证据",
      "生态学：种群、群落、生态系统、物质循环与能量流动",
      "细胞代谢：糖酵解、柠檬酸循环、氧化磷酸化、光合作用",
      "免疫系统：先天免疫、适应性免疫、抗体、疫苗原理",
      "神经与内分泌：神经信号传导、激素调节、反馈机制",
      "发育生物学：细胞分化、胚胎发育、干细胞",
      "生物技术：PCR、基因编辑（CRISPR）、基因组学",
    ],
  },
  {
    id: "physics",
    name: "物理学",
    icon: "atom",
    rssFeeds: [
      { url: "https://export.arxiv.org/rss/physics.gen-ph", name: "ArXiv Physics" },
      { url: "https://physicsworld.com/feed/", name: "Physics World" },
    ],
    foundations: [
      "经典力学：牛顿定律、动量、能量守恒、转动",
      "热力学：温度、热量、熵、四大定律",
      "电磁学：库仑定律、电场、磁场、麦克斯韦方程组",
      "波动与光学：波的性质、干涉、衍射、几何光学",
      "狭义相对论：时间膨胀、长度收缩、质能方程 E=mc²",
      "量子力学基础：波粒二象性、不确定性原理、薛定谔方程",
      "原子与核物理：原子模型、放射性衰变、核裂变与聚变",
      "粒子物理：标准模型、基本粒子、四种基本力",
      "广义相对论概要：时空弯曲、引力波、黑洞",
      "凝聚态物理：能带理论、半导体、超导",
    ],
  },
  {
    id: "sociology",
    name: "社会学",
    icon: "users",
    rssFeeds: [
      { url: "https://sociologicalimagination.org/feed", name: "Sociological Imagination" },
      { url: "https://export.arxiv.org/rss/econ.GN", name: "ArXiv Social" },
    ],
    foundations: [
      "社会学研究方法：定量与定性研究、田野调查、统计分析",
      "社会化：个体社会化过程、文化传递、身份认同",
      "社会结构：地位、角色、群体、组织、制度",
      "社会分层：阶级、阶层、流动性、不平等理论",
      "文化理论：文化要素、亚文化、文化冲突与融合",
      "经典理论：功能主义（涂尔干）、冲突论（马克思）、符号互动论（米德）",
      "家庭社会学：家庭结构变迁、婚姻、性别角色",
      "政治社会学：权力、国家、政治参与、民主理论",
      "经济社会学：市场、劳动、消费、全球化",
      "社会问题：犯罪、贫困、歧视、社会运动",
    ],
  },
  {
    id: "ai-news",
    name: "AI 日报",
    icon: "cpu",
    rssFeeds: [
      { url: "https://export.arxiv.org/rss/cs.AI", name: "ArXiv cs.AI" },
      { url: "https://huggingface.co/blog/feed.xml", name: "HuggingFace Blog" },
    ],
    foundations: [
      "机器学习基础：监督/无监督/强化学习、过拟合、正则化",
      "深度学习：神经网络、反向传播、激活函数、优化器",
      "卷积神经网络：架构原理、图像识别、目标检测",
      "循环神经网络：RNN、LSTM、序列建模",
      "Transformer 架构：自注意力机制、位置编码、Encoder-Decoder",
      "大语言模型：预训练、微调、RLHF、提示工程",
      "计算机视觉：图像分类、生成模型（GAN、Diffusion）",
      "自然语言处理：分词、词嵌入、文本分类、机器翻译",
      "AI 伦理与安全：偏见、可解释性、对齐问题",
      "AI 工程：模型部署、推理优化、RAG、向量数据库",
    ],
  },
  {
    id: "english",
    name: "英语",
    icon: "book-open",
    rssFeeds: [
      { url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english.rss", name: "BBC 6 Minute English" },
      { url: "https://www.voanews.com/api/zkoqmee$tm", name: "VOA Learning English" },
    ],
    foundations: [
      "词汇积累：词根词缀规律、高频词汇、同义词辨析",
      "语法核心：时态（16种时态用法）、语态、情态动词",
      "句子结构：简单句、并列句、复合句、从句类型",
      "阅读技巧：略读、精读、推断词义、理解主旨",
      "写作结构：段落写作、议论文框架、衔接词使用",
      "听力技巧：预测内容、抓关键词、理解语调",
      "口语表达：发音规则、连读与弱读、常用口语句型",
      "商务英语：邮件写作、会议用语、报告结构",
      "学术英语：论文摘要、引用规范、学术词汇",
      "英美文化：习语、俚语、文化背景对语言的影响",
    ],
  },
];

export function getSubject(id: string): SubjectConfig | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function getWeekStart(date: Date = new Date()): Date {
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
}

export function getTodayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
