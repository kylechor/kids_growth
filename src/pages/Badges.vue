<template>
  <div class="page badges-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>我的成就</h2>
      <span></span>
    </div>

    <div class="streak-card" v-if="currentChild">
      <div class="streak-main">
        <span class="fire-icon">🔥</span>
        <span class="streak-number">{{ streakDays }}</span>
        <span class="streak-label">连续打卡</span>
      </div>
      <div class="streak-record">
        <span>历史最高: {{ maxStreak }}天</span>
      </div>
    </div>

    <div class="badges-section">
      <h3>全部徽章</h3>
      <div class="badges-grid">
        <div 
          v-for="badge in allBadges" 
          :key="badge.type"
          class="badge-item"
          :class="{ earned: hasBadge(badge.type) }"
        >
          <div class="badge-icon" :style="{ background: hasBadge(badge.type) ? badge.color : '#e5e5e5' }">
            <span>{{ badge.icon }}</span>
          </div>
          <span class="badge-name">{{ badge.name }}</span>
          <span class="badge-desc" v-if="hasBadge(badge.type)">{{ badge.description }}</span>
          <span class="badge-desc locked" v-else>???</span>
        </div>
      </div>
    </div>

    <div class="earned-section" v-if="earnedBadges.length > 0">
      <h3>已获得 ({{ earnedBadges.length }}/{{ allBadges.length }})</h3>
      <div class="earned-list">
        <div v-for="badge in earnedBadges" :key="badge.id" class="earned-item">
          <span class="earned-icon">{{ getBadgeDef(badge.type)?.icon }}</span>
          <div class="earned-info">
            <span class="earned-name">{{ getBadgeDef(badge.type)?.name }}</span>
            <span class="earned-date">{{ formatDate(badge.earnedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

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
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.header-bar {
  background: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  font-size: 20px;
  color: #333;
  text-decoration: none;
}

.header-bar h2 {
  font-size: 17px;
  margin: 0;
}

.streak-card {
  margin: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 16px;
  color: white;
  text-align: center;
}

.streak-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.fire-icon {
  font-size: 40px;
}

.streak-number {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.streak-label {
  font-size: 18px;
  opacity: 0.9;
}

.streak-record {
  margin-top: 12px;
  font-size: 13px;
  opacity: 0.8;
}

.badges-section {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.badges-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.badge-item {
  text-align: center;
  padding: 12px 4px;
  border-radius: 12px;
  background: #f9f9f9;
  transition: transform 0.2s, box-shadow 0.2s;
}

.badge-item.earned {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 24px;
}

.badge-name {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.badge-desc {
  display: block;
  font-size: 10px;
  color: #999;
}

.badge-desc.locked {
  color: #ccc;
}

.earned-section {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.earned-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.earned-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.earned-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 10px;
}

.earned-icon {
  font-size: 28px;
}

.earned-info {
  flex: 1;
}

.earned-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
}

.earned-date {
  font-size: 12px;
  color: #999;
}

.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 8px 0 20px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #999;
  font-size: 11px;
}

.nav-item.active {
  color: #667eea;
}

.nav-icon {
  font-size: 20px;
}
</style>
