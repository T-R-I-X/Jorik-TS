import { Networking } from "@flamework/networking";

interface ServerEvents {    
    UpdateNpcMovement(folder:Folder, partData:Array<{ cframe:CFrame, size:Vector3 }>):void}

interface ClientEvents {
    UpdateNpcMovement(folder:Folder, partData:Array<{ cframe:CFrame, size:Vector3 }>):void
}

interface ServerFunctions {}

interface ClientFunctions {}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();
