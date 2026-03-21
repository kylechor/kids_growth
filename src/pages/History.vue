<template>
  <div class="page history-page">
    <div class="header-bar">
      <router-link to="/rewards" class="back-btn">←</router-link>
      <h2>积分历史</h2>
      <span></span>
    </div>

    <div class="child-selector" v-if="children.length > 1">
      <span 
        v-for="child in children" 
        :key="child.id"
        class="child-tab"
        :class="{ active: selectedChildId === child.id }"
        @click="selectedChildId = child.id"
      >
        {{ child.avatar }} {{ child.name }}
      </span>
    </div>

    <div class="summary-card" v-if="currentChild">
      <div class="stat">
        <span class="label">累计积分</span>
        <span class="value">{{ totalPoints }}</span>
      </div>
      <div class="stat">
        <span class="label">开始日期</span>
        <span class="value date">{{ startDate }}</span>
      </div>
    </div>

    <div class="chart-section" v-if="pointsHistory.length > 1">
      <h3>积分趋势</h3>
      <div class="simple-chart">
        <div 
          v-for="(item, index) in chartData" 
          :key="index"
          class="chart-bar"
          :style="{ height: item.height + '%' }"
          :class="{ positive: item.points >= 0, negative: item.points < 0 }"
        >
          <span class="bar-value">{{ item.points }}</span>
        </div>
      </div>
      <div class="chart-labels">
        <span v-for="(item, index) in chartData" :key="index" class="label">
          {{ item.label }}
        </span>
      </div>
    </div>

    <div class="history-section">
      <h3>每日明细</h3>
      <div class="history-list" v-if="pointsHistory.length > 0">
        <div v-for="item in pointsHistory" :key="item.date" class="history-item">
          <div class="date-info">
            <span class="date">{{ formatDate(item.date) }}</span>
            <span class="weekday">{{ getWeekday(item.date) }}</span>
          </div>
          <span class="points" :class="{ positive: item.points >= 0, negative: item.points < 0 }">
            {{ item.points >= 0 ? '+' : '' }}{{ item.points }}
          </span>
        </div>
      </div>
      <div class="empty-state" v-else>
        <p>还没有记录</p>
        <p class="sub">完成任务后这里会显示历史</p>
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
import { ref, computed, watch } from 'vue';
import { store } from '../stores/store';

const children = computed(() => store.getChildren());
const selectedChildId = ref('');

watch(() => store.getCurrentChild(), (child) => {
  if (child) selectedChildId.value = child.id;
}, { immediate: true });

const currentChild = computed(() => store.getChild(selectedChildId.value));
const totalPoints = computed(() => store.getTotalPoints(selectedChildId.value));
const pointsHistory = computed(() => store.getPointsHistory(selectedChildId.value));

const startDate = computed(() => {
  if (!currentChild.value) return '-';
  const date = new Date(currentChild.value.createdAt);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});

const chartData = computed(() => {
  const history = [...pointsHistory.value].slice(-7);
  if (history.length === 0) return [];
  
  const maxAbs = Math.max(...history.map(h => Math.abs(h.points)), 10);
  
  return history.map(item => ({
    date: item.date,
    points: item.points,
    height: Math.abs(item.points) / maxAbs * 100,
    label: item.date.slice(5),
  }));
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const getWeekday = (dateStr: string) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[new Date(dateStr).getDay()];
};
</script>

<style scoped>
.history-page {
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

.child-selector {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.child-tab {
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.child-tab.active {
  background: #667eea;
  color: white;
}

.summary-card {
  margin: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  display: flex;
  justify-content: space-around;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.stat .value {
  font-size: 24px;
  font-weight: 700;
}

.chart-section {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.chart-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100px;
  padding: 0 10px;
}

.chart-bar {
  width: 30px;
  background: #ddd;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s;
}

.chart-bar.positive {
  background: linear-gradient(to top, #4caf50, #81c784);
}

.chart-bar.negative {
  background: linear-gradient(to top, #f44336, #e57373);
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
}

.chart-labels .label {
  width: 30px;
  text-align: center;
  font-size: 10px;
  color: #999;
}

.history-section {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.history-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.date-info {
  display: flex;
  gap: 8px;
}

.date {
  font-size: 14px;
}

.weekday {
  font-size: 12px;
  color: #999;
}

.points {
  font-size: 16px;
  font-weight: 600;
}

.points.positive {
  color: #4caf50;
}

.points.negative {
  color: #f44336;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-state .sub {
  font-size: 13px;
  margin-top: 8px;
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
