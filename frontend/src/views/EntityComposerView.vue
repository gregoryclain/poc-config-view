<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { actionsApi, entitiesApi, fieldTypesApi } from "../api/client";
import EntityFieldList from "../components/EntityFieldList.vue";
import EntityActionList from "../components/EntityActionList.vue";
import type { ActionRecord, EntityActionConfig, EntityFieldRef, FieldTypeRecord } from "../types/generator";

const route = useRoute();
const router = useRouter();

const entityId = route.params.id as string;
const name = ref("");
const fields = ref<EntityFieldRef[]>([]);
const actions = ref<EntityActionConfig[]>([]);
const fieldTypes = ref<FieldTypeRecord[]>([]);
const availableActions = ref<ActionRecord[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  [fieldTypes.value, availableActions.value] = await Promise.all([fieldTypesApi.list(), actionsApi.list()]);
  const entity = await entitiesApi.get(entityId);
  name.value = entity.name;
  fields.value = entity.data.fields;
  actions.value = entity.data.actions;
  loading.value = false;
}

async function save() {
  await entitiesApi.update(entityId, { name: name.value.trim(), fields: fields.value, actions: actions.value });
  router.push("/entities");
}

onMounted(load);
</script>

<template>
  <h1>Éditer l'entity</h1>

  <p v-if="loading">Chargement…</p>

  <form v-else @submit.prevent="save">
    <div class="field-row">
      <label for="entity-name">Nom de l'entity</label>
      <input id="entity-name" v-model="name" required placeholder="Ex: Identity" />
    </div>

    <h3>Champs</h3>
    <EntityFieldList v-model="fields" :field-types="fieldTypes" />

    <h3>Boutons d'action</h3>
    <EntityActionList v-model="actions" :fields="fields" :field-types="fieldTypes" :available-actions="availableActions" />

    <button type="submit" class="btn" style="margin-top: 16px">Enregistrer</button>
    <RouterLink to="/entities" class="btn secondary" style="margin-left: 8px">Annuler</RouterLink>
  </form>
</template>
