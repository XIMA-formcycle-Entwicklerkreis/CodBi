# Coding Style Guide

This document describes the coding patterns and style preferences used in this codebase. When generating or modifying code, follow these patterns to maintain consistency.

## General Principles

- **Compact and concise**: Prefer compact code over verbose alternatives
- **Table-like alignment**: Align related elements for easy scanning
- **Minimal whitespace**: Use blank lines sparingly, only between logical sections

## Kotlin Style Patterns

### Control Flow

#### If Statements
- **No space between control keywords and `(`**: `if(` / `for(` / `while(` / `when(` / `catch(` (not `if (` / `for (` / ...)
- **Canonical pattern**: `if( ... )`
- **Spaces inside the parentheses**: Add a space after `(` and before `)` when the adjacent character is a **letter/digit**
  - ✅ `if( condition )`
  - ✅ `if(!initialized.get() )` (no space after `(` because next char is `!`)
  - ❌ `if(condition)`
- **Always on a separate line**: If statements should always be separated by a blank line from other types of instructions
- **Single-line if statements without braces** when the body is a single statement:
  ```kotlin
  if( condition ) statement
  if(!initialized.get()) statement
  ```
- Use braces only when necessary (multi-line or multiple statements):
  ```kotlin
  if( condition ) {
    statement1
    statement2
  }
  ```

#### Finally Blocks
- **Compact finally blocks** on a single line when possible:
  ```kotlin
  } finally { statement }
  ```
- Use multi-line only when the block contains multiple statements:
  ```kotlin
  } finally {
    statement1
    statement2
  }
  ```

### Variable Declarations

#### Aligned Assignment Operators
When multiple variables are declared sequentially, **align the `=` operators** so all values start at the same column. This creates a table-like structure for easy scanning:

#### Keep RHS on Same Line (When It Fits)
- If the right-hand side fits within the codebase width limit (currently **100**), keep it on the **same line** as the `=`.
- Only wrap the RHS to the next line when it would exceed the width limit or improves readability for complex expressions (`when`, `try`, long lambdas, etc.).

✅ Preferred:
```kotlin
val tmpDir = pluginRoot?.resolve("Resources/AI/Tesseract/TmpNatives")?.apply { mkdirs() }
```

✅ Wrap only when needed:
```kotlin
val platformDirName =
    when {
      // ...
    }
```

```kotlin
// ✅ Preferred: Aligned assignments
val manager  = ctx.ndManager
val image    = input.first
val question = input.second

// ❌ Avoid: Unaligned assignments
val manager = ctx.ndManager
val image = input.first
val question = input.second
```

This pattern makes it easy to:
- Scan down the left column to see variable names
- Scan down the right column to see values
- Quickly identify related variable declarations

#### Separation from Other Code
- **Separate from other logic**: Variable declarations (`val`/`var`) and assignments (e.g., `x = y`) should be separated from other types of instructions (function calls, control flow, etc.) by an empty line.
- **Grouping**: Consecutive declarations or assignments do not need empty lines between them.
- **Alignment**: When assignments are one under another, align their `=` or `->` operators on the same column for better readability.

```kotlin
// ✅ Preferred
val a = 1
x     = 5

process(a, x)

// ❌ Avoid
val a = 1
x = 5
process(a, x)
```

### Spacing Around Control Characters

**Letters should be separated from control characters by a space:**

- **Brackets and parentheses**: Use spaces inside brackets/parentheses
  ```kotlin
  // ✅ Preferred: Spaces inside brackets/parentheses
  params.headerMap.forEach { ( headerName, headerValue ) ->
  questionsToAsk.forEach { ( key, question ) ->
  fileResults[ key ] = answer
  
  // ❌ Avoid: No spaces inside
  params.headerMap.forEach { (headerName, headerValue) ->
  questionsToAsk.forEach { (key, question) ->
  fileResults[key] = answer
  ```

