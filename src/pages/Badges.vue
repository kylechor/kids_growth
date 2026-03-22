<template>
  <div class="page badges-page">
    <!-- 主内容 -->
    <div class="main-content" v-if="currentChild">
      
      <!-- 核心统计卡片 -->
      <div class="stats-card">
        <div class="stats-header">
          <span class="avatar">{{ currentChild.avatar }}</span>
          <span class="name">{{ currentChild.name }} 的成长数据</span>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ totalTasks }}</span>
            <span class="stat-label">任务数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ totalRecordDays }}</span>
            <span class="stat-label">记录天数</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-value">{{ maxStreak }}</span>
            <span class="stat-label">最长连续</span>
          </div>
        </div>
      </div>

      <!-- 时间轴卡片 - 横向单行 -->
      <div class="timeline-card">
        <div class="timeline-header">
          <span class="timeline-icon">📅</span>
          <span class="timeline-title">时间轴</span>
        </div>
        <div class="timeline-row">
          <div class="timeline-cell">
            <span class="cell-icon">📆</span>
            <span class="cell-value">{{ todayStr }}</span>
            <span class="cell-label">今天</span>
          </div>
          <div class="timeline-cell">
            <span class="cell-icon">📅</span>
            <span class="cell-value">第 {{ dayOfYear }} 天</span>
            <span class="cell-label">今年</span>
          </div>
          <div class="timeline-cell">
            <span class="cell-icon">📊</span>
            <span class="cell-value">第 {{ weekNumber }} 周</span>
            <span class="cell-label">本周</span>
          </div>
          <div class="timeline-cell highlight">
            <span class="cell-icon">⏰</span>
            <span class="cell-value">{{ remainingDays }} 天</span>
            <span class="cell-label">剩余</span>
          </div>
        </div>
      </div>

      <!-- 徽章墙 -->
      <div class="badges-section">
        <div class="badges-header">
          <span class="badges-icon">🏆</span>
          <span class="badges-title">徽章墙</span>
          <span class="badges-count">{{ earnedBadges.length }}/{{ allBadges.length }}</span>
        </div>
        <div class="badges-grid">
          <div 
            v-for="badge in allBadges" 
            :key="badge.type"
            class="badge-item"
            :class="{ earned: hasBadge(badge.type) }"
          >
            <div class="badge-icon" :style="{ 
              background: hasBadge(badge.type) ? badge.color : '#e5e7eb',
              boxShadow: hasBadge(badge.type) ? `0 4px 12px ${badge.color}40` : 'none'
            }">
              <span>{{ badge.icon }}</span>
            </div>
            <span class="badge-name">{{ badge.name }}</span>
            <span class="badge-desc" :class="{ locked: !hasBadge(badge.type) }">
              {{ hasBadge(badge.type) ? badge.description : '???' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 已获得徽章列表 -->
      <div class="earned-section" v-if="earnedBadges.length > 0">
        <h3>已获得</h3>
        <div class="earned-list">
          <div v-for="badge in earnedBadges" :key="badge.id" class="earned-item">
            <div class="earned-icon-wrapper" :style="{ background: getBadgeDef(badge.type)?.color }">
              <span>{{ getBadgeDef(badge.type)?.icon }}</span>
            </div>
            <div class="earned-info">
              <span class="earned-name">{{ getBadgeDef(badge.type)?.name }}</span>
              <span class="earned-date">{{ formatDate(badge.earnedAt) }}</span>
            </div>
            <span class="earned-check">✓</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">👶</div>
      <p>请先添加孩子</p>
      <router-link to="/children" class="btn-link">去添加</router-link>
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store } from '../stores/store';
import { BADGE_DEFINITIONS, type BadgeType } from '../types';
import BottomNav from '../components/BottomNav.vue';

const currentChild = computed(() => store.getCurrentChild());
const streakDays = computed(() => currentChild.value ? store.getStreak(currentChild.value.id) : 0);
const maxStreak = computed(() => Math.max(currentChild.value?.maxStreakDays || 0, streakDays.value));
const allBadges = BADGE_DEFINITIONS;

// 统计数据
const totalTasks = computed(() => {
  if (!currentChild.value) return 0;
  return store.getTasks(currentChild.value.id).length;
});

const totalRecordDays = computed(() => {
  if (!currentChild.value) return 0;
  return store.getTotalRecordDays(currentChild.value.id);
});

// 时间轴数据
const today = new Date();

const todayStr = computed(() => {
  return `${today.getMonth() + 1}月${today.getDate()}日`;
});

const dayOfYear = computed(() => {
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
});

const totalDaysInYear = computed(() => {
  const year = today.getFullYear();
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 366 : 365;
});

const weekNumber = computed(() => {
  const start = new Date(today.getFullYear(), 0, 1);
  const diff = today.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil((diff + start.getDay() * 24 * 60 * 60 * 1000) / oneWeek);
});

const remainingDays = computed(() => {
  return totalDaysInYear.value - dayOfYear.value;
});

const earnedBadges = computed(() => 
  currentChild.value ? store.getBadges(currentChild.value.id) : []
);

const hasBadge = (type: BadgeType) => {
  if (!currentChild.value) return false;
  return store.hasBadge(currentChild.value.id, type);
};

const getBadgeDef = (type: BadgeType) => {
  return allBadges.find(b => b.type === type);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日获得`;
};
</script>

<style scoped>
.badges-page {
  background: var(--color-bg);
}

.main-content {
  padding-bottom: 80px;
}

/* Stats Card */
.stats-card {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  color: white;
  box-shadow: var(--shadow-lg);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.stats-header .avatar {
  font-size: 32px;
}

.stats-header .name {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-item .stat-value {
  display: block;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.stat-item.highlight .stat-value {
  color: #fbbf24;
}

.stat-item .stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

/* Timeline Card - 横向单行 */
.timeline-card {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.timeline-icon {
  font-size: 24px;
}

.timeline-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.timeline-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
}

.timeline-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.timeline-cell.highlight {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
}

.timeline-cell .cell-icon {
  font-size: 18px;
  margin-bottom: 4px;
}

.timeline-cell .cell-value {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

.timeline-cell.highlight .cell-value {
  color: var(--color-primary);
}

.timeline-cell .cell-label {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* Badges Section */
.badges-section {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.badges-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.badges-icon {
  font-size: 24px;
}

.badges-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.badges-count {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-sm);
}

.badge-item {
  text-align: center;
  padding: var(--space-md) var(--space-xs);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  transition: all var(--transition-fast);
}

.badge-item.earned {
  background: var(--color-bg-card);
  box-shadow: var(--shadow-md);
}

.badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-sm);
  transition: all var(--transition-base);
}

.badge-icon span {
  font-size: 24px;
}

.badge-name {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}

.badge-desc {
  display: block;
  font-size: 10px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.badge-desc.locked {
  color: var(--color-text-muted);
}

/* Earned Section */
.earned-section {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.earned-section h3 {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-bottom: var(--space-md);
}

.earned-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.earned-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
}

.earned-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.earned-icon-wrapper span {
  font-size: 22px;
}

.earned-info {
  flex: 1;
}

.earned-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.earned-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

.earned-check {
  width: 28px;
  height: 28px;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

/* Empty State */
.empty-state {
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: var(--space-md);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.btn-link {
  display: inline-block;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}
</style>
