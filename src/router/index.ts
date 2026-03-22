import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import Children from '../pages/Children.vue';
import Tasks from '../pages/Tasks.vue';
import Rewards from '../pages/Rewards.vue';
import History from '../pages/History.vue';
import Upgrade from '../pages/Upgrade.vue';
import Badges from '../pages/Badges.vue';
import Projects from '../pages/Projects.vue';
import Study from '../pages/Study.vue';
import Motivation from '../pages/Motivation.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/children', name: 'Children', component: Children },
  { path: '/tasks', name: 'Tasks', component: Tasks },
  { path: '/rewards', name: 'Rewards', component: Rewards },
  { path: '/history', name: 'History', component: History },
  { path: '/upgrade', name: 'Upgrade', component: Upgrade },
  { path: '/badges', name: 'Badges', component: Badges },
  { path: '/projects', name: 'Projects', component: Projects },
  { path: '/study', name: 'Study', component: Study },
  { path: '/motivation', name: 'Motivation', component: Motivation },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
