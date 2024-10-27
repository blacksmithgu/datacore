HYPRn4IZWT41

# e8YvLcJlubDiUdj1

> l9HPLH7A0GfD5wk6qNyWFNH4mxLjp8g5G6SZmzt6D2
>
> * [[10 - obsidian plugins]]
> * [[20 - Alexi Laiho tribute undertale fan-battle]]
> * [[30 - rockfic]]

* wheKsz
* ~~ucHBdG656~~

```datacorejsx
const link = dc.parseLink("[[root/views/project-table.md#^taskTable]]")
const imported = await dc.require(link)
console.log(imported, link)
function View() {
   return <imported.ProjectView path={dc.currentPath()} type="category"/>	
}
return <View/>
```
