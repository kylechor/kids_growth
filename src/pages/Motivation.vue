<template>
  <div class="page motivation-page">
    <!-- 孩子选择器 -->
    <ChildSelector @child-changed="onChildChanged" />

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- 积分 Tab -->
    <div v-if="activeTab === 'points'" class="tab-content">
      <!-- 等级卡片 -->
      <div class="level-card" v-if="currentChild && levelInfo">
        <div class="level-header">
          <div class="level-badge" :style="{ background: `linear-gradient(135deg, ${levelInfo.color} 0%, ${levelInfo.color}aa 100%)` }">
            <span class="level-icon">{{ levelInfo.icon }}</span>
            <span class="level-number">Lv.{{ levelInfo.level }}</span>
          </div>
          <div class="level-info">
            <span class="level-name">{{ levelInfo.name }}</span>
            <span class="level-title">{{ levelInfo.title }}</span>
          </div>
        </div>
        <div class="level-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: levelProgress.progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">
            <span>{{ levelProgress.currentPoints }} 积分</span>
            <span v-if="levelProgress.pointsToNextLevel > 0">距离下一级还需 {{ levelProgress.pointsToNextLevel }}</span>
            <span v-else>已达到最高等级!</span>
          </div>
        </div>
      </div>

      <!-- 积分卡片 -->
      <div class="points-card" v-if="currentChild">
        <div class="points-main">
          <span class="points-icon">💰</span>
          <div class="points-info">
            <span class="points-value">{{ totalPoints.toLocaleString() }}</span>
            <span class="points-label">我的积分</span>
          </div>
        </div>
        <div class="points-stats">
          <div class="stat-item">
            <span class="stat-value">+{{ weekStats.points }}</span>
            <span class="stat-label">本周积分</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ weekStats.completed }}/{{ weekStats.total }}</span>
            <span class="stat-label">本周任务</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ currentChild.streakDays }}</span>
            <span class="stat-label">连续打卡</span>
          </div>
        </div>
      </div>

      <!-- 积分明细 -->
      <div class="points-history" v-if="pointsHistory.length > 0">
        <h3 class="section-title">📜 积分明细</h3>
        <div class="history-list">
          <div v-for="record in pointsHistory.slice(-10).reverse()" :key="record.date" class="history-item">
            <div class="history-info">
              <span class="history-points" :class="{ positive: record.points > 0, negative: record.points < 0 }">
                {{ record.points > 0 ? '+' : '' }}{{ record.points }}
              </span>
              <span class="history-date">{{ formatDate(record.date) }}</span>
            </div>
            <div class="history-chart">
              <div class="chart-bar" :style="{ width: Math.abs(record.points) / maxPoints * 100 + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无孩子 -->
      <div v-else-if="!currentChild" class="empty-state">
        <div class="empty-icon">👶</div>
        <p>请先添加孩子</p>
        <router-link to="/children" class="btn-link">去添加</router-link>
      </div>
    </div>

    <!-- 兑换 Tab -->
    <div v-if="activeTab === 'rewards'" class="tab-content">
      <!-- 可用奖励 -->
      <div class="rewards-section">
        <div class="section-header">
          <h3 class="section-title">🎁 可兑换奖励</h3>
          <button class="add-reward-btn" @click="showAddReward = !showAddReward">
            {{ showAddReward ? '收起' : '+ 添加' }}
          </button>
        </div>

        <!-- 添加奖励表单 -->
        <div v-if="showAddReward" class="add-reward-form">
          <input v-model="newReward.name" placeholder="奖励名称" class="form-input" />
          <div class="form-row">
            <input v-model.number="newReward.points" type="number" min="1" placeholder="所需积分" class="form-input small" />
            <input v-model="newReward.icon" placeholder="图标" maxlength="2" class="form-input icon-input" />
          </div>
          <button class="btn-primary" @click="addReward" :disabled="!newReward.name.trim()">添加奖励</button>
        </div>

        <!-- 奖励列表 -->
        <div class="rewards-grid">
          <div v-for="reward in rewards" :key="reward.id" class="reward-card">
            <span class="reward-icon">{{ reward.icon }}</span>
            <span class="reward-name">{{ reward.name }}</span>
            <span class="reward-points">{{ reward.points }}积分</span>
            <button 
              class="redeem-btn"
              @click="redeemReward(reward)"
              :disabled="totalPoints < reward.points"
            >
              兑换
            </button>
            <button class="delete-reward-btn" @click="deleteReward(reward)">×</button>
          </div>
        </div>

        <div v-if="rewards.length === 0" class="empty-state small">
          <p>还没有奖励</p>
          <p class="sub">添加一些奖励来激励孩子吧</p>
        </div>
      </div>

      <!-- 兑换记录 -->
      <div v-if="redemptions.length > 0" class="redemptions-section">
        <h3 class="section-title">📋 兑换记录</h3>
        <div class="redemptions-list">
          <div v-for="redemption in redemptions" :key="redemption.id" class="redemption-item">
            <span class="redemption-icon">🎁</span>
            <div class="redemption-info">
              <span class="redemption-name">{{ redemption.rewardName }}</span>
              <span class="redemption-date">{{ formatDateTime(redemption.redeemedAt) }}</span>
            </div>
            <span class="redemption-points">-{{ redemption.points }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就 Tab -->
    <div v-if="activeTab === 'badges'" class="tab-content">
      <div class="badges-section">
        <div class="section-header">
          <h3 class="section-title">🏅 我的成就</h3>
          <span class="badge-count">{{ earnedBadges.length }} / {{ allBadges.length }}</span>
        </div>

        <div class="badges-grid">
          <div 
            v-for="badge in allBadges" 
            :key="badge.type"
            class="badge-card"
            :class="{ earned: isBadgeEarned(badge.type) }"
          >
            <span class="badge-icon">{{ badge.icon }}</span>
            <span class="badge-name">{{ badge.name }}</span>
            <span class="badge-desc">{{ badge.description }}</span>
            <span v-if="isBadgeEarned(badge.type)" class="badge-date">
              {{ getBadgeDate(badge.type) }}
            </span>
            <span v-else class="badge-locked">🔒</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNav />

    <!-- 兑换成功弹窗 -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="success-modal">
        <div class="success-icon">🎉</div>
        <h3>兑换成功！</h3>
        <p>恭喜你获得了 "{{ redeemedRewardName }}"</p>
        <button class="btn-primary" @click="showSuccessModal = false">太棒了！</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store } from '../stores/store';
