<template>
  <div class="page badges-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>我的成就</h2>
      <span></span>
    </div>

    <!-- 连续打卡卡片 -->
    <div class="streak-card" v-if="currentChild">
      <div class="streak-visual">
        <div class="flame">
          <span class="flame-emoji">🔥</span>
        </div>
        <div class="streak-info">
          <span class="streak-number">{{ streakDays }}</span>
          <span class="streak-label">连续打卡天数</span>
        </div>
      </div>
      <div class="streak-stats">
        <div class="stat">
          <span class="stat-value">{{ maxStreak }}</span>
          <span class="stat-label">历史最高</span>
        </div>
      </div>
    </div>

    <!-- 徽章网格 -->
    <div class="badges-section">
      <h3>全部徽章</h3>
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
      <h3>已获得 ({{ earnedBadges.length }}/{{ allBadges.length }})</h3>
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

    <!-- 空状态 -->
    <div class="empty-state" v-if="!currentChild">
      <div class="empty-icon">👶</div>
      <p>请先添加孩子</p>
      <router-link to="/children" class="btn-link">去添加</router-link>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/children" class="nav-item">
        <span class="nav-icon">👶</span>
        <span>孩子</span>
      </router-link>
      <router-link to="/tasks" class="nav-item">
        <span class="nav-icon">📋</span>
        <span>任务</span>
      </router-link>
      <router-link to="/rewards" class="nav-item">
        <span class="nav-icon">🎁</span>
        <span>奖励</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { store } from '../stores/store';
import { BADGE_DEFINITIONS, type BadgeType } from '../types';

const currentChild = computed(() => store.getCurrentChild());
const streakDays = computed(() => currentChild.value ? store.getStreak(currentChild.value.id) : 0);
const maxStreak = computed(() => currentChild.value?.maxStreakDays || 0);
const allBadges = BADGE_DEFINITIONS;

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

/* Streak Card */
.streak-card {
  margin: var(--space-md);
  padding: var(--space-xl);
  background: var(--gradient-warning);
  border-radius: var(--radius-xl);
  color: white;
  box-shadow: var(--shadow-xl);
}

.streak-visual {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.flame {
  width: 72px;
  height: 72px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.flame-emoji {
  font-size: 40px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.streak-info {
  display: flex;
  flex-direction: column;
}

.streak-number {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.streak-label {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  margin-top: 4px;
}

.streak-stats {
  display: flex;
  gap: var(--space-lg);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.stat-label {
  font-size: var(--font-size-xs);
  opacity: 0.9;
}

/* Badges Section */
.badges-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.badges-section h3 {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-bottom: var(--space-md);
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
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-sm);
  transition: all var(--transition-base);
}

.badge-icon span {
  font-size: 26px;
}

.badge-name {
  display: block;
  font-size: var(--font-size-xs);
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
  margin: var(--space-md);
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
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.earned-icon-wrapper span {
  font-size: 24px;
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
  font-size: var(--font-size-xs);
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
