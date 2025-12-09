# Schema.org Examples for Code Inventory Project

This document provides comprehensive schema.org examples for enhancing documentation, RSS feeds, and code metadata in the Code Inventory project.

## Table of Contents

1. [Repository Metadata](#repository-metadata)
2. [Dataset Schema](#dataset-schema)
3. [Documentation Schema](#documentation-schema)
4. [RSS Feed Enhancement](#rss-feed-enhancement)
5. [Software Application Schema](#software-application-schema)
6. [How-To Guide Schema](#how-to-guide-schema)
7. [Usage in HTML](#usage-in-html)

## Repository Metadata

### SoftwareSourceCode Schema

Use this schema to describe the entire repository:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "Code Inventory - Automated Schema Generator",
  "description": "Automated code schema generation and documentation tool that extracts structured data from Python, TypeScript, and JavaScript codebases using AST parsing and regex patterns.",
  "version": "1.0.0",
  "dateCreated": "2025-11-01",
  "dateModified": "2025-11-08",
  "programmingLanguage": [
    {
      "@type": "ComputerLanguage",
      "name": "Python",
      "version": "3.x"
    },
    {
      "@type": "ComputerLanguage",
      "name": "JavaScript"
    },
    {
      "@type": "ComputerLanguage",
      "name": "TypeScript"
    }
  ],
  "codeRepository": "https://github.com/yourusername/Inventory",
  "author": {
    "@type": "Person",
    "name": "Alyshia Ledlie"
  },
  "applicationCategory": "DeveloperApplication",
  "keywords": [
    "code analysis",
    "schema generation",
    "AST parsing",
    "documentation automation"
  ]
}
```

**When to use**: Add this to your repository's index.html or README metadata section.

## Dataset Schema

### Describing schemas.json

The massive schemas.json file can be described with a Dataset schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Code Schemas Dataset",
  "description": "Complete structured data for 3,335+ scanned directories containing extracted schemas for all code files.",
  "encodingFormat": "application/json",
  "contentSize": "36MB",
  "numberOfItems": 3335,
  "dateCreated": "2025-11-01",
  "dateModified": "2025-11-08",
  "variableMeasured": [
    "Class definitions",
    "Function signatures",
    "Import dependencies",
    "Git repository metadata",
    "Remote URLs",
    "Line numbers"
  ],
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "application/json",
    "contentUrl": "./schemas.json"
  },
  "creator": {
    "@type": "Person",
    "name": "Alyshia Ledlie"
  },
  "license": "https://creativecommons.org/publicdomain/zero/1.0/"
}
```

**When to use**: When publishing the schemas.json file or documenting it in web pages.

## Documentation Schema

### TechArticle for Documentation Files

Each documentation file (TEST_CASES.md, SCHEMA_SUMMARY.md, etc.) can be marked up as a TechArticle:

```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Code Inventory Test Cases",
  "description": "Comprehensive test cases for all session updates including schema generation, README generation, git operations, and RSS integration.",
  "datePublished": "2025-11-01",
  "dateModified": "2025-11-08",
  "author": {
    "@type": "Person",
    "name": "Alyshia Ledlie"
  },
  "articleBody": "48 test cases across 11 test suites covering schema generation, README generation, git operations, server configuration, RSS integration, and more.",
  "proficiencyLevel": "Intermediate",
  "dependencies": "Python 3.x, Node.js, Git",
  "hasPart": [
    {
      "@type": "HowToSection",
      "name": "Schema Generation Tests",
      "itemListElement": [
        {
          "@type": "HowToStep",
          "name": "Test AST parsing",
          "text": "Verify Python AST parsing extracts correct class and function definitions"
        }
      ]
    }
  ]
}
```

**When to use**: For any technical documentation, guides, or tutorial files.

## RSS Feed Enhancement

### DataFeed Schema for RSS

Enhance your RSS feed with schema.org DataFeed markup:

```json
{
  "@context": "https://schema.org",
  "@type": "DataFeed",
  "name": "Burnt Orange Nation - Sumedh Joshi",
  "description": "RSS/Atom feed for latest posts by Sumedh Joshi on Burnt Orange Nation",
  "url": "https://www.burntorangenation.com/rss/stream/21046839",
  "encodingFormat": "application/atom+xml",
  "dateModified": "2025-01-01T00:00:00Z",
  "provider": {
    "@type": "Organization",
    "name": "Burnt Orange Nation",
    "url": "https://www.burntorangenation.com/"
  },
  "dataFeedElement": [
    {
      "@type": "DataFeedItem",
      "dateCreated": "2025-01-01",
      "item": {
        "@type": "Article",
        "headline": "Article Title",
        "author": {
          "@type": "Person",
          "name": "Sumedh Joshi"
        },
        "datePublished": "2025-01-01T00:00:00Z"
      }
    }
  ]
}
```

**Implementation**: See `rss-enhanced.xml` for full example with embedded schema.org markup.

### Individual Feed Items

Each RSS entry can be marked up as an Article or BlogPosting:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Texas Football Game Recap",
  "datePublished": "2025-01-01T00:00:00Z",
  "dateModified": "2025-01-01T00:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Sumedh Joshi",
    "url": "https://www.burntorangenation.com/users/sumedh-joshi"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Burnt Orange Nation",
    "url": "https://www.burntorangenation.com/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.burntorangenation.com/logo.png"
    }
  },
  "articleSection": "Sports",
  "keywords": "football, sports, texas, college football",
  "articleBody": "Full article content here..."
}
```

## Software Application Schema

### For Individual Tools (schema_generator.py)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Schema Generator",
  "description": "Main Python script for extracting schemas from code files using AST parsing and regex patterns.",
  "applicationSubCategory": "Code Analysis Tool",
  "fileSize": "16KB",
  "programmingLanguage": "Python",
  "runtimePlatform": "Python 3.x",
  "features": [
    "AST parsing for Python files",
    "Regex patterns for TypeScript/JavaScript",
    "README.md generation for all directories",
    "Comprehensive schemas.json output"
  ],
  "installUrl": "https://github.com/yourusername/Inventory",
  "downloadUrl": "https://github.com/yourusername/Inventory/blob/main/schema_generator.py",
  "requirements": "Python 3.x with ast and json modules",
  "isPartOf": {
    "@type": "SoftwareSourceCode",
    "name": "Code Inventory"
  }
}
```

## How-To Guide Schema

### Usage Instructions

Convert your usage documentation into structured HowTo schema:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Use Code Inventory Tools",
  "description": "Step-by-step guide for using the code inventory and schema generation tools",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "tool": [
    {
      "@type": "SoftwareApplication",
      "name": "schema_generator.py"
    },
    {
      "@type": "SoftwareApplication",
      "name": "push_changes.py"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Regenerate Schemas",
      "text": "Run the schema generator to scan your codebase",
      "itemListElement": {
        "@type": "HowToDirection",
        "text": "cd /Users/alyshialedlie/code/Inventory && python3 schema_generator.py"
      }
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "View Schema Data",
      "text": "Load and inspect the generated schemas.json file",
      "itemListElement": {
        "@type": "HowToDirection",
        "text": "import json; schemas = json.load(open('schemas.json', 'r'))"
      }
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Push Changes to Repositories",
      "text": "Commit and push documentation updates to GitHub",
      "itemListElement": {
        "@type": "HowToDirection",
        "text": "python3 push_changes.py or bash parallel_push.sh"
      }
    }
  ]
}
```

## Usage in HTML

### Embedding in HTML Files

To add schema.org markup to an HTML page, include it in a `<script>` tag:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Code Inventory</title>

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": "Code Inventory - Automated Schema Generator",
    "description": "Automated code schema generation and documentation tool",
    "codeRepository": "https://github.com/yourusername/Inventory"
  }
  </script>
</head>
<body>
  <h1>Code Inventory</h1>
  <!-- Your content here -->
</body>
</html>
```

### Multiple Schemas with @graph

To include multiple related schemas on one page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareSourceCode",
      "@id": "#repository",
      "name": "Code Inventory"
    },
    {
      "@type": "Dataset",
      "@id": "#dataset",
      "name": "Code Schemas Dataset",
      "isPartOf": { "@id": "#repository" }
    },
    {
      "@type": "TechArticle",
      "@id": "#documentation",
      "name": "Documentation",
      "about": { "@id": "#repository" }
    }
  ]
}
</script>
```

## Benefits of Schema.org Markup

### For Search Engines
- **Rich Snippets**: Enhanced search results with structured data
- **Better Understanding**: Search engines can better understand your content
- **Knowledge Graph**: May appear in Google's Knowledge Graph

### For LLMs and AI
- **Semantic Understanding**: AI can better understand your content structure
- **Entity Recognition**: Clear identification of software, datasets, and documentation
- **Relationship Mapping**: Understanding how different components relate

### For Developers
- **Machine-Readable**: Easy to parse and extract structured information
- **Standard Format**: Industry-standard vocabulary everyone understands
- **API Integration**: Easier to build tools that consume your data

## Validation

### Validate Your Markup

Use these tools to validate your schema.org markup:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Structured Data Testing Tool**: https://search.google.com/structured-data/testing-tool

### Example Validation

```bash
# For JSON-LD files
curl -X POST https://validator.schema.org/validate \
  -H "Content-Type: application/ld+json" \
  -d @schema.org.jsonld
