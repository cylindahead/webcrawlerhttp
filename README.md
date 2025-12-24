# webcrawlerhttp
A modern, concurrent web crawler built with TypeScript that extracts structured data from websites and generates comprehensive reports.

## Features
- Concurrent Crawling: Configurable concurrency limits for efficient parallel requests
- Structured Data Extraction: Extracts H1 tags, first paragraphs, outgoing links, and images
- CSV Reports: Generates detailed CSV reports with extracted data
- Configurable Limits: Control depth, maximum pages, and concurrency
- Type Safety: Written in TypeScript with full type definitions
- Testing: Comprehensive test suite using Vitest

## Installation
```bash
# Clone the repository
git clone https://github.com/cylindahead/webcrawlerhttp.git
cd webcrawlerhttp

# Install dependencies
npm install
```

## Prerequisites
- Node.js 25.2.1 or higher (specified in .nvmrc)
- npm or yarn

## Usage
## Basic Usage
```bash
npm run start <URL> [maxConcurrency] [maxDepth] [maxPages]
```

## Examples
```bash
# Basic crawl with default settings
npm run start https://example.com

# Custom concurrency (3), depth (2), and max pages (10)
npm run start https://example.com 3 2 10

# Using predefined scripts
npm run crawl:small    # 3 concurrent, depth 2, 10 pages
npm run crawl:medium   # 5 concurrent, depth 3, 50 pages
npm run crawl:large    # 10 concurrent, depth 5, 200 pages
```

## Predefined Scripts
- npm run crawl:small - Crawl with 3 concurrent requests, depth 2, max 10 pages
- npm run crawl:medium - Crawl with 5 concurrent requests, depth 3, max 50 pages
- npm run crawl:large - Crawl with 10 concurrent requests, depth 5, max 200 pages

## Output
The crawler generates two types of output:
1. CSV Report (report.csv): Contains detailed extracted data including:
- Page URL
- H1 text
- First paragraph
- Outgoing links (semicolon-separated)
- Image URLs (semicolon-separated)
3. Console Summary: Shows page count statistics

## Project Structure
```text
webcrawlerhttp/
├── src/
│   ├── crawl.ts          # Main crawling logic and data extraction
│   ├── index.ts          # CLI entry point
│   ├── report.ts         # CSV report generation
│   └── crawl.test.ts     # Test suite
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Key Functions
## Data Extraction
- normaliseURL() - Normalizes URLs for consistent comparison
- getURLsFromHTML() - Extracts links from HTML
- getH1FromHTML() - Extracts H1 tag content
- getFirstParagraphFromHTML() - Extracts first paragraph (prioritizes content in <main>)
- getImagesFromHTML() - Extracts image URLs
- extractPageData() - Comprehensive data extraction from a page

## Crawling
- crawlSiteAsync() - Main async crawling function with concurrency control
- ConcurrentCrawler - Class managing concurrent crawling operations

## Reporting
- writeCSVReport() - Generates CSV report from extracted data
-MprintReport() - Prints page count summary to console

## Configuration
The crawler can be configured via command-line arguments:

1. maxConcurrency (default: 5): Maximum number of concurrent HTTP requests
2. maxDepth (default: 5): Maximum crawl depth from the starting URL
3. maxPages (default: 100): Maximum number of unique pages to crawl

## Testing
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test watch

# Run tests with UI
npm run test:ui
```

The test suite includes comprehensive unit tests for all data extraction functions and error handling scenarios.

## Dependencies
- jsdom - HTML parsing and DOM manipulation
- p-limit - Concurrency control
- vitest - Testing framework
- tsx - TypeScript execution

## Development
## Adding New Features
1. Add new data extraction functions to crawl.ts
2. Update extractPageData() to include new data
3. Update CSV report generation in report.ts
4. Write tests for new functionality in crawl.test.ts

## Code Style
- Use TypeScript with strict mode enabled
- Follow async/await patterns for asynchronous operations
- Include comprehensive error handling
- Write tests for all new functionality

## Error Handling
The crawler includes robust error handling for:
- Network failures
- Invalid URLs
- Non-HTML content
- HTTP error status codes
- Aborted requests (when reaching page limits)

## Performance Considerations
- Rate Limiting: Built-in 1-second delay between requests to be respectful to servers
- Memory Management: Uses Sets and Maps to track visited pages efficiently
- Abort Control: Can abort ongoing requests when reaching configured limits
- Concurrency Limits: Prevents overwhelming target servers

## Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Notes
- The crawler respects robots.txt indirectly by limiting to the same hostname
- Always ensure you have permission to crawl target websites
- Consider adding user-agent customization for specific use cases
- The CSV output uses semicolons to separate array values for better compatibility

## Example Output
```csv
page_url,h1,first_paragraph,outgoing_link_urls,image_urls
https://example.com,Welcome,This is the homepage.,https://example.com/about;https://example.com/contact,https://example.com/logo.png
https://example.com/about,About Us,Learn more about our company.,https://example.com/,https://example.com/team.jpg
```
