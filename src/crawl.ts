import { JSDOM } from "jsdom"
import pLimit from "p-limit"

interface Pages {
    [key: string]: number
}

interface ExtractedPageData {
  url: string
  h1: string
  first_paragraph: string
  outgoing_links: string[]
  image_urls: string[]
}

// Add this new interface for the crawler's data storage
interface CrawlerData {
  pageCounts: Pages
  pageData: Record<string, ExtractedPageData>
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function crawlPage(
    baseURL: string,
     currentURL: string,
      pages: Pages,
       depth: number = 0,
        maxDepth: number = 5
    ): Promise<Pages> {

    const baseURLObj = new URL(baseURL)
    const currentURLObj = new URL(currentURL)
    if (baseURLObj.hostname !== currentURLObj.hostname) {
        return pages
    }

  if (depth > maxDepth) {
    console.log(`max depth (${maxDepth}) reached at: ${currentURL}`)
    return pages
  }

    const normalisedCurrentURL = normaliseURL(currentURL)
    if (pages[normalisedCurrentURL] > 0) {
        pages[normalisedCurrentURL]++
        return pages
    }

    pages[normalisedCurrentURL] = 1

    console.log(`[Depth ${depth}] actively crawling: ${currentURL}`)

  const html = await getHTML(currentURL)
  if (!html) {
    console.log(`error fetching HTML from: ${currentURL}`)
    return pages
  }

        const nextURLs = getURLsFromHTML(html, baseURL)

          console.log(`waiting 1 second before next request...`)
          await delay(1000) // 1 second delay

        for (const nextURL of nextURLs) {
            pages = await crawlPage(baseURL, nextURL, pages, depth + 1, maxDepth)
        }
    return pages
}

function getURLsFromHTML(htmlBody: string, baseURL: string): string[] {
    const urls: string[] = []
    const dom = new JSDOM(htmlBody)
    const linkElements = dom.window.document.querySelectorAll("a")
    for (const linkElement of linkElements) {
        const href = linkElement.getAttribute("href")
        if (!href) continue
        if (href.slice(0, 1) === "/") {
            // relative URL
            try {
                const urlObj = new URL (`${baseURL}${href}`)
                urls.push(urlObj.href)
            } catch (err:any) {
                console.log(`error with relative url: ${err.message}`)
            }
        } else {
            // absolute URL
            try {
                const urlObj = new URL (href)
                urls.push(urlObj.href)
            } catch (err:any) {
                console.log(`error with absolute url: ${err.message}`)
            }
        }
    }
    return urls
}

function normaliseURL(urlString: string): string {
    const urlObj = new URL(urlString)
    const hostPath = `${urlObj.hostname}${urlObj.pathname}`
    if (hostPath.length > 0 && hostPath.slice(-1) === "/") {
        return hostPath.slice(0, -1)
    }
    return hostPath
}

function getH1FromHTML(html: string): string {
    const dom = new JSDOM(html)
  const h1Element = dom.window.document.querySelector("h1")
  return h1Element?.textContent?.trim() || ""
}

function getFirstParagraphFromHTML(html: string): string {
    const dom = new JSDOM(html)
    const document = dom.window.document

    const mainElement = document.querySelector("main")
    if (mainElement) {
        const mainParagraph = mainElement.querySelector("p")
        if (mainParagraph) {
            return mainParagraph.textContent?.trim() || ""
        }
    }

    const firstParagraph = document.querySelector("p")
    return firstParagraph?.textContent?.trim() || ""
}

function getImagesFromHTML(html: string, baseURL: string): string[] {
  const urls: string[] = []
  const dom = new JSDOM(html)
  const imageElements = dom.window.document.querySelectorAll('img')
  
  for (const imageElement of imageElements) {
    const src = imageElement.getAttribute('src')
    if (!src) continue; // Skip if no src attribute
    
    try {
      const urlObj = new URL(src, baseURL)
      urls.push(urlObj.href)
    } catch (err: any) {
      console.log(`error with image url: ${err.message}`)
    }
  }
  
  return urls
}

function extractPageData(html: string, pageURL: string): ExtractedPageData {
  return {
    url: pageURL,
    h1: getH1FromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL)
  }
}

async function getHTML(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BootCrawler/1.0"
      }
    })

    if (response.status > 399) {
      console.log(`error in fetch with status code: ${response.status} on page: ${url}`)
      return null
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes('text/html')) {
      console.log(`not html response, content type: ${contentType}, on page: ${url}`)
      return null
    }

    return await response.text()
  } catch (err: any) {
    console.log(`error in fetch: ${err.message}, on page: ${url}`)
    return null
  }
}

class ConcurrentCrawler {
  private baseURL: string
  private data: CrawlerData
  private limit: ReturnType<typeof pLimit>
  private visited: Set<string> = new Set()
  private maxPages: number
  private shouldStop: boolean = false
  private allTasks: Set<Promise<void>> = new Set()
  private abortController: AbortController

