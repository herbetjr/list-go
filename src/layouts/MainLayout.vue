<template>
  <q-layout view="hHh lpR fFf" class="doodle-bg">
    <q-header class="bg-white text-dark shadow-1" height-hint="64">
      <q-toolbar class="q-px-lg q-py-sm">
        <div class="row items-center cursor-pointer" @click="irParaHome">
          <q-avatar size="38px" color="primary" text-color="white" icon="playlist_add_check" class="q-mr-sm shadow-1" />
          <div>
            <div class="text-weight-bolder text-h6 text-primary leading-tight">Listas Compartilhadas</div>
            <div class="text-caption text-grey-7" style="font-size: 11px; margin-top: -3px">Quem leva o quê?</div>
          </div>
        </div>

        <q-space />

        <div class="row items-center q-gutter-x-md">
                   <!-- Perfil do Usuário com Dropdown -->
          <q-btn-dropdown
            flat
            no-caps
            dense
            color="dark"
            class="q-px-sm"
          >
            <template #label>
              <div class="row items-center q-gutter-x-sm">
                <q-avatar size="32px" color="grey-3" text-color="primary" icon="person" />
                <div class="text-left gt-xs">
                  <div class="text-weight-medium text-body2 leading-tight">{{ auth.usuario?.nome || 'Usuário' }}</div>
                  <div class="text-caption text-grey-6" style="font-size: 10px">{{ auth.isAdmin ? 'Administrador' : 'Usuário' }}</div>
                </div>
              </div>
            </template>

            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup @click="irParaHome">
                <q-item-section avatar>
                  <q-icon name="list_alt" color="grey-7" />
                </q-item-section>
                <q-item-section>Minhas Listas</q-item-section>
              </q-item>

              <q-item v-if="auth.isAdmin" clickable v-close-popup @click="irParaUsuarios">
                <q-item-section avatar>
                  <q-icon name="manage_accounts" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Cadastro de Usuários</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="fazerLogout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">Sair</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth = useAuthStore();

function irParaHome() {
  void router.push('/app');
}

function irParaUsuarios() {
  void router.push('/app/usuarios');
}

function fazerLogout() {
  auth.logout();
  void router.replace('/');
}
</script>

