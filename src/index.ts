import { crawlPage } from "./crawl.js"
import { printReport } from "./report.js"

async function main() {
  if (process.argv.length < 3) {
    console.log("no website provided")
    process.exit(1)
  }

  const baseURL = process.argv[2]
  let maxDepth = 5

  if (process.argv.length >= 4) {
    const depthArg = parseInt(process.argv[3])
    if (!isNaN(depthArg) && depthArg > 0) {
        maxDepth = depthArg
    }
  }

  console.log(`starting crawl of ${baseURL}`)
    console.log(`Safety features: max depth ${maxDepth}, 1 second delay between requests`)
  
  const pages = await crawlPage(baseURL, baseURL, {}, 0, maxDepth)
  printReport(pages)
}

main()