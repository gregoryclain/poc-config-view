<script setup lang="ts">
import { onMounted, ref } from "vue";
import { actionsApi } from "../api/client";
import type { ActionRecord } from "../types/generator";

const actions = ref<ActionRecord[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  actions.value = await actionsApi.list();
  loading.value = false;
}

onMounted(load);
</script>

<template>
  <h1>Actions</h1>
  <p style="font-size: 13px; color: #666">
    Actions disponibles pour composer un bouton sur une entity — catalogue fixe pour l'instant, le
    paramétrage (quels champs elles concernent) se fait sur chaque entity, dans le composeur.
  </p>

  <p v-if="loading">Chargement…</p>

  <div v-else>
    <div v-for="action in actions" :key="action.id" class="card">
      <strong>{{ action.data.label }}</strong>
      <small style="display: block">nom: {{ action.data.name }}</small>
    </div>
  </div>
</template>
