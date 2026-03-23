<template>
  <div class="page home">
    <!-- 顶部孩子选择器 -->
    <ChildSelector @child-changed="onChildChanged" />

    <!-- 主内容区 -->
    <div class="main-content" v-if="currentChild">
	  <!-- 今日数据卡片 -->
      <div class="today-data-card">
        <div class="today-left">
          <div class="avatar-row">
            <span class="avatar">{{ currentChild.avatar }}</span>
            <div class="avatar-info">
              <span class="name">{{ currentChild.name }}</span>
              <span class="greeting">{{ greeting }}</span>
            </div>
          </div>
        </div>
        <div class="today-right">
          <div class="stat-main">
            <span class="stat-value">{{ totalPoints }}</span>
            <span class="stat-label">积分</span>
          </div>
        </div>
      </div>

      <!-- 等级进度条 -->
      <div class="level-card">
        <div class="level-header">
          <div class="level-info">
            <span class="level-icon">{{ levelInfo.icon }}</span>
            <div class="level-text">
              <span class="level-name">{{ levelInfo.name }}</span>
              <span class="level-title">Lv.{{ levelInfo.level }}</span>
            </div>
          </div>
          <div class="level-progress-info">
            <span class="progress-text">{{ levelProgress.currentPoints }} / {{ levelInfo.maxPoints === Infinity ? '∞' : levelInfo.maxPoints }}</span>
          </div>
        </div>
        <div class="level-progress-bar">
          <div class="level-progress-fill" :style="{ width: levelProgress.progressPercent + '%', background: levelInfo.color }"></div>
        </div>
        <div class="level-footer">
          <span class="level-tip">再获得 {{ levelProgress.pointsToNextLevel }} 积分升级到 {{ nextLevel?.name || '最高级' }}</span>
        </div>
      </div>
      
      <!-- GitHub风格打卡日历 - 单行 -->
      <div class="calendar-section">
        <div class="calendar-header">
          <div class="calendar-title">
            <span class="fire" v-if="streakDays > 0">🔥</span>
            <span>连续打卡 {{ streakDays }} 天</span>
          </div>
          <div class="month-badge">{{ monthCheckinDays }}/{{ daysInMonth }} 天</div>
        </div>
        <!-- 单行横向展示 -->
        <div class="github-row">
          <div 
            v-for="day in monthDaysArray" 
            :key="day.date"
            class="github-cell"
            :class="{ 
              'level-0': day.level === 0,
              'level-1': day.level === 1,
              'level-2': day.level === 2,
              'level-3': day.level === 3,
              'level-4': day.level === 4,
              'today': day.isToday,
              'future': day.isFuture
            }"
            :title="day.day > 0 ? `${day.day}日: ${day.completedPercent}%` : ''"
          >
            <span class="day-label" v-if="day.isToday || day.day === 1">{{ day.day }}</span>
          </div>
        </div>
        <!-- 图例 -->
        <div class="legend">
          <span class="legend-label">少</span>
          <div class="legend-cell level-0"></div>
          <div class="legend-cell level-1"></div>
          <div class="legend-cell level-2"></div>
          <div class="legend-cell level-3"></div>
          <div class="legend-cell level-4"></div>
          <span class="legend-label">多</span>
        </div>
      </div>

      <!-- 今日进度 -->
      <div class="progress-card">
        <div class="progress-top">
          <span class="date-info">{{ currentDate }} {{ weekday }}</span>
          <span class="task-info" v-if="tasks.length > 0">{{ completedCount }}/{{ tasks.length }} 任务</span>
          <span class="task-info empty" v-else>暂无任务</span>
        </div>
        <div class="progress-track" v-if="tasks.length > 0">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-track empty" v-else>
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="points-row" v-if="tasks.length > 0">
          <span class="today-points" :class="todayPointsClass">{{ todayPoints > 0 ? '+' : '' }}{{ todayPoints }} 今日积分</span>
        </div>
      </div>

      <!-- 每日挑战 -->
      <div class="challenges-section">
        <div class="section-header">
          <div class="section-title-row">
            <span class="section-icon">🎯</span>
            <span class="section-title">每日挑战</span>
          </div>
          <span class="challenge-count">{{ completedChallengeCount }}/{{ dailyChallenges.length }}</span>
        </div>
        <div class="challenges-list" v-if="dailyChallenges.length > 0">
          <div 
            v-for="challenge in dailyChallenges" 
            :key="challenge.id"
            class="challenge-item"
            :class="{ completed: challenge.completed }"
          >
            <div class="challenge-icon">{{ getChallengeIcon(challenge.type) }}</div>
            <div class="challenge-content">
              <div class="challenge-title">{{ challenge.title }}</div>
              <div class="challenge-desc">{{ challenge.description }}</div>
              <div class="challenge-progress">
                <div class="challenge-progress-bar">
                  <div 
                    class="challenge-progress-fill" 
                    :style="{ width: Math.min(100, (challenge.currentValue / challenge.targetValue) * 100) + '%' }"
                  ></div>
                </div>
                <span class="challenge-progress-text">
                  {{ challenge.currentValue }}/{{ challenge.targetValue }}
                </span>
              </div>
            </div>
            <div class="challenge-reward">
              <span class="reward-badge" :class="{ earned: challenge.completed }">
                +{{ challenge.rewardPoints }}
              </span>
              <span v-if="challenge.completed" class="completed-check">✓</span>
            </div>
          </div>
        </div>
        <div v-else class="no-challenges">
          <p>今天还没有挑战</p>
          <button class="generate-btn" @click="generateChallenges">生成挑战</button>
        </div>
      </div>

      <!-- 本周积分柱状图 -->
      <div class="week-points-chart">
        <div class="chart-header">
          <span class="chart-icon">📈</span>
          <span class="chart-title">本周积分</span>
          <span class="chart-total">+{{ weekPointsTotal }} 积分</span>
        </div>
        <div class="chart-body">
          <div class="chart-y-axis">
            <span>{{ maxWeekPoints }}</span>
            <span>{{ Math.round(maxWeekPoints / 2) }}</span>
            <span>0</span>
          </div>
          <div class="chart-bars">
            <div 
              v-for="day in weekPointsData" 
              :key="day.date"
              class="chart-bar-wrapper"
            >
              <div 
                class="chart-bar"
                :style="{ height: getBarHeight(day.points) + '%' }"
                :class="{ today: day.isToday, future: day.isFuture }"
              >
                <span v-if="day.points > 0" class="bar-value">{{ day.points }}</span>
              </div>
              <span class="bar-label" :class="{ today: day.isToday }">{{ day.dayName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 本周任务卡片 -->
      <div class="weekly-report" v-if="tasks.length > 0">
        <div class="report-header">
          <span class="report-icon">📋</span>
          <span class="report-title">本周任务</span>
        </div>
        <div class="report-stats">
          <div class="report-stat">
            <span class="stat-num">{{ weekStats.completed }}</span>
            <span class="stat-desc">已完成</span>
          </div>
          <div class="report-stat">
            <span class="stat-num">{{ weekStats.total }}</span>
            <span class="stat-desc">总任务</span>
          </div>
          <div class="report-stat highlight">
            <span class="stat-num">+{{ weekStats.points }}</span>
            <span class="stat-desc">获得积分</span>
          </div>
        </div>
        <div class="week-days">
          <div 
            v-for="day in weekPointsData" 
            :key="day.date"
            class="week-day"
            :class="{ completed: day.points > 0, future: day.isFuture }"
          >
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-status">{{ day.isFuture ? '' : (day.points > 0 ? '✓' : '○') }}</span>
          </div>
        </div>
        <div class="report-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: weekProgressPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ weekProgressPercent }}% 完成</span>
        </div>
      </div>

      <!-- 本周项目卡片 -->
      <div class="weekly-report">
        <div class="report-header">
          <span class="report-icon">🚀</span>
          <span class="report-title">本周项目</span>
        </div>
        <div class="report-stats">
          <div class="report-stat">
            <span class="stat-num">{{ weekProjectStats.completed }}</span>
            <span class="stat-desc">已完成</span>
          </div>
          <div class="report-stat">
            <span class="stat-num">{{ weekProjectStats.total }}</span>
            <span class="stat-desc">总任务</span>
          </div>
          <div class="report-stat highlight">
            <span class="stat-num">+{{ weekProjectStats.points }}</span>
            <span class="stat-desc">获得积分</span>
          </div>
        </div>
        <div class="report-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: weekProjectStats.total > 0 ? (weekProjectStats.completed / weekProjectStats.total * 100) : 0 + '%' }"></div>
          </div>
          <span class="progress-text">{{ weekProjectStats.total > 0 ? Math.round(weekProjectStats.completed / weekProjectStats.total * 100) : 0 }}% 完成</span>
        </div>
      </div>

    </div>

    <!-- 无孩子时显示 -->
    <div class="no-child-content" v-else>
      <div class="empty-hero">
        <div class="empty-icon">👨‍👩‍👧‍👦</div>
        <h2>欢迎使用成长积分宝</h2>
        <p>添加孩子，开始记录成长之旅</p>
      </div>
      <button class="btn-primary large" @click="goToChildren">
        添加第一个孩子
      </button>
    </div>

    <!-- 庆祝动画 -->
    <Transition name="celebration">
      <div class="celebration-overlay" v-if="showCelebration">
        <div class="celebration-content">
          <div class="confetti-icon">🎉</div>
          <div class="celebration-text">太棒了！</div>
        </div>
      </div>
    </Transition>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';
import BottomNav from '../components/BottomNav.vue';
import ChildSelector from '../components/ChildSelector.vue';

const router = useRouter();
const children = computed(() => store.getChildren());

const selectedChildId = ref<string>(store.getCurrentChild()?.id || '');
const showCelebration = ref(false);
const selectedCategory = ref<string>('all');

const onChildChanged = (childId: string) => {
  selectedChildId.value = childId;
  loadRecords();
  selectedCategory.value = 'all';
};

// 当前月份数据（固定显示当月）
const currentMonth = ref(new Date());

// 当月天数数组
const daysInMonth = computed(() => {
  const date = currentMonth.value;
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
});

const monthDaysArray = computed(() => {
  if (!currentChild.value) return [];
  
  const date = currentMonth.value;
  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = daysInMonth.value;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  // 获取当天任务总数
  const tasks = store.getTasks(currentChild.value!.id);
  const totalTasks = tasks.length || 1;
  
  const result: { day: number; date: string; completed: boolean; partial: boolean; isToday: boolean; isFuture: boolean; level: number; completedPercent: number }[] = [];
  
  for (let d = 1; d <= totalDays; d++) {
    const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;
    const dayRecords = store.getRecords(currentChild.value!.id, dayStr);
    const completedCount = dayRecords.filter(r => r.completed).length;
    const hasAnyRecords = dayRecords.length > 0;
    const completedPercent = Math.round((completedCount / totalTasks) * 100);
    
    // 根据完成百分比计算颜色等级
    let level = 0;
    if (completedPercent > 0) level = 1;
    if (completedPercent >= 25) level = 2;
    if (completedPercent >= 50) level = 3;
    if (completedPercent >= 75) level = 4;
    
    result.push({
      day: d,
      date: dayStr,
      completed: hasAnyRecords && completedCount === totalTasks,
      partial: hasAnyRecords && completedCount < totalTasks,
      isToday: dayStr === todayStr,
      isFuture: dayStr > todayStr,
      level,
      completedPercent
    });
  }
  
  return result;
});

const currentChild = computed(() => 
  children.value.find(c => c.id === selectedChildId.value) || null
);

const tasks = computed(() => currentChild.value ? store.getTasks(currentChild.value.id) : []);
const totalPoints = computed(() => currentChild.value ? store.getTotalPoints(currentChild.value.id) : 0);
const todayPoints = computed(() => currentChild.value ? store.getTodayPoints(currentChild.value.id) : 0);
const streakDays = computed(() => currentChild.value ? store.getStreak(currentChild.value.id) : 0);
const monthCheckinDays = computed(() => currentChild.value ? store.getMonthCheckinDays(currentChild.value.id) : 0);

const recordStatus = ref<Record<string, boolean>>({});

// 周数据
const weekStats = computed(() => {
  if (!currentChild.value) return { completed: 0, total: 0, points: 0 };
  return store.getWeekTaskStats(currentChild.value.id);
});

// 本周积分数据
const weekPointsData = computed(() => {
  if (!currentChild.value) return [];
  const data = store.getWeekPoints(currentChild.value.id);
  const today = new Date().toISOString().split('T')[0];
  return data.map(d => ({
    ...d,
    isToday: d.date === today,
    isFuture: d.date > today
  }));
});

const weekPointsTotal = computed(() => {
  return weekPointsData.value.reduce((sum, d) => sum + d.points, 0);
});

const maxWeekPoints = computed(() => {
  const max = Math.max(...weekPointsData.value.map(d => d.points), 1);
  return Math.ceil(max / 10) * 10;
});

const getBarHeight = (points: number): number => {
  if (maxWeekPoints.value === 0) return 0;
  return Math.max((points / maxWeekPoints.value) * 100, points > 0 ? 5 : 0);
};

// 本周项目统计
const weekProjectStats = computed(() => {
  if (!currentChild.value) return { total: 0, completed: 0, points: 0 };
  return store.getWeekProjectStats(currentChild.value.id);
});

const weekProgressPercent = computed(() => {
  if (weekStats.value.total === 0) return 0;
  return Math.round((weekStats.value.completed / weekStats.value.total) * 100);
});

const completedCount = computed(() => 
  tasks.value.filter(t => getRecordStatus(t.id)).length
);

const progressPercent = computed(() => 
  tasks.value.length > 0 ? (completedCount.value / tasks.value.length) * 100 : 0
);

const todayPointsClass = computed(() => {
  if (todayPoints.value > 0) return 'positive';
  if (todayPoints.value < 0) return 'negative';
  return 'zero';
});

const currentDate = computed(() => {
  const today = new Date();
  return `${today.getMonth() + 1}月${today.getDate()}日`;
});

const weekday = computed(() => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[new Date().getDay()];
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好！';
  if (hour < 18) return '下午好！';
  return '晚上好！';
});

const getRecordStatus = (taskId: string) => recordStatus.value[taskId] || false;

const loadRecords = () => {
  if (!currentChild.value) {
    recordStatus.value = {};
    return;
  }
  const records = store.getRecords(currentChild.value.id);
  recordStatus.value = {};
  records.forEach(r => {
    recordStatus.value[r.taskId] = r.completed;
  });
};

const goToChildren = () => router.push('/children');

// 等级系统
const levelProgress = computed(() => {
  if (!currentChild.value) return { currentLevel: 1, currentPoints: 0, pointsToNextLevel: 100, progressPercent: 0 };
  return store.getLevelProgress(currentChild.value.id);
});

const levelInfo = computed(() => {
  if (!currentChild.value) return { level: 1, name: '小小萌新', icon: '🌱', color: '#10b981', maxPoints: 100, minPoints: 0 };
  return store.getLevelInfo(currentChild.value.id);
});

const nextLevel = computed(() => {
  const LEVEL_NAMES: Record<number, string> = {
    1: '成长小芽',
    2: '学习小童',
    3: '勤奋小学生',
    4: '学霸萌芽',
    5: '知识小将',
    6: '智慧少年',
    7: '学霸之星',
    8: '学习达人',
    9: '全能学霸',
  };
  const current = levelProgress.value.currentLevel;
  return current < 10 ? { name: LEVEL_NAMES[current + 1] || '最高级' } : null;
});

// 每日挑战
const dailyChallenges = computed(() => {
  if (!currentChild.value) return [];
  return store.getDailyChallenges(currentChild.value.id);
});

const completedChallengeCount = computed(() => {
  if (!currentChild.value) return 0;
  return store.getTodayCompletedChallenges(currentChild.value.id);
});

const generateChallenges = () => {
  if (!currentChild.value) return;
  store.generateDailyChallenges(currentChild.value.id);
};

const getChallengeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    quick: '⚡',
    study: '📚',
    exercise: '🏃',
    creative: '🎨',
    social: '🤝',
  };
  return icons[type] || '🎯';
};

