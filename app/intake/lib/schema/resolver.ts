// Schema resolver — given a practice ID and a field key, this is the one
// place that answers "what type is this field, what are its options, is it
// required, what reveals it." Modules never hardcode field type/options
// per screen; they ask the resolver.

import { FieldConfig, FieldOption, ModuleConfig, PracticeConfig } from "./types";

export type OptionSource = () => FieldOption[] | Promise<FieldOption[]>;

// Registry of resolvable option sources, keyed by source id — lets a
// FieldConfig say `{ source: "genders" }` instead of duplicating a static
// list inline in every module/practice config that needs it.
const optionSources: Record<string, OptionSource> = {};

export function registerOptionSource(id: string, source: OptionSource) {
  optionSources[id] = source;
}

export async function resolveOptions(options: FieldOption[] | { source: string }): Promise<FieldOption[]> {
  if (Array.isArray(options)) return options;
  const source = optionSources[options.source];
  if (!source) {
    console.warn(`[schema resolver] no option source registered for "${options.source}"`);
    return [];
  }
  return source();
}

export class SchemaResolver {
  constructor(
    private modules: ModuleConfig[],
    private practices: PracticeConfig[]
  ) {}

  getPracticeConfig(practiceId: string): PracticeConfig | null {
    return this.practices.find((p) => p.practiceId === practiceId) ?? null;
  }

  // Practice-level tier: which modules apply, and in what order, for this
  // practice/specialty. Falls back to every known module (in declared
  // order) if the practice isn't configured, rather than showing nothing.
  getModulesForPractice(practiceId: string): ModuleConfig[] {
    const practice = this.getPracticeConfig(practiceId);
    if (!practice) return this.modules;
    return practice.moduleOrder
      .map((id) => this.modules.find((m) => m.id === id))
      .filter((m): m is ModuleConfig => !!m);
  }

  getModule(moduleId: string): ModuleConfig | null {
    return this.modules.find((m) => m.id === moduleId) ?? null;
  }

  getField(moduleId: string, fieldKey: string): FieldConfig | null {
    const mod = this.getModule(moduleId);
    return mod?.fields.find((f) => f.key === fieldKey) ?? null;
  }
}