```

## Integration with MCP Tools

### Using Schema.org MCP

After activating the Schema.org MCP in Claude Desktop, you can:

```
"Generate a SoftwareApplication schema for schema_generator.py with all available properties"

"What additional properties can I add to my Dataset schema to make it more complete?"

"Create a JSON-LD example for a TechArticle about code documentation"

"Validate this schema markup and suggest improvements"
```

### Common Patterns

**For Code Files**:
- Use `SoftwareSourceCode` for repositories
- Use `SoftwareApplication` for individual tools/scripts
- Use `ComputerLanguage` for programming languages

**For Documentation**:
- Use `TechArticle` for technical documentation
- Use `HowTo` for tutorials and guides
- Use `APIReference` for API documentation

**For Data**:
- Use `Dataset` for data collections
- Use `DataDownload` for distribution formats
- Use `DataFeed` for RSS/Atom feeds

## Next Steps

1. Review `schema.org.jsonld` for the complete project markup
2. Check `rss-enhanced.xml` for RSS feed enhancement example
3. Test your markup with validation tools
4. Consider adding schema.org to your web pages
5. Use the Schema.org MCP for generating additional schemas

## Resources

- **Project Schema File**: [schema.org.jsonld](./schema.org.jsonld)
- **Enhanced RSS Feed**: [rss-enhanced.xml](./rss-enhanced.xml)
- **Schema.org Documentation**: https://schema.org/
- **JSON-LD Playground**: https://json-ld.org/playground/
- **Google Search Central**: https://developers.google.com/search/docs/appearance/structured-data

---

*These examples demonstrate how to add semantic structure to the Code Inventory project using schema.org vocabulary.*
