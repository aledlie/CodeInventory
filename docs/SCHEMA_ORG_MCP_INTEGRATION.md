# Schema.org MCP Integration Guide

## Overview
This project is integrated with the Schema.org MCP Server, which provides access to schema.org vocabulary for structured data implementation.

## Configuration Status
✅ **MCP Server Installed**: `/Users/alyshialedlie/code/ISInternal/schema-org-mcp`
✅ **Claude Desktop Configured**: Entry exists in `~/Library/Application Support/Claude/claude_desktop_config.json`

## Available Tools

### 1. get_schema_type
Retrieve detailed information about any schema.org type.

**Example Use Cases:**
- Understanding what properties a schema type supports
- Learning about schema.org vocabulary
- Discovering relationships between types

**Usage:**
```
"I need information about the Organization schema type"
```

### 2. search_schemas
Search for schema types by keyword.

**Example Use Cases:**
- Finding the right schema type for your content
- Exploring available schema options
- Discovering related schema types

**Usage:**
```
"Search for schema types related to events"
"What schema types are available for products?"
```

### 3. get_type_hierarchy
Explore inheritance relationships between schema types.

**Example Use Cases:**
- Understanding schema type inheritance
- Finding parent/child relationships
- Planning structured data implementation

**Usage:**
```
"Show me the hierarchy for NewsArticle"
"What is the parent type of BlogPosting?"
```

### 4. get_type_properties
List all properties available for a schema type (including inherited).

**Example Use Cases:**
- Planning structured data markup
- Understanding required and optional properties
- Comprehensive schema implementation

**Usage:**
```
"What properties are available for the Product schema?"
"List all properties for Organization including inherited ones"
```

### 5. generate_example
Create example JSON-LD for any schema type.

**Example Use Cases:**
- Quick schema.org implementation
- Learning JSON-LD format
- Testing structured data markup

**Usage:**
```
"Generate an example JSON-LD for a Recipe"
"Create a Product schema example with name and price"
```

### 6. run_performance_test
Run performance tests on websites (Core Web Vitals, Load, Stress, Soak, Scalability).

**Example Use Cases:**
- Testing website performance
- Measuring Core Web Vitals
- Performance optimization

**Usage:**
```
"Run Core Web Vitals test on https://example.com"
```

### 7. run_comprehensive_test_suite
Run complete performance test suites (quick, comprehensive, endurance).

**Example Use Cases:**
- Comprehensive website performance analysis
- Before/after schema implementation testing
- Complete performance audits

**Usage:**
```
"Run comprehensive performance tests on https://example.com"
```

### 8. compare_performance_results
Compare two performance test results.

**Example Use Cases:**
- Analyzing impact of schema.org implementation
- Performance optimization tracking
- A/B testing results

### 9. analyze_schema_impact
Analyze the impact of schema.org implementation on SEO, LLM, and performance.

**Example Use Cases:**
- Measuring schema.org benefits
- SEO impact analysis
- LLM understanding improvements

## Integration with This Project

### Current Project Context
This is a code inventory project that:
- Generates schemas from codebases
- Creates documentation and test cases
- Provides RSS feeds for updates

### How to Use Schema.org MCP Here

#### 1. Documenting Code Schemas
Use schema.org MCP to add structured data to documentation:

```
"Generate a SoftwareSourceCode schema for this repository"
"Create a CodeRepository schema example for the README"
```

#### 2. Enhancing RSS Feed
Add schema.org markup to the RSS feed:

```
"What schema properties should I use for a DataFeed?"
"Generate a schema example for an RSS feed item"
```

#### 3. Test Case Documentation
Structure test case documentation with schema.org:

```
"What schema type should I use for test documentation?"
"Generate a TechArticle schema for test cases"
```

#### 4. Schema Generator Enhancement
Enhance the schema generator with schema.org vocabulary:

```
"Search for schema types related to code documentation"
"What properties does the SoftwareApplication schema have?"
```

## Activation Instructions

### If MCP Tools Are Not Available:
1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. Start a new conversation
4. The schema.org MCP tools should now be available

### Verification:
After restarting, ask:
```
"Search for schema types about software"
```

If the MCP is working, you'll get schema.org search results.

## Common Use Cases for This Project

### 1. Add Structured Data to README
```
Task: "Generate a SoftwareSourceCode schema for the README with repository information"
```

### 2. Structure Documentation
```
Task: "Create TechArticle schema examples for the test case documentation"
```

### 3. Enhance RSS Feed
```
Task: "Add schema.org markup to the RSS feed items"
```

### 4. Document Schemas
```
Task: "Generate Article schema for the schema documentation files"
```

## Resources

- **MCP Server Location**: `/Users/alyshialedlie/code/ISInternal/schema-org-mcp`
- **Schema.org Official Documentation**: https://schema.org/
- **MCP Documentation**: https://modelcontextprotocol.io/

## Troubleshooting

### MCP Not Available
1. Check Claude Desktop config: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Verify the schema-org entry exists
3. Restart Claude Desktop
4. Start a new conversation

### Server Path Issues
The configured path is:
```
/Users/alyshialedlie/code/ISInternal/schema-org-mcp/dist/index.js
```

If this path changes, update the Claude Desktop config accordingly.

### Tools Not Responding
1. Check that the MCP server is built: `cd /Users/alyshialedlie/code/ISInternal/schema-org-mcp && npm run build`
2. Restart Claude Desktop
3. Check for errors in Claude Desktop logs

## Next Steps

1. ✅ Restart Claude Desktop to activate the MCP
2. Test the integration by searching for schema types
3. Consider adding schema.org markup to project files
4. Enhance documentation with structured data

## Example Queries to Try

Once activated, try these queries:

1. `"Search for schema types related to code and software"`
2. `"Generate a SoftwareApplication schema example"`
3. `"What properties are available for the Dataset schema?"`
4. `"Show me the hierarchy for CreativeWork"`
5. `"Create a JSON-LD example for a CodeRepository"`
