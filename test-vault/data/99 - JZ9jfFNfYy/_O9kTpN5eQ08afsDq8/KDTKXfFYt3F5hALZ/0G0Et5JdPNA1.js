/* eslint-disable linebreak-style */
const path = input.path
let q = await dv.tryQueryMarkdown(`
TASK
FROM "${path}"
GROUP BY section`)

let p = dv.page(path)
console.log(p)
console.log(q)
let re = /\|[^\]]*?(\]\])$/gim
let linkRE = /\[(?<display>.*?)\]\((?<url>.*?)\)/gmi

let original = (await dv.io.load(path + ".md")).split("\n")

let matches = original.map(a => {
	return linkRE.exec(a)?.groups
}).filter(z => z !== undefined)

// /\s+(longURL|longURL2)(]])$/igm
let string = q.replace(/ {2,}/gi, "")
let finalString = string.split("\n").map(a => {
	let link = new RegExp(`\\s+(${matches.map(a => a.url).join("|")})(\]\])$`, "gmi")
	let name = new RegExp(`${path.split("/").reverse()[0]} ?> ?`, "gim")
	return a.replace(link, "$2").replace(name, "")
}).join("\n")

dv.el("div",finalString)