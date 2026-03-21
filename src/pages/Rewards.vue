<template>
  <div class="page rewards-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>奖励兑换</h2>
      <router-link to="/history" class="history-btn" v-if="redemptions.length > 0">记录</router-link>
      <span v-else></span>
    </div>

    <!-- 积分展示 -->
    <div class="points-card" v-if="currentChild">
      <div class="points-main">
        <span class="points-label">{{ currentChild.name }} 的积分</span>
        <div class="points-value">
          <span class="number">{{ totalPoints }}</span>
          <span class="unit">分</span>
        </div>
      </div>
      <div class="points-icon">⭐</div>
    </div>

    <!-- 奖励列表 -->
    <div class="rewards-section">
      <div class="section-header">
        <h3>可用奖励</h3>
        <button class="add-btn" @click="showAddReward = !showAddReward">
          {{ showAddReward ? '收起' : '+ 添加' }}
        </button>
      </div>

      <div class="rewards-list" v-if="rewards.length > 0">
        <div v-for="reward in rewards" :key="reward.id" class="reward-card">
          <div class="reward-icon-wrapper">
            <span class="reward-icon">{{ reward.icon }}</span>
          </div>
          <div class="reward-info">
            <span class="reward-name">{{ reward.name }}</span>
            <span class="reward-points">
              <span class="icon">⭐</span>
              {{ reward.points }} 积分
            </span>
          </div>
          <button 
            class="redeem-btn"
            :class="{ disabled: totalPoints < reward.points }"
            @click="confirmRedeem(reward)"
          >
            兑换
          </button>
        </div>
      </div>
      <div class="empty-rewards" v-else>
        <div class="empty-icon">🎁</div>
        <p>还没有奖励</p>
        <p class="sub">添加孩子想要的奖励吧</p>
      </div>

      <!-- 添加奖励表单 -->
      <div class="add-form" v-if="showAddReward">
        <div class="form-title">添加新奖励</div>
        
        <div class="picker-section">
          <label>选择图标</label>
          <div class="icon-picker">
            <button 
              v-for="icon in iconOptions" 
              :key="icon"
              class="icon-option"
              :class="{ selected: newReward.icon === icon }"
              @click="newReward.icon = icon"
            >
              {{ icon }}
            </button>
          </div>
        </div>

        <div class="input-group">
          <input v-model="newReward.name" placeholder="奖励名称，如：去游乐园" />
        </div>

        <div class="points-input">
          <label>所需积分</label>
          <div class="stepper">
            <button @click="newReward.points = Math.max(10, newReward.points - 10)">−</button>
            <span class="value">{{ newReward.points }}</span>
            <button @click="newReward.points += 10">+</button>
          </div>
        </div>

        <button class="btn-primary" @click="addReward" :disabled="!newReward.name.trim()">
          确认添加
        </button>
      </div>
    </div>

    <!-- 兑换记录 -->
    <div class="history-section" v-if="redemptions.length > 0">
      <h3>兑换记录</h3>
      <div class="history-list">
        <div v-for="record in redemptions" :key="record.id" class="history-item">
          <span class="record-icon">🎁</span>
          <div class="record-info">
            <span class="record-name">{{ record.rewardName }}</span>
            <span class="record-date">{{ formatDate(record.redeemedAt) }}</span>
          </div>
          <span class="record-points">-{{ record.points }}</span>
        </div>
      </div>
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
      <router-link to="/rewards" class="nav-item active">
        <span class="nav-icon">🎁</span>
        <span>奖励</span>
      </router-link>
    </div>

    <!-- 确认兑换弹窗 -->
    <div class="modal" v-if="showRedeemConfirm">
      <div class="modal-content">
        <div class="modal-icon">{{ redeemTarget?.icon }}</div>
        <p class="modal-title">确认兑换</p>
        <p class="reward-name-display">{{ redeemTarget?.name }}</p>
        <div class="points-preview">
          <span class="icon">⭐</span>
          <span class="amount">-{{ redeemTarget?.points }}</span>
        </div>
        <div class="modal-btns">
          <button @click="showRedeemConfirm = false">取消</button>
          <button class="confirm" @click="redeem">确认兑换</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store } from '../stores/store';
