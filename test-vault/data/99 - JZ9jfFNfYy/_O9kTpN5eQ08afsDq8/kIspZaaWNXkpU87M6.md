> lGHMUn7NwLABponVsnzZxK1

```datacorejsx
let sent = 0;
const useSection = z => {
if(sent < 2) {
sent++;
console.log(z.$parent)
}
	let par = z;
	while(!par.$link) par = par.$parent;
	return par;
}
const useParent = a => {
	let par = a.$parent;
	if(par.__proto__.constructor.name.match(/markdownlistblock/i))	return a;
	while(Array.isArray(par.$elements) && "$status" in par) par = par.$parent;
	return par;
}

let m = 0;
let sentinel = 0
return function What() {
	let q = dc.useQuery(`@task and $parentLine < 0 and !contains($file, "periodic") and !contains($file, "bible") and !contains($file, "kanban") and contains($file, "rockfic")`)
	
	
	let rowVal = dc.useArray(q, b => {
		let inter = b.groupBy(y => useSection(y)).groupBy(y => y.key.$file)
			console.log("inty", inter)
		return inter
	})
		
	//console.info("ROWVAL", rowVal)
	
	const props = {
		rows: rowVal,
		paging: 15,
		columns: [
			{
				id: "texto",
				title: "text",
				width: "maximum",
				value: x => x.$cleantext,
				editable: true,
				onUpdate: (v, x) => {
					console.log("vv", v)
					console.log("xx", x)
					dc.setTaskText(v, x)
				},
				editor: (v, o, d) => <dc.VanillaTextBox dispatch={d} text={v} inline={false}/>,
				render: (v, o) => <dc.Markdown content={v} inline/>
			},
			{
				id: "completed",
				value: x => x.$completed,
				render: (v, o) => <dc.Checkbox defaultChecked={v} onCheckChange={(v2) => {
				dc.setTaskCompletion(v2, o);
			}} checked={v}/>,
				width: "minimum"
			},
			{
				id: "id",
				value: x => x.$revision,
				sortable: true,
				width: "minimum",
				title: "revision #",
				editable: false
			},
		],
		displayGroupAsRow: true,
		groupings: [{
			render: (k, v) => <h1>{k.split("/").toReversed()[0].replace(/\.md$/, "")}</h1>
		},
		{
			render: (k, v)	=> {
				let sec = useSection(k)
				let link = sec.$link.withDisplay(sec.$title)
				return <dc.Link link={link} />	
			}
		},
		],
		childSelector: (x) => x.$elements
	}
	return (
		<dc.TreeTable {...props}/>
		)
}

```
