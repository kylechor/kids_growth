<template>
  <div class="page home">
    <!-- 顶部孩子选择器 -->
    <div class="children-selector">
      <div class="children-scroll">
        <button 
          v-for="child in children" 
          :key="child.id"
          class="child-tab"
          :class="{ active: selectedChildId === child.id }"
          @click="selectChild(child.id)"
        >
          <span class="child-avatar">{{ child.avatar }}</span>
          <span class="child-name">{{ child.name }}</span>
          <span class="child-points">{{ store.getTotalPoints(child.id) }}分</span>
        </button>
        <button class="child-tab add-child" @click="goToChildren">
          <span class="add-icon">+</span>
          <span class="child-name">添加</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" v-if="currentChild">
      
      <!-- 简化打卡日历 - 只显示当月每天 -->
      <div class="calendar-section">
        <div class="calendar-header">
          <div class="calendar-title">
            <span class="fire" v-if="streakDays > 0">🔥</span>
            <span>连续打卡 {{ streakDays }} 天</span>
          </div>
          <div class="month-badge">{{ monthCheckinDays }}/{{ daysInMonth }} 天</div>
        </div>
        <div class="calendar-grid-simple">
          <div 
            v-for="day in monthDaysArray" 
            :key="day.date"
            class="day-cell"
            :class="{ 
              'completed': day.completed,
              'partial': day.partial,
              'today': day.isToday,
              'future': day.isFuture,
              'empty': day.day === 0
            }"
          >
            <span class="day-num" v-if="day.day > 0">{{ day.day }}</span>
            <span class="day-indicator" v-if="day.day > 0 && (day.completed || day.partial)">✓</span>
          </div>
        </div>
      </div>

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

      <!-- 任务列表 (2列布局) -->
      <div class="tasks-section">
        <div class="section-header">
          <h3>今日任务</h3>
          <router-link to="/tasks" class="manage-link">管理</router-link>
        </div>
        
        <!-- 分类筛选 -->
        <div class="filter-tabs" v-if="categories.length > 1">
          <button 
            v-for="cat in categories" 
            :key="cat"
            class="filter-tab"
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ getCategoryLabel(cat) }}
          </button>
        </div>

        <!-- 2列任务网格 -->
        <div class="tasks-grid" v-if="filteredTasks.length > 0">
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="task-card"
            :class="{ completed: getRecordStatus(task.id) }"
            @click="toggleTask(task)"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-points">+{{ task.points }}</span>
            </div>
            <div class="task-check" :class="{ checked: getRecordStatus(task.id) }">
              <svg v-if="getRecordStatus(task.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <div class="empty-tasks" v-else>
          <div class="empty-icon">📋</div>
          <p>还没有任务</p>
          <button class="btn-primary" @click="goToTasks">添加任务</button>
        </div>
      </div>

      <!-- 本周成绩单 -->
      <div class="weekly-report" v-if="tasks.length > 0">
        <div class="report-header">
          <span class="report-icon">📊</span>
          <span class="report-title">本周成绩单</span>
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
            v-for="day in weekDays" 
            :key="day.name"
            class="week-day"
            :class="{ completed: day.completed, future: day.isFuture }"
          >
            <span class="day-name">{{ day.name }}</span>
            <span class="day-status">{{ day.isFuture ? '' : (day.completed ? '✓' : '○') }}</span>
          </div>
        </div>
        <div class="report-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: weekProgressPercent + '%' }"></div>
          </div>
          <span class="progress-text">{{ weekProgressPercent }}% 完成</span>
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
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';
import type { Task, TaskCategory } from '../types';
import { CATEGORY_LABELS } from '../types';

const router = useRouter();
const children = computed(() => store.getChildren());

const selectedChildId = ref<string>('');
const selectedCategory = ref<string>('all');
const showCelebration = ref(false);

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
  
  const result: { day: number; date: string; completed: boolean; partial: boolean; isToday: boolean; isFuture: boolean }[] = [];
  
  for (let d = 1; d <= totalDays; d++) {
    const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;
    const dayRecords = store.getRecords(currentChild.value!.id, dayStr);
    const hasCompleted = dayRecords.some(r => r.completed);
    
    result.push({
      day: d,
      date: dayStr,
      completed: hasCompleted && dayRecords.length > 0,
      partial: !hasCompleted && dayRecords.length > 0,
      isToday: dayStr === todayStr,
      isFuture: dayStr > todayStr
    });
  }
  
  return result;
});