  constructor(baseURL: string, maxConcurrency: number = 5, maxPages: number = 100) {
    this.baseURL = baseURL
    this.data = {
      pageCounts: {},
      pageData: {}
    }
    this.limit = pLimit(maxConcurrency)
    this.maxPages = maxPages
    this.abortController = new AbortController()
  }

  private addPageVisit(normalisedURL: string): boolean {
    // Check if we should stop crawling
    if (this.shouldStop) {
      return false
    }

    // Check if we've already visited this page
    if (this.visited.has(normalisedURL)) {
        return false
    }

    // Check if we've reached the maximum number of pages
    if (this.visited.size >= this.maxPages) {
      console.log(`Reached maximum number of pages to crawl (${this.maxPages}).`)
      this.shouldStop = true
      this.abortController.abort()
      return false
    }

    // Mark as visited
    this.visited.add(normalisedURL)

    // Update pages count
    if (this.data.pageCounts[normalisedURL]) {
      this.data.pageCounts[normalisedURL]++
    } else {
      this.data.pageCounts[normalisedURL] = 1
    }

    return true
  }

  private async getHTML(currentURL: string): Promise<string | null> {
    return await this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: {
            'User-Agent': 'BootCrawler/1.0'
          },
          signal: this.abortController.signal // Add abort signal
        })

        if (response.status > 399) {
          console.log(`error in fetch with status code: ${response.status} on page: ${currentURL}`)
          return null
        }

        const contentType = response.headers.get("content-type")
        if (!contentType?.includes("text/html")) {
          console.log(`not html response, content type: ${contentType}, on page: ${currentURL}`)
          return null
        }

        return await response.text()
      } catch (err: any) {
        if (err.name === "AbortError") {
            console.log("Fetch aborted due to max pages reached")
        } else {
            console.log(`error in fetch: ${err.message}, on page: ${currentURL}`)
        }
        return null
      }
    })
  }

  private async crawlPage(currentURL: string, depth: number = 0, maxDepth: number = 5): Promise<void> {
    // Check if we should stop crawling
    if (this.shouldStop) {
        return
    }

    // Check depth limit
    if (depth > maxDepth) {
        console.log(`max depth (${maxDepth}) reached at: ${currentURL}`)
        return
    }

    // Check if URL is on the same domain
    const baseURLObj = new URL(this.baseURL)
    const currentURLObj = new URL(currentURL)
    if (baseURLObj.hostname !== currentURLObj.hostname) {
      return
    }

    // Get normalised URL and check if we should crawl it
    const normalisedURL = normaliseURL(currentURL)
    if (!this.addPageVisit(normalisedURL)) {
      return // Already visited, being visited, or max pages reached
    }

    console.log(`[Concurrent - Depth ${depth}] actively crawling: ${currentURL} (${this.visited.size}/${this.maxPages} pages)`)

    // Get HTML
    const html = await this.getHTML(currentURL)
    if (!html) {
      return
    }

    // Extract and store page data
    const extractedData = extractPageData(html, currentURL)
    this.data.pageData[normalisedURL] = extractedData

    // Get all URLs from HTML
    const nextURLs = getURLsFromHTML(html, this.baseURL)

    // Create promises for each next URL and wait for them concurrently
    const crawlPromises = nextURLs.map(nextURL => 
      this.crawlPage(nextURL, depth + 1, maxDepth)
    )

    // Add tasks to the tracking set and remove when complete
    for (const promise of crawlPromises) {
      this.allTasks.add(promise)
      promise.finally(() => {
        this.allTasks.delete(promise)
      })
    }

    await Promise.all(crawlPromises)
  }

  async crawl(maxDepth: number = 5): Promise<CrawlerData> {
    console.log(`Starting concurrent crawl of ${this.baseURL} (max depth: ${maxDepth}, max pages: ${this.maxPages})`)

    // Start the initial crawl
    const initialTask = this.crawlPage(this.baseURL, 0, maxDepth)
    this.allTasks.add(initialTask)
    initialTask.finally(() => {
      this.allTasks.delete(initialTask)
    })

    // Wait for all tasks to complete
    while (this.allTasks.size > 0) {
      await Promise.all(Array.from(this.allTasks))
    }

    console.log(`Crawl complted! Visited ${this.visited.size} unique pages`)
    return this.data
  }
}

// Update crawlSiteAsync to return both counts and data
async function crawlSiteAsync(
    baseURL: string, 
    maxConcurrency: number = 5, 
    maxDepth: number = 5,
    maxPages: number = 100
): Promise<{ pageCounts: Pages; pageData: Record<string, ExtractedPageData> }> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages)
  const data = await crawler.crawl(maxDepth)
  return data
}

export {
    normaliseURL,
    getURLsFromHTML,
    crawlPage,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getImagesFromHTML,
    extractPageData,
    getHTML,
    crawlSiteAsync
}