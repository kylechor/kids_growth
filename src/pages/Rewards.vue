<template>
  <div class="page rewards-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>奖励兑换</h2>
      <router-link to="/history" class="history-btn">记录</router-link>
    </div>

    <div class="current-points" v-if="currentChild">
      <span class="label">{{ currentChild.name }} 当前积分</span>
      <span class="value">{{ totalPoints }}</span>
    </div>

    <div class="rewards-section">
      <h3>可用奖励</h3>
      <div class="rewards-list" v-if="rewards.length > 0">
        <div v-for="reward in rewards" :key="reward.id" class="reward-card">
          <span class="reward-icon">{{ reward.icon }}</span>
          <div class="reward-info">
            <span class="reward-name">{{ reward.name }}</span>
            <span class="reward-points">{{ reward.points }} 积分</span>
          </div>
          <button 
            class="redeem-btn"
            :disabled="totalPoints < reward.points"
            @click="confirmRedeem(reward)"
          >
            兑换
          </button>
        </div>
      </div>
      <div class="empty-rewards" v-else>
        <p>还没有奖励</p>
        <p class="sub">添加孩子想要的奖励吧</p>
      </div>

      <button class="btn-outline" @click="showAddReward = !showAddReward">
        {{ showAddReward ? '取消添加' : '+ 添加奖励' }}
      </button>

      <div class="add-reward-form" v-if="showAddReward">
        <div class="icon-picker">
          <span 
            v-for="icon in iconOptions" 
            :key="icon"
            class="icon-option"
            :class="{ selected: newReward.icon === icon }"
            @click="newReward.icon = icon"
          >{{ icon }}</span>
        </div>
        <div class="input-group">
          <input v-model="newReward.name" placeholder="奖励名称，如：去游乐园" />
        </div>
        <div class="points-input">
          <label>所需积分</label>
          <div class="stepper">
            <button @click="newReward.points = Math.max(10, newReward.points - 10)">-</button>
            <span>{{ newReward.points }}</span>
            <button @click="newReward.points += 10">+</button>
          </div>
        </div>
        <button class="btn-primary" @click="addReward" :disabled="!newReward.name.trim()">
          确认添加
        </button>
      </div>
    </div>

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
        <p>确认兑换 "{{ redeemTarget?.name }}"?</p>
        <p class="points-info">将消耗 {{ redeemTarget?.points }} 积分</p>
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

.history-btn {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
}

.current-points {
  margin: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  text-align: center;
}

.current-points .label {
  display: block;
  font-size: 13px;
  opacity: 0.9;
}

.current-points .value {
  font-size: 40px;
  font-weight: 700;
}

.rewards-section {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.rewards-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.reward-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 10px;
}

.reward-icon {
  font-size: 28px;
}

.reward-info {
  flex: 1;
}

.reward-name {
  display: block;
  font-size: 15px;
}

.reward-points {
  font-size: 12px;
  color: #999;
}

.redeem-btn {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.redeem-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.empty-rewards {
  text-align: center;
  padding: 30px;
  color: #999;
}

.empty-rewards .sub {
  font-size: 13px;
  margin-top: 8px;
}

.btn-outline {
  width: 100%;
  padding: 12px;
  background: white;
  color: #667eea;
  border: 1px dashed #667eea;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
}

.add-reward-form {
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.icon-option {
  font-size: 24px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
}

.icon-option.selected {
  background: #e8e4f8;
}

.input-group {
  margin-bottom: 16px;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.points-input {
  margin-bottom: 16px;
}

.points-input label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 8px;
  width: fit-content;
}

.stepper button {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
}

.stepper span {
  font-size: 20px;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
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
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.record-icon {
  font-size: 24px;
}

.record-info {
  flex: 1;
}

.record-name {
  display: block;
  font-size: 14px;
}

.record-date {
  font-size: 12px;
  color: #999;
}

.record-points {
  color: #f44336;
  font-weight: 600;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 80%;
  max-width: 300px;
  text-align: center;
}

.points-info {
  color: #666;
  font-size: 14px;
}

.modal-btns {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.modal-btns button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #f5f5f5;
}

.modal-btns button.confirm {
  background: #4caf50;
  color: white;
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
