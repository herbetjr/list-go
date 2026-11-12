<template>
  <q-page class="q-py-lg q-px-md">
    <div class="row justify-center q-mb-md">
      <div class="col-12 col-xl-10 row items-center justify-between">
        <q-btn
          flat
          no-caps
          color="grey-8"
          icon="arrow_back"
          label="Voltar para a Home"
          @click="voltar"
        />
        <div class="row items-center q-gutter-x-sm">
          <q-btn
            v-if="viewerRef?.isDonoDaLista"
            unelevated
            color="primary"
            icon="admin_panel_settings"
            label="Administradores"
            @click="abrirAdministradores"
          >
            <q-tooltip>Vincular outros administradores e gerenciar permissões</q-tooltip>
          </q-btn>
          <q-btn
            unelevated
            class="btn-action-green"
            icon="share"
            label="Compartilhar lista"
            @click="abrirCompartilhar"
          />
        </div>
      </div>
    </div>

    <ListaViewer
      ref="viewerRef"
      :id-ou-codigo="route.params.id as string"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ListaViewer from '../components/ListaViewer.vue';

const route = useRoute();
const router = useRouter();
const viewerRef = ref<InstanceType<typeof ListaViewer> | null>(null);

function voltar() {
  void router.push('/app');
}

function abrirCompartilhar() {
  viewerRef.value?.abrirCompartilhar();
}

function abrirAdministradores() {
  viewerRef.value?.abrirAdministradores();
}
</script>

