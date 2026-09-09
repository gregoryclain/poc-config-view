<script setup lang="ts"></script>

<template>
  <nav class="top-nav">
    <RouterLink to="/">Accueil</RouterLink>
    <RouterLink to="/field-types">Field Types</RouterLink>
    <RouterLink to="/entities">Entities</RouterLink>
    <RouterLink to="/screens">Écrans</RouterLink>
    <RouterLink to="/actions">Actions</RouterLink>
  </nav>
  <RouterView />
</template>
