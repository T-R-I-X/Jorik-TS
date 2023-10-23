//////////
// @CLIENT 10/22/2023 23:53:37
//
//  Name: World
//  Desc: Handles the client world things
//
//  Revision:
//      T-R-I-X Create
//////////

import { OnStart, Controller } from "@flamework/core";
import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { Agent } from "client/modules/Agent";
import { Events } from "client/network";

import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { Agent } from "client/modules/Agent";
import { Events } from "client/network";

@Controller({})
class World implements OnStart {
    private npcCache: Array<Agent>
    private pathNPCCache: Map<Folder, Array<{ cframe:CFrame, size:Vector3 }>>
    public npcFolder: Folder
    public hiddenFolder: Folder

    constructor() {
        this.npcCache = new Array<Agent>()
        this.pathNPCCache = new Map<Folder, Array<{ cframe:CFrame, size:Vector3 }>>()

        this.npcFolder = ReplicatedStorage.WaitForChild("Mobs") as Folder
        this.hiddenFolder = new Instance("Folder", ReplicatedStorage)
        this.hiddenFolder.Name = "HiddenNPCs"
    }

    onStart() {
        Events.UpdateNpcMovement.connect((folder, pData) => this.updateNPCPath(folder, pData))

        const npcFolder = Workspace.WaitForChild("MOBS")
        for (const folder of npcFolder.GetChildren()) {
            task.delay(5, () => {
               this.watchNPC(folder as Folder) 
            })
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

    private updateNPCPath(folder:Folder, partData:Array<{ cframe:CFrame, size:Vector3 }>) {
        if (this.pathNPCCache.get(folder)) return;
        this.pathNPCCache.set(folder, partData)
    }
}

export default World;
export { World };