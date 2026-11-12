<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="(val: boolean) => emit('update:modelValue', val)"
  >
    <q-card style="width: 100%; max-width: 440px; border-radius: 20px;" class="q-pa-md">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h6 text-weight-bold row items-center q-gutter-x-sm">
          <q-icon name="share" color="primary" size="28px" />
          <span>Compartilhar lista</span>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="text-center q-py-md">
        <p class="text-grey-7 q-mb-md" style="font-size: 0.95rem">
          Envie o link ou mostre o QR Code abaixo. <strong>Quem for contribuir não precisa de login</strong>, basta informar o nome e o item que vai levar!
        </p>

        <div class="row justify-center q-my-sm">
          <canvas ref="canvasRef" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08)"></canvas>
        </div>

        <div class="q-mt-md">
          <q-input
            v-model="urlCompleta"
            readonly
            outlined
            dense
            bg-color="grey-1"
          >
            <template #append>
              <q-btn
                flat
                dense
                color="primary"
                icon="content_copy"
                label="Copiar"
                @click="copiarLink"
              />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <q-card-actions align="center" class="q-gutter-sm q-pt-none">
        <q-btn
          unelevated
          rounded
          class="full-width btn-action-green"
          icon="share"
          label="Compartilhar no WhatsApp"
          @click="compartilharWhatsApp"
        />
        <q-btn
          flat
          rounded
          color="grey-7"
          label="Fechar"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import QRCode from 'qrcode';
import { useQuasar } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
  codigoCompartilhamento: string;
  tituloLista: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const $q = useQuasar();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const urlCompleta = computed(() => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/lista/${props.codigoCompartilhamento}`;
});

watch(
  () => props.modelValue,
  async (aberto) => {
    if (aberto) {
      await nextTick();
      if (canvasRef.value && urlCompleta.value) {
        QRCode.toCanvas(canvasRef.value, urlCompleta.value, {
          width: 200,
          margin: 2,
          color: {
            dark: '#0ea5e9',
            light: '#ffffff',
          },
        });
      }
    }
  },
);

async function copiarLink() {
  try {
    await navigator.clipboard.writeText(urlCompleta.value);
    $q.notify({
      type: 'positive',
      message: 'Link copiado para a área de transferência!',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Não foi possível copiar automaticamente.',
      position: 'top',
    });
  }
}

function compartilharWhatsApp() {
  const texto = encodeURIComponent(
    `Olá! Veja a nossa lista "${props.tituloLista}" no Quem Leva o Quê? e marque o que você vai levar: ${urlCompleta.value}`,
  );
  window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
}
</script>

