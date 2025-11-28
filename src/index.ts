import { crawlSiteAsync } from "./crawl.js"
import { writeCSVReport, printReport } from "./report.js"

async function main() {
  if (process.argv.length < 3) {
    console.log("no website provided")
    console.log("usage: npm run start <URL> <maxConcurrency> <maxPages>")
    process.exit(1)
  }

  const baseURL = process.argv[2]
  let maxConcurrency = 5 // default concurrency
  let maxDepth = 5 // default depth
  let maxPages = 100 // deafult max pages

// Parse command line arguments
  if (process.argv.length >= 4) {
    const concurrencyArg = parseInt(process.argv[3])
    if (!isNaN(concurrencyArg) && concurrencyArg > 0) {
        maxConcurrency = concurrencyArg
    }
  }

// Parse depth
    if (process.argv.length >= 5) {
    const depthArg = parseInt(process.argv[4])
    if (!isNaN(depthArg) && depthArg > 0) {
        maxDepth = depthArg
    }
  }

 // Parse maxPages
  if (process.argv.length >= 6) {
    const pagesArg = parseInt(process.argv[5])
    if (!isNaN(pagesArg) && pagesArg > 0) {
        maxPages = pagesArg
    }
  }

  console.log(`starting crawl of ${baseURL}`)
  console.log(`Concurrency: ${maxConcurrency} simultaneous requests`)
  console.log(`Max Depth: ${maxDepth}`)
  console.log(`Max Pages: ${maxPages}`)
  
  const data = await crawlSiteAsync(baseURL, maxConcurrency, maxDepth, maxPages)

  // Generate CSV Report (NEW)
  writeCSVReport(data.pageData)

  // Keep the original report for counts (optional)
  console.log("\n=== PAGE COUNT SUMMARY ===")
  printReport(data.pageCounts)
}

main()