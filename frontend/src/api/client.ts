import type {
  ActionData,
  ActionRecord,
  EntityData,
  EntityRecord,
  EntityValueRecord,
  FieldTypeData,
  FieldTypeRecord,
  ScreenData,
  ScreenRecord,
} from "../types/generator";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const fieldTypesApi = {
  list: () => request<FieldTypeRecord[]>("/api/field-types"),
  get: (id: string) => request<FieldTypeRecord>(`/api/field-types/${id}`),
  create: (data: FieldTypeData) =>
    request<FieldTypeRecord>("/api/field-types", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: FieldTypeData) =>
    request<FieldTypeRecord>(`/api/field-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/field-types/${id}`, { method: "DELETE" }),
};

export const entitiesApi = {
  list: () => request<EntityRecord[]>("/api/entities"),
  get: (id: string) => request<EntityRecord>(`/api/entities/${id}`),
  create: (data: EntityData) => request<EntityRecord>("/api/entities", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: EntityData) =>
    request<EntityRecord>(`/api/entities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/entities/${id}`, { method: "DELETE" }),
};

export const screensApi = {
  list: () => request<ScreenRecord[]>("/api/screens"),
  get: (id: string) => request<ScreenRecord>(`/api/screens/${id}`),
  create: (data: ScreenData) => request<ScreenRecord>("/api/screens", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: ScreenData) =>
    request<ScreenRecord>(`/api/screens/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/screens/${id}`, { method: "DELETE" }),
};

export const actionsApi = {
  list: () => request<ActionRecord[]>("/api/actions"),
  get: (id: string) => request<ActionRecord>(`/api/actions/${id}`),
  create: (data: ActionData) => request<ActionRecord>("/api/actions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: ActionData) =>
    request<ActionRecord>(`/api/actions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/actions/${id}`, { method: "DELETE" }),
};

export const entityValuesApi = {
  get: (entityId: string) => request<EntityValueRecord>(`/api/entity-values/${entityId}`),
  save: (entityId: string, values: Record<string, string>) =>
    request<EntityValueRecord>(`/api/entity-values/${entityId}`, { method: "PUT", body: JSON.stringify({ values }) }),
};
