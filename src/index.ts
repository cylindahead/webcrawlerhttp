import { crawlSiteAsync } from "./crawl.js"
import { printReport } from "./report.js"

async function main() {
  if (process.argv.length < 3) {
    console.log("no website provided")
    process.exit(1)
  }

  const baseURL = process.argv[2]
  let maxConcurrency = 5 // default concurrency
  let maxDepth = 5 // default depth

  if (process.argv.length >= 4) {
    const concurrencyArg = parseInt(process.argv[3])
    if (!isNaN(concurrencyArg) && concurrencyArg > 0) {
        maxConcurrency = concurrencyArg
    }
  }

    if (process.argv.length >= 5) {
    const depthArg = parseInt(process.argv[4])
    if (!isNaN(depthArg) && depthArg > 0) {
        maxDepth = depthArg
    }
  }

  console.log(`starting crawl of ${baseURL}`)
    console.log(`Concurrency: ${maxConcurrency} simultaneous requests`)
    console.log(`Max Depth: ${maxDepth}`)
  
  const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxDepth)
  printReport(pages)
}

main()