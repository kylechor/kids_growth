<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
/* ============================================
   CSS Variables - Design System
   ============================================ */
:root {
  /* Colors - Modern Flat Palette */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  --color-accent: #f472b6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  /* Neutrals */
  --color-bg: #f8fafc;
  --color-bg-card: #ffffff;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-border: #e2e8f0;
  --color-divider: #f1f5f9;
  
  /* Shadows - Layered for depth */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --gradient-hero: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  --gradient-success: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
  --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* Z-index */
  --z-nav: 50;
  --z-modal: 100;
  --z-celebration: 200;
}

/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-size-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility Classes */
.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: calc(70px + env(safe-area-inset-bottom, 20px));
}

.card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-md);
}

.btn-primary {
  width: 100%;
  padding: 14px var(--space-md);
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  width: 100%;
  padding: 12px var(--space-md);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

/* Nav Bar */
.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 12px));
  box-shadow: 0 -1px 0 var(--color-border), var(--shadow-lg);
  z-index: var(--z-nav);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: 500;
  padding: 4px 12px;
  transition: all var(--transition-fast);
}

.nav-item .nav-icon {
  font-size: 22px;
  transition: transform var(--transition-fast);
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-md);
}

.modal-content {
  background: var(--color-bg-card);
  padding: var(--space-lg);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 320px;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.modal-btns {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.modal-btns button {
  flex: 1;
  padding: 12px var(--space-md);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.modal-btns button:active {
  transform: scale(0.98);
}

.modal-btns button.danger {
  background: var(--color-danger);
  color: white;
}

/* Header Bar */
.header-bar {
  background: var(--color-bg-card);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
}

.header-bar .back-btn {
  font-size: 22px;
  color: var(--color-text);
  text-decoration: none;
  padding: var(--space-xs);
  margin-left: calc(-1 * var(--space-xs));
}

.header-bar h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
}

/* Form Elements */
.input-group {
  margin-bottom: var(--space-md);
}

.input-group input {
  width: 100%;
  padding: 14px var(--space-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--color-bg);
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.input-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

/* Empty State */
.empty-state {
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
}

.empty-state p {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
