<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { entitiesApi, fieldTypesApi, screensApi } from "../api/client";
import { resolveEntityFields } from "../utils/resolveFields";
import type { EntityRecord, FieldTypeRecord, ScreenRecord } from "../types/generator";

const props = defineProps<{ id: string }>();

const screen = ref<ScreenRecord | null>(null);
const entities = ref<EntityRecord[]>([]);
const fieldTypes = ref<FieldTypeRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [screenRecord, entityList, fieldTypeList] = await Promise.all([
      screensApi.get(props.id),
      entitiesApi.list(),
      fieldTypesApi.list(),
    ]);
    screen.value = screenRecord;
    entities.value = entityList;
    fieldTypes.value = fieldTypeList;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erreur de chargement";
  } finally {
    loading.value = false;
  }
}

// Raw records exactly as stored/served by the API (screen + only the entities it places).
const rawJson = computed(() => {
  if (!screen.value) return "";
  const placedEntityIds = new Set(screen.value.data.items.map((i) => i.entityId));
  const placedEntities = entities.value.filter((e) => placedEntityIds.has(e.id));
  return JSON.stringify({ screen: screen.value, entities: placedEntities }, null, 2);
});

// Resolved view: each screen item with its entity's fields fully merged (field type + overrides).
const resolvedJson = computed(() => {
  if (!screen.value) return "";
  const items = screen.value.data.items.map((item) => {
    const entity = entities.value.find((e) => e.id === item.entityId);
    return {
      position: { x: item.x, y: item.y, w: item.w, h: item.h },
      entityName: entity?.name ?? null,
      fields: entity ? resolveEntityFields(entity, fieldTypes.value) : [],
    };
  });
  return JSON.stringify({ name: screen.value.name, items }, null, 2);
});

onMounted(load);
</script>

<template>
  <p v-if="loading">Chargement…</p>
  <p v-else-if="error" style="color: #b91c1c">{{ error }}</p>

  <template v-else-if="screen">
    <h1>{{ screen.name }} — config JSON</h1>
    <RouterLink :to="`/screens/${props.id}`" class="btn secondary">Éditer</RouterLink>
    <RouterLink :to="`/screens/${props.id}/preview`" class="btn secondary" style="margin-left: 8px">Prévisualiser</RouterLink>

    <h3 style="margin-top: 24px">Résolu (champs mergés, ce que consomme un renderer)</h3>
    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; overflow: auto; max-height: 500px">{{ resolvedJson }}</pre>

    <h3>Brut (tel que stocké en base / servi par l'API)</h3>
    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; overflow: auto; max-height: 500px">{{ rawJson }}</pre>
  </template>
</template>
