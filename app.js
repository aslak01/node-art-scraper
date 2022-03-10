import express from 'express'
import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import fs from 'fs'

const app = express()

const PORT = process.env.port || 3000

//https://www.wikiart.org/en/maria-primachenko/all-works/text-list
const baseurl = 'http://wikiart.org'
const sitelang = '/en/'
const artist = 'maria-primachenko'
const suffix = '/all-works/text-list'
// '/all-works#!#filterName:all-paintings-chronologically,resultType:masonry'

const url = baseurl + sitelang + artist + suffix

const getPage = async (url) => {
  try {
    const response = await fetch(url)
    const text = await response.text()
    return text
  } catch (error) {
    console.log(error, error.message)
  }
}
const getPages = (html) => {
  const root = parse(html)
  let content = []
  const list = root.querySelectorAll('ul.painting-list-text li')
  list.forEach((item) => {
    const link = item.querySelector('a')
    const href = baseurl + link.getAttribute('href')
    content.push({
      href,
    })
  })
  return content
}

const getUrls = async (list) => {
  const images = []
  for (const item of list) {
    const linkContent = await getPage(item.href)
    const linkRoot = parse(linkContent)
    const img = linkRoot.querySelector(
      'div.wiki-layout-artist-image-wrapper img'
    )
    const src = img.getAttribute('src')
    const title = img.getAttribute('alt')
    images.push({
      title,
      src,
    })
  }
  return images
}

const downloadImages = async (images) => {
  for (const image of images) {
    const response = await fetch(image.src)
    const data = await response.arrayBuffer()
    console.time(image.title)
    fs.writeFileSync('images/' + image.title + '.jpg', Buffer.from(data))
    console.timeEnd(image.title)
  }
}

app.listen(PORT, () => {
  console.log(`server is running on PORT:${PORT}`)
})

const html = await getPage(url)
const content = getPages(html)
const urls = await getUrls(content)
downloadImages(urls)

app.get('/', (req, res) => {
  res.json(urls)
})
