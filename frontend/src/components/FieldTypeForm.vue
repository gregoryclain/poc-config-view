<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import {
  DISPLAY_FIELD_TYPES,
  FIELD_TYPES_WITH_OPTIONS,
  INPUT_FIELD_TYPES,
  fieldKindOf,
  type FieldKind,
  type FieldType,
  type FieldTypeData,
} from "../types/generator";

const props = defineProps<{ modelValue?: FieldTypeData | null }>();
const emit = defineEmits<{
  submit: [data: FieldTypeData];
  cancel: [];
}>();

function blank(): FieldTypeData {
  return { type: "text", key: "", label: "", required: false, placeholder: "", config: { options: [] } };
}

const form = reactive<FieldTypeData>(props.modelValue ? { ...props.modelValue, config: { options: [...(props.modelValue.config?.options ?? [])] } } : blank());
const optionsText = reactive({ value: (props.modelValue?.config?.options ?? []).join("\n") });
const kind = reactive({ value: fieldKindOf(form.type) as FieldKind });

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(form, val ? { ...val, config: { options: [...(val.config?.options ?? [])] } } : blank());
    optionsText.value = (val?.config?.options ?? []).join("\n");
    kind.value = fieldKindOf(form.type);
  },
);

const typesForKind = computed(() => (kind.value === "display" ? DISPLAY_FIELD_TYPES : INPUT_FIELD_TYPES));

function onKindChange() {
  form.type = typesForKind.value[0];
}

const showOptions = computed(() => FIELD_TYPES_WITH_OPTIONS.includes(form.type as FieldType));
const isDisplay = computed(() => kind.value === "display");

function handleSubmit() {
  const data: FieldTypeData = {
    type: form.type,
    key: form.key.trim(),
    label: form.label.trim(),
    required: isDisplay.value ? false : form.required,
    placeholder: form.placeholder?.trim() || undefined,
    config: showOptions.value
      ? { options: optionsText.value.split("\n").map((o) => o.trim()).filter(Boolean) }
      : undefined,
  };
  emit("submit", data);
}
</script>

<template>
  <form class="card" @submit.prevent="handleSubmit">
    <div class="field-row">
      <label for="ft-label">Label</label>
      <input id="ft-label" v-model="form.label" required placeholder="Ex: Nom" />
    </div>

    <div class="field-row">
      <label for="ft-key">Clé (key)</label>
      <input id="ft-key" v-model="form.key" required placeholder="Ex: lastName" />
    </div>

    <div class="field-row">
      <label for="ft-kind">Catégorie</label>
      <select id="ft-kind" v-model="kind.value" @change="onKindChange">
        <option value="input">Champ de saisie</option>
        <option value="display">Zone d'affichage</option>
      </select>
    </div>

    <div class="field-row">
      <label for="ft-type">Type</label>
      <select id="ft-type" v-model="form.type">
        <option v-for="t in typesForKind" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div class="field-row" v-if="showOptions">
      <label for="ft-options">Options (une par ligne)</label>
      <textarea id="ft-options" v-model="optionsText.value" rows="4" placeholder="Option A&#10;Option B"></textarea>
    </div>

    <div class="field-row">
      <label for="ft-placeholder">{{ isDisplay ? "Texte d'exemple" : "Placeholder" }}</label>
      <input id="ft-placeholder" v-model="form.placeholder" />
    </div>

    <div class="field-row" v-if="!isDisplay" style="flex-direction: row; align-items: center; gap: 8px">
      <input id="ft-required" v-model="form.required" type="checkbox" style="width: auto" />
      <label for="ft-required" style="margin: 0">Obligatoire</label>
    </div>

    <button type="submit" class="btn">Enregistrer</button>
    <button type="button" class="btn secondary" style="margin-left: 8px" @click="emit('cancel')">Annuler</button>
  </form>
</template>
