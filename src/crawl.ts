import { JSDOM } from "jsdom"

interface Pages {
    [key: string]: number
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

export {
    normaliseURL,
    getURLsFromHTML,
    crawlPage
}