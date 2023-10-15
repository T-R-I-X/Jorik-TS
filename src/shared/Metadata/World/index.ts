interface WorldData {
    placeId: number;
    name: string;
    levelRequired: number;
    isDiscoverable: boolean;
}

type getReturn = boolean | WorldData;

// eslint-disable-next-line roblox-ts/lua-truthiness
const instanceOfWorldData = (value: WorldData): value is WorldData => !!value.placeId;

function get(ident: string | number): getReturn {
    const module = script.FindFirstChild(ident);
    if (module && module.IsA("ModuleScript")) {
        const data = require(module) as WorldData;
        if (instanceOfWorldData(data)) {
            return data;
        } else {
            return false;
        }
    }

    return false;
}

export { get, WorldData, getReturn };
