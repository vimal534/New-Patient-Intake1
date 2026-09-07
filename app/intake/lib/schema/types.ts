// Shared schema contracts — the single source of truth every field-type
// component, the schema resolver, the conditional-field engine, and every
// module read from. Nothing here is specific to one screen or one
// practice; per-practice/per-specialty variation is DATA (see
// lib/schema/config/*), not new component code.

export type FieldType =
  | "chip"
  | "chipOther"
  | "searchableDropdown"
  | "codedSearchSelect"
  | "structuredFreeText"
  | "bulkNegativeSection"
  | "validatedInstrument";

// A single static option for chip/dropdown-style fields.
export type FieldOption = { value: string; label: string };

// Conditional-reveal rule: "when field `sourceField` has value(s) matching
// `equals`/`includes`, this field/section becomes visible (or required)."
// Field-level, module-level, and practice-level conditions all reduce to
// this same shape — a module's visibility is just a condition evaluated
// against module-selection state instead of a single field's state.
export type ConditionRule = {
  sourceField: string;
  // Exactly one of these — `equals` for single-select fields, `includes`
  // for multi-select (any-of match), `gte` for a numeric threshold (e.g.
  // a prior screener's score gating a follow-on screener's eligibility —
  // "only if PHQ-2 scored >= 3" can't be expressed as string equality).
  equals?: string;
  includes?: string;
  gte?: number;
};

export type ConditionGroup = {
  all?: ConditionRule[]; // AND
  any?: ConditionRule[]; // OR
};

// Base shape every field config shares, regardless of type.
export type BaseFieldConfig = {
  key: string; // unique within its module — this is the answer-state key
  label: string;
  required: boolean;
  helperText?: string;
  // When present, this field (or, for a module-level condition, this
  // section) only renders once the condition evaluates true against
  // current answer state. Absent = always visible.
  showWhen?: ConditionGroup;
};

export type ChipFieldConfig = BaseFieldConfig & {
  type: "chip";
  multi: boolean;
  options: FieldOption[] | { source: string }; // static list, or a resolver source id
};

export type ChipOtherFieldConfig = BaseFieldConfig & {
  type: "chipOther";
  multi: boolean;
  options: FieldOption[] | { source: string };
  otherLabel?: string; // defaults to "Other"
};

export type SearchableDropdownFieldConfig = BaseFieldConfig & {
  type: "searchableDropdown";
  multi: boolean;
  options: FieldOption[] | { source: string };
  searchPlaceholder?: string;
};

export type CodedSearchSelectFieldConfig = BaseFieldConfig & {
  type: "codedSearchSelect";
  // Which mock/real data source this searches — see lib/data-source.
  source: "medications" | "allergens" | string;
  resultDetailFields?: string[]; // which coded-entry fields to show inline in results
};

export type StructuredFreeTextFieldConfig = BaseFieldConfig & {
  type: "structuredFreeText";
  multi: boolean;
  options: FieldOption[] | { source: string };
  freeTextLabel?: string; // defaults to "Anything else?"
};

export type BulkNegativeSectionFieldConfig = BaseFieldConfig & {
  type: "bulkNegativeSection";
  negativeToggleLabel: string; // e.g. "I don't have any of these"
  items: FieldOption[];
};

export type ValidatedInstrumentQuestion = {
  key: string;
  prompt: string; // fixed clinical wording — never restyled
  options: FieldOption[];
  required: boolean;
};

// "mandatory": every item required, block submission until answered
// (PHQ-9/PHQ-A, Vanderbilt, PSC-17, EPDS, M-CHAT-R/F in the v1 screener
// set). "prorate": up to `maxSkips` items may be left blank and the score
// is prorated (sum_answered / count_answered * item_count); beyond
// `maxSkips` the domain is invalid and no score is sent for it, rather
// than a false number (ASQ-3 / ASQ:SE-2). The screener engine (Phase 4)
// reads this to decide how to score, not the field component itself —
// the component only needs it to know whether skipping an item is
// allowed at all.
export type SkipPolicy = { mode: "mandatory" } | { mode: "prorate"; maxSkips: number };

export type ValidatedInstrumentFieldConfig = BaseFieldConfig & {
  type: "validatedInstrument";
  instrumentId: string;
  questions: ValidatedInstrumentQuestion[];
  skipPolicy: SkipPolicy;
};

export type FieldConfig =
  | ChipFieldConfig
  | ChipOtherFieldConfig
  | SearchableDropdownFieldConfig
  | CodedSearchSelectFieldConfig
  | StructuredFreeTextFieldConfig
  | BulkNegativeSectionFieldConfig
  | ValidatedInstrumentFieldConfig;

export type ModuleConfig = {
  id: string;
  title: string;
  fields: FieldConfig[];
  // Module-level condition — e.g. a module only loads for certain
  // chief-complaint selections. Absent = always included.
  showWhen?: ConditionGroup;
};

// What a practice/specialty config says: which modules apply, and in what
// order. This is the "practice-level" tier of the conditional engine.
export type PracticeConfig = {
  practiceId: string;
  specialty: string;
  moduleOrder: string[]; // module ids, in display order
};

// Generic answer bag every module reads/writes — deliberately loose
// (Record, not a per-module interface) since the schema is data-driven;
// individual modules narrow this with their own typed selectors.
export type AnswerValue = string | string[] | number | Record<string, unknown> | undefined;
export type AnswerState = Record<string, AnswerValue>;
