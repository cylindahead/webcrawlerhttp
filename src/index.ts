import { printReport } from "./report.js"
import { getHTML } from "./crawl.js"

async function main() {
  if (process.argv.length < 3) {
    console.log("no website provided")
    process.exit(1)
  }
  if (process.argv.length > 3) {
    console.log("too many command line arguments")
    process.exit(1)
  }
  const baseURL = process.argv[2]

  console.log(`starting crawl of ${baseURL}`)
  
  // Test getHTML function
  const html = await getHTML(baseURL)
  if (html) {
    console.log("Successfully fetched HTML:")
    console.log(html.substring(0, 500) + "...") // Print first 500 chars
  } else {
    console.log("Failed to fetch HTML")
    process.exit(1)
  }
}

main()