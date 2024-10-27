---
tags: folder-note
---

F3BVTKtpae0h

# 7UwFMFWOg09V8K

```dataviewjs
await dv.view("99 - config/85 - dataview views/project-view", {
    path: dv.current().file.folder, overviewType: "type"
})
```

```datacorejsx
const link = dc.parseLink("[[root/views/project-table.md#^taskTable]]")
const imported = await dc.require(link)
console.log(imported, link)
function View() {
	return <imported.ProjectView path={dc.currentPath()} type="category"/>	
}
return <View/>
```
