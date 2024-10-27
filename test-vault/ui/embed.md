```datacorejsx
return function View() {
	let link = dc.fileLink(dc.app.metadataCache.getFirstLinkpathDest("37C4aljQO068.md", "/").path).toEmbed();
	console.log(link)
	return <>{dc.LinkEmbed({inline: false, link: link.path})} </>
}
```