onMounted(() => {
  loadRecords();
  // 自动生成今日挑战
  if (currentChild.value) {
    store.generateDailyChallenges(currentChild.value.id);
  }
});
</script>

<style scoped>
/* Children Selector */
.children-selector {
  background: var(--color-bg-card);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.children-scroll {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: 0 var(--space-md);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.children-scroll::-webkit-scrollbar {
  display: none;
}

.child-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  min-width: 80px;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.child-tab.active {
  background: var(--gradient-hero);
  color: white;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.child-tab .child-avatar {
  font-size: 28px;
}

.child-tab .child-name {
  font-size: 12px;
  font-weight: 600;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.child-tab .child-points {
  font-size: 10px;
  opacity: 0.8;
}

.child-tab.add-child {
  background: var(--color-bg);
  border: 2px dashed var(--color-border);
}

.child-tab.add-child .add-icon {
  font-size: 24px;
  font-weight: 300;
  color: var(--color-primary);
}

/* Main Content */
.main-content {
  padding-bottom: var(--space-lg);
}

/* Calendar Section */
.calendar-section {
  margin: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.calendar-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.calendar-title .fire {
  font-size: 18px;
}

.month-badge {
  font-size: 12px;
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

/* GitHub风格日历 - 单行 */
.github-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 3px;
  overflow-x: auto;
  padding: 4px 0;
}

.github-cell {
  min-width: 20px;
  height: 20px;
  border-radius: 3px;
  background: #ebedf0;
  transition: transform 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.github-cell.level-0 {
  background: #ebedf0;
}

.github-cell.level-1 {
  background: #9be9a8;
}

.github-cell.level-2 {
  background: #40c463;
}

.github-cell.level-3 {
  background: #30a14e;
}

.github-cell.level-4 {
  background: #216e39;
}

.github-cell.today {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.github-cell.future {
  opacity: 0.4;
}

.github-cell:hover {
  transform: scale(1.1);
}

.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-cell.level-0 {
  background: #ebedf0;
}

.legend-cell.level-1 {
  background: #9be9a8;
}

.legend-cell.level-2 {
  background: #40c463;
}

.legend-cell.level-3 {
  background: #30a14e;
}

.legend-cell.level-4 {
  background: #216e39;
}

.legend-label {
  margin: 0 4px;
}

/* Today Data Card */
.today-data-card {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-md);
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-lg);
}

.today-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.avatar {
  font-size: 40px;
}

.avatar-info {
  display: flex;
  flex-direction: column;
}

.avatar-info .name {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.avatar-info .greeting {
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

.stat-main {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-main .stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.stat-main .stat-label {
  font-size: 11px;
  opacity: 0.8;
}

/* Progress Card */
.progress-card {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.progress-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.date-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.task-info {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
}

.task-info.empty {
  color: var(--color-text-muted);
  font-weight: normal;
}

.progress-track {
  height: 8px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-track.empty {
  background: var(--color-border);
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.points-row {
  margin-top: var(--space-sm);
}

.today-points {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.today-points.positive {
  color: var(--color-success);
}

.today-points.negative {
  color: var(--color-danger);
}

/* Tasks Section */
.tasks-section {
  padding: 0 var(--space-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.section-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
}

.manage-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.filter-tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--space-xs);
}

.filter-tab {
  padding: 6px 14px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.filter-tab.active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

/* 2列任务网格 */
.tasks-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

.task-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.task-card:active {
  transform: scale(0.98);
}

.task-card.completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
}

.task-card .task-icon {
  font-size: 32px;
}

.task-card .task-info {
  text-align: center;
}

.task-card .task-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}

.task-card.completed .task-name {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-card .task-points {
  font-size: 11px;
  color: var(--color-success);
  font-weight: 600;
}

.task-card .task-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.task-card .task-check.checked {
  background: var(--color-success);
  border-color: var(--color-success);
}

.task-card .task-check svg {
  width: 12px;
  height: 12px;
  color: white;
}

.empty-tasks {
  text-align: center;
  padding: var(--space-xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.empty-tasks p {
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
}

/* Weekly Report */
.weekly-report {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.report-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.report-icon {
  font-size: 24px;
}

.report-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.report-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: var(--space-md);
}

.report-stat {
  text-align: center;
}

.report-stat .stat-num {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text);
}

.report-stat.highlight .stat-num {
  color: var(--color-success);
}

.report-stat .stat-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

.week-days {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  padding: var(--space-sm) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 40px;
}

.week-day .day-name {
  font-size: 11px;
  color: var(--color-text-muted);
}

.week-day .day-status {
  font-size: 16px;
  color: var(--color-text-muted);
}

.week-day.completed .day-status {
  color: var(--color-success);
}

.week-day.future .day-name,
.week-day.future .day-status {
  color: var(--color-border);
}

.report-progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.report-progress .progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.report-progress .progress-fill {
  height: 100%;
  background: var(--gradient-success);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.report-progress .progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-left: var(--space-sm);
}

/* Responsive for PC */
@media (min-width: 768px) {
  .main-content {
    max-width: 600px;
    margin: 0 auto;
  }

  .today-data-card,
  .level-card,
  .calendar-section,
  .progress-card,
  .challenges-section,
  .week-points-chart,
  .weekly-report,
  .project-report {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
