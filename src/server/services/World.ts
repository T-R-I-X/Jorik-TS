/// Handles player functions on server side

import { OnStart, Service } from "@flamework/core";
import { WorldData, get, getReturn } from "../../shared/Metadata/World";
import { Workspace } from "@rbxts/services";
import { Events } from "server/network";

@Service()
class GameCharacter implements OnStart {
    world: string;
    metadata: WorldData;
    npcNodes: Map<Folder, any>;

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

        this.npcNodes = new Map<Folder, any>();
    }

    onStart() {
        this.setupNPCs();
    }

    private setupNPCs() {
        const npcFolder = Workspace.FindFirstChild("World_NPCs");

        if (npcFolder) {
            for (const folder of npcFolder.GetChildren()) {
                if (folder.IsA("Folder")) {
                    const data = [];
                    for (const part of folder.GetChildren()) {
                        if (part.IsA("BasePart") || part.IsA("MeshPart")) {
                            data.push([{ cframe: part.CFrame, size: part.Size }]);
                            part.CanCollide = false;
                        }
                    }
                    this.npcNodes.set(folder, data);
                }
            }
        }

        task.spawn(() => {
            while (true) {
                for (const v of this.npcNodes) {
                    if (v[1].length < 1) { 
                        const x = v[1].cframe.p.X + math.random(-v[1].size.X/2, v[1].size.X/2)
                        const z = v[1].cframe.p.Z + math.random(-v[1].size.Z/2, v[1].size.Z/2)
                        Events.UpdateNpcMovement.broadcast(x,z)
                    }
                }

                task.wait()
            }
        })
    }
}

export default GameCharacter;
export { GameCharacter };
