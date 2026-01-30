# [Feature Name] - Implementation Tasks

**Feature**: [Feature description]
**Branch**: `feat/[slug]`
**Goal**: [One-line goal statement]

---

## Overview

[2-3 sentence description of what this feature implements and the approach taken.]

### Key Decisions

- [Important technical decision made during planning]
- [Architecture or pattern choice]
- [Trade-off or constraint acknowledged]

---

## Tasks

### Phase 1: Setup & Infrastructure

#### T001 - [Task Title] [P]

**File**: `src/path/to/file.ts`
**Description**: [What this task accomplishes]

**Requirements**:

- [Specific requirement]
- [Specific requirement]

**Implementation Notes**:

- [Helpful implementation detail]
- [Reference to existing pattern]

---

#### T002 - [Task Title] [P]

**File**: `src/path/to/another-file.ts`
**Description**: [What this task accomplishes]

**Requirements**:

- [Specific requirement]

---

### Phase 2: Core Implementation

#### T003 - [Task Title]

**Files**:

- `src/path/to/file.astro`
- `src/path/to/related.ts`

**Description**: [What this task accomplishes]

**Requirements**:

- [Specific requirement]
- [Specific requirement]

**Implementation Notes**:

```typescript
// Example code or interface if helpful
interface Example {
  field: string
}
```

---

#### T004 - [Task Title]

**File**: `src/path/to/component.astro`
**Description**: [What this task accomplishes]

**Requirements**:

- [Specific requirement]

---

### Phase 3: Integration

#### T005 - [Task Title]

**File**: `src/path/to/integration.ts`
**Description**: [What this task accomplishes]

**Requirements**:

- [Specific requirement]

---

### Phase 4: Testing & Validation

#### T006 - [Task Title] [P]

**File**: `src/path/to/test.ts` (if applicable)
**Description**: [Testing task description]

**Checklist**:

- [ ] [Test scenario 1]
- [ ] [Test scenario 2]
- [ ] [Edge case verification]

---

### Phase 5: Documentation & Cleanup

#### T007 - [Task Title] [P]

**File**: `README.md` or relevant documentation
**Description**: [Documentation task description]

**Include**:

- [Documentation item]
- [Documentation item]

---

## Parallel Execution Guide

The following tasks can be executed in parallel as they modify different files:

### Parallel Group 1 (Infrastructure)

```
T001 - [Task Title]
T002 - [Task Title]
```

### Parallel Group 2 (Core)

```
T003 - [Task Title]
T004 - [Task Title]
```

### Parallel Group 3 (Polish)

```
T006 - [Task Title]
T007 - [Task Title]
```

---

## Dependencies

```
T001 (Setup)
  └── T003, T004 (Core Implementation)
       └── T005 (Integration)
            └── T006, T007 (Testing & Documentation)
```

---

## Files Modified Summary

| File                          | Tasks      |
| ----------------------------- | ---------- |
| `src/path/to/file.ts` (NEW)   | T001       |
| `src/path/to/component.astro` | T003, T004 |
| `src/path/to/integration.ts`  | T005       |

---

## Success Metrics

After implementation, we should be able to:

1. **[Metric category]**: [What can be measured or verified]
2. **[Metric category]**: [What can be measured or verified]
3. **[Metric category]**: [What can be measured or verified]

### Verification Commands

```bash
# Build the project
pnpm build

# Run type checking
pnpm check

# Preview the site
pnpm preview
```

---

## Notes

[Any additional notes, caveats, or future considerations]

---

**Task Legend:**

- `[P]` = Parallelizable - can run concurrently with other `[P]` tasks in the same phase
- Tasks without `[P]` must run sequentially or have dependencies on previous tasks
