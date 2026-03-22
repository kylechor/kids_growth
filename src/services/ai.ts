import type { AIProjectResult, TaskCategory, TaskFrequency } from '../types';

// AI 服务配置
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_KEY = import.meta.env.VITE_BIGMODEL_API_KEY || '464443b4b88d413ab49331e7116260d9.Id4ZNKwCrVtfZXG6';

// 错误状态
export interface AIError {
  type: 'no_api_key' | 'api_error' | 'parse_error';
  message: string;
}

// 生成的单个任务
export interface AIGeneratedTask {
  name: string;
  icon: string;
  points: number;
  deductPoints: number;
  category: TaskCategory;
  frequency: TaskFrequency;
}

// AI 任务生成结果
export interface AITaskResult {
  success: boolean;
  tasks?: AIGeneratedTask[];
  error?: AIError;
}

// AI 生成的学习任务
export interface AIStudyTask {
  name: string;
  subject: string;
  estimatedMinutes: number;
  timerMode: 'none' | 'stopwatch' | 'countdown' | 'pomodoro';
  countdownMinutes?: number;
  totalPomodoros?: number;
  tip?: string;
}

// AI 学习任务生成结果
export interface AIStudyTaskResult {
  success: boolean;
  tasks?: AIStudyTask[];
  error?: AIError;
}

// 任务生成系统提示词
const TASK_SYSTEM_PROMPT = `你是一个儿童成长任务设计专家，帮助家长为孩子设计合适的日常任务。

请根据用户输入的目标或需求，生成3个适合孩子的日常任务。

输出格式必须是有效的JSON，包含一个tasks数组：
{
  "tasks": [
    {
      "name": "任务名称（如：整理书包）",
      "icon": "emoji图标（如：🎒）",
      "points": 完成奖励积分（5-15之间）,
      "deductPoints": 未完成扣分（2-8之间）,
      "category": "任务分类（study/life/exercise/other）",
      "frequency": "执行频率（once单次/daily每天/weekly每周）"
    }
  ]
}

分类说明：
- study: 学习类任务（作业、阅读、学习等）
- life: 生活类任务（起床、睡觉、整理等）
- exercise: 运动类任务（跑步、球类、运动等）
- other: 其他类任务

频率建议：
- daily（每天）: 需要养成习惯的任务，如按时起床、整理房间
- weekly（每周）: 周期性的任务，如周末大扫除、每周阅读
- once（单次）: 一次性完成的任务，如完成手抄报

重要要求：
1. 任务要具体、可执行，适合孩子年龄
2. 积分设置要合理：加分5-15，扣分2-8
3. 图标要直观反映任务内容
4. 只需生成3个任务，覆盖不同类型
5. 频率选择要符合任务性质`;

// 学习任务生成系统提示词
const STUDY_TASK_SYSTEM_PROMPT = `你是一位资深儿童学习顾问，帮助家长为孩子设计合适的学习任务和计划。

请根据用户输入的目标或需求，生成3-5个适合孩子的学习任务。

输出格式必须是有效的JSON：
{
  "tasks": [
    {
      "name": "任务名称（如：数学乘法练习）",
      "subject": "科目（语文/数学/英语/科学/其他）",
      "estimatedMinutes": 建议学习时长（15-60之间）,
      "timerMode": "计时模式（none无/stopwatch正计时/countdown倒计时/pomodoro番茄钟）",
      "countdownMinutes": 倒计时分钟数（timerMode为countdown时必填）,
      "totalPomodoros": 番茄钟数量（timerMode为pomodoro时必填，2-4之间）,
      "tip": "学习小贴士或提示"
    }
  ]
}

计时模式说明：
- none（无计时）：适合阅读、手工等活动
- stopwatch（正计时）：适合探索性学习，记录总时长
- countdown（倒计时）：适合限时练习，如30分钟数学题
- pomodoro（番茄钟）：适合需要专注的学习，25分钟专注+5分钟休息

科目分类：
- 语文：阅读、写作、拼音、识字、古诗背诵
- 数学：计算、应用题、思维训练
- 英语：单词、口语、阅读、听力
- 科学：自然实验、科学知识、探索
- 其他：手工、绘画、音乐等

重要要求：
1. 任务要具体可执行，适合孩子年龄
2. 建议时长要合理：15-60分钟
3. 计时模式要符合任务性质
4. 生成3-5个任务，覆盖不同学习内容
5. 每个任务要有实用的小贴士`;

