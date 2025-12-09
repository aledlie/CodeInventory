# ast-grep MCP Integration Guide

## Overview
This project is integrated with the ast-grep MCP Server, which provides powerful structural code search capabilities using Abstract Syntax Tree (AST) pattern matching. Unlike simple text-based search, ast-grep searches code based on syntax structure.

## Configuration Status
✅ **MCP Server Installed**: `/Users/alyshialedlie/code/ast-grep-mcp`
✅ **Claude Desktop Configured**: Entry exists in `~/Library/Application Support/Claude/claude_desktop_config.json`
✅ **ast-grep CLI Required**: Ensure `ast-grep` is installed and available in PATH

## What is ast-grep?

ast-grep enables structural code search by:
- Finding code patterns based on syntax structure, not just text matching
- Searching for specific programming constructs (functions, classes, imports, etc.)
- Writing and testing complex search rules using YAML configuration
- Debugging and visualizing AST structures for better pattern development

## Available Tools

### 1. dump_syntax_tree
Visualize the Abstract Syntax Tree structure of code snippets. Essential for understanding how to write effective search patterns.

**Use Cases:**
- Debug why a pattern isn't matching
- Understand the AST structure of target code
- Learn ast-grep pattern syntax

**Usage:**
```
"Show me the AST structure for this Python function: def hello(name): return f'Hello {name}'"
```

### 2. test_match_code_rule
Test ast-grep YAML rules against code snippets before applying them to larger codebases.

**Use Cases:**
- Validate rules work as expected
- Iterate on rule development
- Debug complex matching logic

**Usage:**
```
"Test this rule against the code snippet to see if it matches"
```

### 3. find_code
Search codebases using simple ast-grep patterns for straightforward structural matches.

**Parameters:**
- `max_results`: Limit number of complete matches returned (default: unlimited)
- `output_format`: Choose between `"text"` (default, ~75% fewer tokens) or `"json"` (full metadata)

**Text Output Format:**
```
Found 2 matches:

path/to/file.py:10-15
def example_function():
    # function body
    return result

path/to/file.py:20-22
def another_function():
    pass
```

**Use Cases:**
- Find function calls with specific patterns
- Locate variable declarations
- Search for simple code constructs

**Usage:**
```
"Find all console.log statements in JavaScript files"
"Search for async function declarations"
```

### 4. find_code_by_rule
Advanced codebase search using complex YAML rules that can express sophisticated matching criteria.

**Parameters:**
- `max_results`: Limit number of complete matches returned (default: unlimited)
- `output_format`: Choose between `"text"` (default, ~75% fewer tokens) or `"json"` (full metadata)

**Use Cases:**
- Find nested code structures
- Search with relational constraints (inside, has, precedes, follows)
- Complex multi-condition searches

**Usage:**
```
"Find all async functions that use await"
"Search for functions with specific error handling patterns"
```

## Supported Languages

ast-grep supports many programming languages including:
- JavaScript/TypeScript
- Python
- Rust
- Go
- Java
- C/C++
- C#
- Ruby
- PHP
- Swift
- Kotlin
- And many more...

