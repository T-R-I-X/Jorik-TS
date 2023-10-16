/// Handles player functions on server side

import { OnStart, Service } from "@flamework/core";
import { WorldData, get, getReturn } from "../../shared/Metadata/World";
import { Workspace } from "@rbxts/services";
import { Events } from "server/network";

type npcNodeArray = Array<{cframe:CFrame, size:Vector3}>

@Service()
class World implements OnStart {
    world: string;
    metadata: WorldData;
    npcNodes: Map<Folder, npcNodeArray>;

    constructor() {
        const worldData: getReturn = get(game.PlaceId);

        if (worldData === false) {
            this.metadata = {
                placeId: 0
            } as WorldData;
            this.world = "None";

            warn("[WARN] World: unable to assign a world metadata nor world name.");
        } else {
            this.metadata = worldData as WorldData;
            this.world = this.metadata.name;
        }

        this.npcNodes = new Map<Folder, npcNodeArray>();
    }

    onStart() {
        this.setupNPCs();
    }

    private setupNPCs() {
        const npcFolder = Workspace.FindFirstChild("World_NPCs");

        if (npcFolder) {
            for (const folder of npcFolder.GetChildren()) {
                if (folder.IsA("Folder")) {
                    const data = [] as npcNodeArray;
                    for (const part of folder.GetChildren()) {
                        if (part.IsA("BasePart") || part.IsA("MeshPart")) {
                            data.push({ cframe: part.CFrame, size: part.Size });
                            part.CanCollide = false;
                        }
                    }
                    this.npcNodes.set(folder, data);
                }
            }
        }

        task.spawn(() => {
            // eslint-disable-next-line roblox-ts/lua-truthiness
            while (task.wait()) {
                for (const v of this.npcNodes) {
                    const folder = v[0]
                    const data = v[1] as npcNodeArray

                    if ((data.size() - 1) < 1) { 
                        const cframe = data[0].cframe as CFrame
                        const size = data[0].size as Vector3

                        const x = cframe.Position.Z + math.random(-size.X/2, size.X/2)
                        const z = cframe.Position.Z + math.random(-size.Z/2, size.Z/2)

                        print(`[INFO] NPC: updated ${folder.Name}'s position cords to X${x} Z${z}`)
                        Events.UpdateNpcMovement.broadcast(x,z) // tell all the other clients.
                    }
                }
            }
        })
    }
}

export default World;
export { World, npcNodeArray };
