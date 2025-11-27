import { JSDOM } from "jsdom"

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

import pLimit from "p-limit"

class ConcurrentCrawler {
  private baseURL: string
  private pages: Pages
  private limit: (fn: () => Promise<any>) => Promise<any>
  private visited: Set<string> = new Set()

  constructor(baseURL: string, maxConcurrency: number = 5) {
    this.baseURL = baseURL
    this.pages = {}
    this.limit = pLimit(maxConcurrency)
  }

  private addPageVisit(normalisedURL: string): boolean {
    // If we've already visited this page in this crawl session, return false
    if (this.visited.has(normalisedURL)) {
      return false
    }

    // Mark as visited
    this.visited.add(normalisedURL)

    // Update pages count (like before)
    if (this.pages[normalisedURL]) {
      this.pages[normalisedURL]++
    } else {
      this.pages[normalisedURL] = 1
    }

    return true
  }

  private async getHTML(currentURL: string): Promise<string | null> {
    return await this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: {
            'User-Agent': 'BootCrawler/1.0'
          }
        })

        if (response.status > 399) {
          console.log(`error in fetch with status code: ${response.status} on page: ${currentURL}`)
          return null
        }

        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('text/html')) {
          console.log(`not html response, content type: ${contentType}, on page: ${currentURL}`)
          return null
        }

        return await response.text()
      } catch (err: any) {
        console.log(`error in fetch: ${err.message}, on page: ${currentURL}`)
        return null
      }
    })
  }

  private async crawlPage(currentURL: string, depth: number = 0, maxDepth: number = 5): Promise<void> {
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
      return // Already visited or being visited
    }

    console.log(`[Concurrent - Depth ${depth}] actively crawling: ${currentURL}`)

    // Get HTML
    const html = await this.getHTML(currentURL)
    if (!html) {
      return
    }

    // Get all URLs from HTML
    const nextURLs = getURLsFromHTML(html, this.baseURL)

    // Create promises for each next URL and wait for them concurrently
    const crawlPromises = nextURLs.map(nextURL => 
      this.crawlPage(nextURL, depth + 1, maxDepth)
    )

    await Promise.all(crawlPromises)
  }

  async crawl(maxDepth: number = 5): Promise<Pages> {
    console.log(`Starting concurrent crawl of ${this.baseURL} (max depth: ${maxDepth})` ) 
    await this.crawlPage(this.baseURL, 0, maxDepth)
    return this.pages
  }
}

// Helper function to use the concurrent crawler
async function crawlSiteAsync(baseURL: string, maxConcurrency: number = 5, maxDepth: number = 5): Promise<Pages> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency)
  return await crawler.crawl(maxDepth)
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