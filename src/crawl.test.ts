import { normaliseURL, getURLsFromHTML, getH1FromHTML, getFirstParagraphFromHTML, getImagesFromHTML, extractPageData} from "./crawl.js"
import { test, expect } from "vitest"

/*
we want to normalise different strings 
to the same strings if they represent the same webpage

for example:
https://boot.dev -> boot.dev
http://boot.dev -> boot.dev
https://Boot.dev -> boot.dev
*/ 

test("normaliseURL strip protocol", () => {
    const input = "https://blog.boot.dev/path"
    const actual = normaliseURL(input)
    const expected = "blog.boot.dev/path"
    expect(actual).toEqual(expected)
})

test("normaliseURL strip trailing slash", () => {
    const input = "https://blog.boot.dev/path/"
    const actual = normaliseURL(input)
    const expected = "blog.boot.dev/path"
    expect(actual).toEqual(expected)
})

test("normaliseURL capitals", () => {
    const input = "https://BLOG.boot.dev/path"
    const actual = normaliseURL(input)
    const expected = "blog.boot.dev/path"
    expect(actual).toEqual(expected)
})

test("normaliseURL strip http", () => {
    const input = "http://blog.boot.dev/path/"
    const actual = normaliseURL(input)
    const expected = "blog.boot.dev/path"
    expect(actual).toEqual(expected)
})

test("getURLsFromHTML absolute", () => {
    const inputHTMLBody = `
<html>
    <body>
        <a href= "https://blog.boot.dev/path/">
            Boot.dev Blog
        </a>
    </body>
</html>  
`
    const inputBaseURL = "https://blog.boot.dev"
    const actual = getURLsFromHTML(inputHTMLBody, inputBaseURL)
    const expected = ["https://blog.boot.dev/path/"]
    expect(actual).toEqual(expected)
})

test("getURLsFromHTML relative", () => {
    const inputHTMLBody = `
<html>
    <body>
        <a href= "/path/">
            Boot.dev Blog
        </a>
    </body>
</html>  
`
    const inputBaseURL = "https://blog.boot.dev"
    const actual = getURLsFromHTML(inputHTMLBody, inputBaseURL)
    const expected = ["https://blog.boot.dev/path/"]
    expect(actual).toEqual(expected)
})

test("getURLsFromHTML both", () => {
    const inputHTMLBody = `
<html>
    <body>
        <a href= "https://blog.boot.dev/path1/">
            Boot.dev Blog Path One
        </a>
        <a href= "/path2/">
            Boot.dev Blog Path Two
        </a>
    </body>
</html>  
`
    const inputBaseURL = "https://blog.boot.dev"
    const actual = getURLsFromHTML(inputHTMLBody, inputBaseURL)
    const expected = ["https://blog.boot.dev/path1/", "https://blog.boot.dev/path2/"]
    expect(actual).toEqual(expected)
})

test("getURLsFromHTML invalid", () => {
    const inputHTMLBody = `
<html>
    <body>
        <a href= "invalid">
            Invalid URL
        </a>
    </body>
</html>  
`
    const inputBaseURL = "https://blog.boot.dev"
    const actual = getURLsFromHTML(inputHTMLBody, inputBaseURL)
    const expected: string[] = []
    expect(actual).toEqual(expected)
})

test("getH1FromHTML basic", () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`
  const actual = getH1FromHTML(inputBody)
  const expected = "Test Title"
  expect(actual).toEqual(expected)
})

test("getH1FromHTML no h1 tag", () => {
  const inputBody = `<html><body><p>No heading here</p></body></html>`
  const actual = getH1FromHTML(inputBody)
  const expected = ""
  expect(actual).toEqual(expected)
})

test("getH1FromHTML multiple h1 tags", () => {
  const inputBody = `
    <html>
      <body>
        <h1>First Title</h1>
        <h1>Second Title</h1>
      </body>
    </html>`
  const actual = getH1FromHTML(inputBody)
  const expected = "First Title"
  expect(actual).toEqual(expected)
})

test("getH1FromHTML with whitespace", () => {
  const inputBody = `<html><body><h1>   Title with spaces   </h1></body></html>`
  const actual = getH1FromHTML(inputBody)
  const expected = "Title with spaces"
  expect(actual).toEqual(expected)
})

test("getH1FromHTML empty string", () => {
  const inputBody = ""
  const actual = getH1FromHTML(inputBody)
  const expected = ""
  expect(actual).toEqual(expected)
})

test("getFirstParagraphFromHTML basic", () => {
  const inputBody = `<html><body><p>First paragraph.</p></body></html>`
  const actual = getFirstParagraphFromHTML(inputBody)
  const expected = "First paragraph."
  expect(actual).toEqual(expected)
})

test("getFirstParagraphFromHTML main priority", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `
  const actual = getFirstParagraphFromHTML(inputBody)
  const expected = "Main paragraph."
  expect(actual).toEqual(expected)
})

test("getFirstParagraphFromHTML no main tag", () => {
  const inputBody = `
    <html><body>
      <p>First paragraph.</p>
      <p>Second paragraph.</p>
    </body></html>
  `
  const actual = getFirstParagraphFromHTML(inputBody)
  const expected = "First paragraph."
  expect(actual).toEqual(expected)
})

