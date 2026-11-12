import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from '@/stores/auth.store';
import { setUnauthorizedHandler } from '@/services/http';

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : createWebHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  const auth = useAuthStore(store);

  Router.beforeEach(async (to) => {
    if (to.meta.requiresAuth) {
      const sessaoAtiva = await auth.restaurarSessao();
      if (!sessaoAtiva) return '/';

      if (auth.needsPasswordChange && to.path !== '/primeiro-acesso') {
        return '/primeiro-acesso';
      }

      if (!auth.needsPasswordChange && to.path === '/primeiro-acesso') {
        return '/app';
      }
    } else if (to.meta.guestOnly && auth.isAuthenticated) {
      const sessaoAtiva = await auth.restaurarSessao();
      if (sessaoAtiva) {
        if (auth.needsPasswordChange) {
          return '/primeiro-acesso';
        }
        return '/app';
      }
    }
  });

  setUnauthorizedHandler(() => {
    auth.logout();
    void Router.replace('/');
  });

  return Router;
});

