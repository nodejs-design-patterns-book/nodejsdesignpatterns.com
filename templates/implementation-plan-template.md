# Implementation Plan: [Feature Name]

**Feature Branch**: `feat/[slug]`
**Spec File**: `.claude/features/[slug]/spec.md`
**Created**: [Date]
**Status**: Draft

---

## Technical Context

### Stack

- **Framework**: Astro
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Deployment**: GitHub Pages via GitHub Actions

### Existing Patterns

- [Relevant existing pattern in the codebase]
- [Component or module to reference]
- [Coding convention to follow]

### User-Provided Context

[Any specific technical direction or constraints from the user's request]

---

## Research Summary

### Codebase Analysis

- [Key finding from codebase exploration]
- [Relevant existing implementation to reference]
- [Pattern or approach already used in the project]

### Files to Modify

| File                          | Change Type | Purpose        |
| ----------------------------- | ----------- | -------------- |
| `src/path/to/file.ts`         | Modify      | [What changes] |
| `src/path/to/new-file.ts`     | Create      | [What it does] |
| `src/path/to/component.astro` | Modify      | [What changes] |

### Files to Reference

- `src/path/to/example.ts` - Example of [pattern]
- `src/path/to/similar.astro` - Similar component implementation

---

## Data Model

### Entities

#### [Entity Name]

```typescript
interface EntityName {
  id: string
  // ... fields
}
```

### Content Collections

[If using Astro content collections, define the schema here]

```typescript
// src/content.config.ts addition
const collectionName = defineCollection({
  type: 'content',
  schema: z.object({
    // ... schema definition
  }),
})
```

---

## API Contracts

### Events/Hooks

[Define any custom events, hooks, or callbacks]

```typescript
// Event definitions
type FeatureEvent = {
  name: string
  payload: {
    // ... payload structure
  }
}
```

### External Integrations

[If integrating with external services, define contracts here]

---

## Quickstart Guide

### Prerequisites

- Node.js v18+
- pnpm installed
- Repository cloned

### Dev Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run type checking
pnpm check
```

### Testing

```bash
# Run tests (if applicable)
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Verification Steps

1. [Step to verify feature works]
2. [Step to verify edge cases]
3. [Step to verify accessibility]

---

## Implementation Phases

### Phase 0: Research

- [ ] Analyze existing codebase patterns
- [ ] Identify files to modify
- [ ] Document technical decisions
- **Output**: `research.md`

### Phase 1: Setup

- [ ] Create necessary directories/files
- [ ] Set up type definitions
- [ ] Configure any new dependencies
- **Output**: `data-model.md`, `contracts/`, `quickstart.md`

### Phase 2: Core Implementation

- [ ] Implement core functionality
- [ ] Add necessary components
- [ ] Integrate with existing code
- **Output**: Working feature

### Phase 3: Integration

- [ ] Connect to existing systems
- [ ] Add error handling
- [ ] Implement logging/analytics (if needed)

### Phase 4: Polish

- [ ] Add tests (if applicable)
- [ ] Optimize performance
- [ ] Update documentation
- [ ] Code review preparation
- **Output**: `tasks.md`

---

## Risk Assessment

| Risk               | Likelihood   | Impact       | Mitigation            |
| ------------------ | ------------ | ------------ | --------------------- |
| [Risk description] | Low/Med/High | Low/Med/High | [Mitigation strategy] |
| [Risk description] | Low/Med/High | Low/Med/High | [Mitigation strategy] |

---

## Progress Tracking

| Phase                | Status      | Notes |
| -------------------- | ----------- | ----- |
| Phase 0: Research    | Not Started |       |
| Phase 1: Setup       | Not Started |       |
| Phase 2: Core        | Not Started |       |
| Phase 3: Integration | Not Started |       |
| Phase 4: Polish      | Not Started |       |

---

## Generated Artifacts

Checklist of artifacts to generate:

- [ ] `research.md` - Codebase analysis and technical decisions
- [ ] `data-model.md` - Entity definitions and schemas
- [ ] `contracts/` - API contracts and event definitions (if needed)
- [ ] `quickstart.md` - Development setup and verification steps
- [ ] `tasks.md` - Detailed task breakdown for implementation

---

## Notes

[Additional notes, decisions, or context that doesn't fit elsewhere]
