<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { GridItem, GridLayout } from "grid-layout-plus";
import { entitiesApi, screensApi } from "../api/client";
import {
  DEFAULT_ITEM_H,
  DEFAULT_ITEM_W,
  GRID_COLS,
  GRID_ROW_HEIGHT,
  GRID_ROWS,
  type EntityRecord,
  type ScreenItem,
} from "../types/generator";

const route = useRoute();
const router = useRouter();

const screenId = route.params.id as string | undefined;
const name = ref("");
const domain = ref("");
const layout = ref<ScreenItem[]>([]);
const entities = ref<EntityRecord[]>([]);
const loading = ref(true);
const canvasEl = ref<HTMLElement | null>(null);

function entityFor(id: string): EntityRecord | undefined {
  return entities.value.find((e) => e.id === id);
}

async function load() {
  loading.value = true;
  entities.value = await entitiesApi.list();
  if (screenId) {
    const screen = await screensApi.get(screenId);
    name.value = screen.name;
    domain.value = screen.data.domain ?? "";
    layout.value = screen.data.items;
  }
  loading.value = false;
}

function onDragStart(event: DragEvent, entityId: string) {
  event.dataTransfer?.setData("text/plain", entityId);
}

function onDrop(event: DragEvent) {
  const entityId = event.dataTransfer?.getData("text/plain");
  if (!entityId || !canvasEl.value) return;

  const rect = canvasEl.value.getBoundingClientRect();
  const colWidth = rect.width / GRID_COLS;
  const rowPx = GRID_ROW_HEIGHT + 10;

  let x = Math.floor((event.clientX - rect.left) / colWidth);
  let y = Math.floor((event.clientY - rect.top) / rowPx);
  x = Math.max(0, Math.min(x, GRID_COLS - DEFAULT_ITEM_W));
  y = Math.max(0, y);

  layout.value.push({
    i: crypto.randomUUID(),
    entityId,
    x,
    y,
    w: DEFAULT_ITEM_W,
    h: DEFAULT_ITEM_H,
  });
}

function removeItem(i: string) {
  layout.value = layout.value.filter((item) => item.i !== i);
}

async function save() {
  const data = {
    name: name.value.trim(),
    domain: domain.value.trim() || undefined,
    items: layout.value.map(({ i, entityId, x, y, w, h }) => ({ i, entityId, x, y, w, h })),
  };
  if (screenId) {
    await screensApi.update(screenId, data);
  } else {
    await screensApi.create(data);
  }
  router.push("/screens");
}

const canvasWidth = computed(() => GRID_COLS * 60);

onMounted(load);
</script>

<template>
  <h1>{{ screenId ? "Éditer l'écran" : "Nouvel écran" }}</h1>

  <p v-if="loading">Chargement…</p>

  <template v-else>
    <div class="field-row">
      <label for="screen-name">Nom de l'écran</label>
      <input id="screen-name" v-model="name" required placeholder="Ex: Fiche contact" />
    </div>

    <div class="field-row">
      <label for="screen-domain">Domaine métier</label>
      <input id="screen-domain" v-model="domain" placeholder="Ex: contact" />
    </div>

    <div style="display: flex; gap: 24px; align-items: flex-start">
      <div style="width: 220px; flex-shrink: 0">
        <h3>Entities</h3>
        <p style="font-size: 13px; color: #666">Glissez une entity sur le canvas.</p>
        <div
          v-for="entity in entities"
          :key="entity.id"
          class="card"
          draggable="true"
          style="cursor: grab; padding: 8px 12px; margin-bottom: 8px"
          @dragstart="onDragStart($event, entity.id)"
        >
          {{ entity.name }}
        </div>
        <p v-if="entities.length === 0" style="font-size: 13px; color: #666">
          Aucune entity. <RouterLink to="/entities">Créez-en une</RouterLink>.
        </p>
      </div>

      <div
        ref="canvasEl"
        style="border: 1px dashed #ccc; background: #fafafa; overflow: auto"
        :style="{ width: `${canvasWidth}px` }"
        @dragover.prevent
        @drop="onDrop"
      >
        <GridLayout
          v-model:layout="layout"
          :col-num="GRID_COLS"
          :max-rows="GRID_ROWS"
          :row-height="GRID_ROW_HEIGHT"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="true"
          :use-css-transforms="true"
        >
          <GridItem
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
          >
            <div class="card" style="height: 100%; margin: 0; box-sizing: border-box; position: relative">
              <strong>{{ entityFor(item.entityId)?.name ?? "?" }}</strong>
              <div style="font-size: 12px; color: #666">
                {{ entityFor(item.entityId)?.data.fields.length ?? 0 }} champ(s)
              </div>
              <button
                type="button"
                class="btn danger"
                style="position: absolute; top: 4px; right: 4px; padding: 2px 8px"
                @click="removeItem(item.i)"
              >
                ×
              </button>
            </div>
          </GridItem>
        </GridLayout>
      </div>
    </div>

    <button type="button" class="btn" style="margin-top: 16px" @click="save">Enregistrer</button>
    <RouterLink
      v-if="screenId"
      :to="`/screens/${screenId}/preview`"
      class="btn secondary"
      style="margin-left: 8px"
    >Prévisualiser</RouterLink>
    <RouterLink to="/screens" class="btn secondary" style="margin-left: 8px">Annuler</RouterLink>
  </template>
</template>