import { BADGE_DEFINITIONS, type Reward } from '../types';
import BottomNav from '../components/BottomNav.vue';
import ChildSelector from '../components/ChildSelector.vue';

const tabs = [
  { id: 'points', name: '积分', icon: '💰' },
  { id: 'rewards', name: '兑换', icon: '🎁' },
  { id: 'badges', name: '成就', icon: '🏅' },
];

const activeTab = ref('points');
const currentChild = computed(() => store.getCurrentChild());
const allBadges = BADGE_DEFINITIONS;

const onChildChanged = (_childId: string) => {
  // 刷新数据
};

// 等级
const levelInfo = computed(() => {
  if (!currentChild.value) return null;
  return store.getLevelInfo(currentChild.value.id);
});

const levelProgress = computed(() => {
  if (!currentChild.value) return { currentLevel: 1, currentPoints: 0, pointsToNextLevel: 100, progressPercent: 0 };
  return store.getLevelProgress(currentChild.value.id);
});

// 积分
const totalPoints = computed(() => {
  if (!currentChild.value) return 0;
  return store.getTotalPoints(currentChild.value.id);
});

const weekStats = computed(() => {
  if (!currentChild.value) return { completed: 0, total: 0, points: 0 };
  return store.getWeekTaskStats(currentChild.value.id);
});

const pointsHistory = computed(() => {
  if (!currentChild.value) return [];
  return store.getPointsHistory(currentChild.value.id);
});

const maxPoints = computed(() => {
  if (pointsHistory.value.length === 0) return 100;
  return Math.max(...pointsHistory.value.map(p => Math.abs(p.points)), 100);
});

// 奖励
const rewards = computed(() => store.getRewards());

const showAddReward = ref(false);
const newReward = ref({ name: '', points: 50, icon: '🎁' });

const addReward = () => {
  if (!newReward.value.name.trim()) return;
  store.addReward(newReward.value.name, newReward.value.points, newReward.value.icon);
  newReward.value = { name: '', points: 50, icon: '🎁' };
  showAddReward.value = false;
};

const deleteReward = (reward: Reward) => {
  if (confirm(`确定删除"${reward.name}"吗？`)) {
    store.removeReward(reward.id);
  }
};

const redemptions = computed(() => {
  if (!currentChild.value) return [];
  return store.getRedemptions(currentChild.value.id);
});

const redeemedRewardName = ref('');
const showSuccessModal = ref(false);

const redeemReward = (reward: Reward) => {
  if (!currentChild.value) return;
  
  if (totalPoints.value < reward.points) {
    alert('积分不足，无法兑换');
    return;
  }

  if (confirm(`确定用${reward.points}积分兑换"${reward.name}"吗？`)) {
    const success = store.redeemReward(currentChild.value.id, reward);
    if (success) {
      redeemedRewardName.value = reward.name;
      showSuccessModal.value = true;
    }
  }
};

