# Python Development Standards for Secret Santa

This file establishes coding conventions for `functions/main.py` and related Python modules.

## General Principles

- **Clarity over brevity**: Readable code is maintainable code.
- **Type hints everywhere**: Use `typing` module for all function signatures.
- **Docstrings**: PEP 257 format with purpose, parameters, return, and exceptions.
- **PEP 8**: 79 character line limit, 4-space indentation.
- **Testing**: Unit tests for all public functions; edge cases documented.

## Function Structure

### Template

```python
from typing import List, Dict, Optional, Tuple

def solve_pairing(users: List[Dict[str, any]], conflicts: Dict[str, List[str]]) -> Tuple[Dict[str, str], List[str]]:
    """
    Solve the Secret Santa pairing problem with conflict constraints.
    
    This function uses backtracking to find a valid circular assignment where no user
    is assigned to themselves or to a conflicted user.
    
    Args:
        users: List of user dicts with 'id' and 'name' keys.
        conflicts: Dict mapping user_id -> [list of conflicted user_ids].
    
    Returns:
        Tuple of:
        - pairings: Dict mapping giver_id -> giftee_id (empty if unsolvable).
        - errors: List of error strings (empty if successful).
    
    Raises:
        ValueError: If users list is empty or has fewer than 2 users.
    
    Example:
        >>> users = [{'id': 'a', 'name': 'Alice'}, {'id': 'b', 'name': 'Bob'}]
        >>> conflicts = {}
        >>> pairings, errors = solve_pairing(users, conflicts)
        >>> assert errors == []
    """
    # Implementation here
    pass
```

## Naming Conventions

- **Variables**: `snake_case` (e.g., `user_id`, `giftee_assignment`)
- **Functions**: `snake_case` (e.g., `is_valid_assignment`)
- **Classes**: `PascalCase` (e.g., `PairingConstraintSolver`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_BACKTRACK_ITERATIONS`)

## Error Handling

Always define clear error messages with context:

```python
if len(users) < 2:
    raise ValueError(
        f"Insufficient users for pairing: need at least 2 non-admin users, found {len(users)}. "
        f"Request 'activate' from inactive users or reduce conflict constraints."
    )
```

## Testing Requirements

For each public function:

1. **Happy path**: Normal, expected usage.
2. **Edge cases**: Empty inputs, single item, boundary conditions.
3. **Error cases**: Invalid inputs, unsolvable constraints.
4. **Performance**: Verify acceptable performance for expected dataset sizes.

Example:

```python
def test_solve_pairing_self_assignment_prevented():
    """Verify user cannot be assigned to themselves."""
    users = [{'id': 'a', 'name': 'Alice'}]
    pairings, errors = solve_pairing(users, {})
    assert errors  # Should fail with insufficient users error
    assert not pairings

def test_solve_pairing_conflict_respected():
    """Verify conflicts are respected in assignment."""
    users = [
        {'id': 'a', 'name': 'Alice'},
        {'id': 'b', 'name': 'Bob'},
    ]
    conflicts = {'a': ['b'], 'b': ['a']}
    pairings, errors = solve_pairing(users, conflicts)
    assert errors  # Should fail: unsolvable constraint graph
    assert not pairings
```

## Comments & Docstrings

- **Module docstring**: Describe purpose and usage at top of file.
- **Function docstring**: PEP 257 format (purpose, args, returns, raises, examples).
- **Inline comments**: Explain *why*, not *what*. Use sparingly.
- **Edge case comments**: Document expected behavior in edge cases.

## Algorithm Documentation

For complex algorithms (e.g., backtracking), include:

1. **High-level explanation**: What the algorithm does.
2. **Key decisions**: Why this approach vs. alternatives.
3. **Complexity analysis**: Time and space complexity.
4. **Limitations**: Known constraints or failure modes.

Example:

```python
def _backtrack_pairing(
    assignment: Dict[str, str],
    available: List[str],
    conflicts: Dict[str, List[str]],
    used: set
) -> bool:
    """
    Recursively find a valid pairing using backtracking.
    
    **Algorithm**: Backtracking
    - For each unassigned user, try assigning an available giftee.
    - Validate: no self-assignment, no conflicts.
    - If valid, recurse to next user.
    - If all assigned, return True (solution found).
    - If no valid giftee, backtrack and try different assignment.
    
    **Complexity**: O(n!) worst case; pruning (conflicts) reduces typical runtime.
    
    **Assumptions**: All users are distinct, conflicts are symmetric.
    """
    pass
```

## Imports

Organize in three groups, separated by blank lines:

```python
# Standard library
import random
from typing import List, Dict, Optional, Tuple
from datetime import datetime

# Third-party (Firebase)
from firebase_admin import firestore

# Local (relative imports)
from .utils import validate_user_data
```

## Performance Considerations

- **Firestore queries**: Use indexed queries; document indexes in comments.
- **Backtracking**: Add early termination (max iterations) for large datasets.
- **Batch operations**: Use batch writes for > 5 updates.

## Security

- **Input validation**: Always validate user inputs (IDs, counts, data types).
- **Access control**: Verify auth and admin status before sensitive operations.
- **Error messages**: Don't leak sensitive data in errors.

