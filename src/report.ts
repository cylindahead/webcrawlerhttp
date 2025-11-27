export function printReport(pages: { [key: string]: number }) {
    console.log("Starting report...")

    const sortedPages = Object.entries(pages).sort((a, b) => b[1] - a[1])
    
    for (const [url, count] of sortedPages) {
        console.log(`Found ${count} internal links to: ${url}`)
    }
    
    console.log("Report complete.")
}
