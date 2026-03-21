<template>
  <div class="page upgrade-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>解锁全部功能</h2>
      <span></span>
    </div>

    <div class="hero-section">
      <span class="hero-icon">🌟</span>
      <h1>升级成长积分宝</h1>
      <p>解锁更多能力，让孩子成长更精彩</p>
    </div>

    <div class="features-section">
      <h3>免费版 vs 专业版</h3>
      <div class="comparison">
        <div class="feature free">
          <span class="label">免费版</span>
          <ul>
            <li>1个孩子</li>
            <li>3个任务</li>
            <li>基础统计</li>
          </ul>
        </div>
        <div class="feature pro">
          <span class="label">专业版</span>
          <ul>
            <li>无限制孩子</li>
            <li>无限制任务</li>
            <li>详细数据分析</li>
            <li>数据导出</li>
            <li>云端备份</li>
            <li>持续更新</li>
          </ul>
          <span class="badge">推荐</span>
        </div>
      </div>
    </div>

    <div class="price-section">
      <div class="price-card">
        <span class="price">¥{{ proPrice }}</span>
        <span class="period">终身使用</span>
      </div>
    </div>

    <div class="action-section">
      <button class="btn-primary" @click="handlePurchase">
        立即解锁专业版
      </button>
      <p class="note">支付成功后功能即刻解锁</p>
    </div>

    <div class="demo-section">
      <button class="btn-demo" @click="handleDemo">
        演示解锁（测试用）
      </button>
      <p class="demo-note">点击后可直接体验专业版全部功能</p>
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

    <!-- 支付弹窗 -->
    <div class="modal" v-if="showPayModal">
      <div class="modal-content">
        <h3>扫码支付</h3>
        <div class="qrcode">
          <div class="placeholder">支付 {{ proPrice }} 元</div>
        </div>
        <p class="pay-note">支付完成后点击"已完成支付"</p>
        <div class="modal-btns">
          <button @click="showPayModal = false">取消</button>
          <button class="confirm" @click="confirmPayment">已完成支付</button>
        </div>
      </div>
    </div>

    <!-- 成功弹窗 -->
    <div class="modal success-modal" v-if="showSuccessModal">
      <div class="modal-content">
        <span class="success-icon">🎉</span>
        <h3>解锁成功！</h3>
        <p>欢迎使用专业版</p>
        <button class="btn-primary" @click="goHome">开始使用</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';

const router = useRouter();
const proPrice = ref(29); // 可以调整价格

const showPayModal = ref(false);
const showSuccessModal = ref(false);

const handlePurchase = () => {
  showPayModal.value = true;
};

const handleDemo = () => {
  store.unlockPro();
  showSuccessModal.value = true;
};

const confirmPayment = () => {
  // 实际项目中这里需要对接支付SDK验证
  store.unlockPro();
  showPayModal.value = false;
  showSuccessModal.value = true;
};

const goHome = () => {
  showSuccessModal.value = false;
  router.push('/');
};
</script>

<style scoped>
.upgrade-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f0f5 0%, #fff 100%);
  padding-bottom: 80px;
}

.header-bar {
  background: transparent;
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

.hero-section {
  text-align: center;
  padding: 40px 20px;
}

.hero-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.hero-section h1 {
  font-size: 24px;
  margin: 0 0 8px;
}

.hero-section p {
  color: #666;
  font-size: 14px;
}

.features-section {
  margin: 20px 16px;
}

.features-section h3 {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 16px;
}

.comparison {
  display: flex;
  gap: 12px;
}

.feature {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 16px;
  position: relative;
}

.feature.pro {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.feature .label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}

.feature ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
}

.feature ul li {
  padding: 6px 0;
  text-align: center;
}

.feature.free ul li {
  color: #999;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff9800;
  color: white;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 10px;
}

.price-section {
  margin: 24px 16px;
  text-align: center;
}

.price-card {
  display: inline-block;
  background: white;
  padding: 20px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.price {
  display: block;
  font-size: 40px;
  font-weight: 700;
  color: #667eea;
}

.price::before {
  content: '¥';
  font-size: 20px;
}

.period {
  color: #999;
  font-size: 13px;
}

.action-section {
  margin: 24px 16px;
  text-align: center;
}

.btn-primary {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.note {
  font-size: 12px;
  color: #999;
  margin-top: 12px;
}

.demo-section {
  margin: 16px;
  text-align: center;
  padding: 16px;
  background: rgba(0,0,0,0.03);
  border-radius: 12px;
}

.btn-demo {
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
}

.demo-note {
  font-size: 11px;
  color: #bbb;
  margin-top: 8px;
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
  width: 85%;
  max-width: 320px;
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 16px;
}

.qrcode {
  background: #f5f5f5;
  padding: 30px;
  margin-bottom: 16px;
  border-radius: 8px;
}

.placeholder {
  font-size: 14px;
  color: #666;
}

.pay-note {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.modal-btns {
  display: flex;
  gap: 12px;
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

.success-modal .modal-content {
  padding: 40px 24px;
}

.success-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.success-modal h3 {
  font-size: 20px;
}

.success-modal p {
  color: #666;
  margin-bottom: 24px;
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
