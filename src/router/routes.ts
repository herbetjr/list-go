import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/features/auth/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/primeiro-acesso',
    component: () => import('@/features/auth/pages/PrimeiroAcessoPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/app',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/features/home/pages/HomePage.vue'),
      },
      {
        path: 'lista/:id',
        component: () => import('@/features/lista/pages/DetalheListaPage.vue'),
      },
      {
        path: 'usuarios',
        component: () => import('@/features/usuarios/pages/UsuariosPage.vue'),
      },
    ],
  },
  {
    // Rota pública para quem acessa o link compartilhado sem necessidade de login!
    path: '/lista/:codigo',
    component: () => import('@/features/lista/pages/CompartilharListaPage.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

export default routes;

