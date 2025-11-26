const {normaliseURL} = require("./crawl.js")
const {test, expect} = require("@jest/globals")

/*
we want to normalise diiferent strings 
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