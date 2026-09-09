<script setup lang="ts">
import { computed, ref } from "vue";
import type { ActionRecord, EntityActionConfig, EntityFieldRef, FieldTypeRecord } from "../types/generator";

const props = defineProps<{
  modelValue: EntityActionConfig[];
  fields: EntityFieldRef[];
  fieldTypes: FieldTypeRecord[];
  availableActions: ActionRecord[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: EntityActionConfig[]];
}>();

function fieldTypeFor(id: string): FieldTypeRecord | undefined {
  return props.fieldTypes.find((ft) => ft.id === id);
}

// Champs display DE CETTE ENTITY uniquement (pas tout le catalogue) — ce sont les
// seuls champs qu'un bouton d'action peut proposer de remplir.
const displayFieldsOfEntity = computed(() =>
  props.fields
    .map((f) => fieldTypeFor(f.fieldTypeId))
    .filter((ft): ft is FieldTypeRecord => !!ft && ft.data.type === "display"),
);

function actionNameFor(actionId: string): string {
  return props.availableActions.find((a) => a.id === actionId)?.data.label ?? actionId;
}

const selectedActionToAdd = ref("");

function addActionButton() {
  if (!selectedActionToAdd.value) return;
  const next: EntityActionConfig[] = [
    ...props.modelValue,
    { id: crypto.randomUUID(), actionId: selectedActionToAdd.value, targetFieldTypeIds: [] },
  ];
  emit("update:modelValue", next);
  selectedActionToAdd.value = "";
}

function removeActionButton(id: string) {
  emit(
    "update:modelValue",
    props.modelValue.filter((c) => c.id !== id),
  );
}

function updateLabelOverride(configId: string, value: string) {
  const next = props.modelValue.map((c) => (c.id === configId ? { ...c, labelOverride: value || undefined } : c));
  emit("update:modelValue", next);
}

function toggleTargetField(configId: string, fieldTypeId: string, checked: boolean) {
  const next = props.modelValue.map((c) => {
    if (c.id !== configId) return c;
    const targetFieldTypeIds = checked
      ? [...c.targetFieldTypeIds, fieldTypeId]
      : c.targetFieldTypeIds.filter((id) => id !== fieldTypeId);
    return { ...c, targetFieldTypeIds };
  });
  emit("update:modelValue", next);
}
</script>

<template>
  <div class="field-row" style="flex-direction: row; align-items: center; gap: 8px">
    <select v-model="selectedActionToAdd">
      <option value="" disabled>Choisir une action…</option>
      <option v-for="a in availableActions" :key="a.id" :value="a.id">{{ a.data.label }}</option>
    </select>
    <button type="button" class="btn secondary" :disabled="!selectedActionToAdd" @click="addActionButton">
      Ajouter un bouton
    </button>
  </div>

  <p v-if="displayFieldsOfEntity.length === 0" style="font-size: 13px; color: #666">
    Aucun champ "display" dans cette entity — ajoutez-en un ci-dessus pour pouvoir configurer un bouton.
  </p>

  <div v-if="modelValue.length === 0" class="empty-state">Aucun bouton d'action configuré.</div>

  <div v-for="config in modelValue" :key="config.id" class="card">
    <strong>{{ actionNameFor(config.actionId) }}</strong>

    <div class="field-row">
      <label :for="`entity-action-label-${config.id}`">Nom du bouton (override)</label>
      <input
        :id="`entity-action-label-${config.id}`"
        :value="config.labelOverride ?? ''"
        :placeholder="actionNameFor(config.actionId)"
        @input="updateLabelOverride(config.id, ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div style="margin-top: 8px">
      <label style="font-size: 13px; font-weight: 600; color: #444; display: block; margin-bottom: 4px">
        Champs concernés
      </label>
      <div
        v-for="ft in displayFieldsOfEntity"
        :key="ft.id"
        style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px"
      >
        <input
          :id="`entity-action-${config.id}-${ft.id}`"
          type="checkbox"
          style="width: auto"
          :checked="config.targetFieldTypeIds.includes(ft.id)"
          @change="toggleTargetField(config.id, ft.id, ($event.target as HTMLInputElement).checked)"
        />
        <label :for="`entity-action-${config.id}-${ft.id}`" style="margin: 0">{{ ft.name }}</label>
      </div>
    </div>

    <button type="button" class="btn danger" style="margin-top: 8px" @click="removeActionButton(config.id)">
      Retirer ce bouton
    </button>
  </div>
</template>