// 徽章
const earnedBadges = computed(() => {
  if (!currentChild.value) return [];
  return store.getBadges(currentChild.value.id);
});

const isBadgeEarned = (type: string): boolean => {
  if (!currentChild.value) return false;
  return store.hasBadge(currentChild.value.id, type);
};

const getBadgeDate = (type: string): string => {
  if (!currentChild.value) return '';
  const badge = earnedBadges.value.find(b => b.type === type);
  if (!badge) return '';
  return formatDate(badge.earnedAt.split('T')[0]);
};

// 工具函数
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.motivation-page {
  padding-bottom: 80px;
}

.header-bar h2 {
  text-align: center;
  padding: var(--space-md);
  font-size: var(--font-size-xl);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  padding: 0 var(--space-md);
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

/* Level Card */
.level-card {
  margin: var(--space-md);
  margin-bottom: var(--space-sm);
  padding: var(--space-lg);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: var(--radius-xl);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.level-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.level-badge {
  position: relative;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.level-icon {
  font-size: 32px;
}

.level-number {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
}

.level-info {
  flex: 1;
}

.level-name {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.level-title {
  display: block;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.level-progress {
  margin-bottom: var(--space-md);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-xs);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffec8b 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.7);
}

.level-perks {
  display: flex;
  gap: var(--space-sm);
}

.perk-tag {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

/* Points Card */
.points-card {
  margin: var(--space-md);
  margin-top: var(--space-sm);
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  border-radius: var(--radius-xl);
  color: white;
}

.points-main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.points-icon {
  font-size: 40px;
}

.points-info {
  display: flex;
  flex-direction: column;
}

.points-value {
  font-size: 36px;
  font-weight: 700;
}

.points-label {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.points-stats {
  display: flex;
  gap: var(--space-md);
}

.stat-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.stat-label {
  font-size: var(--font-size-xs);
  opacity: 0.9;
}

/* Points History */
.points-history {
  padding: 0 var(--space-md);
}

.section-title {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.history-list {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.history-item {
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.history-points {
  font-weight: 700;
}

.history-points.positive {
  color: var(--color-success);
}

.history-points.negative {
  color: var(--color-danger);
}

.history-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.history-chart {
  height: 4px;
  background: var(--color-bg);
  border-radius: 2px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  background: var(--gradient-primary);
}

/* Rewards Section */
.rewards-section {
  padding: 0 var(--space-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.add-reward-btn {
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.add-reward-form {
  background: var(--color-bg-card);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-base);
}

.form-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.form-input.small {
  width: 100px;
}

.form-input.icon-input {
  width: 60px;
  text-align: center;
  font-size: 20px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

.reward-card {
  position: relative;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  text-align: center;
}

.reward-icon {
  font-size: 32px;
  display: block;
  margin-bottom: var(--space-xs);
}

.reward-name {
  display: block;
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin-bottom: 4px;
}

.reward-points {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.redeem-btn {
  width: 100%;
  padding: 8px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.redeem-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-reward-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
}

/* Redemptions */
.redemptions-section {
  padding: 0 var(--space-md);
  margin-top: var(--space-lg);
}

.redemptions-list {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

.redemption-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.redemption-item:last-child {
  border-bottom: none;
}

.redemption-icon {
  font-size: 24px;
}

.redemption-info {
  flex: 1;
}

.redemption-name {
  display: block;
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.redemption-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.redemption-points {
  color: var(--color-danger);
  font-weight: 600;
}

/* Badges */
.badges-section {
  padding: 0 var(--space-md);
}

.badge-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

.badge-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  text-align: center;
  opacity: 0.5;
  transition: all 0.2s;
}

.badge-card.earned {
  opacity: 1;
}

.badge-icon {
  font-size: 36px;
  display: block;
  margin-bottom: var(--space-xs);
}

.badge-name {
  display: block;
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin-bottom: 2px;
}

.badge-desc {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-xs);
}

.badge-date {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-success);
}

.badge-locked {
  font-size: 16px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-2xl);
}

.empty-state.small {
  padding: var(--space-lg);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: var(--space-md);
}

.empty-state p {
  color: var(--color-text-secondary);
}

.sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-xs);
}

.btn-link {
  display: inline-block;
  margin-top: var(--space-md);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.success-modal {
  width: 280px;
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  text-align: center;
}

.success-icon {
  font-size: 64px;
  margin-bottom: var(--space-md);
}

.success-modal h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-sm);
}

.success-modal p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}
</style>
