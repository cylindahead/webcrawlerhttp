import * as fs from "node:fs"
import * as path from "node:path"

// Define the ExtractedPageData interface if not already defined elsewhere
export interface ExtractedPageData {
  url: string
  h1: string
  first_paragraph: string
  outgoing_links: string[]
  image_urls: string[]
}

// CSV escape function
function csvEscape(field: string): string {
  const str = field ?? ""
  const needsQuoting = /[",\n]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuoting ? `"${escaped}"` : escaped
}

// Main CSV report function
export function writeCSVReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.csv"
): void {
  const headers = ["page_url", "h1", "first_paragraph", "outgoing_link_urls", "image_urls"]
  const rows: string[] = [headers.join(",")]

// Iterate through all page data
  for (const page of Object.values(pageData)) {
    const row = [
      csvEscape(page.url),
      csvEscape(page.h1),
      csvEscape(page.first_paragraph),
      csvEscape(page.outgoing_links.join(";")), // Join arrays with semicolons
      csvEscape(page.image_urls.join(";"))      // Join arrays with semicolons
    ]
    rows.push(row.join(","))
  }

 // Write to file
  const filePath = path.resolve(process.cwd(), filename)
  fs.writeFileSync(filePath, rows.join("\n"))
  console.log(`CSV report saved to: ${filePath}`)
}

export function printReport(pages: { [key: string]: number }) {
    console.log("Starting report...")

    const sortedPages = Object.entries(pages).sort((a, b) => b[1] - a[1])
    
    for (const [url, count] of sortedPages) {
        console.log(`Found ${count} internal links to: ${url}`)
    }
    
    console.log("Report complete.")
}
