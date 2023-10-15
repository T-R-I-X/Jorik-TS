interface WorldData {
    placeId: number;
    name: string;
    levelRequired: number;
    isDiscoverable: boolean;
}

type getReturn = boolean | WorldData;

function instanceOfWorldData(object: any): object is WorldData {
    return "placeId" in object;
}

function get(ident: any): getReturn {
    const module: Instance | undefined = script.FindFirstChild(ident);
    if (module && module.IsA("ModuleScript")) {
        const data: unknown = require(module);
        if (instanceOfWorldData(data)) {
            return data;
        } else {
            return false;
        }
    }

    return false;
}

export { get, WorldData, getReturn };
