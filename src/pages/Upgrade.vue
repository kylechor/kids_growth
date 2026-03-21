<template>
  <div class="page upgrade-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>解锁全部功能</h2>
      <span></span>
    </div>

    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-icon">✨</div>
      <h1>升级成长积分宝</h1>
      <p>解锁更多能力，让孩子成长更精彩</p>
    </div>

    <!-- Feature Comparison -->
    <div class="comparison-section">
      <div class="comparison-card free">
        <span class="plan-label">免费版</span>
        <ul class="feature-list">
          <li>
            <span class="check">✓</span>
            1个孩子
          </li>
          <li>
            <span class="check">✓</span>
            3个任务
          </li>
          <li>
            <span class="check">✓</span>
            基础统计
          </li>
        </ul>
      </div>
      <div class="comparison-card pro">
        <div class="pro-badge">推荐</div>
        <span class="plan-label">专业版</span>
        <ul class="feature-list">
          <li>
            <span class="check">✓</span>
            无限制孩子
          </li>
          <li>
            <span class="check">✓</span>
            无限制任务
          </li>
          <li>
            <span class="check">✓</span>
            详细数据分析
          </li>
          <li>
            <span class="check">✓</span>
            数据导出
          </li>
          <li>
            <span class="check">✓</span>
            云端备份
          </li>
          <li>
            <span class="check">✓</span>
            持续更新
          </li>
        </ul>
      </div>
    </div>

    <!-- Price Section -->
    <div class="price-section">
      <div class="price-card">
        <span class="currency">¥</span>
        <span class="amount">{{ proPrice }}</span>
        <span class="period">终身使用</span>
      </div>
    </div>

    <!-- CTA Buttons -->
    <div class="cta-section">
      <button class="btn-primary large" @click="handlePurchase">
        立即解锁专业版
      </button>
      <p class="note">支付成功后功能即刻解锁</p>
    </div>

    <!-- Demo Button -->
    <div class="demo-section">
      <button class="demo-btn" @click="handleDemo">
        演示解锁（测试用）
      </button>
      <p class="demo-note">点击后可直接体验专业版全部功能</p>
    </div>

    <!-- Bottom Nav -->
    <BottomNav />

    <!-- Pay Modal -->
    <div class="modal" v-if="showPayModal">
      <div class="modal-content">
        <h3>扫码支付</h3>
        <div class="qrcode-wrapper">
          <div class="qrcode-placeholder">
            <span>¥</span>
            <span class="amount">{{ proPrice }}</span>
          </div>
        </div>
        <p class="pay-note">支付完成后点击"已完成支付"</p>
        <div class="modal-btns">
          <button @click="showPayModal = false">取消</button>
          <button class="confirm" @click="confirmPayment">已完成支付</button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div class="modal success-modal" v-if="showSuccessModal">
      <div class="modal-content success-content">
        <div class="success-icon">🎉</div>
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
import BottomNav from '../components/BottomNav.vue';

const router = useRouter();
const proPrice = ref(29);

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
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
}

.hero-icon {
  font-size: 72px;
  display: block;
  margin-bottom: var(--space-md);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.hero-section h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-sm);
}

.hero-section p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

/* Comparison Section */
.comparison-section {
  display: flex;
  gap: var(--space-md);
  padding: 0 var(--space-md);
  margin-bottom: var(--space-lg);
}

.comparison-card {
  flex: 1;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  position: relative;
  box-shadow: var(--shadow-md);
}

.comparison-card.pro {
  background: var(--gradient-hero);
  color: white;
}

.pro-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-warning);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.plan-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--space-md);
  opacity: 0.9;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.check {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.comparison-card.free .check {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

/* Price Section */
.price-section {
  padding: var(--space-lg) var(--space-md);
  display: flex;
  justify-content: center;
}

.price-card {
  background: var(--color-bg-card);
  padding: var(--space-lg) var(--space-2xl);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: baseline;
  gap: 4px;
  box-shadow: var(--shadow-xl);
}

.currency {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-primary);
}

.amount {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.period {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-left: var(--space-sm);
}

/* CTA Section */
.cta-section {
  padding: 0 var(--space-md);
  text-align: center;
}

.btn-primary.large {
  padding: 16px;
  font-size: var(--font-size-lg);
}

.note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-sm);
}

/* Demo Section */
.demo-section {
  margin: var(--space-lg) var(--space-md);
  margin-bottom: 100px;
  padding: var(--space-md);
  text-align: center;
}

.demo-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  cursor: pointer;
}

.demo-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  opacity: 0.7;
  margin-top: var(--space-xs);
}

/* Modal */
.modal-content h3 {
  margin: 0 0 var(--space-md);
  font-size: var(--font-size-lg);
}

.qrcode-wrapper {
  background: var(--color-bg);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.qrcode-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-text-muted);
}

.qrcode-placeholder .amount {
  font-size: var(--font-size-2xl);
  color: var(--color-text);
}

.pay-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
}

.modal-btns button.confirm {
  background: var(--color-success);
  color: white;
}

/* Success Modal */
.success-content {
  padding: var(--space-xl);
}

.success-icon {
  font-size: 72px;
  display: block;
  margin-bottom: var(--space-md);
  animation: celebrate 0.6s ease;
}

@keyframes celebrate {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.success-content h3 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-xs);
}

.success-content p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
}
</style>
