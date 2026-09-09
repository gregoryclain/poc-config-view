<script setup lang="ts">
import { onMounted, ref } from "vue";
import { screensApi } from "../api/client";
import type { ScreenRecord } from "../types/generator";

const screens = ref<ScreenRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    screens.value = await screensApi.list();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erreur de chargement";
  } finally {
    loading.value = false;
  }
}

async function remove(id: string) {
  await screensApi.remove(id);
  await load();
}

onMounted(load);
</script>

<template>
  <h1>Écrans</h1>

  <RouterLink to="/screens/new" class="btn">+ Nouvel écran</RouterLink>

  <p v-if="loading">Chargement…</p>
  <p v-else-if="error" style="color: #b91c1c">{{ error }}</p>

  <div v-else-if="screens.length === 0" class="empty-state">
    <p>Aucun écran pour l'instant.</p>
    <p><RouterLink to="/screens/new">Créez un premier écran</RouterLink> et posez-y des entities.</p>
  </div>

  <div v-else>
    <div v-for="screen in screens" :key="screen.id" class="card">
      <h3>{{ screen.name }}</h3>
      <p>{{ screen.data.items.length }} entité(s) posée(s)</p>
      <RouterLink :to="`/screens/${screen.id}`" class="btn secondary">Éditer</RouterLink>
      <RouterLink :to="`/screens/${screen.id}/preview`" class="btn secondary" style="margin-left: 8px">Prévisualiser</RouterLink>
      <button class="btn danger" style="margin-left: 8px" @click="remove(screen.id)">Supprimer</button>
    </div>
  </div>
</template>
