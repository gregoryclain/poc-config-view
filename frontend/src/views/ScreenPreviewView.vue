<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { actionsApi, entitiesApi, entityValuesApi, fieldTypesApi, screensApi } from "../api/client";
import FieldPreview from "../components/FieldPreview.vue";
import Modal from "../components/Modal.vue";
import { resolveEntityFields } from "../utils/resolveFields";
import { GRID_COLS, type ActionRecord, type EntityRecord, type FieldTypeRecord, type ScreenRecord } from "../types/generator";

const route = useRoute();
const screenId = route.params.id as string;

const screen = ref<ScreenRecord | null>(null);
const entities = ref<EntityRecord[]>([]);
const fieldTypes = ref<FieldTypeRecord[]>([]);
const actions = ref<ActionRecord[]>([]);
const valuesByEntityId = reactive<Record<string, Record<string, string>>>({});
const loading = ref(true);

const openDropdownKey = ref<string | null>(null);
const activeModal = ref<{ entityId: string; fieldTypeId: string } | null>(null);
const modalValue = ref("");

async function load() {
  loading.value = true;
  const [screenRecord, entityList, fieldTypeList, actionList] = await Promise.all([
    screensApi.get(screenId),
    entitiesApi.list(),
    fieldTypesApi.list(),
    actionsApi.list(),
  ]);
  screen.value = screenRecord;
  entities.value = entityList;
  fieldTypes.value = fieldTypeList;
  actions.value = actionList;

  const uniqueEntityIds = [...new Set(screenRecord.data.items.map((i) => i.entityId))];
  const valueRecords = await Promise.all(uniqueEntityIds.map((id) => entityValuesApi.get(id)));
  uniqueEntityIds.forEach((id, i) => {
    valuesByEntityId[id] = valueRecords[i].data.values;
  });

  loading.value = false;
}

function entityFor(id: string): EntityRecord | undefined {
  return entities.value.find((e) => e.id === id);
}

function fieldTypeFor(id: string): FieldTypeRecord | undefined {
  return fieldTypes.value.find((ft) => ft.id === id);
}

function actionLabelFor(actionId: string): string {
  return actions.value.find((a) => a.id === actionId)?.data.label ?? actionId;
}

const items = computed(() => {
  if (!screen.value) return [];
  return screen.value.data.items.map((item) => {
    const entity = entityFor(item.entityId);
    const fields = entity ? resolveEntityFields(entity, fieldTypes.value) : [];
    return { item, entity, fields, actionConfigs: entity?.data.actions ?? [] };
  });
});

function toggleDropdown(key: string) {
  openDropdownKey.value = openDropdownKey.value === key ? null : key;
}

function openFieldModal(entityId: string, fieldTypeId: string) {
  openDropdownKey.value = null;
  activeModal.value = { entityId, fieldTypeId };
  modalValue.value = valuesByEntityId[entityId]?.[fieldTypeId] ?? "";
}

function closeModal() {
  activeModal.value = null;
}

async function submitModal() {
  if (!activeModal.value) return;
  const { entityId, fieldTypeId } = activeModal.value;
  const saved = await entityValuesApi.save(entityId, { [fieldTypeId]: modalValue.value });
  valuesByEntityId[entityId] = saved.data.values;
  activeModal.value = null;
}

onMounted(load);
</script>

<template>
  <p v-if="loading">Chargement…</p>

  <template v-else-if="screen">
    <h1>{{ screen.name }}</h1>
    <RouterLink :to="`/screens/${screenId}`" class="btn secondary">Retour à l'édition</RouterLink>

    <div v-if="openDropdownKey" style="position: fixed; inset: 0; z-index: 40" @click="openDropdownKey = null"></div>

    <div
      style="
        display: grid;
        margin-top: 16px;
        border: 1px dashed #ccc;
        background: #fafafa;
        padding: 8px;
        gap: 8px;
      "
      :style="{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, width: `${GRID_COLS * 60}px` }"
    >
      <div
        v-for="{ item, entity, fields, actionConfigs } in items"
        :key="item.i"
        class="card"
        style="margin: 0; position: relative"
        :style="{
          gridColumn: `${item.x + 1} / span ${item.w}`,
          gridRow: `${item.y + 1} / span ${item.h}`,
        }"
      >
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 4px; flex-wrap: wrap">
          <h3>{{ entity?.name ?? "?" }}</h3>
          <div
            v-for="config in actionConfigs"
            :key="config.id"
            style="position: relative; z-index: 50"
          >
            <button
              type="button"
              class="btn secondary"
              style="padding: 4px 10px"
              @click="toggleDropdown(`${item.i}:${config.id}`)"
            >
              {{ config.labelOverride || actionLabelFor(config.actionId) }} ▾
            </button>
            <div
              v-if="openDropdownKey === `${item.i}:${config.id}`"
              class="card"
              style="position: absolute; right: 0; top: 100%; margin-top: 4px; min-width: 180px; padding: 4px"
            >
              <button
                v-for="fieldTypeId in config.targetFieldTypeIds"
                :key="fieldTypeId"
                type="button"
                class="btn secondary"
                style="display: block; width: 100%; text-align: left; margin-bottom: 4px; border: none"
                @click="openFieldModal(item.entityId, fieldTypeId)"
              >
                {{ fieldTypeFor(fieldTypeId)?.name ?? fieldTypeId }}
              </button>
              <p v-if="config.targetFieldTypeIds.length === 0" style="font-size: 13px; color: #666; margin: 4px 8px">
                Aucun champ configuré.
              </p>
            </div>
          </div>
        </div>
        <p v-if="fields.length === 0" style="font-size: 13px; color: #666">Aucun champ.</p>
        <FieldPreview
          v-for="rf in fields"
          :key="rf.fieldTypeId"
          :field="rf.data"
          :value="valuesByEntityId[item.entityId]?.[rf.fieldTypeId]"
        />
      </div>
    </div>

    <Modal v-if="activeModal" :title="fieldTypeFor(activeModal.fieldTypeId)?.name ?? ''" @close="closeModal">
      <form @submit.prevent="submitModal">
        <div class="field-row">
          <label for="modal-field-value">{{ fieldTypeFor(activeModal.fieldTypeId)?.data.label }}</label>
          <textarea id="modal-field-value" v-model="modalValue" rows="4"></textarea>
        </div>

        <button type="submit" class="btn">Enregistrer</button>
        <button type="button" class="btn secondary" style="margin-left: 8px" @click="closeModal">Annuler</button>
      </form>
    </Modal>
  </template>
</template>
