# Coding Style Guide Addendum: Special Character Grouping

This section details the style requirement to minimize whitespace immediately adjacent to special characters and operators when they are grouped with parentheses or other delimiters.

## Rule: Group Special Characters

Whitespace adjacent to non-alphanumeric structural characters (operators, symbols) within expressions delimited by parentheses `()` must be removed for conciseness.

### Example:

It is **not** allowed to write: `if( !blue )`
It **must** be written as: `if(!blue )`

This applies generally to situations where an operator or symbol immediately follows an opening parenthesis or immediately precedes a closing parenthesis, such as:
*   `( !expression` should become `(!expression`
*   `operator )` should become `operator)`

This style rule aims to keep expressions tight around logical operators and symbols.