watch(children, (newChildren) => {
  if (newChildren.length > 0 && !selectedChildId.value) {
    const current = store.getCurrentChild();
    if (current) {
      selectedChildId.value = current.id;
    } else {
      selectedChildId.value = newChildren[0].id;
    }
  }
}, { immediate: true });

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

const weekProgressPercent = computed(() => {
  if (weekStats.value.total === 0) return 0;
  return Math.round((weekStats.value.completed / weekStats.value.total) * 100);
});

const weekDays = computed(() => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const todayStr = today.toISOString().split('T')[0];
  
  return dayNames.map((name, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const records = store.getRecords(currentChild.value!.id, dateStr);
    const hasCompleted = records.some(r => r.completed);
    
    return {
      name,
      completed: hasCompleted,
      isFuture: dateStr > todayStr
    };
  });
});

const selectChild = (id: string) => {
  selectedChildId.value = id;
  store.setCurrentChild(id);
  loadRecords();
};

// 分类相关
const categories = computed(() => {
  const cats = new Set(tasks.value.map(t => t.category));
  return ['all', ...Array.from(cats)] as string[];
});

const filteredTasks = computed(() => {
  if (selectedCategory.value === 'all') return tasks.value;
  return tasks.value.filter(t => t.category === selectedCategory.value);
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

const getCategoryLabel = (cat: string) => {
  if (cat === 'all') return '全部';
  return CATEGORY_LABELS[cat as TaskCategory] || cat;
};

const getRecordStatus = (taskId: string) => recordStatus.value[taskId] || false;

const toggleTask = (task: Task) => {
  if (!currentChild.value) return;
  const wasCompleted = recordStatus.value[task.id];
  const newStatus = !wasCompleted;
  recordStatus.value[task.id] = newStatus;
  store.toggleRecord(currentChild.value.id, task.id, newStatus, task.points);
  
  if (newStatus && !wasCompleted) {
    showCelebration.value = true;
    setTimeout(() => {
      showCelebration.value = false;
    }, 1500);
  }
};

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

watch(selectedChildId, () => {
  loadRecords();
  selectedCategory.value = 'all';
});

const goToChildren = () => router.push('/children');
const goToTasks = () => router.push('/tasks');

onMounted(loadRecords);
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

/* 简化日历网格 */
.calendar-grid-simple {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: 12px;
  color: var(--color-text-secondary);
  position: relative;
}

.day-cell.empty {
  background: transparent;
}

.day-cell.today {
  border: 2px solid var(--color-primary);
}

.day-cell.completed {
  background: var(--color-success);
  color: white;
}

.day-cell.partial {
  background: rgba(16, 185, 129, 0.5);
  color: white;
}

.day-cell.future {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.day-cell .day-num {
  font-weight: 600;
  font-size: 13px;
}

.day-cell .day-indicator {
  font-size: 10px;
  margin-top: 1px;
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
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* No Child Content */
.no-child-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-xl);
  text-align: center;
}

.empty-hero {
  margin-bottom: var(--space-xl);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: var(--space-md);
}

.empty-hero h2 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-sm);
}

.empty-hero p {
  color: var(--color-text-secondary);
}

.btn-primary.large {
  padding: 16px 48px;
  font-size: var(--font-size-lg);
}

/* Celebration Animation */
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-celebration);
}

.celebration-content {
  text-align: center;
  animation: celebrationPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.confetti-icon {
  font-size: 80px;
  animation: bounce 0.6s ease infinite alternate;
}

.celebration-text {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-top: var(--space-md);
}

@keyframes celebrationPop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

.celebration-enter-active {
  animation: celebrationPop 0.3s ease;
}

.celebration-leave-active {
  animation: celebrationPop 0.3s ease reverse;
}
</style>
