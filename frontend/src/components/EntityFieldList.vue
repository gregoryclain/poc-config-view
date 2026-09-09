<script setup lang="ts">
import { computed, ref } from "vue";
import type { EntityFieldRef, FieldTypeRecord } from "../types/generator";

const props = defineProps<{
  modelValue: EntityFieldRef[];
  fieldTypes: FieldTypeRecord[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: EntityFieldRef[]];
}>();

const availableToAdd = computed(() =>
  props.fieldTypes.filter((ft) => !props.modelValue.some((f) => f.fieldTypeId === ft.id)),
);

const selectedToAdd = ref("");

function fieldTypeFor(id: string): FieldTypeRecord | undefined {
  return props.fieldTypes.find((ft) => ft.id === id);
}

function addField() {
  if (!selectedToAdd.value) return;
  const next = [...props.modelValue, { fieldTypeId: selectedToAdd.value, order: props.modelValue.length }];
  emit("update:modelValue", next);
  selectedToAdd.value = "";
}

function removeField(index: number) {
  const next = props.modelValue.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
  emit("update:modelValue", next);
}

function move(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= props.modelValue.length) return;
  const next = [...props.modelValue];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  emit(
    "update:modelValue",
    next.map((f, i) => ({ ...f, order: i })),
  );
}

function updateLabelOverride(index: number, value: string) {
  const next = props.modelValue.map((f, i) => (i === index ? { ...f, labelOverride: value || undefined } : f));
  emit("update:modelValue", next);
}
</script>

<template>
  <div class="field-row" style="flex-direction: row; align-items: center; gap: 8px">
    <select v-model="selectedToAdd">
      <option value="" disabled>Choisir un field type…</option>
      <option v-for="ft in availableToAdd" :key="ft.id" :value="ft.id">{{ ft.name }} ({{ ft.data.type }})</option>
    </select>
    <button type="button" class="btn secondary" :disabled="!selectedToAdd" @click="addField">Ajouter</button>
  </div>

  <div v-if="modelValue.length === 0" class="empty-state">Aucun champ ajouté.</div>

  <div v-for="(f, index) in modelValue" :key="f.fieldTypeId" class="card">
    <strong>{{ fieldTypeFor(f.fieldTypeId)?.name ?? f.fieldTypeId }}</strong>
    <small style="display: block">type: {{ fieldTypeFor(f.fieldTypeId)?.data.type }}</small>

    <div class="field-row">
      <label>Label (override)</label>
      <input
        :value="f.labelOverride ?? ''"
        :placeholder="fieldTypeFor(f.fieldTypeId)?.data.label"
        @input="updateLabelOverride(index, ($event.target as HTMLInputElement).value)"
      />
    </div>

    <button type="button" class="btn secondary" :disabled="index === 0" @click="move(index, -1)">↑</button>
    <button type="button" class="btn secondary" :disabled="index === modelValue.length - 1" @click="move(index, 1)">↓</button>
    <button type="button" class="btn danger" style="margin-left: 8px" @click="removeField(index)">Retirer</button>
  </div>
</template>
