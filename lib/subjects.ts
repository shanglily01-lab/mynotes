export interface OpenResource {
  title: string;
  url: string;
  description: string;
}

export interface SubjectConfig {
  id: string;
  name: string;
  icon: string;
  rssFeeds: { url: string; name: string }[];
  foundations: string[];
  openResources: OpenResource[];
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
    openResources: [
      {
        title: "MIT OCW: Introduction to Psychology (9.00SC)",
        url: "https://ocw.mit.edu/courses/9-00sc-introduction-to-psychology-fall-2011/pages/syllabus/",
        description: "MIT 开放课件：心理学导论，含完整课程大纲和讲义",
      },
      {
        title: "OpenStax Psychology 2e",
        url: "https://openstax.org/books/psychology-2e/pages/1-introduction",
        description: "OpenStax 免费开放教材：心理学第二版，全书可在线阅读",
      },
      {
        title: "Stanford: Human Behavioral Biology (Robert Sapolsky)",
        url: "https://www.youtube.com/playlist?list=PL848F2368C90DDC3D",
        description: "斯坦福大学 Sapolsky 教授人类行为生物学公开课",
      },
      {
        title: "Yale OCW: Introduction to Psychology (PSYC 110)",
        url: "https://oyc.yale.edu/psychology/psyc-110",
        description: "耶鲁大学心理学导论公开课，含视频和讲义",
      },
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
    openResources: [
      {
        title: "MIT OCW: Biology (7.01SC Fundamentals of Biology)",
        url: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/pages/syllabus/",
        description: "MIT 生物学基础课程大纲，含分子生物学、遗传学、进化等模块",
      },
      {
        title: "OpenStax Biology 2e",
        url: "https://openstax.org/books/biology-2e/pages/1-introduction",
        description: "OpenStax 免费开放教材：生物学第二版",
      },
      {
        title: "MIT OCW: Introductory Biology (7.016)",
        url: "https://ocw.mit.edu/courses/7-016-introductory-biology-fall-2018/pages/syllabus/",
        description: "MIT 生物学导论 2018 版，含基因组学和细胞生物学",
      },
      {
        title: "Khan Academy: Biology",
        url: "https://www.khanacademy.org/science/biology",
        description: "可汗学院生物学全套免费课程，从细胞到生态系统",
      },
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
    openResources: [
      {
        title: "MIT OCW: Classical Mechanics (8.01SC)",
        url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/syllabus/",
        description: "MIT 经典力学课程，Walter Lewin 教授主讲",
      },
      {
        title: "MIT OCW: Electricity and Magnetism (8.02)",
        url: "https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/pages/syllabus/",
        description: "MIT 电磁学课程大纲与讲义",
      },
      {
        title: "OpenStax University Physics Vol.1-3",
        url: "https://openstax.org/subjects/science",
        description: "OpenStax 大学物理全三卷：力学、热学、电磁学、光学、近代物理",
      },
      {
        title: "The Feynman Lectures on Physics (Online)",
        url: "https://www.feynmanlectures.caltech.edu/",
        description: "费曼物理学讲义全文在线免费阅读，加州理工官方授权",
      },
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
    openResources: [
      {
        title: "OpenStax Introduction to Sociology 3e",
        url: "https://openstax.org/books/introduction-sociology-3e/pages/1-introduction",
        description: "OpenStax 社会学导论第三版，免费开放教材",
      },
      {
        title: "MIT OCW: Introduction to Sociology (17.950)",
        url: "https://ocw.mit.edu/courses/17-950-introduction-to-sociology-fall-2005/pages/syllabus/",
        description: "MIT 社会学导论课程大纲和阅读材料",
      },
      {
        title: "Yale OCW: Foundations of Modern Social Theory (SOCY 151)",
        url: "https://oyc.yale.edu/sociology/socy-151",
        description: "耶鲁大学现代社会理论基础公开课，含涂尔干、韦伯、马克思",
      },
      {
        title: "Stanford Encyclopedia: Social Science Methodology",
        url: "https://plato.stanford.edu/entries/social-science/",
        description: "斯坦福哲学百科：社会科学研究方法论",
      },
    ],
  },
  {
    id: "ai",
    name: "AI 理论基础",
    icon: "cpu",
    rssFeeds: [
      { url: "https://export.arxiv.org/rss/cs.AI", name: "ArXiv cs.AI" },
      { url: "https://export.arxiv.org/rss/cs.LG", name: "ArXiv cs.LG" },
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
    openResources: [
      {
        title: "Stanford CS229: Machine Learning (Andrew Ng)",
        url: "https://cs229.stanford.edu/syllabus-autumn2018.html",
        description: "斯坦福 CS229 机器学习课程大纲，Andrew Ng 主讲",
      },
      {
        title: "Stanford CS231n: Deep Learning for Computer Vision",
        url: "https://cs231n.stanford.edu/",
        description: "斯坦福深度学习与计算机视觉课程，含讲义和作业",
      },
      {
        title: "fast.ai: Practical Deep Learning for Coders",
        url: "https://course.fast.ai/",
        description: "fast.ai 实践深度学习课程，免费开放，含 Jupyter Notebook",
      },
      {
        title: "Deep Learning Book (Goodfellow, Bengio, Courville)",
        url: "https://www.deeplearningbook.org/",
        description: "深度学习圣经全书在线免费阅读，MIT Press 官方授权",
      },
      {
        title: "Andrej Karpathy: Neural Networks Zero to Hero",
        url: "https://karpathy.ai/zero-to-hero.html",
        description: "Karpathy（前特斯拉 AI 总监）从零手写神经网络系列课程",
      },
    ],
  },
  {
    id: "google-ai",
    name: "Google AI 动态",
    icon: "sparkles",
    rssFeeds: [
      { url: "https://blog.google/technology/ai/rss/", name: "Google AI Blog" },
      { url: "https://deepmind.google/blog/rss.xml", name: "Google DeepMind Blog" },
      { url: "https://research.google/blog/rss/", name: "Google Research Blog" },
    ],
    foundations: [
      "Gemini 系列模型：架构演进、多模态能力、与 GPT 的对比",
      "Google DeepMind：AlphaFold、AlphaStar、科学发现应用",
      "TPU 与 AI 基础设施：张量处理单元、Pathways 分布式系统",
      "Google Search AI：AI Overviews、NotebookLM、搜索增强",
      "Vertex AI 平台：企业 AI 服务、微调、部署管道",
      "Android AI 集成：Pixel 端侧推理、Google Assistant 演进",
      "Google AI 安全：负责任 AI 原则、对抗样本、安全评估",
    ],
    openResources: [
      {
        title: "Google AI Blog",
        url: "https://blog.google/technology/ai/",
        description: "Google 官方 AI 博客：最新模型发布、研究成果、产品动态",
      },
      {
        title: "Google DeepMind Research",
        url: "https://deepmind.google/research/",
        description: "DeepMind 研究主页：论文、项目和科学突破",
      },
      {
        title: "Google AI for Developers",
        url: "https://ai.google.dev/",
        description: "Google AI 开发者平台：Gemini API 文档、教程和示例",
      },
      {
        title: "Google Research Publications",
        url: "https://research.google/pubs/",
        description: "Google Research 论文库：可按主题筛选最新发表",
      },
    ],
  },
  {
    id: "anthropic-ai",
    name: "Anthropic AI 动态",
    icon: "bot",
    rssFeeds: [
      { url: "https://www.anthropic.com/rss.xml", name: "Anthropic Blog" },
      { url: "https://export.arxiv.org/rss/cs.AI", name: "ArXiv cs.AI" },
    ],
    foundations: [
      "Claude 系列模型：Haiku / Sonnet / Opus 能力边界与适用场景",
      "Constitutional AI（CAI）：规则引导的 RLHF 安全训练方法",
      "AI 安全与对齐研究：可解释性、超级对齐、红队测试",
      "Claude API 与 Artifacts：多轮对话、工具调用、代码生成",
      "Model Spec：Claude 的价值观、诚实性与边界设计",
      "Anthropic 经济影响报告：AI 对劳动力和创造性工作的影响",
      "MCP（Model Context Protocol）：工具调用标准化协议",
    ],
    openResources: [
      {
        title: "Anthropic News & Research",
        url: "https://www.anthropic.com/news",
        description: "Anthropic 官方新闻：模型发布、研究论文、公司动态",
      },
      {
        title: "Anthropic Research Papers",
        url: "https://www.anthropic.com/research",
        description: "Anthropic 研究主页：安全、对齐、可解释性论文",
      },
      {
        title: "Claude Documentation",
        url: "https://docs.anthropic.com/",
        description: "Claude API 官方文档：使用指南、工具调用、提示工程",
      },
      {
        title: "Anthropic Model Specification",
        url: "https://www.anthropic.com/claude/model-spec",
        description: "Claude 模型规范：设计原则、价值观与行为边界完整文档",
      },
    ],
  },
  {
    id: "philosophy",
    name: "哲学",
    icon: "scale",
    rssFeeds: [
      { url: "https://philpapers.org/rss/recent.rss", name: "PhilPapers" },
      { url: "https://plato.stanford.edu/rss/sep.xml", name: "Stanford Encyclopedia of Philosophy" },
    ],
    foundations: [
      "哲学研究方法：论证分析、概念厘清、思想实验",
      "形而上学：存在论、本体论、实体与属性、时间与空间",
      "认识论：知识的定义与来源、怀疑论、证成理论、真理观",
      "逻辑学：命题逻辑、谓词逻辑、有效推理与谬误",
      "伦理学：道德理论（功利主义、义务论、美德伦理）、元伦理学",
      "政治哲学：正义论、社会契约论、自由与权利、国家权威",
      "心灵哲学：身心问题、意识、意向性、功能主义",
      "语言哲学：意义理论、指称、言语行为、语言游戏",
      "科学哲学：归纳问题、科学解释、科学革命（库恩）、证伪主义（波普尔）",
      "古希腊哲学：苏格拉底、柏拉图、亚里士多德的核心思想",
      "近现代哲学：笛卡尔、休谟、康德、黑格尔、维特根斯坦",
      "中国哲学：儒家、道家、佛教哲学的核心概念",
    ],
    openResources: [
      {
        title: "Stanford Encyclopedia of Philosophy (SEP)",
        url: "https://plato.stanford.edu/",
        description: "斯坦福哲学百科全书，权威免费，几乎覆盖所有哲学主题",
      },
      {
        title: "MIT OCW: Ancient Philosophy (24.01)",
        url: "https://ocw.mit.edu/courses/24-01-classics-in-western-philosophy-spring-2006/pages/syllabus/",
        description: "MIT 西方哲学经典课程，从苏格拉底到近代",
      },
      {
        title: "Yale OCW: Death (PHIL 176, Shelly Kagan)",
        url: "https://oyc.yale.edu/philosophy/phil-176",
        description: "耶鲁大学死亡哲学公开课，Shelly Kagan 主讲，深入讨论存在意义",
      },
      {
        title: "Internet Encyclopedia of Philosophy (IEP)",
        url: "https://iep.utm.edu/",
        description: "互联网哲学百科全书，学术水准高，免费开放",
      },
    ],
  },
  {
    id: "theology",
    name: "神学",
    icon: "book-open",
    rssFeeds: [
      { url: "https://www.biblegateway.com/devotionals/morning-and-evening/feed", name: "Bible Gateway" },
      { url: "https://themelios.thegospelcoalition.org/feed/", name: "Themelios Journal" },
    ],
    foundations: [
      "神学研究方法：圣经解释学、历史批评法、系统神学、护教学",
      "圣经研究：旧约/新约概论、正典形成、文本批评、释经学",
      "上帝论：上帝的本质与属性、三位一体、上帝的存在论证",
      "创造论与宇宙论：创造神学、自然与神恩、进化与创造的关系",
      "人论：人的本质与尊严、罪论（原罪、本罪）、自由意志",
      "基督论：道成肉身、耶稣的身份与工作、救赎论、受难与复活",
      "救恩论：恩典、信心、称义、成圣、预定论",
      "教会论：教会的本质与使命、圣礼（洗礼、圣餐）、教会治理",
      "末世论：死后生命、复活、末日审判、天国",
      "宗教哲学：宗教经验、恶的问题、宗教多元主义、信仰与理性",
      "比较宗教：基督教、伊斯兰教、犹太教、佛教、印度教的核心教义",
      "历史神学：教父时期、中世纪经院哲学、宗教改革、现代神学流派",
    ],
    openResources: [
      {
        title: "Yale Divinity School: Open Yale Courses (RLST 145)",
        url: "https://oyc.yale.edu/religious-studies/rlst-145",
        description: "耶鲁大学新约圣经公开课，学术视角解读新约文本",
      },
      {
        title: "Yale OCW: Introduction to the Old Testament (RLST 145)",
        url: "https://oyc.yale.edu/religious-studies/rlst-145",
        description: "耶鲁大学旧约导论公开课，含历史与文学分析",
      },
      {
        title: "Stanford Encyclopedia: Theology and Philosophy of Religion",
        url: "https://plato.stanford.edu/entries/religion/",
        description: "斯坦福哲学百科：宗教哲学专题，含上帝论证、宗教经验等",
      },
      {
        title: "Christian Classics Ethereal Library (CCEL)",
        url: "https://www.ccel.org/",
        description: "基督教经典电子图书馆，含奥古斯丁、阿奎那等教父著作全文",
      },
    ],
  },
  {
    id: "news",
    name: "每日新闻",
    icon: "newspaper",
    rssFeeds: [
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World News" },
      { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", name: "NYT World" },
      { url: "https://feeds.apnews.com/rss/apf-topnews", name: "AP Top News" },
      { url: "https://www.theguardian.com/world/rss", name: "The Guardian World" },
    ],
    foundations: [],
    openResources: [], // 新闻无需课本资源
  },
  {
    id: "medicine",
    name: "现代医学",
    icon: "stethoscope",
    rssFeeds: [
      { url: "https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss", name: "NEJM" },
      { url: "https://www.thelancet.com/rssfeed/lancet_online.xml", name: "The Lancet" },
      { url: "https://jamanetwork.com/rss/site_3/67.xml", name: "JAMA" },
    ],
    foundations: [
      "解剖学：人体系统、器官结构、组织学基础",
      "生理学：各系统功能机制、稳态调节、生理指标",
      "病理学：疾病发生机制、炎症、肿瘤、细胞损伤",
      "药理学：药物作用机制、药代动力学、药效学",
      "微生物与免疫：细菌、病毒、真菌、免疫应答与疾病",
      "内科学：心血管、呼吸、消化、内分泌等系统常见病",
      "外科学基础：外科原则、无菌技术、手术适应症",
      "诊断学：病史采集、体格检查、实验室与影像学解读",
      "流行病学与公共卫生：疾病分布、预防策略、循证医学",
      "临床研究方法：RCT 设计、Meta 分析、NNT/NNH 解读",
    ],
    openResources: [
      {
        title: "OpenStax Anatomy and Physiology 2e",
        url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction",
        description: "OpenStax 免费开放教材：解剖与生理学第二版",
      },
      {
        title: "Khan Academy: Health and Medicine",
        url: "https://www.khanacademy.org/science/health-and-medicine",
        description: "可汗学院医学健康系列：心脏、肾脏、神经、免疫等系统深度讲解",
      },
      {
        title: "NEJM Knowledge+",
        url: "https://knowledgeplus.nejm.org/",
        description: "NEJM 知识库：临床决策支持与医学知识自测平台",
      },
      {
        title: "Cochrane Library",
        url: "https://www.cochranelibrary.com/",
        description: "Cochrane 系统评价库：循证医学最高质量证据来源",
      },
      {
        title: "WHO: Evidence-Informed Policy Networks",
        url: "https://www.who.int/evidence/resources/",
        description: "WHO 循证医学资源：全球公共卫生指南与证据汇编",
      },
    ],
  },
  {
    id: "diabetes",
    name: "糖尿病管理",
    icon: "heart-pulse",
    rssFeeds: [
      { url: "https://diabetesjournals.org/care/rss/site_1/1.xml", name: "Diabetes Care" },
      { url: "https://www.diabetesselfmanagement.com/feed/", name: "Diabetes Self-Management" },
      { url: "https://beyondtype1.org/feed/", name: "Beyond Type 1" },
    ],
    foundations: [
      "糖尿病分型：1型、2型、妊娠期糖尿病及特殊类型的区别",
      "血糖调节机制：胰岛素分泌、胰高血糖素作用、肝糖原代谢",
      "诊断标准：空腹血糖、餐后2h血糖、HbA1c、OGTT 解读",
      "饮食管理：血糖生成指数（GI）、碳水计数、地中海饮食",
      "运动疗法：有氧运动、抗阻训练对血糖的影响与注意事项",
      "药物治疗：二甲双胍、GLP-1 激动剂、SGLT-2 抑制剂、胰岛素",
      "血糖监测：自我血糖监测、动态血糖仪（CGM）、TIR 解读",
      "并发症预防：视网膜病变、肾病、神经病变、心血管风险",
      "低血糖识别与处理：症状、急救、预防策略",
      "心理与生活质量：糖尿病痛苦、自我管理支持、社会资源",
    ],
    openResources: [
      {
        title: "ADA Standards of Care in Diabetes 2024",
        url: "https://diabetesjournals.org/care/issue/47/Supplement_1",
        description: "美国糖尿病学会2024年糖尿病诊疗标准，全球最权威临床指南",
      },
      {
        title: "CDC: Diabetes Prevention Program",
        url: "https://www.cdc.gov/diabetes/prevention/index.html",
        description: "美国疾控中心糖尿病预防计划，含生活方式干预资源",
      },
      {
        title: "Diabetes UK: Learning Zone",
        url: "https://www.diabetes.org.uk/guide-to-diabetes",
        description: "英国糖尿病协会学习中心，涵盖饮食、运动、药物等实用指南",
      },
      {
        title: "NIDDK: Diabetes Information",
        url: "https://www.niddk.nih.gov/health-information/diabetes",
        description: "美国国家糖尿病、消化和肾脏疾病研究所患者教育资料",
      },
      {
        title: "IDF Diabetes Atlas",
        url: "https://diabetesatlas.org/",
        description: "国际糖尿病联合会全球数据地图，含流行病学数据与预防策略",
      },
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
    openResources: [
      {
        title: "Purdue OWL: English Grammar and Writing",
        url: "https://owl.purdue.edu/owl/general_writing/index.html",
        description: "普渡大学写作实验室：英语语法与写作指南，全球最权威免费资源",
      },
      {
        title: "BBC Learning English: Grammar",
        url: "https://www.bbc.co.uk/learningenglish/english/grammar",
        description: "BBC 英语学习语法专区，含视频讲解和练习",
      },
      {
        title: "Oxford Learner's Dictionaries: Grammar",
        url: "https://www.oxfordlearnersdictionaries.com/grammar/",
        description: "牛津学习者词典语法指南，含例句和用法说明",
      },
      {
        title: "MIT OpenCourseWare: Writing and Rhetoric",
        url: "https://ocw.mit.edu/courses/21w-035-science-writing-and-new-media-fall-2016/pages/syllabus/",
        description: "MIT 科技写作与修辞课程，提升学术英语写作能力",
      },
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
