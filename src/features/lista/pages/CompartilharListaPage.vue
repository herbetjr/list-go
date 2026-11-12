<template>
  <q-layout view="hHh lpR fFf" class="doodle-bg">
    <!-- Barra Superior Pública -->
    <q-header class="bg-white text-dark shadow-1">
      <q-toolbar class="q-px-lg q-py-sm">
        <div class="row items-center cursor-pointer" @click="irParaLogin">
          <q-avatar size="36px" color="primary" text-color="white" icon="playlist_add_check" class="q-mr-sm" />
          <div>
            <div class="text-weight-bolder text-h6 text-primary leading-tight">Listas Compartilhadas</div>
            <div class="text-caption text-grey-7" style="font-size: 11px">Colaboração Aberta</div>
          </div>
        </div>

        <q-space />

        <div class="row items-center q-gutter-x-sm">
          <q-badge color="light-blue-1" text-color="primary" class="q-pa-xs gt-xs text-weight-bold">
            <q-icon name="public" size="14px" class="q-mr-xs" />
            Link Compartilhado
          </q-badge>

          <q-btn
            flat
            no-caps
            rounded
            color="primary"
            label="Entrar"
            icon="login"
            @click="irParaLogin"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-py-xl q-px-md">
        <!-- Banner explicativo sutil no topo -->
        <div class="row justify-center q-mb-md">
          <div class="col-12 col-xl-10">
            <q-banner rounded class="bg-white text-grey-8 shadow-1 q-py-sm">
              <template #avatar>
                <q-icon name="info" color="primary" />
              </template>
              <div class="text-body2">
                <strong>Você foi convidado para colaborar nesta lista!</strong>
                Não é necessário fazer login. Informe seu nome e clique no item que deseja assumir.
              </div>
            </q-banner>
          </div>
        </div>

        <ListaViewer
          :id-ou-codigo="route.params.codigo as string"
          :modo-compartilhado="true"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import ListaViewer from '../components/ListaViewer.vue';

const route = useRoute();
const router = useRouter();

function irParaLogin() {
  void router.push('/');
}
</script>

