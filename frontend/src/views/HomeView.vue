<script setup lang="ts">
// Fixed id of the "Fiche contact" demo screen (seeded in generator.sqlite), used as the
// worked example for the OnePlatform POC (see modules/generator-fiche in eudonet-oportal).
const FICHE_CONTACT_SCREEN_ID = "c12582d7-4038-4a13-9805-8ae229c99dc6";
</script>

<template>
  <h1>Generator</h1>
  <p>POC de configuration d'écrans à la volée.</p>

  <div class="card" style="max-width: 480px">
    <h3>Fiche contact (exemple)</h3>
    <p>Écran démo consommé par le module <code>generator-fiche</code> d'oportal.</p>
    <RouterLink :to="`/screens/${FICHE_CONTACT_SCREEN_ID}/json`" class="btn">Voir la config JSON</RouterLink>
    <RouterLink :to="`/screens/${FICHE_CONTACT_SCREEN_ID}/preview`" class="btn secondary" style="margin-left: 8px">Prévisualiser</RouterLink>
    <RouterLink :to="`/screens/${FICHE_CONTACT_SCREEN_ID}`" class="btn secondary" style="margin-left: 8px">Éditer</RouterLink>
  </div>
</template>
