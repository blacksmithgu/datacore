export interface WorkerRequest {
	id: string;
	libDir: string;
	vaultRoot: string;
	vaultFiles: string[];
	lvi: {
		[k: string]: string;
	}
	version: string;
	package: string;
}
export interface WorkerResponse {
	id: string;
	package: string;
	version: string;
	content: {
		[pkg: string]: {
			entryPoint: string;
			latest: string;
			baseDir: string;
			dependencies: string[]
			files: {
				path: string;
				transformed: string;
			}[];
		};
	};
	
	latest: {
		[k: string]: string
	}
}
