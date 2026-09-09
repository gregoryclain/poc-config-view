<script setup lang="ts">
import type { FieldTypeData } from "../types/generator";

defineProps<{ field: FieldTypeData; value?: string }>();
</script>

<template>
  <div class="field-row">
    <label>{{ field.label }}<span v-if="field.required"> *</span></label>

    <textarea v-if="field.type === 'textarea'" :placeholder="field.placeholder" disabled></textarea>

    <select v-else-if="field.type === 'select'" disabled>
      <option v-for="o in field.config?.options ?? []" :key="o">{{ o }}</option>
    </select>

    <select v-else-if="field.type === 'multiselect'" multiple disabled>
      <option v-for="o in field.config?.options ?? []" :key="o">{{ o }}</option>
    </select>

    <input v-else-if="field.type === 'boolean'" type="checkbox" disabled style="width: auto" />

    <div
      v-else-if="field.type === 'display'"
      :style="
        value
          ? 'padding: 8px; background: #f0f0f0; border-radius: 6px; color: #222; white-space: pre-wrap'
          : 'padding: 8px; background: #f0f0f0; border-radius: 6px; color: #555; font-style: italic'
      "
    >
      {{ value || field.placeholder || "Texte affiché ici" }}
    </div>

    <input
      v-else
      :type="
        field.type === 'number'
          ? 'number'
          : field.type === 'date'
            ? 'date'
            : field.type === 'email'
              ? 'email'
              : field.type === 'url'
                ? 'url'
                : field.type === 'phone'
                  ? 'tel'
                  : 'text'
      "
      :placeholder="field.placeholder"
      disabled
    />
  </div>
</template>