// 项目生成系统提示词 - PBL项目制学习
const PROJECT_SYSTEM_PROMPT = `你是一位资深PBL（项目制学习）教育专家，精通设计激发孩子真实能力成长的项目。

## PBL核心原则
1. **真实性**：解决真实世界的问题，与孩子生活相关
2. **探究性**：孩子主动探索、提问、寻找答案
3. **协作性**：与他人合作，学会沟通和分工
4. **创造性**：产出独特作品，展示个人思考
5. **反思性**：定期反思学习过程，总结收获

## 能力维度分类
- 核心素养：批判性思维、问题解决、创造力
- 执行功能：时间管理、自律、专注力
- 社会情感：沟通、合作、同理心、责任意识
- 学习方法：信息检索、笔记整理、复盘总结

请根据用户输入的能力培养目标，生成一个真正的PBL项目规划。

输出格式必须是有效的JSON：
{
  "name": "项目名称（带emoji图标，如'🏠 家庭节能计划'）",
  "description": "一句话描述项目要解决的真实问题",
  "duration": 项目总天数,
  "difficulty": 难度1-5,
  "icon": "项目图标emoji",
  "rewardPoints": 完成奖励积分,
  "vision": "给孩子看的愿景（用孩子的语言，激励人心）",
  "finalProduct": "最终作品描述（如：制作一份家庭节能手册/拍摄一个科普视频/完成一件手工作品）",
  "realWorldConnection": "这个项目如何连接真实世界（如：帮助家庭省电/为社区做贡献/解决一个实际问题）",
  "steps": [
    {
      "stepNumber": 阶段编号,
      "name": "阶段名称（如：发现问题/调研探索/动手实践/展示分享）",
      "description": "阶段核心目标",
      "startDay": 开始天数,
      "endDay": 结束天数,
      "celebration": "阶段完成庆祝语",
      "phases": ["探究阶段", "行动阶段", "反思阶段"],
      "tasks": [
        {
          "day": 任务所在天数,
          "title": "任务标题",
          "description": "详细的任务描述（代入孩子第一人称，如'我需要去采访家人，了解我们家每月用电情况'）",
          "duration": "建议时长",
          "tip": "小贴士或引导问题",
          "type": "任务类型：explore(探究)、act(行动)、reflect(反思)、create(创作)、share(分享)",
          "skillsTrained": ["培养的能力点，如：沟通能力/数据收集/批判性思维"],
          "deliverable": "当日产出（如：记录3个发现/画出思维导图/完成草图）"
        }
      ]
    }
  ]
}

## 重要要求
1. **项目必须有真实问题**：不是虚拟场景，而是孩子身边真实存在的问题
2. **每日任务有产出**：每天都有可见的成果，不是空洞的"学习"
3. **任务用第一人称**：'我'要做什么，而不是'学习什么'
4. **能力点要具体**：明确写出培养什么能力
5. **有最终作品**：项目结束时有可以展示的成果
6. **鼓励反思**：定期安排"我学到了什么"的反思环节
7. **任务之间有逻辑**：前后任务有递进关系，不是随机排列`;

