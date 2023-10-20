//@Description Example
//@Author Name

import { OnStart, Controller } from "@flamework/core";
import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { Agent } from "client/modules/Agent";

@Controller()
class World implements OnStart {
    npcCache: Array<Agent>
    npcFolder: Folder

    constructor() {
        this.npcCache = new Array<Agent>()
        this.npcFolder = ReplicatedStorage.WaitForChild("Mobs") as Folder
    }

    onStart() {
        const npcFolder = Workspace.WaitForChild("MOBS")
        for (const folder of npcFolder.GetChildren()) {
            this.watchNPC(folder as Folder)
        }
    }

    private watchNPC(folder:Folder) {
        const npcModel = this.npcFolder.FindFirstChild(folder.Name) as Model
 
        if (!npcModel) throw error(`Missing model for npc ${folder.Name}.`)

        const newAgent = new Agent(npcModel, folder, 10, true)
        this.npcCache.push(newAgent)

        folder.AttributeChanged.Connect((attribute) => {
            if (attribute === "Position") {
                const newPos = folder.GetAttribute(attribute) as Vector3
                newAgent.MoveTo(newPos)
            }
        })
    }
}

export default World;
export { World };