---
description: 'Instructions for writing Dart and Flutter code following the official recommendations.'
applyTo: 'docs/DEVELOPMENT_PLAN.md'
---

# Development Plan and Log Format Instructions

This document defines the required structure for `docs/DEVELOPMENT_PLAN.md` files created by the PLANNER agent.

## Required Structure

### 1. Header Section
```markdown
# Development Plan: [Project Name]

## Project Goal
[Clear, concise statement of the project objective]

## Requirements & Constraints
- [List all requirements]
- [List all constraints]
- [Include any critical success factors]
```

### 2. Plan Section
```markdown
## Plan

### Phase [Number]: [Phase Name]
- [ ] [Task Number] [Task Description]
  - [ ] [Subtask Number] [Subtask Description]
  - [ ] [Subtask Number] [Another Subtask]
- [ ] [Task Number] [Another Task]
```

**Task Numbering Convention:**
- Use hierarchical numbering: `1.1`, `1.2`, `2.1`, `2.2.a`, `2.2.b`
- Mark completed tasks with `[x]`
- Mark incomplete tasks with `[ ]`

**Task Types:**
- `(FIX)` - Bug fixes or corrections
- `(REFACTOR)` - Code restructuring without functionality changes  
- `(ENHANCE)` - New features or improvements
- `**VALIDATION CHECKPOINT:**` - Critical verification steps

### 3. Success Criteria Section
```markdown
## Success Criteria (Measurable)

- [ ] [Specific, testable criterion]
- [ ] [Another measurable outcome]
- [ ] [Include minimum thresholds where applicable]
```

### 4. Agent Log Section
```markdown
## Agent Log

- **[ROLE]:** [Task reference]: [Status]. [Description of work completed]
- **[ROLE]:** [Task reference]: [Status]. [Additional details]
```

**Log Entry Format:**
- **Roles:** PLANNER, WORKER, REVIEWER
- **Status:** Complete, In Progress, Blocked, Pass, Fail
- **Task Reference:** Use exact task numbers from plan
- Keep entries concise but informative

## Format Requirements

1. **Consistency:** Use identical markdown formatting throughout
2. **Specificity:** Tasks must be actionable and measurable
3. **Hierarchy:** Maintain clear parent-child relationships in task structure
4. **Validation:** Include checkpoints for critical path items
5. **Traceability:** Agent log entries must reference specific task numbers

## Example Task Formats

**Good Task Examples:**
- `[ ] 1.1.a Update tenant references in Azure-Access-Packages-cli.md from 'onedig' to 'od'`
- `[ ] 2.3.b **VALIDATION CHECKPOINT:** Verify CSV contains exactly these columns: tenant, packageId, packageName`

**Poor Task Examples:**
- `[ ] Fix documentation` (too vague)
- `[ ] Update files` (no specific target)
- `[ ] Make it work` (not measurable)

## Validation Rules

Before marking a plan complete, verify:
1. All task numbers follow hierarchical convention
2. Success criteria are measurable and specific
3. Critical validation checkpoints are included
4. Agent log entries reference actual task numbers
5. No duplicate task numbers exist