For a complete list, see the [ast-grep language support documentation](https://ast-grep.github.io/reference/languages.html).

## Integration with This Project

### Current Project Context
This is a code inventory project that:
- Generates schemas from codebases (Python)
- Creates documentation and test cases (Markdown)
- Provides RSS feeds for updates (XML)

### How to Use ast-grep MCP Here

#### 1. Analyze Python Code Structure

**Find all function definitions:**
```
"Use ast-grep to find all function definitions in schema_generator.py"
```

**Find specific patterns:**
```
"Find all try-except blocks in the Python files"
"Search for all class definitions in the codebase"
```

#### 2. Code Quality Analysis

**Find deprecated patterns:**
```
"Find all print statements that should be logging calls"
"Search for hardcoded credentials or API keys"
```

**Identify code smells:**
```
"Find functions with more than 5 parameters"
"Search for deeply nested if statements"
```

#### 3. Refactoring Assistance

**Find code to refactor:**
```
"Find all instances of a specific function call pattern"
"Search for duplicate code structures"
```

**Update patterns:**
```
"Find all imports from a specific module so we can update them"
```

#### 4. Documentation Generation

**Extract function signatures:**
```
"Find all public function definitions with their docstrings"
"Extract all class definitions with their methods"
```

**Analyze API usage:**
```
"Find all uses of the Anthropic SDK in the codebase"
"Search for all PostHog tracking calls"
```

#### 5. Test Coverage Analysis

**Find untested code:**
```
"Find all function definitions that don't have corresponding tests"
"Search for async functions to ensure they're properly tested"
```

## Example Search Patterns

### Basic Pattern Search

**Query:**
> Find all functions that call the Anthropic API

**ast-grep will generate rules like:**
```yaml
id: find-anthropic-calls
language: python
rule:
  pattern: client.$METHOD($$$)
```

### Complex Rule Example

**Query:**
> Find all async functions that use await

**ast-grep will generate rules like:**
```yaml
id: async-with-await
language: python
rule:
  all:
    - kind: function_definition
    - has:
        pattern: async
    - has:
        pattern: await $EXPR
        stopBy: end
```

## Activation Instructions

### If MCP Tools Are Not Available:
1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. Start a new conversation
4. The ast-grep MCP tools should now be available

### Verify ast-grep CLI Installation:
```bash
ast-grep --version
```

If not installed:
```bash
# macOS
brew install ast-grep

# Or via cargo
cargo install ast-grep --locked
```

### Verification:
After restarting, ask:
```
"Use ast-grep to find all function definitions in schema_generator.py"
```

If the MCP is working, you'll get structured search results.

## Common Use Cases for This Project

### 1. Analyze Schema Generator

**Find all JSON operations:**
```
"Use ast-grep to find all json.dumps and json.loads calls in schema_generator.py"
```

**Find error handling:**
```
"Search for all try-except blocks in the schema generator"
```

### 2. Code Inventory

**Extract all function definitions:**
```
"Use ast-grep to create an inventory of all functions in the Python files"
```

**Find external dependencies:**
```
"Search for all import statements to identify dependencies"
```

### 3. Code Quality Checks

**Find potential issues:**
```
"Find all TODO and FIXME comments in the code"
"Search for functions without docstrings"
```

**Security checks:**
```
"Find hardcoded strings that might be secrets"
"Search for potential SQL injection points"
```

### 4. Refactoring Planning

**Identify refactoring candidates:**
```
"Find all functions longer than 50 lines"
"Search for duplicate code patterns"
```

**Plan updates:**
```
"Find all uses of a deprecated function"
"Search for all instances of a pattern we want to change"
```

## Advanced Features

### Custom Configuration (sgconfig.yaml)

You can create custom ast-grep configurations for this project:

```yaml
# sgconfig.yaml example
ruleDirs:
  - rules
  - custom-rules

customLanguages:
  # Add custom language support if needed

languageGlobs:
  # Map file extensions to languages
  - extensions: [.mjs, .cjs]
    language: javascript
```

### Output Format Options

**Text format (default)** - Uses ~75% fewer tokens:
```
"Find all functions and show results in text format"
```

**JSON format** - Full metadata:
```
"Find all functions and show results in JSON format with full metadata"
```

## Troubleshooting

### Common Issues

1. **"Command not found" errors**
   - Ensure ast-grep is installed: `brew install ast-grep`
   - Check PATH: `which ast-grep`

2. **No matches found**
   - Try adding `stopBy: end` to relational rules
   - Use `dump_syntax_tree` to understand AST structure

3. **Pattern not matching**
   - Ask to dump the syntax tree first
   - Verify the language is correctly specified

4. **Permission errors**
   - Ensure read access to target directories
   - Check file permissions

### Debug Workflow

1. **Understand the AST structure:**
   ```
   "Show me the AST structure for this code snippet"
   ```

2. **Test your rule:**
   ```
   "Test this ast-grep rule against the code to see if it matches"
   ```

3. **Apply to codebase:**
   ```
   "Search the entire codebase with this validated rule"
   ```

## Resources

- **MCP Server Location**: `/Users/alyshialedlie/code/ast-grep-mcp`
- **ast-grep Official Documentation**: https://ast-grep.github.io/
- **ast-grep Rule Documentation**: See the ast-grep.mdc file in the MCP repo
- **MCP Documentation**: https://modelcontextprotocol.io/

## Best Practices

### 1. Start Simple
Begin with simple patterns and gradually add complexity:
```
1. Find all function definitions
2. Find async functions
3. Find async functions with specific parameters
4. Find async functions that use await
```

### 2. Use dump_syntax_tree
Always check the AST structure when patterns don't match:
```
"Show me the AST for this code so I can write a better pattern"
```

### 3. Test Before Searching
Test rules on small snippets before searching the entire codebase:
```
"Test this rule on this code snippet first"
```

### 4. Limit Results
For large codebases, limit results to avoid overwhelming output:
```
"Find all functions but limit to 10 results"
```

### 5. Choose the Right Format
- Use text format for quick scanning and token efficiency
- Use JSON format when you need exact positions and metadata

## Next Steps

1. ✅ Restart Claude Desktop to activate the MCP
2. Verify ast-grep CLI is installed
3. Test the integration by searching for patterns
4. Consider creating custom rules for common searches in this project

## Example Queries to Try

Once activated, try these queries:

1. `"Use ast-grep to find all function definitions in schema_generator.py"`
2. `"Show me the AST structure for a simple Python function"`
3. `"Find all try-except blocks in the codebase"`
4. `"Search for all imports from the anthropic SDK"`
5. `"Find all async function calls in Python files"`
6. `"Extract all class definitions with their methods"`
7. `"Find hardcoded strings that might contain API keys"`
8. `"Search for all functions that don't have docstrings"`

## Comparison with Traditional Search

### Text-based search (grep):
```bash
grep "def " *.py  # Finds "def" in comments, strings, etc.
```

### Structure-based search (ast-grep):
```
"Find all function definitions"  # Only finds actual function definitions
```

**Advantages of ast-grep:**
- Understands code structure
- No false positives from comments/strings
- Can match complex patterns
- Language-aware searching
- Can search based on relationships (nested, contains, follows, etc.)

## Integration Checklist

- [x] ast-grep MCP server installed
- [x] Claude Desktop configured
- [ ] ast-grep CLI installed and in PATH
- [ ] Claude Desktop restarted
- [ ] MCP tools verified and working
- [ ] First structural search performed successfully

Happy structural code searching!
