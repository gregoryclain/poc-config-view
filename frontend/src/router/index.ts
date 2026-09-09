import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
    { path: "/field-types", name: "field-types", component: () => import("../views/FieldTypesView.vue") },
    { path: "/entities", name: "entities", component: () => import("../views/EntitiesListView.vue") },
    { path: "/entities/:id", name: "entity-edit", component: () => import("../views/EntityComposerView.vue"), props: true },
    { path: "/screens", name: "screens", component: () => import("../views/ScreensListView.vue") },
    { path: "/screens/new", name: "screen-new", component: () => import("../views/ScreenEditorView.vue") },
    { path: "/screens/:id", name: "screen-edit", component: () => import("../views/ScreenEditorView.vue"), props: true },
    { path: "/screens/:id/preview", name: "screen-preview", component: () => import("../views/ScreenPreviewView.vue"), props: true },
    { path: "/actions", name: "actions", component: () => import("../views/ActionsView.vue") },
  ],
});

export default router;
