import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

// Normalize raw MCP schemas, which bypass LiveKit's strict-schema conversion.
export function strictMcpSchema(input: JSONSchema7): JSONSchema7 {
  const convert = (value: JSONSchema7Definition): JSONSchema7Definition =>
    typeof value === 'boolean' ? value : strictMcpSchema(value);
  const schema: JSONSchema7 = { ...input };
  for (const key of ['definitions', '$defs', 'properties'] as const) {
    if (schema[key]) schema[key] = Object.fromEntries(Object.entries(schema[key]).map(([name, child]) => [name, convert(child)]));
  }
  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (schema[key]) schema[key] = schema[key].map(convert);
  }
  if (schema.items) schema.items = Array.isArray(schema.items) ? schema.items.map(convert) : convert(schema.items);
  if (schema.properties || [schema.type].flat().includes('object')) {
    schema.properties = Object.fromEntries(Object.entries(schema.properties ?? {}).map(([name, child]) =>
      [name, input.required?.includes(name) ? child : { anyOf: [child, { type: 'null' }] }]));
    schema.required = Object.keys(schema.properties);
    schema.additionalProperties = false;
  }
  return schema;
}

// Restore omitted optional arguments before MCP validation and default handling.
export function mcpArguments(args: Record<string, unknown>, schema: JSONSchema7): Record<string, unknown> {
  function clean(value: unknown, definition: JSONSchema7Definition, refs = new Set<string>()): unknown {
    if (typeof definition === 'boolean') return value;
    if (definition.$ref?.startsWith('#/') && !refs.has(definition.$ref)) {
      const ref = definition.$ref;
      const target = ref.slice(2).split('/').reduce<unknown>((node, key) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[key.replace(/~1/g, '/').replace(/~0/g, '~')] : undefined, schema);
      if (target !== undefined) return clean(value, target as JSONSchema7Definition, new Set([...refs, ref]));
    }
    if (Array.isArray(value) && definition.items && !Array.isArray(definition.items)) {
      return value.map(item => clean(item, definition.items as JSONSchema7Definition));
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
        const child = definition.properties?.[key];
        if (child === undefined) return [[key, item]];
        if (item === null && !definition.required?.includes(key) && !allowsNull(child)) return [];
        return [[key, clean(item, child)]];
      }));
    }
    return value;
  }
  return clean(args, schema) as Record<string, unknown>;
}

function allowsNull(schema: JSONSchema7Definition): boolean {
  if (typeof schema === 'boolean') return schema;
  return [schema.type].flat().includes('null') || !!schema.enum?.includes(null)
    || !!schema.anyOf?.some(allowsNull) || !!schema.oneOf?.some(allowsNull)
    || (!schema.type && !schema.$ref && !schema.enum && !schema.anyOf && !schema.oneOf);
}
