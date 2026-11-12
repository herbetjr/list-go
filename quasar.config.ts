import { defineConfig } from "#q-app";

export default defineConfig(() => {
  return {
    boot: [],

    css: ["app.scss"],

    extras: [
      "roboto-font",
      "material-icons"
    ],

    build: {
      target: {},
      typescript: {
        strict: true,
        vueShim: true
      },
      vueRouterMode: "history"
    },

    devServer: {
      host: "0.0.0.0",
      port: 9000,
      open: false,
      proxy: {
        "/api": "http://127.0.0.1:3000"
      }
    },

    framework: {
      config: {},
      lang: "pt-BR",
      plugins: ["Notify", "Dialog"]
    },

    animations: []
  };
});