test("getFirstParagraphFromHTML multiple paragraphs in main", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>First main paragraph.</p>
        <p>Second main paragraph.</p>
      </main>
    </body></html>
  `
  const actual = getFirstParagraphFromHTML(inputBody)
  const expected = "First main paragraph."
  expect(actual).toEqual(expected)
})

test("getFirstParagraphFromHTML no p tags", () => {
  const inputBody = `<html><body><div>No paragraphs here</div></body></html>`
  const actual = getFirstParagraphFromHTML(inputBody)
  const expected = ""
  expect(actual).toEqual(expected)
})

test("getFirstParagraphFromHTML empty string", () => {
  const inputBody = ""
  const actual = getFirstParagraphFromHTML(inputBody)
  const expected = ""
  expect(actual).toEqual(expected)
})

test("getImagesFromHTML relative", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`
  const actual = getImagesFromHTML(inputBody, inputURL)
  const expected = ["https://blog.boot.dev/logo.png"]
  expect(actual).toEqual(expected)
})

test("getImagesFromHTML absolute", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `<html><body><img src="https://blog.boot.dev/image.jpg" alt="Image"></body></html>`
  const actual = getImagesFromHTML(inputBody, inputURL)
  const expected = ["https://blog.boot.dev/image.jpg"]
  expect(actual).toEqual(expected)
})

test("getImagesFromHTML multiple images", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `
    <html>
      <body>
        <img src="/logo.png" alt="Logo">
        <img src="https://blog.boot.dev/banner.jpg" alt="Banner">
        <img src="/icons/favicon.ico" alt="Favicon">
      </body>
    </html>`
  const actual = getImagesFromHTML(inputBody, inputURL)
  const expected = [
    "https://blog.boot.dev/logo.png",
    "https://blog.boot.dev/banner.jpg", 
    "https://blog.boot.dev/icons/favicon.ico"
  ]
  expect(actual).toEqual(expected)
})

test("getImagesFromHTML missing src attribute", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `<html><body><img alt="No source"></body></html>`
  const actual = getImagesFromHTML(inputBody, inputURL)
  const expected: string[] = []
  expect(actual).toEqual(expected)
})

test("getImagesFromHTML mixed valid and invalid", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `
    <html>
      <body>
        <img src="/valid.png" alt="Valid">
        <img alt="No source">
        <img src="https://blog.boot.dev/another.jpg" alt="Another">
      </body>
    </html>`
  const actual = getImagesFromHTML(inputBody, inputURL)
  const expected = [
    "https://blog.boot.dev/valid.png",
    "https://blog.boot.dev/another.jpg"
  ]
  expect(actual).toEqual(expected)
})

test("getImagesFromHTML no images", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `<html><body><p>No images here</p></body></html>`
  const actual = getImagesFromHTML(inputBody, inputURL)
  const expected: string[] = []
  expect(actual).toEqual(expected)
})

test("extractPageData basic", () => {
  const inputURL = "https://blog.boot.dev"
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `

  const actual = extractPageData(inputBody, inputURL)
  const expected = {
    url: "https://blog.boot.dev",
    h1: "Test Title",
    first_paragraph: "This is the first paragraph.",
    outgoing_links: ["https://blog.boot.dev/link1"],
    image_urls: ["https://blog.boot.dev/image1.jpg"],
  }

  expect(actual).toEqual(expected)
})

test("extractPageData with multiple elements", () => {
  const inputURL = "https://example.com"
  const inputBody = `
    <html>
      <body>
        <h1>Main Heading</h1>
        <p>Outside paragraph.</p>
        <main>
          <p>Main paragraph content.</p>
        </main>
        <a href="/about">About</a>
        <a href="https://external.com">External</a>
        <img src="/logo.png" alt="Logo">
        <img src="/banner.jpg" alt="Banner">
      </body>
    </html>
  `

  const actual = extractPageData(inputBody, inputURL)
  const expected = {
    url: "https://example.com",
    h1: "Main Heading",
    first_paragraph: "Main paragraph content.",
    outgoing_links: [
      "https://example.com/about",
      "https://external.com/"
    ],
    image_urls: [
      "https://example.com/logo.png",
      "https://example.com/banner.jpg"
    ],
  }

  expect(actual).toEqual(expected)
})

test("extractPageData missing elements", () => {
  const inputURL = "https://example.com"
  const inputBody = `
    <html>
      <body>
        <p>Only a paragraph here.</p>
        <a href="/contact">Contact</a>
      </body>
    </html>
  `

  const actual = extractPageData(inputBody, inputURL)
  const expected = {
    url: "https://example.com",
    h1: "", // No h1 tag
    first_paragraph: "Only a paragraph here.",
    outgoing_links: ["https://example.com/contact"],
    image_urls: [], // No images
  }

  expect(actual).toEqual(expected)
})

test("extractPageData empty page", () => {
  const inputURL = "https://example.com"
  const inputBody = `<html><body></body></html>`

  const actual = extractPageData(inputBody, inputURL)
  const expected = {
    url: "https://example.com",
    h1: "",
    first_paragraph: "",
    outgoing_links: [],
    image_urls: [],
  }

  expect(actual).toEqual(expected)
})