class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEY;
  }

  async generateProject(goal: string, duration: number): Promise<AIProjectResult & { error?: AIError }> {
    if (!this.apiKey) {
      return {
        ...this.getMockProject(goal, duration),
        error: {
          type: 'no_api_key',
          message: '请先配置 API Key 才能使用 AI 功能'
        }
      };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4.7-flash',
          messages: [
            { role: 'system', content: PROJECT_SYSTEM_PROMPT },
            { role: 'user', content: `请为孩子设计一个培养"${goal}"能力的成长项目，时长${duration}天。请生成详细的任务计划。` }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            ...this.getMockProject(goal, duration),
            error: {
              type: 'api_error',
              message: 'API Key 已过期或无效，请检查配置'
            }
          };
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in response');
      }

      // 尝试解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AIProjectResult;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('AI generation failed:', error);
      return {
        ...this.getMockProject(goal, duration),
        error: {
          type: 'api_error',
          message: '生成失败，请检查网络或 API 配置'
        }
      };
    }
  }

  // 生成推荐任务
  async generateTasks(goal: string): Promise<AITaskResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: {
          type: 'no_api_key',
          message: '请先配置 API Key 才能使用 AI 功能'
        }
      };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4.7-flash',
          messages: [
            { role: 'system', content: TASK_SYSTEM_PROMPT },
            { role: 'user', content: `请为孩子设计日常任务，目标：${goal}` }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: {
              type: 'api_error',
              message: 'API Key 已过期或无效，请在设置中更新'
            }
          };
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in response');
      }

      // 尝试解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          tasks: result.tasks as AIGeneratedTask[]
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('AI task generation failed:', error);
      return {
        success: false,
        error: {
          type: 'api_error',
          message: '生成失败，请检查网络或 API 配置'
        }
      };
    }
  }

  // 检查 API Key 是否有效
  checkApiKey(): boolean {
    return !!this.apiKey;
  }

  // 生成学习任务
  async generateStudyTasks(goal: string): Promise<AIStudyTaskResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: {
          type: 'no_api_key',
          message: '请先配置 API Key 才能使用 AI 功能'
        }
      };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4.7-flash',
          messages: [
            { role: 'system', content: STUDY_TASK_SYSTEM_PROMPT },
            { role: 'user', content: `请为孩子设计学习任务，目标：${goal}` }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: {
              type: 'api_error',
              message: 'API Key 已过期或无效，请在设置中更新'
            }
          };
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in response');
      }

      // 尝试解析JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          tasks: result.tasks as AIStudyTask[]
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('AI study task generation failed:', error);
      return {
        success: false,
        error: {
          type: 'api_error',
          message: '生成失败，请检查网络或 API 配置'
        }
      };
    }
  }

  // 生成示例学习任务
  getMockStudyTasks(_goal: string): AIStudyTask[] {
    const subjects = ['语文', '数学', '英语', '科学'];
    const tasks: AIStudyTask[] = [];
    
    for (let i = 0; i < 3; i++) {
      const subject = subjects[i % subjects.length];
      const timerModes: Array<'none' | 'stopwatch' | 'countdown' | 'pomodoro'> = ['stopwatch', 'countdown', 'pomodoro'];
      const mode = timerModes[i % timerModes.length];
      
      tasks.push({
        name: this.getMockStudyTaskName(subject, _goal, i),
        subject,
        estimatedMinutes: 20 + i * 10,
        timerMode: mode,
        countdownMinutes: mode === 'countdown' ? 25 : undefined,
        totalPomodoros: mode === 'pomodoro' ? 3 : undefined,
        tip: this.getMockStudyTip(subject),
      });
    }
    
    return tasks;
  }

  private getMockStudyTaskName(subject: string, _goal: string, index: number): string {
    const names: Record<string, string[]> = {
      '语文': ['阅读理解练习', '生字词默写', '作文片段练习'],
      '数学': ['口算能力训练', '应用题分析', '几何图形认知'],
      '英语': ['单词拼写练习', '口语对话练习', '阅读理解'],
      '科学': ['自然观察记录', '简单科学实验', '科学知识探索'],
    };
    const subjectNames = names[subject] || ['学习任务'];
    return subjectNames[index % subjectNames.length];
  }

  private getMockStudyTip(subject: string): string {
    const tips: Record<string, string> = {
      '语文': '💡 阅读时试着用自己的话复述内容',
      '数学': '💡 先读懂题目，再动笔计算',
      '英语': '💡 试着用英语描述你的房间',
      '科学': '💡 仔细观察，记录你发现的细节',
    };
    return tips[subject] || '💡 认真专注，高效学习';
  }

  // 生成示例项目（用于测试）
  private getMockProject(goal: string, duration: number): AIProjectResult {
    const icon = this.getGoalIcon(goal);
    const stepsCount = Math.min(Math.ceil(duration / 7), 4);
    const daysPerStep = Math.ceil(duration / stepsCount);
    
    const steps = [];
    const goalName = this.extractGoalName(goal);
    
    for (let i = 0; i < stepsCount; i++) {
      const startDay = i * daysPerStep + 1;
      const endDay = Math.min((i + 1) * daysPerStep, duration);
      const tasks = [];
      
      for (let day = startDay; day <= endDay; day++) {
        const taskTypes: Array<'explore' | 'act' | 'reflect' | 'create' | 'share'> = ['explore', 'act', 'reflect', 'create', 'share'];
        const taskType = taskTypes[day % 5];
        
        tasks.push({
          day,
          title: this.getMockTaskTitle(goalName, day, taskType),
          description: this.getMockTaskDescription(goalName, day, taskType),
          duration: `${10 + (day % 3) * 5}分钟`,
          tip: this.getMockTip(goalName, taskType),
          type: taskType,
        });
      }

      steps.push({
        stepNumber: i + 1,
        name: this.getStepName(goalName, i + 1),
        description: `学习${goalName}的基础知识和技能`,
        startDay,
        endDay,
        celebration: this.getCelebration(i + 1),
        tasks,
      });
    }

    return {
      name: `${icon} ${goalName}小达人`,
      description: `通过${duration}天的学习，掌握${goalName}技能`,
      duration,
      difficulty: Math.min(Math.ceil(duration / 7), 5),
      icon,
      rewardPoints: Math.round(duration * 10),
      vision: `通过${duration}天的努力，你将成为${goalName}小达人！每一步都是在向目标前进，相信自己！`,
      finalProduct: `完成一份${goalName}学习手册，包含我的探索记录和创意作品`,
      realWorldConnection: `将学到的${goalName}技能应用到日常生活中，帮助家人或朋友`,
      steps,
    };
  }

  private getGoalIcon(goal: string): string {
    const goalLower = goal.toLowerCase();
    if (goalLower.includes('时间')) return '⏰';
    if (goalLower.includes('阅读') || goalLower.includes('读书')) return '📚';
    if (goalLower.includes('早起') || goalLower.includes('作息')) return '🌅';
    if (goalLower.includes('运动') || goalLower.includes('体育')) return '🏃';
    if (goalLower.includes('绘画') || goalLower.includes('美术')) return '🎨';
    if (goalLower.includes('音乐') || goalLower.includes('乐器')) return '🎵';
    if (goalLower.includes('数学')) return '🔢';
    if (goalLower.includes('英语') || goalLower.includes('外语')) return '🌍';
    if (goalLower.includes('整理') || goalLower.includes('收纳')) return '🧹';
    if (goalLower.includes('写字') || goalLower.includes('书法')) return '✏️';
    return '⭐';
  }

  private extractGoalName(goal: string): string {
    const cleaned = goal.replace(/培养|学习|掌握|提高|养成/g, '').trim();
    return cleaned.substring(0, 10);
  }

  private getStepName(goal: string, step: number): string {
    const stepNames = ['认识', '基础', '进阶', '熟练', '精通'];
    const stepName = stepNames[Math.min(step - 1, stepNames.length - 1)];
    return `${stepName}${goal}`;
  }

  private getMockTaskTitle(goal: string, day: number, type: string): string {
    const titles: Record<string, string[]> = {
      study: [`了解${goal}是什么`, `学习${goal}的基本概念`, `深入学习${goal}知识`],
      practice: [`练习${goal}的基础动作`, `巩固${goal}技能`, `实战练习${goal}`],
      review: [`回顾今天学的${goal}`, `检查${goal}掌握情况`, `复习${goal}重点`],
      creative: [`用${goal}做个小作品`, `发挥创意运用${goal}`, `创作${goal}小故事`],
    };
    const typeTitles = titles[type] || titles.study;
    return typeTitles[day % typeTitles.length];
  }

  private getMockTaskDescription(goal: string, day: number, type: string): string {
    const descriptions: Record<string, string[]> = {
      study: [
        `和爸爸妈妈一起查阅资料，了解什么是${goal}，它有什么好处？`,
        `观看${goal}相关的视频或图片，记录3个最重要的知识点`,
        `阅读${goal}相关的绘本或文章，回答：${goal}对我们的生活有什么帮助？`,
      ],
      practice: [
        `找一项和${goal}相关的简单活动，和家人一起尝试做5分钟`,
        `今天设定一个小目标，比如${goal}练习10分钟，完成后给自己贴个小星星`,
        `把${goal}融入到日常活动中，比如早上起床后或睡前`,
      ],
      review: [
        `和爸爸妈妈分享：今天学到的关于${goal}最重要的一件事是什么？`,
        `画出${goal}的思维导图，看看自己能想到多少相关的内容`,
        `用自己的话说一说：${goal}是什么？为什么要学习它？`,
      ],
      creative: [
        `用画画或手工的方式，制作一张关于${goal}的海报`,
        `编一个小故事，主人公通过${goal}解决了什么问题？`,
        `创作一首关于${goal}的小歌谣或顺口溜`,
      ],
    };
    const typeDescriptions = descriptions[type] || descriptions.study;
    return typeDescriptions[day % typeDescriptions.length];
  }

  private getMockTip(_goal: string, _type: string): string {
    const tips = [
      '💡 可以把学到的东西画下来哦',
      '💡 完成后别忘了给自己一个大拇指！',
      '💡 如果遇到困难，可以请爸爸妈妈帮忙',
      '💡 每天进步一点点，坚持就是胜利！',
      '💡 完成后可以和家人分享你的收获',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  private getCelebration(step: number): string {
    const celebrations = [
      '🎉 太棒了！你已经迈出了第一步！继续加油！',
      '🎉 第一阶段完成！你学到了很多基础知识！',
      '🎉 太厉害了！你已经掌握了很多技能！',
      '🎉 你是最棒的！继续保持！',
    ];
    return celebrations[Math.min(step - 1, celebrations.length - 1)];
  }
}

export const aiService = new AIService();
