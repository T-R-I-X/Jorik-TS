function get(lang: string, path: string): string {
    const pathing = path.split(".");
    const langFolder = script.FindFirstChild(lang) as Folder;
    if (lang !== undefined) {
        const module = langFolder.FindFirstChild(pathing[0]) as ModuleScript;
        if (module) {
            const req = require(module) as { [key: string]: string };
            return req[pathing[1]];
        } else {
            return "MISSING MODULE";
        }
    } else {
        return "MISSING LOCALIZATION FOLDER";
    }
}

export default get
export { get }