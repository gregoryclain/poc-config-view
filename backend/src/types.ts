export type FieldKind = "input" | "display";

export type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "url"
  | "email"
  | "date"
  | "select"
  | "multiselect"
  | "autocomplete"
  | "phone"
  | "image-upload"
  | "boolean"
  | "display"
  | "widget";

export const INPUT_FIELD_TYPES: FieldType[] = [
  "text",
  "number",
  "textarea",
  "url",
  "email",
  "date",
  "select",
  "multiselect",
  "autocomplete",
  "phone",
  "image-upload",
  "boolean",
];

export const DISPLAY_FIELD_TYPES: FieldType[] = ["display", "widget"];

export const FIELD_TYPES: FieldType[] = [...INPUT_FIELD_TYPES, ...DISPLAY_FIELD_TYPES];

export interface FieldTypeConfig {
  options?: string[];
  validation?: FieldValidationRule[];
}

export type FieldValidationRuleKind = "maxLength" | "pattern" | "notFutureDate";

export interface FieldValidationRule {
  kind: FieldValidationRuleKind;
  value?: number | string;
  errorCode: string;
}

export interface FieldTypeData {
  type: FieldType;
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  /** Remix Icon class name (e.g. "ri-phone-line") shown next to this field when it's offered as an action target (e.g. in an "Add" dropdown item). */
  icon?: string;
  config?: FieldTypeConfig;
}

export interface FieldTypeRecord {
  id: string;
  name: string;
  data: FieldTypeData;
  createdAt: string;
  updatedAt: string;
}

export interface EntityFieldRef {
  fieldTypeId: string;
  order: number;
  labelOverride?: string;
  requiredOverride?: boolean;
}

export interface EntityActionConfig {
  id: string;
  actionId: string;
  targetFieldTypeIds: string[];
  labelOverride?: string;
}

export interface EntityData {
  name: string;
  fields: EntityFieldRef[];
  actions: EntityActionConfig[];
}

export interface EntityRecord {
  id: string;
  name: string;
  data: EntityData;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenItem {
  i: string;
  entityId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScreenData {
  name: string;
  items: ScreenItem[];
  /** Business domain this screen's records belong to (e.g. "contact") — resolved by the consuming renderer to know which domain adapter to use. */
  domain?: string;
}

export interface ScreenRecord {
  id: string;
  name: string;
  data: ScreenData;
  createdAt: string;
  updatedAt: string;
}

/**
 * Open string, not a closed union: the OnePlatform renderer resolves a `kind` against a
 * runtime registry (kind -> Vue component), so new business-rule kinds can be configured
 * here without a matching TS union change in either repo.
 */
export type ActionKind = string;

export interface ActionData {
  name: string;
  label: string;
  kind: ActionKind;
}

export interface ActionRecord {
  id: string;
  name: string;
  data: ActionData;
  createdAt: string;
  updatedAt: string;
}

export interface EntityValueData {
  values: Record<string, string>;
}

export interface EntityValueRecord {
  entityId: string;
  data: EntityValueData;
  createdAt: string;
  updatedAt: string;
}
