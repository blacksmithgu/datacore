---
banner: "https://i.imgur.com/2nzVmm0.png"
banner: "https://i.imgur.com/2nzVmm0.png"
banner_y: 0.2751
banner_x: 0.57248
---

0O2kc4geJA49

# QW3Ld5Fq6aWMtreDb

```datacorejsx
const link = dc.parseLink("![[root/views/project-table.md#^taskTable]]")
const imported = await dc.require(link)
console.log(imported, link)
function View() {
	const p = dc.currentPath();
	console.log(p)
	return <imported.ProjectView path={p} type="fandom"/>	
}
return <View/>
```
