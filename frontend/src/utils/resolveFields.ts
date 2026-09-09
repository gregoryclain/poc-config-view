import type { EntityRecord, FieldTypeData, FieldTypeRecord } from "../types/generator";

export interface ResolvedField {
  fieldTypeId: string;
  data: FieldTypeData;
}

export function resolveEntityFields(entity: EntityRecord, fieldTypes: FieldTypeRecord[]): ResolvedField[] {
  return [...entity.data.fields]
    .sort((a, b) => a.order - b.order)
    .map((ref) => {
      const fieldType = fieldTypes.find((ft) => ft.id === ref.fieldTypeId);
      if (!fieldType) return null;
      return {
        fieldTypeId: ref.fieldTypeId,
        data: {
          ...fieldType.data,
          label: ref.labelOverride ?? fieldType.data.label,
          required: ref.requiredOverride ?? fieldType.data.required,
        },
      };
    })
    .filter((f): f is ResolvedField => f !== null);
}
