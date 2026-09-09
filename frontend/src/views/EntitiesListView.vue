<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { actionsApi, entitiesApi, fieldTypesApi } from "../api/client";
import EntityFieldList from "../components/EntityFieldList.vue";
import EntityActionList from "../components/EntityActionList.vue";
import Modal from "../components/Modal.vue";
import type { ActionRecord, EntityActionConfig, EntityFieldRef, EntityRecord, FieldTypeRecord } from "../types/generator";

const entities = ref<EntityRecord[]>([]);
const fieldTypes = ref<FieldTypeRecord[]>([]);
const availableActions = ref<ActionRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const showCreateModal = ref(false);
const newName = ref("");
const newFields = ref<EntityFieldRef[]>([]);
const newActions = ref<EntityActionConfig[]>([]);
const filterText = ref("");

const filteredEntities = computed(() => {
  const q = filterText.value.trim().toLowerCase();
  if (!q) return entities.value;
  return entities.value.filter((e) => e.name.toLowerCase().includes(q));
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    [entities.value, fieldTypes.value, availableActions.value] = await Promise.all([
      entitiesApi.list(),
      fieldTypesApi.list(),
      actionsApi.list(),
    ]);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erreur de chargement";
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  newName.value = "";
  newFields.value = [];
  newActions.value = [];
  showCreateModal.value = true;
}

async function submitCreate() {
  await entitiesApi.create({ name: newName.value.trim(), fields: newFields.value, actions: newActions.value });
  showCreateModal.value = false;
  await load();
}

async function remove(id: string) {
  await entitiesApi.remove(id);
  await load();
}

async function duplicate(entity: EntityRecord) {
  await entitiesApi.create({ name: `${entity.name} (copie)`, fields: entity.data.fields, actions: entity.data.actions });
  await load();
}

onMounted(load);
</script>

<template>
  <h1>Entities</h1>

  <button type="button" class="btn" @click="openCreateModal">+ Créer une entité</button>

  <p v-if="loading">Chargement…</p>
  <p v-else-if="error" style="color: #b91c1c">{{ error }}</p>

  <div v-else-if="entities.length === 0" class="empty-state">
    <p>Aucune entity pour l'instant.</p>
    <p>Commencez par définir des <RouterLink to="/field-types">field types</RouterLink>, puis créez une entity.</p>
  </div>

  <template v-else>
    <div class="field-row" style="max-width: 320px">
      <input v-model="filterText" placeholder="Filtrer par nom…" />
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Champs</th>
          <th>Boutons d'action</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entity in filteredEntities" :key="entity.id">
          <td>{{ entity.name }}</td>
          <td>{{ entity.data.fields.length }}</td>
          <td>{{ entity.data.actions.length }}</td>
          <td style="white-space: nowrap; text-align: right">
            <RouterLink :to="`/entities/${entity.id}`" class="btn secondary" style="padding: 2px 10px">Éditer</RouterLink>
            <button class="btn secondary" style="padding: 2px 10px; margin-left: 6px" @click="duplicate(entity)">
              Dupliquer
            </button>
            <button class="btn danger" style="padding: 2px 10px; margin-left: 6px" @click="remove(entity.id)">
              Supprimer
            </button>
          </td>
        </tr>
        <tr v-if="filteredEntities.length === 0">
          <td colspan="4" style="text-align: center; color: #666">Aucun résultat.</td>
        </tr>
      </tbody>
    </table>
  </template>

  <Modal v-if="showCreateModal" title="Nouvelle entity" @close="showCreateModal = false">
    <form @submit.prevent="submitCreate">
      <div class="field-row">
        <label for="new-entity-name">Nom de l'entity</label>
        <input id="new-entity-name" v-model="newName" required placeholder="Ex: Identity" />
      </div>

      <h3>Champs</h3>
      <EntityFieldList v-model="newFields" :field-types="fieldTypes" />

      <h3>Boutons d'action</h3>
      <EntityActionList v-model="newActions" :fields="newFields" :field-types="fieldTypes" :available-actions="availableActions" />

      <button type="submit" class="btn" style="margin-top: 16px">Enregistrer</button>
      <button type="button" class="btn secondary" style="margin-left: 8px" @click="showCreateModal = false">Annuler</button>
    </form>
  </Modal>
</template>
