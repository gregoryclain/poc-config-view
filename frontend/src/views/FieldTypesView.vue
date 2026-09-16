<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { fieldTypesApi } from "../api/client";
import FieldTypeForm from "../components/FieldTypeForm.vue";
import type { FieldTypeData, FieldTypeRecord } from "../types/generator";

const fieldTypes = ref<FieldTypeRecord[]>([]);
const loading = ref(true);
const editing = ref<FieldTypeRecord | null>(null);
const creating = ref(false);
const filterText = ref("");

const filteredFieldTypes = computed(() => {
  const q = filterText.value.trim().toLowerCase();
  if (!q) return fieldTypes.value;
  return fieldTypes.value.filter((ft) =>
    [ft.name, ft.data.key, ft.data.type].some((v) => v.toLowerCase().includes(q)),
  );
});

async function load() {
  loading.value = true;
  fieldTypes.value = await fieldTypesApi.list();
  loading.value = false;
}

async function handleSubmit(data: FieldTypeData) {
  if (editing.value) {
    await fieldTypesApi.update(editing.value.id, data);
  } else {
    await fieldTypesApi.create(data);
  }
  editing.value = null;
  creating.value = false;
  await load();
}

async function remove(id: string) {
  await fieldTypesApi.remove(id);
  await load();
}

function startEdit(ft: FieldTypeRecord) {
  editing.value = ft;
  creating.value = false;
}

function startCreate() {
  creating.value = true;
  editing.value = null;
}

function cancel() {
  creating.value = false;
  editing.value = null;
}

onMounted(load);
</script>

<template>
  <h1>Field Types</h1>

  <button v-if="!creating && !editing" class="btn" @click="startCreate">+ Nouveau field type</button>

  <FieldTypeForm
    v-if="creating || editing"
    :model-value="editing?.data ?? null"
    @submit="handleSubmit"
    @cancel="cancel"
  />

  <p v-if="loading">Chargement…</p>
  <div v-else-if="fieldTypes.length === 0 && !creating" class="empty-state">Aucun field type défini.</div>

  <template v-else>
    <div class="field-row" style="max-width: 320px">
      <input v-model="filterText" placeholder="Filtrer par label, clé ou type…" />
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Type</th>
          <th>Clé</th>
          <th>Requis</th>
          <th>Icône</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ft in filteredFieldTypes" :key="ft.id">
          <td>{{ ft.name }}</td>
          <td>{{ ft.data.type }}</td>
          <td>{{ ft.data.key }}</td>
          <td>{{ ft.data.required ? "Oui" : "Non" }}</td>
          <td>{{ ft.data.icon || "—" }}</td>
          <td style="white-space: nowrap; text-align: right">
            <button class="btn secondary" style="padding: 2px 10px" @click="startEdit(ft)">Éditer</button>
            <button class="btn danger" style="padding: 2px 10px; margin-left: 6px" @click="remove(ft.id)">Supprimer</button>
          </td>
        </tr>
        <tr v-if="filteredFieldTypes.length === 0">
          <td colspan="6" style="text-align: center; color: #666">Aucun résultat.</td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
