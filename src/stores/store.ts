import type { Child, Task, DailyRecord, Reward, Redemption, AppState, Badge, TaskCategory } from '../types';

const STORAGE_KEY = 'grow_points_data';

interface StorageData {
  children: Child[];
  tasks: Task[];
  records: DailyRecord[];
  rewards: Reward[];
  redemptions: Redemption[];
  badges: Badge[];
  appState: AppState;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

class Store {
  private data: StorageData;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
      // 确保旧数据有新增字段
      if (!this.data.badges) this.data.badges = [];
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
      };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
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
    return this.data.children;
  }

  getChild(id: string): Child | undefined {
    return this.data.children.find(c => c.id === id);
  }

  getCurrentChild(): Child | undefined {
    if (!this.data.appState.currentChildId) return undefined;
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
    if (this.data.appState.currentChildId === id) {
      this.data.appState.currentChildId = this.data.children[0]?.id || null;
    }
    this.save();
  }

  canAddChild(): boolean {
    return this.data.appState.isPro || this.data.children.length < 1;
  }

  // Tasks
  getTasks(childId: string): Task[] {
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
    const childTasks = this.getTasks(childId);
    return this.data.appState.isPro || childTasks.length < 3;
  }

  // Daily Records
  getRecords(childId: string, date?: string): DailyRecord[] {
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
    const today = getToday();
    return this.data.records
      .filter(r => r.childId === childId && r.date === today)
      .reduce((sum, r) => sum + (r.completed ? r.points : -r.points + r.points), 0);
  }

  getTotalPoints(childId: string): number {
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

  // Rewards
  getRewards(): Reward[] {
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
    return this.data.redemptions
      .filter(r => r.childId === childId)
      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
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
    };
    this.save();
  }
}

export const store = new Store();
