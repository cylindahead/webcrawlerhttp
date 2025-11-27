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

async function crawlPage(baseURL: string, currentURL: string, pages: Pages): Promise<Pages> {

    const baseURLObj = new URL(baseURL)
    const currentURLObj = new URL(currentURL)
    if (baseURLObj.hostname !== currentURLObj.hostname) {
        return pages
    }

    const normalisedCurrentURL = normaliseURL(currentURL)
    if (pages[normalisedCurrentURL] > 0) {
        pages[normalisedCurrentURL]++
        return pages
    }

    pages[normalisedCurrentURL] = 1

    console.log(`actively crawling: ${currentURL}`)

    try {
        const resp = await fetch(currentURL)

        if (resp.status > 399) {
            console.log(`error in fetch with status code: ${resp.status} on page: ${currentURL}`)
            return pages
        }

        const contentType = resp.headers.get("content-type")
        if (!contentType?.includes("text/html")) {
            console.log(`not html response, content type: ${contentType}, on page: ${currentURL}`)
            return pages
        }

        const htmlBody = await resp.text()

        const nextURLs = getURLsFromHTML(htmlBody, baseURL)

        for (const nextURL of nextURLs) {
            pages = await crawlPage(baseURL, nextURL, pages)
        }
    } catch (err:any) {
        console.log(`error in fetch: ${err.message}, on page: ${currentURL}`)
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

export {
    normaliseURL,
    getURLsFromHTML,
    crawlPage,
    getH1FromHTML,
    getFirstParagraphFromHTML,
    getImagesFromHTML,
    extractPageData
}