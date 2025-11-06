"""Attribute-Based Access Control (ABAC) policy evaluation engine."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List, Sequence


@dataclass(frozen=True)
class PolicyContext:
    """Holds helper state for policy evaluation."""

    user_attributes: Sequence[str]

    @property
    def attribute_set(self) -> set[str]:
        return {attr.strip() for attr in self.user_attributes if attr.strip()}


class PolicySyntaxError(ValueError):
    """Raised when the policy string cannot be parsed."""


def evaluate_policy(user_attrs: List[str], policy: str) -> bool:
    """Evaluate an ABAC policy string against user attributes.

    The supported grammar is a minimal subset:

    ``expression := term (OR term)*``
    ``term := factor (AND factor)*``
    ``factor := "(" expression ")" | attribute``

    Attributes are expressed as ``key:value`` pairs. Keys are matched in a
    case-insensitive manner while values remain case-sensitive. Parentheses
    and operator precedence are honoured. Contextual attributes like
    ``valid_until`` are treated specially: users must present the attribute and
    the current UTC date must be on or before the referenced date.

    Args:
        user_attrs: Attribute strings attached to the user.
        policy: Boolean policy string to evaluate.

    Returns:
        ``True`` if the user satisfies the policy, otherwise ``False``.
    """

    ctx = PolicyContext(user_attributes=user_attrs)
    tokens = _tokenize(policy)
    if not tokens:
        return True

    output: list[str] = []
    operators: list[str] = []
    precedence = {"AND": 2, "OR": 1}

    for token in tokens:
        if token == "(":
            operators.append(token)
        elif token == ")":
            while operators and operators[-1] != "(":
                output.append(operators.pop())
            if not operators:
                raise PolicySyntaxError("Unbalanced parentheses in policy")
            operators.pop()
        elif token in precedence:
            while operators and operators[-1] in precedence and precedence[operators[-1]] >= precedence[token]:
                output.append(operators.pop())
            operators.append(token)
        else:
            output.append(token)

    while operators:
        op = operators.pop()
        if op == "(":
            raise PolicySyntaxError("Unbalanced parentheses in policy")
        output.append(op)

    stack: list[bool] = []
    for token in output:
        if token in precedence:
            if len(stack) < 2:
                raise PolicySyntaxError("Malformed policy expression")
            right = stack.pop()
            left = stack.pop()
            stack.append((left and right) if token == "AND" else (left or right))
        else:
            stack.append(_evaluate_atom(token, ctx))

    if len(stack) != 1:
        raise PolicySyntaxError("Malformed policy expression")
    return stack[0]


def _tokenize(policy: str) -> List[str]:
    raw = policy.strip()
    if not raw:
        return []
    tokens: List[str] = []
    buffer: list[str] = []
    idx = 0
    while idx < len(raw):
        ch = raw[idx]
        if ch in "()":
            if buffer:
                tokens.append("".join(buffer).strip())
                buffer.clear()
            tokens.append(ch)
            idx += 1
            continue
        if raw[idx : idx + 3].upper() == "AND" and _is_delimiter(raw, idx, 3):
            if buffer:
                tokens.append("".join(buffer).strip())
                buffer.clear()
            tokens.append("AND")
            idx += 3
            continue
        if raw[idx : idx + 2].upper() == "OR" and _is_delimiter(raw, idx, 2):
            if buffer:
                tokens.append("".join(buffer).strip())
                buffer.clear()
            tokens.append("OR")
            idx += 2
            continue
        buffer.append(ch)
        idx += 1
    if buffer:
        tokens.append("".join(buffer).strip())
    return [token for token in tokens if token]


def _is_delimiter(text: str, index: int, length: int) -> bool:
    before = text[index - 1] if index > 0 else " "
    after = text[index + length] if index + length < len(text) else " "
    return before.isspace() and after.isspace()


def _evaluate_atom(atom: str, ctx: PolicyContext) -> bool:
    normalized = atom.strip()
    if not normalized:
        return False
    key, sep, value = normalized.partition(":")
    if not sep:
        raise PolicySyntaxError(f"Invalid attribute expression: {atom}")
    key = key.strip().lower()
    value = value.strip()
    attr_literal = f"{key}:{value}" if key == "valid_until" else f"{key}:{value}".lower()

    if key == "valid_until":
        user_value = _find_attribute_value(ctx.attribute_set, key)
        if not user_value:
            return False
        try:
            expiry = datetime.strptime(user_value, "%Y-%m-%d").date()
            policy_expiry = datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return False
        today = datetime.utcnow().date()
        return today <= expiry and today <= policy_expiry

    if key == "level" and value.isdigit():
        user_value = _find_attribute_value(ctx.attribute_set, key)
        return bool(user_value and user_value.isdigit() and int(user_value) >= int(value))

    return attr_literal in {attr.lower() for attr in ctx.attribute_set}


def _find_attribute_value(attributes: Iterable[str], key: str) -> str | None:
    key_lower = key.lower()
    for attr in attributes:
        a_key, sep, a_value = attr.partition(":")
        if not sep:
            continue
        if a_key.strip().lower() == key_lower:
            return a_value.strip()
    return None
