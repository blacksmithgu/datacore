/** All datacore settings. */
export interface Settings {
    /** The number of threads the importer will use for importing. */
    importerNumThreads: number;
    /** The CPU utilization (between 0.1 and 1.0) that importer threads should use. */
    importerUtilization: number;
}

/** Default settings for the plugin. */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
    importerNumThreads: 2,
    importerUtilization: 0.75,
});
