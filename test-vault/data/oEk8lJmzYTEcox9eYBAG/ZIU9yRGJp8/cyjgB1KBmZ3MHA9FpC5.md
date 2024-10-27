```datacorejsx
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
function TaskTable({path}) {
	let q = dc.useQuery(`childof (@block-list) and $parentLine < 0 and @task and path("${path}") and !#folder-note`);
	
	const uniq = dc.useMemo(() => q.map(x => x.$parent).filter((b, i, a) => i === a.findIndex(y => y.$file === b.$file)), [q]);
	const groups = dc.useMemo(() => uniq
		.map((p) => ({key: p, rows: q.filter(b => b.$parent.$id === p.$id)}))
		.sort((a, b) => {
			let aa = a.key.$file.split("/").toReversed()[0];
			let bb = b.key.$file.split("/").toReversed()[0];
			return aa > bb ? 1 : aa < bb ? -1 : 0;
		}), [uniq, q]);
	return dc.useMemo(() => {
		
		const tprops = {
			groupings: [
				{
					render: (k, r) =>	{
						let kk = k.$file.split("/");
						let block = kk.pop();
						let name = kk[kk.length - 1];
						name = name.substr(0, name.lastIndexOf("."));
						let link = k.$parent.$link.withDisplay(name)
						return (<h4 style={{
							"--link-color": "var(--h4-color)",
						}}>
							<dc.Link link={link} style={{color: "var(--h4-color) !important"}}/>
						</h4>)
					}
				}
			],
			rows: groups,
			columns: [
				{
					id: "one",
					title: "task",
					value: (x) => x,
					render: (v, o) => {
						return <dc.TaskList 
							rows={[o]} 
							states={["/", "x", " "]} />
					}
				},
				{
					id: "progress",
					title: "% done",
					value: (x) => x,
					render: (v, o) => <progress value={tprogress(o) * 100} min={0} max={100}/>	
				}
			],
			
			paging: 7
		}
		return <dc.VanillaTable {...tprops}/>
	}, [q, groups, uniq])
}

function Type({path}) {
	
}

return {TaskTable}
```

YrNcrirar3
