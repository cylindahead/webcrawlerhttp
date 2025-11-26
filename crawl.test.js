const { normaliseURL, getURLsFromHTML } = require("./crawl.js")
const { test, expect } = require("@jest/globals")

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
    const expected = []
    expect(actual).toEqual(expected)
})