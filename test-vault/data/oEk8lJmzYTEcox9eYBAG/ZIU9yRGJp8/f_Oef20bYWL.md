```jsx
const {fandoms: fandomIcons, categories: categoryIcons} = await dc.require("root/views/cat-icons.md#category icons")
const PRE_REGEX = /^\d+\s-\s/m;
const tprogress = (t) => {
	if(t.$completed) return 1;
	let completed = t.$elements.filter(x => x.$completed).length;
	let total = Math.max(t.$elements.length, 1);
	let a = 0;
	t.$elements.forEach(e => {
		a += tprogress(e) / total;	
	})
	return a;	
}
const usePath = (path) => dc.useQuery(`childof (@block-list) and $parentLine < 0 and @task and path("${path}") and !#folder-note and !contains($file, "uni")`)

function TaskTable({rows}) {
	//const uniq = dc.useMemo(() => q.map(x => x.$parent).filter((b, i, a) => i === a.findIndex(y => y.$file === b.$file)), [q]);
	/*const groups = dc.useMemo(() => uniq
		.map((p) => ({key: p, rows: q.filter(b => b.$parent.$id === p.$id)}))
		.sort((a, b) => {
			let aa = a.key.$file.split("/").toReversed()[0];
			let bb = b.key.$file.split("/").toReversed()[0];
			return aa > bb ? 1 : aa < bb ? -1 : 0;
		}), [uniq, q]);*/
	return dc.useMemo(() => {
		
		const tprops = {
			groupings: [
				{
					render: (k, r) =>	{
						let kk = k.$file.split("/");
						let block = kk.pop();
						let name = kk[kk.length - 1];
						name = name.substr(0, name.lastIndexOf("."));
						let link = k.$parent.$link.withDisplay(k.$parent.$title)
						return (<h4 style={{
							"--link-color": "var(--h4-color)",
						}}>
							<dc.Link link={link} style={{color: "var(--h4-color) !important"}}/>
						</h4>)
					}
				}
			],
			rows,
			columns: [
				{
					id: "one",
					title: "task",
					value: (x) => x,
					render: (v, o) => {
						return <dc.TaskList 
							rows={[o]} 
							states={["/", "x", " "]} />
					},
					width: "maximum"
				},
				{
					id: "progress",
					title: "% done",
					value: (x) => x,
					render: (v, o) => <progress value={tprogress(o) * 100} min={0} max={100}/>,
					width: "minimum"	
				}
			],
			
			paging: 7
		}
		return <dc.VanillaTable {...tprops}/>
	}, [rows])
}
function Fandom({projects, name, path}) {
	let realName = name.replace(PRE_REGEX, "")
	let lastSegment = path.split("/").toReversed()[0]
	const title = <span style={{"--link-color": "var(--callout-color)"}}><i className={`far ${fandomIcons[realName.toLocaleLowerCase()]}`}/> <dc.Link link={dc.fileLink(`${path}/${lastSegment}.md`).withDisplay(realName)}/></span>
	return (
			<>
				<dc.Callout type="column|flex" title={title}>
					{projects.map(p => (
						<dc.Callout type="turquoise" title={<span style={{"--link-color": "var(--callout-color)"}}><dc.Link link={
							dc.fileLink(p.key).withDisplay(p.key.split("/").toReversed()[0].replace(PRE_REGEX, "").replace(/\.md$/, ""))}/></span>} collapsible={false}>
							<TaskTable rows={p.rows}/>
						</dc.Callout>
					))}	
				</dc.Callout>
			</>
		)
}
function Type({ fandoms, catName }) {	
//	console.log("tasks", tasks);
//	console.log(arr)
	let realName = catName.replace(PRE_REGEX, "")
	return (<dc.Callout type="greybl" title={<h1><i className={`fal ${categoryIcons[realName.toLocaleLowerCase()]}`}/>&nbsp;{realName}</h1>}>
		{fandoms.map(f => (
			<Fandom path={f.key} projects={f.rows} name={f.key.split("/").toReversed()[0].replace(PRE_REGEX, "")} />))}
	</dc.Callout>)
}

function Master({tasks}) {
	return (<>
		{tasks.map(x => <Type fandoms={x.rows} catName={x.key.split("/")[1].replace(PRE_REGEX, "")} />)}	
	</>)
}

function ProjectView({type, path}) {
	let tmp = path.split("/").toReversed().slice(1).toReversed()
	path = tmp.join("/").replace(/\.md$/m, "")
	switch(type) {
		case "master": {
			const gf = o => {
				let tmp = o.substring(o.indexOf("/"))
				return tmp
			}
			const tasks = dc.array(usePath(path)).groupBy(o => o.$parent)
				.groupBy(ok => ok.key.$file)
				.groupBy(ok => {
					let t = ok.key;
					t = t.substring(0, t.lastIndexOf("/"))	
					return t
				})
				.groupBy((ok) => {
					return ok.key.split("/").toReversed().slice(1).toReversed().join("/")	
				})
				.array()
			return <Master tasks={tasks}/>
		}
		case "category":
			const tasks = usePath(path);
			const fandoms = dc.array(tasks).groupBy(ok => ok.$parent)
				.groupBy(ok => ok.key.$file)
				.groupBy(ok => {
					let tpo = ok.key.split("/").toReversed().slice(1).toReversed().join("/")
					return tpo
				}).array();
			return <Type catName={path.substring(path.lastIndexOf("/") + 1)} fandoms={fandoms}/>
		case "fandom":
		default:
			let projects = dc.array(usePath(path)).groupBy(ok => ok.$parent).groupBy(ok => ok.key.$file).array();
			return <Fandom path={path} name={path.substring(path.lastIndexOf("/") + 1).replace(PRE_REGEX, "")} projects={projects}/>
	}	
}
return {TaskTable, Type, Fandom, ProjectView}
```

Xo6ccBfNeJ
