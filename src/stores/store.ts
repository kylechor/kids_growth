import type { 
  Child, Task, DailyRecord, Reward, Redemption, AppState, Badge, TaskCategory,
  Project, GeneratedProjectTask, ProjectStory, Reminder, StudyTask, AIProjectResult,
  StudyRecord, Score, ScoreType, DailyChallenge, LevelDefinition, LevelProgress
} from '../types';
import { LEVEL_DEFINITIONS } from '../types';
import { ref } from 'vue';

const STORAGE_KEY = 'grow_points_data';

interface StorageData {
  children: Child[];
  tasks: Task[];
  records: DailyRecord[];
  rewards: Reward[];
  redemptions: Redemption[];
  badges: Badge[];
  appState: AppState;
  // AI 项目系统
  projects: Project[];
  projectTasks: GeneratedProjectTask[];
  projectStories: ProjectStory[];
  reminders: Reminder[];
  // 学习任务
  studyTasks: StudyTask[];
  studyRecords: StudyRecord[];
  scores: Score[];
  // 每日挑战
  dailyChallenges: DailyChallenge[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// 触发更新通知
const updateTrigger = ref(0);
export function notifyUpdate() {
  updateTrigger.value++;
}
export function getUpdateCount() {
  return updateTrigger.value;
}

class Store {
  private data: StorageData;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
      // 确保旧数据有新增字段
      if (!this.data.badges) this.data.badges = [];
      if (!this.data.projects) this.data.projects = [];
      if (!this.data.projectTasks) this.data.projectTasks = [];
      if (!this.data.projectStories) this.data.projectStories = [];
      if (!this.data.reminders) this.data.reminders = [];
      if (!this.data.studyTasks) this.data.studyTasks = [];
      if (!this.data.studyRecords) this.data.studyRecords = [];
      if (!this.data.scores) this.data.scores = [];
      if (!this.data.dailyChallenges) this.data.dailyChallenges = [];
      this.data.children = this.data.children.map(c => ({
        ...c,
        streakDays: c.streakDays || 0,
        maxStreakDays: c.maxStreakDays || 0,
      }));
    } else {
      this.data = {
        children: [],
        tasks: [],
        records: [],
        rewards: [],
        redemptions: [],
        badges: [],
        appState: { isPro: false, currentChildId: null },
        projects: [],
        projectTasks: [],
        projectStories: [],
        reminders: [],
        studyTasks: [],
        studyRecords: [],
        scores: [],
        dailyChallenges: [],
      };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    // 触发更新
    notifyUpdate();
  }

  // App State
  get isPro(): boolean {
    return this.data.appState.isPro;
  }

  set isPro(value: boolean) {
    this.data.appState.isPro = value;
    this.save();
  }

  unlockPro(): void {
    this.data.appState.isPro = true;
    this.save();
  }

  // Children
  getChildren(): Child[] {
    getUpdateCount(); // 触发响应式
    return this.data.children;
  }

  getChild(id: string): Child | undefined {
    getUpdateCount(); // 触发响应式
    return this.data.children.find(c => c.id === id);
  }

  getCurrentChild(): Child | undefined {
    if (!this.data.appState.currentChildId) return undefined;
    getUpdateCount(); // 触发响应式
    return this.getChild(this.data.appState.currentChildId);
  }

  setCurrentChild(id: string): void {
    this.data.appState.currentChildId = id;
    this.save();
  }

  addChild(name: string, avatar: string): Child | null {
    if (!this.data.appState.isPro && this.data.children.length >= 1) {
      return null;
    }
    const child: Child = {
      id: generateId(),
      name,
      avatar,
      createdAt: new Date().toISOString(),
      streakDays: 0,
      maxStreakDays: 0,
    };
    this.data.children.push(child);
    if (!this.data.appState.currentChildId) {
      this.data.appState.currentChildId = child.id;
    }
    this.save();
    // 授予首次使用徽章
    this.awardBadge(child.id, 'first_login');
    return child;
  }

  removeChild(id: string): void {
    this.data.children = this.data.children.filter(c => c.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.childId !== id);
    this.data.records = this.data.records.filter(r => r.childId !== id);
    this.data.redemptions = this.data.redemptions.filter(r => r.childId !== id);
    this.data.projects = this.data.projects.filter(p => p.childId !== id);
    this.data.projectTasks = this.data.projectTasks.filter(t => {
      const project = this.data.projects.find(p => p.id === t.projectId);
      return project?.childId !== id;
    });
    this.data.studyTasks = this.data.studyTasks.filter(s => s.childId !== id);
    if (this.data.appState.currentChildId === id) {
      this.data.appState.currentChildId = this.data.children[0]?.id || null;
    }
    this.save();
  }

  canAddChild(): boolean {
    getUpdateCount(); // 触发响应式
    return this.data.appState.isPro || this.data.children.length < 1;
  }

  // Tasks
  getTasks(childId: string): Task[] {
    getUpdateCount(); // 触发响应式
    return this.data.tasks.filter(t => t.childId === childId);
  }

  addTask(childId: string, name: string, points: number, deductPoints: number, icon: string, category: TaskCategory = 'other'): Task | null {
    const childTasks = this.getTasks(childId);
    if (!this.data.appState.isPro && childTasks.length >= 3) {
      return null;
    }
    const task: Task = {
      id: generateId(),
      childId,
      name,
      points,
      deductPoints,
      icon,
      category,
      frequency: 'daily',
    };
    this.data.tasks.push(task);
    this.save();
    return task;
  }

  updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'childId'>>): void {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
    }
  }

  removeTask(taskId: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.save();
  }

  canAddTask(childId: string): boolean {
    getUpdateCount(); // 触发响应式
    const childTasks = this.getTasks(childId);
    return this.data.appState.isPro || childTasks.length < 3;
  }

  // Daily Records
  getRecords(childId: string, date?: string): DailyRecord[] {
    getUpdateCount(); // 触发响应式
    return this.data.records.filter(r => {
      if (r.childId !== childId) return false;
      if (date && r.date !== date) return false;
      return true;
    });
  }

  toggleRecord(childId: string, taskId: string, completed: boolean, points: number): void {
    const today = getToday();
    const existing = this.data.records.find(r => r.childId === childId && r.taskId === taskId && r.date === today);
    
    if (existing) {
      existing.completed = completed;
      existing.points = points;
    } else {
      this.data.records.push({
        id: generateId(),
        date: today,
        childId,
        taskId,
        completed,
        points,
      });
    }
    this.save();
    
    // 检查徽章条件
    if (completed) {
      // 首次完成任务
      const hasAnyCompleted = this.data.records.some(r => r.childId === childId && r.completed);
      if (hasAnyCompleted) {
        this.awardBadge(childId, 'first_task');
      }
      
      // 检查完美一天
      this.checkPerfectDay(childId);
      
      // 检查早起达人
      const hour = new Date().getHours();
      if (hour < 8) {
        this.awardBadge(childId, 'early_bird');
      }
      
      // 检查积分徽章
      const total = this.getTotalPoints(childId);
      if (total >= 100) this.awardBadge(childId, 'points_100');
      if (total >= 500) this.awardBadge(childId, 'points_500');
      if (total >= 1000) this.awardBadge(childId, 'points_1000');
    }
    
    // 更新连续打卡天数
    this.updateStreak(childId);
  }

  // Points Calculation
  getTodayPoints(childId: string): number {
    getUpdateCount(); // 触发响应式
    const today = getToday();
    return this.data.records
      .filter(r => r.childId === childId && r.date === today)
      .reduce((sum, r) => sum + (r.completed ? r.points : -r.points + r.points), 0);
  }

  getTotalPoints(childId: string): number {
    getUpdateCount(); // 触发响应式
    const child = this.getChild(childId);
    if (!child) return 0;

    const startDate = new Date(child.createdAt);
    const today = new Date();
    let total = 0;

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = this.data.records.filter(r => r.childId === childId && r.date === dateStr);
      const tasks = this.getTasks(childId);
      
      dayRecords.forEach(r => {
        const task = tasks.find(t => t.id === r.taskId);
        if (task) {
          total += r.completed ? task.points : -task.deductPoints;
        }
      });
    }
    return total;
  }

  getPointsHistory(childId: string): { date: string; points: number }[] {
    const dates = new Set(
      this.data.records
        .filter(r => r.childId === childId)
        .map(r => r.date)
    );

    return Array.from(dates)
      .sort()
      .map(date => {
        const dayRecords = this.data.records.filter(r => r.childId === childId && r.date === date);
        const tasks = this.getTasks(childId);
        let dayPoints = 0;
        dayRecords.forEach(r => {
          const task = tasks.find(t => t.id === r.taskId);
          if (task) {
            dayPoints += r.completed ? task.points : -task.deductPoints;
          }
        });
        return { date, points: dayPoints };
      });
  }

  // 获取某月的打卡状态
  getMonthCheckins(childId: string, year: number, month: number): { date: string; completed: boolean; partial: boolean }[] {
    getUpdateCount();
    const tasks = this.getTasks(childId);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: { date: string; completed: boolean; partial: boolean }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 只显示今天及之前的数据
      if (dateStr > todayStr) {
        result.push({ date: dateStr, completed: false, partial: false });
        continue;
      }

      const dayRecords = this.data.records.filter(r => r.childId === childId && r.date === dateStr);
      const hasRecords = dayRecords.length > 0;

      if (!hasRecords || tasks.length === 0) {
        result.push({ date: dateStr, completed: false, partial: false });
        continue;
      }

      // 检查是否全部完成
      const allCompleted = tasks.every(t =>
        dayRecords.some(r => r.taskId === t.id && r.completed)
      );

      // 检查是否有部分完成
      const partial = dayRecords.some(r => r.completed);

      result.push({ date: dateStr, completed: allCompleted, partial: !allCompleted && partial });
    }

    return result;
  }

  // 获取本月打卡天数
  getMonthCheckinDays(childId: string): number {
    const today = new Date();
    const monthCheckins = this.getMonthCheckins(childId, today.getFullYear(), today.getMonth());
    return monthCheckins.filter(c => c.completed || c.partial).length;
  }

  // 获取累计记录天数
  getTotalRecordDays(childId: string): number {
    getUpdateCount();
    const dates = new Set(
      this.data.records
        .filter(r => r.childId === childId)
        .map(r => r.date)
    );
    return dates.size;
  }

  // 获取本周完成的任务数
  getWeekTaskStats(childId: string): { completed: number; total: number; points: number } {
    getUpdateCount();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    let completed = 0;
    let total = 0;
    let points = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = this.data.records.filter(r => r.childId === childId && r.date === dateStr);
      
      dayRecords.forEach(r => {
        if (r.completed) {
          completed++;
          points += r.points;
        }
        total++;
      });
    }

    return { completed, total, points };
  }

  // Rewards
  getRewards(): Reward[] {
    getUpdateCount(); // 触发响应式
    return this.data.rewards;
  }

  addReward(name: string, points: number, icon: string): void {
    this.data.rewards.push({
      id: generateId(),
      name,
      points,
      icon,
    });
    this.save();
  }

  removeReward(rewardId: string): void {
    this.data.rewards = this.data.rewards.filter(r => r.id !== rewardId);
    this.save();
  }

  // Redemptions
  getRedemptions(childId: string): Redemption[] {
    getUpdateCount(); // 触发响应式
    return this.data.redemptions.filter(r => r.childId === childId);
  }

  // Badges
  getBadges(childId: string): Badge[] {
    return this.data.badges.filter(b => b.childId === childId);
  }

  hasBadge(childId: string, type: string): boolean {
    return this.data.badges.some(b => b.childId === childId && b.type === type);
  }

  awardBadge(childId: string, type: string): void {
    if (this.hasBadge(childId, type)) return;
    this.data.badges.push({
      id: generateId(),
      childId,
      type: type as any,
      earnedAt: new Date().toISOString(),
    });
    this.save();
  }

  // Streak tracking
  updateStreak(childId: string): void {
    const child = this.getChild(childId);
    if (!child) return;

    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 检查今天的任务是否都完成了
    const tasks = this.getTasks(childId);
    const todayRecords = this.getRecords(childId, today);
    const allCompletedToday = tasks.length > 0 && tasks.every(t => 
      todayRecords.some(r => r.taskId === t.id && r.completed)
    );

    if (allCompletedToday) {
      // 检查昨天是否也完成了
      const yesterdayRecords = this.getRecords(childId, yesterdayStr);
      const completedYesterday = tasks.every(t =>
        yesterdayRecords.some(r => r.taskId === t.id && r.completed)
      );

      if (completedYesterday || child.streakDays === 0) {
        child.streakDays++;
        if (child.streakDays > child.maxStreakDays) {
          child.maxStreakDays = child.streakDays;
        }
      } else {
        child.streakDays = 1;
      }

      // 检查连续打卡徽章
      if (child.streakDays >= 3) this.awardBadge(childId, 'streak_3');
      if (child.streakDays >= 7) this.awardBadge(childId, 'streak_7');
      if (child.streakDays >= 30) this.awardBadge(childId, 'streak_30');
    }

    this.save();
  }

  getStreak(childId: string): number {
    getUpdateCount(); // 触发响应式
    const child = this.getChild(childId);
    return child?.streakDays || 0;
  }

  // Check perfect day achievement
  checkPerfectDay(childId: string): void {
    const today = getToday();
    const tasks = this.getTasks(childId);
    const todayRecords = this.getRecords(childId, today);
    
    if (tasks.length > 0 && tasks.every(t => 
      todayRecords.some(r => r.taskId === t.id && r.completed)
    )) {
      this.awardBadge(childId, 'perfect_day');
    }
  }

  // Rewards with badge
  redeemReward(childId: string, reward: Reward): boolean {
    const total = this.getTotalPoints(childId);
    if (total < reward.points) return false;

    this.data.redemptions.push({
      id: generateId(),
      childId,
      rewardId: reward.id,
      rewardName: reward.name,
      points: reward.points,
      redeemedAt: new Date().toISOString(),
    });
    this.save();
    
    // 首次兑换徽章
    if (this.data.redemptions.filter(r => r.childId === childId).length === 1) {
      this.awardBadge(childId, 'rewards_1');
    }
    
    return true;
  }

  // ============== Project Methods ==============
  
  getProjects(childId: string): Project[] {
    getUpdateCount();
    return this.data.projects.filter(p => p.childId === childId);
  }

  getActiveProjects(childId: string): Project[] {
    getUpdateCount();
    return this.data.projects.filter(p => p.childId === childId && p.status === 'active');
  }

  getProjectById(projectId: string): Project | undefined {
    getUpdateCount();
    return this.data.projects.find(p => p.id === projectId);
  }

  addProject(childId: string, aiResult: AIProjectResult): Project {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + aiResult.duration);

    const project: Project = {
      id: generateId(),
      childId,
      name: aiResult.name,
      icon: aiResult.icon,
      description: aiResult.description,
      duration: aiResult.duration,
      difficulty: aiResult.difficulty,
      rewardPoints: aiResult.rewardPoints,
      vision: aiResult.vision,
      finalProduct: aiResult.finalProduct || '',
      realWorldConnection: aiResult.realWorldConnection || '',
      status: 'active',
      currentStep: 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.data.projects.push(project);
    this.save();
    return project;
  }

  updateProject(projectId: string, updates: Partial<Omit<Project, 'id' | 'childId'>>): void {
    const project = this.data.projects.find(p => p.id === projectId);
    if (project) {
      Object.assign(project, updates);
      this.save();
    }
  }

  deleteProject(projectId: string): void {
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);
    this.data.projectTasks = this.data.projectTasks.filter(t => t.projectId !== projectId);
    this.data.projectStories = this.data.projectStories.filter(s => s.projectId !== projectId);
    this.data.reminders = this.data.reminders.filter(r => r.projectId !== projectId);
    this.save();
  }

  getProjectDay(projectId: string): number {
    const project = this.getProjectById(projectId);
    if (!project) return 0;
    
    const start = new Date(project.startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff + 1, project.duration);
  }

  // ============== Project Task Methods ==============

  getProjectTasks(projectId: string): GeneratedProjectTask[] {
    getUpdateCount();
    return this.data.projectTasks.filter(t => t.projectId === projectId);
  }

  getProjectTasksByDay(projectId: string, day: number): GeneratedProjectTask[] {
    getUpdateCount();
    return this.data.projectTasks.filter(t => t.projectId === projectId && t.day === day);
  }

  getTodayProjectTasks(projectId: string): GeneratedProjectTask[] {
    const day = this.getProjectDay(projectId);
    return this.getProjectTasksByDay(projectId, day);
  }

  addProjectTask(projectId: string, stepNumber: number, day: number, title: string, 
    description: string, duration: string, tip: string, type: 'explore' | 'act' | 'reflect' | 'create' | 'share',
    skillsTrained?: string[], deliverable?: string): GeneratedProjectTask {
    const task: GeneratedProjectTask = {
      id: generateId(),
      projectId,
      stepNumber,
      day,
      title,
      description,
      duration,
      tip,
      type,
      skillsTrained,
      deliverable,
      status: 'pending',
    };
    this.data.projectTasks.push(task);
    this.save();
    return task;
  }

  addProjectTasks(projectId: string, steps: AIProjectResult['steps']): void {
    steps.forEach(step => {
      step.tasks.forEach(task => {
        this.addProjectTask(
          projectId,
          step.stepNumber,
          task.day,
          task.title,
          task.description,
          task.duration,
          task.tip,
          task.type,
          task.skillsTrained,
          task.deliverable
        );
      });
    });
  }

  updateProjectTask(taskId: string, updates: Partial<Omit<GeneratedProjectTask, 'id' | 'projectId'>>): void {
    const task = this.data.projectTasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
    }
  }

  deleteProjectTask(taskId: string): void {
    this.data.projectTasks = this.data.projectTasks.filter(t => t.id !== taskId);
    this.save();
  }

  completeProjectTask(taskId: string, note?: string): void {
    const task = this.data.projectTasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      if (note) task.note = note;
      this.save();
    }
  }

  // ============== Project Story Methods ==============

  getProjectStory(projectId: string): ProjectStory | undefined {
    getUpdateCount();
    return this.data.projectStories.find(s => s.projectId === projectId);
  }

  createProjectStory(projectId: string, vision: string, stepSummaries: { stepNumber: number; title: string; celebration: string }[]): ProjectStory {
    const story: ProjectStory = {
      id: generateId(),
      projectId,
      vision,
      dailyLogs: [],
      stepSummaries: stepSummaries.map(s => ({ ...s, completed: false })),
      createdAt: new Date().toISOString(),
    };
    this.data.projectStories.push(story);
    this.save();
    return story;
  }

  addDailyLog(projectId: string, day: number, taskTitle: string, completed: boolean, note?: string): void {
    let story = this.getProjectStory(projectId);
    if (!story) return;

    story.dailyLogs.push({
      id: generateId(),
      day,
      taskTitle,
      completed,
      note,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }

  updateStepSummary(projectId: string, stepNumber: number, summary: string): void {
    const story = this.getProjectStory(projectId);
    if (!story) return;

    const stepSummary = story.stepSummaries.find(s => s.stepNumber === stepNumber);
    if (stepSummary) {
      stepSummary.summary = summary;
      stepSummary.completed = true;
      this.save();
    }
  }

  setCompletedStory(projectId: string, completedStory: string): void {
    const story = this.getProjectStory(projectId);
    if (story) {
      story.completedStory = completedStory;
      this.save();
    }
  }

  // ============== Reminder Methods ==============

  getReminders(projectId?: string): Reminder[] {
    getUpdateCount();
    if (projectId) {
      return this.data.reminders.filter(r => r.projectId === projectId);
    }
    return this.data.reminders;
  }

  getDueReminders(): Reminder[] {
    getUpdateCount();
    const now = new Date().toISOString();
    return this.data.reminders.filter(r => !r.triggered && r.triggerTime <= now);
  }

  addReminder(projectId: string, type: Reminder['type'], title: string, message: string, triggerTime: string): Reminder {
    const reminder: Reminder = {
      id: generateId(),
      projectId,
      type,
      title,
      message,
      triggerTime,
      triggered: false,
    };
    this.data.reminders.push(reminder);
    this.save();
    return reminder;
  }

  triggerReminder(reminderId: string): void {
    const reminder = this.data.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.triggered = true;
      reminder.triggeredAt = new Date().toISOString();
      this.save();
    }
  }

  deleteProjectReminders(projectId: string): void {
    this.data.reminders = this.data.reminders.filter(r => r.projectId !== projectId);
    this.save();
  }

  checkAndSendReminders(): Reminder[] {
    const due = this.getDueReminders();
    // 在这里可以实现浏览器通知
    return due;
  }

  // ============== Study Task Methods ==============

  getStudyTasks(childId: string): StudyTask[] {
    getUpdateCount();
    return this.data.studyTasks.filter(t => t.childId === childId);
  }

  getActiveStudyTask(childId: string): StudyTask | undefined {
    getUpdateCount();
    return this.data.studyTasks.find(t => t.childId === childId && (t.status === 'in_progress' || t.status === 'paused'));
  }

  addStudyTask(childId: string, name: string, subject: string, scheduledTime?: string, 
    estimatedMinutes: number = 30, timerMode: StudyTask['timerMode'] = 'none',
    countdownMinutes?: number, totalPomodoros?: number): StudyTask {
    const studyTask: StudyTask = {
      id: generateId(),
      childId,
      name,
      subject,
      scheduledTime,
      estimatedMinutes,
      ebbinghaus: {
        enabled: false,
        intervals: [],
        reviews: [],
      },
      timerMode,
      countdownMinutes,
      totalPomodoros,
      status: 'pending',
    };
    this.data.studyTasks.push(studyTask);
    this.save();
    return studyTask;
  }

  updateStudyTask(taskId: string, updates: Partial<Omit<StudyTask, 'id' | 'childId'>>): void {
    const task = this.data.studyTasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
    }
  }

  deleteStudyTask(taskId: string): void {
    this.data.studyTasks = this.data.studyTasks.filter(t => t.id !== taskId);
    this.save();
  }

  completeStudyTask(taskId: string, actualMinutes?: number, totalSeconds?: number): void {
    const task = this.data.studyTasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      if (actualMinutes !== undefined) task.actualMinutes = actualMinutes;
      if (totalSeconds !== undefined) task.totalSeconds = totalSeconds;
      this.save();
    }
  }

  startStudyTask(taskId: string): void {
    // 确保只有一个任务在运行
    const task = this.data.studyTasks.find(t => t.id === taskId);
    if (!task) return;

    // 停止其他正在运行的任务
    this.data.studyTasks.forEach(t => {
      if (t.childId === task.childId && (t.status === 'in_progress' || t.status === 'paused')) {
        t.status = 'paused';
      }
    });

    task.status = 'in_progress';
    task.startedAt = new Date().toISOString();
    this.save();
  }

  pauseStudyTask(taskId: string): void {
    const task = this.data.studyTasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'paused';
      this.save();
    }
  }

  getDueReviews(childId: string): { task: StudyTask; dueDate: string }[] {
    const today = getToday();
    const studyTasks = this.getStudyTasks(childId);
    const dueReviews: { task: StudyTask; dueDate: string }[] = [];

    studyTasks.forEach(task => {
      if (task.ebbinghaus.enabled) {
        task.ebbinghaus.reviews.forEach(review => {
          if (!review.completed && review.dueDate <= today) {
            dueReviews.push({ task, dueDate: review.dueDate });
          }
        });
      }
    });

    return dueReviews.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  completeReview(taskId: string, reviewIndex: number): void {
    const task = this.data.studyTasks.find(t => t.id === taskId);
    if (task && task.ebbinghaus.reviews[reviewIndex]) {
      task.ebbinghaus.reviews[reviewIndex].completed = true;
      task.ebbinghaus.reviews[reviewIndex].completedAt = new Date().toISOString();
      this.save();
    }
  }

  // ============== Study Records Methods ==============

  getStudyRecords(childId: string, date?: string): StudyRecord[] {
    getUpdateCount();
    return this.data.studyRecords
      .filter(r => {
        if (r.childId !== childId) return false;
        if (date && r.date !== date) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addStudyRecord(childId: string, taskId: string, taskName: string, subject: string, 
    duration: number, completed: boolean): StudyRecord {
    const record: StudyRecord = {
      id: generateId(),
      childId,
      taskId,
      taskName,
      subject,
      date: getToday(),
      duration,
      completed,
      createdAt: new Date().toISOString(),
    };
    this.data.studyRecords.push(record);
    this.save();
    return record;
  }

  getStudyStats(childId: string): { 
    totalMinutes: number; 
    todayMinutes: number; 
    weekMinutes: number; 
    bySubject: Record<string, number>;
  } {
    const records = this.getStudyRecords(childId);
    const today = getToday();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let totalMinutes = 0;
    let todayMinutes = 0;
    let weekMinutes = 0;
    const bySubject: Record<string, number> = {};

    records.forEach(r => {
      totalMinutes += r.duration;
      if (r.date === today) todayMinutes += r.duration;
      if (new Date(r.date) >= weekAgo) weekMinutes += r.duration;
      
      if (!bySubject[r.subject]) bySubject[r.subject] = 0;
      bySubject[r.subject] += r.duration;
    });

    return { totalMinutes, todayMinutes, weekMinutes, bySubject };
  }

  getDailyStudyMinutes(childId: string, days: number = 30): { date: string; minutes: number }[] {
    const result: { date: string; minutes: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = this.data.studyRecords.filter(r => r.childId === childId && r.date === dateStr);
      const minutes = dayRecords.reduce((sum, r) => sum + r.duration, 0);
      
      result.push({ date: dateStr, minutes });
    }

    return result;
  }

  // ============== Score Methods ==============

  getScores(childId: string, subject?: string): Score[] {
    getUpdateCount();
    let scores = this.data.scores.filter(s => s.childId === childId);
    if (subject) {
      scores = scores.filter(s => s.subject === subject);
    }
    return scores.sort((a, b) => b.date.localeCompare(a.date));
  }

  addScore(childId: string, subject: string, type: ScoreType, name: string, 
    score: number, fullScore: number, date: string, note?: string): Score {
    const newScore: Score = {
      id: generateId(),
      childId,
      subject,
      type,
      name,
      score,
      fullScore,
      date,
      note,
      createdAt: new Date().toISOString(),
    };
    this.data.scores.push(newScore);
    this.save();
    return newScore;
  }

  updateScore(scoreId: string, updates: Partial<Omit<Score, 'id' | 'childId'>>): void {
    const score = this.data.scores.find(s => s.id === scoreId);
    if (score) {
      Object.assign(score, updates);
      this.save();
    }
  }

  deleteScore(scoreId: string): void {
    this.data.scores = this.data.scores.filter(s => s.id !== scoreId);
    this.save();
  }

  getScoreTrend(childId: string, subject: string): { date: string; percentage: number }[] {
    const scores = this.getScores(childId, subject)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return scores.map(s => ({
      date: s.date,
      percentage: Math.round((s.score / s.fullScore) * 100),
    }));
  }

  // ============== Level System Methods ==============

  getLevelProgress(childId: string): LevelProgress {
    const totalPoints = this.getTotalPoints(childId);
    
    // 找到当前等级
    let currentLevel = LEVEL_DEFINITIONS[0];
    for (const level of LEVEL_DEFINITIONS) {
      if (totalPoints >= level.minPoints) {
        currentLevel = level;
      } else {
        break;
      }
    }
    
    const pointsInLevel = totalPoints - currentLevel.minPoints;
    const pointsNeeded = currentLevel.maxPoints === Infinity ? 0 : currentLevel.maxPoints - currentLevel.minPoints;
    const progressPercent = pointsNeeded > 0 ? Math.round((pointsInLevel / pointsNeeded) * 100) : 100;
    const pointsToNextLevel = currentLevel.maxPoints === Infinity ? 0 : currentLevel.maxPoints - totalPoints;
    
    return {
      currentLevel: currentLevel.level,
      currentPoints: totalPoints,
      pointsToNextLevel,
      progressPercent,
    };
  }

  getLevelInfo(childId: string): LevelDefinition {
    const progress = this.getLevelProgress(childId);
    return LEVEL_DEFINITIONS.find(l => l.level === progress.currentLevel) || LEVEL_DEFINITIONS[0];
  }

  // ============== Daily Challenge Methods ==============

  getDailyChallenges(childId: string, date?: string): DailyChallenge[] {
    getUpdateCount();
    const targetDate = date || getToday();
    return this.data.dailyChallenges
      .filter(c => c.childId === childId && c.date === targetDate)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.rewardPoints - a.rewardPoints;
      });
  }

  generateDailyChallenges(childId: string): DailyChallenge[] {
    const today = getToday();
    
    // 检查今天是否已经有挑战
    const existingChallenges = this.getDailyChallenges(childId, today);
    if (existingChallenges.length > 0) {
      return existingChallenges;
    }
    
    // 生成3个随机挑战
    const challengeTemplates = [
      { type: 'quick' as const, title: '快速行动', description: '在10分钟内完成一项小任务', targetValue: 1, rewardPoints: 5 },
      { type: 'study' as const, title: '学习达人', description: '完成30分钟的学习', targetValue: 30, rewardPoints: 15 },
      { type: 'exercise' as const, title: '运动一刻', description: '进行15分钟的运动', targetValue: 15, rewardPoints: 10 },
      { type: 'creative' as const, title: '创意时刻', description: '完成一项创意任务', targetValue: 1, rewardPoints: 8 },
      { type: 'social' as const, title: '协作小帮手', description: '帮助家人做一件事', targetValue: 1, rewardPoints: 5 },
      { type: 'study' as const, title: '阅读时间', description: '阅读书籍15分钟', targetValue: 15, rewardPoints: 8 },
      { type: 'quick' as const, title: '整洁小能手', description: '整理好自己的书桌', targetValue: 1, rewardPoints: 5 },
      { type: 'exercise' as const, title: '户外探险', description: '到户外活动20分钟', targetValue: 20, rewardPoints: 12 },
    ];
    
    // 随机选择3个不重复的挑战
    const shuffled = [...challengeTemplates].sort(() => Math.random() - 0.5);
    const selectedChallenges = shuffled.slice(0, 3);
    
    const newChallenges: DailyChallenge[] = selectedChallenges.map(template => ({
      id: generateId(),
      childId,
      date: today,
      type: template.type,
      title: template.title,
      description: template.description,
      targetValue: template.targetValue,
      currentValue: 0,
      rewardPoints: template.rewardPoints,
      completed: false,
      createdAt: new Date().toISOString(),
    }));
    
    this.data.dailyChallenges.push(...newChallenges);
    this.save();
    
    return newChallenges;
  }

  updateChallengeProgress(challengeId: string, value: number): void {
    const challenge = this.data.dailyChallenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.currentValue = value;
      if (challenge.currentValue >= challenge.targetValue) {
        challenge.completed = true;
        // 奖励积分
        this.toggleRecord(challenge.childId, 'challenge_' + challenge.id, true, challenge.rewardPoints);
      }
      this.save();
    }
  }

  getTodayCompletedChallenges(childId: string): number {
    const today = getToday();
    return this.data.dailyChallenges.filter(c => 
      c.childId === childId && c.date === today && c.completed
    ).length;
  }

  // Reset
  resetAll(): void {
    this.data = {
      children: [],
      tasks: [],
      records: [],
      rewards: [],
      redemptions: [],
      badges: [],
      appState: { isPro: false, currentChildId: null },
      projects: [],
      projectTasks: [],
      projectStories: [],
      reminders: [],
      studyTasks: [],
      studyRecords: [],
      scores: [],
      dailyChallenges: [],
    };
    this.save();
  }
}

export const store = new Store();