- **Type assertions**: Use spaces inside parentheses for type assertions
  ```typescript
  // ✅ Preferred: Spaces inside parentheses for type assertions
  const files = ( toProcess as HTMLInputElement ).files ;
  ( toProcess as HTMLInputElement ).addEventListener("change", (event) => {
  ( document.querySelector(`#${key2}`) as HTMLInputElement ).value = response[key][key2];
  
  // ❌ Avoid: No spaces inside parentheses
  const files = (toProcess as HTMLInputElement).files;
  (toProcess as HTMLInputElement).addEventListener("change", (event) => {
  (document.querySelector(`#${key2}`) as HTMLInputElement).value = response[key][key2];
  ```

- **Operators**: Use spaces around binary operators
  ```kotlin
  // ✅ Preferred: Spaces around operators
  if ( a + b > 10 )
  val result = ( a + b ) * 2
  
  // ❌ Avoid: No spaces around operators
  if (a+b > 10)
  val result = (a+b)*2
  ```

- **Unary operators**: Unary operators like `!` stay attached to their operand
  ```kotlin
  // ✅ Preferred: Unary operator attached, space before closing paren
  if(!initialized.get() )
  if( !active )
  
  // ❌ Avoid: Space after unary operator or no space before closing paren
  if ( ! active )
  if(!initialized.get())
  ```

- **Closing parentheses**: Space before closing paren in if statements
  ```kotlin
  // ✅ Preferred: Space before closing paren in if statements
  if( condition )
  if(!initialized.get() )
  if( key.isNotBlank() && headerValue != null )
  if(!files || files.length === 0 )
  
  // ❌ Avoid: No space before closing paren
  if( condition)
  if(!initialized.get())
  if( key.isNotBlank() && headerValue != null)
  ```

- **Control characters together**: No spaces between adjacent control characters
  ```typescript
  // ✅ Preferred: No spaces between control characters
  $.each( files, ( i, file ) => { formData.append( file.name, file );});
  $.each( results, ( fileName, text ) => { output += text;});
  
  // ❌ Avoid: Spaces between control characters
  $.each( files, ( i, file ) => { formData.append( file.name, file ); });
  $.each( results, ( fileName, text ) => { output += text; });
  ```

- **Arrow functions**: Always spaces around `=>`
  ```typescript
  // ✅ Preferred: Spaces around arrow operator
  ( i, file ) => { statement }
  ( fileName, text ) => { output += text; }
  
  // ❌ Avoid: No spaces around arrow operator
  (i, file)=> { statement }
  (fileName, text)=> { output += text; }
  ```

- **Closing Braces**:
  - **Correct**: `)}`
  - **Incorrect**: `) }`
  - **Correct**: `{(`
  - **Incorrect**: `{ (`

### Function Parameters

- **Spacing around parentheses** follows the control character spacing rule:
  ```kotlin
  // With spaces inside parentheses
  override fun prepare( ctx: TranslatorContext ) {
  params.headerMap.forEach { ( headerName, headerValue ) ->
  
  // Can also be without spaces in some contexts (follow existing file pattern)
  override fun processInput(ctx: TranslatorContext, input: Pair<Image, String>): NDList {
  ```

### Indentation

- Use **2 spaces** for indentation (standard Kotlin)
- No tabs

### Blank Lines

- Use blank lines **sparingly**
- Only insert blank lines between logical sections
- **Exception**: If statements should always be separated by a blank line from other types of instructions
- **Exception**: Variable declaration blocks (`val`/`var`) and assignments should be separated by a blank line from other types of instructions
- **No blank lines after comments**: Comments should be immediately followed by the code they describe.
- Avoid excessive whitespace

### Code Organization

- Use `//region` and `//endregion` comments to organize code sections:
  ```kotlin
  //region Image processing
  var array = image.toNDArray(manager)
  // ... code ...
  //endregion Image processing
  ```

### Comments

#### KDoc Comments (Classes and Functions)

**Class Comments:**
- Start with `/**` on its own line
- First line describes what the class does
- Can use markdown sections with `##` or `####` for subsections
- Use bullet points with `-` for lists
- End with `*/` on its own line (sometimes with `*` before closing)

```kotlin
/**
 * Processes uploaded images and answers questions about them.
 *
 * #### Header Parameters:
 * - X-Question-{key}: Question to ask about the document, where {key} is the result key
 *   (e.g., X-Question-total: "Total?", X-Question-date: "Date?")
 *
 * #### Resources
 * On **Disk** the model takes up about **800MB** while in **RAM** it will need about **1GB**.
 * */
```

**Function/Method Comments:**
- Start with `/**` on its own line
- First line describes what the function does
- Can have multiple paragraphs
- Use `@param` for parameters (can reference interfaces: `@param ctx See [Translator.prepare].`)
- Use `@return` for return values (can be multi-line and indented)
- End with `*/` on its own line (sometimes with `*` before closing)

```kotlin
/**
 * Performs the actual request to the model by first identifying the questions to ask from the received header,
 * retrieving the uploaded file and do a [PyTorch.predict]ion with this data.
 * Once all questions have been asked and the responses received everything is sent back to the client.
 * 
 * @param params
 *
 * @return  A proper message if this model is not [PyTorch.initialized] cause **DONUT** is missing in the
 *          Plugin-Property
 */
```

**Property/Field Comments:**
- Single line format: `/** Description. */`
- Can reference other classes: `/** See [PyTorch.resModelFiles]. */`
- Sometimes incomplete: `/** See [PyTorch.modelName]*/` (acceptable pattern)

```kotlin
/** See [PyTorch.resModelFiles]. */
override val resModelBaseURL = "https://huggingface.co/..."

/** See [PyTorch.modelName]*/
override val modelName = "donut-docvqa"
```

#### Inline Comments

- Use `//` for single-line comments
- Use `//region` and `//endregion` for code organization
- Use `// --- TEXT ---` for section markers within functions
- Comments can be on their own line or at the end of a line
- **No new line between comments and code**: Comments should be immediately followed by the code they describe, without an empty line in between.

```kotlin
//region Image processing
var array = image.toNDArray(manager)
// ... code ...
//endregion Image processing

// --- QUESTIONS CONFIG ---
val questionsToAsk = mutableMapOf<String, String>()
```

#### Comment Patterns

- Use `**bold**` for emphasis in KDoc
- Use `[ClassName]` or `[ClassName.method]` for references
- Use `####` for subsections in class documentation
- Parameters can reference interfaces: `@param ctx See [Translator.prepare].`
- Return values can be multi-line and indented for clarity

#### TSDoc Comments (TypeScript)

**TSDoc follows the same patterns as KDoc:**

**Class Comments:**
- Start with `/**` on its own line
- First line describes what the class does
- Can use `@remarks` for additional notes
- End with `*/` on its own line

```typescript
/**
 * Provides the {@link AI.functionality } for Donut Document Visual Question Answering.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
```

**Function/Method Comments:**
- Start with `/**` on its own line
- First line describes what the function does
- Can have multiple paragraphs
- Use `@param` for parameters
- Use `@returns` or `@return` for return values (can be multi-line and indented)
- End with `*/` on its own line

```typescript
/**
 * This functionality processes uploaded images using the Donut model to answer questions about documents.
 *
 * Questions are acquired from DOM elements within the parent.parent container of the toProcess element
 * that have the class `AI_PT_DONUT_QA_Question`. Each such element should have:
 *  - An `id` attribute (used as the question key)
 *  - A `data-cb-DonutQuestion` attribute (contains the question text)
 *
 * @param toLoad    Provided by the CodBi.
 * @param toProcess Provided by the CodBi. */
```

**TSDoc Patterns:**
- Use `{@link ClassName.method}` for references
- Use `@remarks` for additional notes
- Parameters can be documented with `@param`
- Same spacing and formatting rules as KDoc

## Style Comparison

### Your Style (DonutDocVQA.kt)
- Compact, concise
- Single-line if statements without braces
- Compact finally blocks
- Aligned variable assignments
- Minimal whitespace

### Other Code (PyTorch.kt)
- More verbose
- Always uses braces for if statements
- Multi-line finally blocks
- Standard variable assignments
- More whitespace

**Always use the compact pattern when generating or modifying code. This is the preferred style for this codebase.**

## Examples

### Good: Compact If Statement
```kotlin
val files = input.files

if(!files || files.length === 0 ) {
  console.warn("No files selected.");
  return;
}

if( array.shape.dimension() == 4 ) array = array.squeeze(0)
if( nextTokenId == 2L ) break
if(!initialized.get() ) return
```

### Good: Aligned Variables
```kotlin
val manager  = ctx.ndManager
val image    = input.first
val question = input.second
```

### Good: Compact Finally
```kotlin
} finally { Thread.currentThread().contextClassLoader = oldClassLoader }
```

### Good: Region Organization
```kotlin
//region Image processing
var array = image.toNDArray(manager)
// ... processing code ...
//endregion Image processing
```

## Notes

- This style guide is based on analysis of `DonutDocVQA.kt` and other files in the codebase
- Patterns may evolve over time - this document should be updated accordingly
- **Always apply the compact pattern** when generating or modifying code
- This is the standard style for this codebase