import type { Reward } from '../types';

const currentChild = computed(() => store.getCurrentChild());
const rewards = computed(() => store.getRewards());
const totalPoints = computed(() => currentChild.value ? store.getTotalPoints(currentChild.value.id) : 0);
const redemptions = computed(() => currentChild.value ? store.getRedemptions(currentChild.value.id) : []);

const iconOptions = ['🎮', '🎬', '🍦', '🍔', '🎁', '🎠', '🏊', '🚲', '📱', '🎨', '⚽', '🎸'];
const showAddReward = ref(false);
const newReward = ref({
  name: '',
  points: 100,
  icon: '🎁',
});

const showRedeemConfirm = ref(false);
const redeemTarget = ref<Reward | null>(null);

const addReward = () => {
  if (!newReward.value.name.trim()) return;
  store.addReward(newReward.value.name, newReward.value.points, newReward.value.icon);
  newReward.value = { name: '', points: 100, icon: '🎁' };
  showAddReward.value = false;
};

const confirmRedeem = (reward: Reward) => {
  redeemTarget.value = reward;
  showRedeemConfirm.value = true;
};

const redeem = () => {
  if (redeemTarget.value && currentChild.value) {
    store.redeemReward(currentChild.value.id, redeemTarget.value);
    showRedeemConfirm.value = false;
    redeemTarget.value = null;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
</script>

<style scoped>
.rewards-page {
  background: var(--color-bg);
}

/* Header */
.history-btn {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius-full);
}

/* Points Card */
.points-card {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-lg);
}

.points-main .points-label {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.points-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 4px;
}

.points-value .number {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.points-value .unit {
  font-size: var(--font-size-lg);
  opacity: 0.8;
}

.points-icon {
  font-size: 56px;
  opacity: 0.8;
}

/* Rewards Section */
.rewards-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
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

.add-btn {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  border: none;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-weight: 500;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.reward-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.reward-icon-wrapper {
  width: 48px;
  height: 48px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.reward-icon {
  font-size: 24px;
}

.reward-info {
  flex: 1;
}

.reward-name {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
}

.reward-points {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.reward-points .icon {
  font-size: 12px;
}

.redeem-btn {
  padding: 10px 20px;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.redeem-btn.disabled {
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

.redeem-btn:not(.disabled):active {
  transform: scale(0.95);
}

.empty-rewards {
  text-align: center;
  padding: var(--space-xl);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.empty-rewards p {
  color: var(--color-text-secondary);
}

.empty-rewards .sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* Add Form */
.add-form {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.form-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--space-md);
  text-align: center;
}

.picker-section {
  margin-bottom: var(--space-md);
}

.picker-section label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.icon-option {
  width: 44px;
  height: 44px;
  font-size: 22px;
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-option.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
}

.points-input {
  margin-bottom: var(--space-md);
}

.points-input label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.stepper {
  display: flex;
  align-items: center;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-xs);
  width: fit-content;
}

.stepper button {
  width: 44px;
  height: 44px;
  border: none;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.stepper .value {
  min-width: 80px;
  text-align: center;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

/* History Section */
.history-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.history-section h3 {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-bottom: var(--space-md);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.history-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.record-icon {
  font-size: 24px;
}

.record-info {
  flex: 1;
}

.record-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.record-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.record-points {
  color: var(--color-danger);
  font-weight: 700;
  font-size: var(--font-size-base);
}

/* Modal */
.modal-icon {
  font-size: 64px;
  margin-bottom: var(--space-md);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.reward-name-display {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.points-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
}

.points-preview .icon {
  font-size: 20px;
}

.points-preview .amount {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-danger);
}

.modal-btns button.confirm {
  background: var(--color-success);
  color: white;
}
</style>
