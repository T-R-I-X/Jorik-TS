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

import { HttpService, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { Agent } from "client/modules/Agent";
import { Events } from "client/network";

@Controller({})
class World implements OnStart {
    private npcCache: Array<Agent>;
    private pathNPCCache: Map<Folder, Array<{ cframe: CFrame; size: Vector3 }>>;
    public npcFolder: Folder;
    public hiddenFolder: Folder;


    /**
     * Only issue I can see is that NPC will not be where the server says it is, so we need to fix that when NPC is unhidden
     * by client.
     * 
     * LN 71
     */

    constructor() {
        this.npcCache = new Array<Agent>();
        this.pathNPCCache = new Map<Folder, Array<{ cframe: CFrame; size: Vector3 }>>();

        this.npcFolder = ReplicatedStorage.WaitForChild("Mobs") as Folder;
        this.hiddenFolder = new Instance("Folder", ReplicatedStorage);
        this.hiddenFolder.Name = "HiddenNPCs";

        task.spawn(() => {
            // eslint-disable-next-line roblox-ts/lua-truthiness
            while (task.wait(10)) {
                for (const model of this.npcFolder.GetDescendants()) {
                    if (model.IsA("Model")) {
                        const character = Players.LocalPlayer.Character;

                        if (character !== undefined) {
                            const modelHRP = model.WaitForChild("HumanoidRootPart") as Part;
                            const hrp = character.WaitForChild("HumanoidRootPart") as Part;

                            const mag = hrp.Position.sub(modelHRP.Position).Magnitude;

                            if (mag > 150) {
                                model.Parent = this.hiddenFolder;
                            }
                        }
                    }
                }

                for (const model of this.hiddenFolder.GetDescendants()) {
                    if (model.IsA("Model")) {
                        const character = Players.LocalPlayer.Character;

                        if (character !== undefined) {
                            const modelHRP = model.WaitForChild("HumanoidRootPart") as Part;
                            const hrp = character.WaitForChild("HumanoidRootPart") as Part;

                            const mag = hrp.Position.sub(modelHRP.Position).Magnitude;

                            if (mag < 150) {
                                model.Parent = this.npcFolder;
                            }
                        }
                    }
                }
            }
        });
    }

    onStart() {
        Events.UpdateNpcMovement.connect((folder, pData) => this.updateNPCPath(folder, pData));

        const npcFolder = Workspace.WaitForChild("MOBS");
        for (const folder of npcFolder.GetChildren()) {
            task.delay(5, () => {
                this.watchNPC(folder as Folder);
            });
        }

        Events.RenderNPC.connect((npcName, initialPos) => this.renderNPC(npcName, initialPos));
    }

    private renderNPC(npcName: string, initialPos: Vector3) {
        const npcModel = this.npcFolder.FindFirstChild(npcName) as Model;

        const cloneModel = npcModel.Clone();
        cloneModel.Name = HttpService.GenerateGUID(false);
        cloneModel.Parent = this.npcFolder;
        cloneModel.AddTag("NPC");
        cloneModel.SetAttribute("Name", npcName);

        // make npc unkillable
        const forceField = new Instance("ForceField", cloneModel);
        forceField.Visible = false;

        cloneModel.PivotTo(new CFrame(initialPos.X, initialPos.Y, initialPos.Z));
    }

    private watchNPC(folder: Folder) {
        const npcModel = this.npcFolder.FindFirstChild(folder.Name) as Model;

        if (!npcModel) throw error(`Missing model for npc ${folder.Name}.`);

        const newAgent = new Agent(npcModel, folder, 10, true);
        this.npcCache.push(newAgent);

        folder.AttributeChanged.Connect((attribute) => {
            if (newAgent.agent.Parent !== this.hiddenFolder) {
                if (attribute === "Position") {
                    const newPos = folder.GetAttribute(attribute) as Vector3;
                    newAgent.MoveTo(newPos);
                }
            }
        });
    }

    private updateNPCPath(folder: Folder, partData: Array<{ cframe: CFrame; size: Vector3 }>) {
        if (this.pathNPCCache.get(folder)) return;
        this.pathNPCCache.set(folder, partData);
    }
}

export default World;
export { World };
