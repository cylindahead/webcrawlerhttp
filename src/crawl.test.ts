import { normaliseURL, getURLsFromHTML, getH1FromHTML, getFirstParagraphFromHTML } from "./crawl.js"
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