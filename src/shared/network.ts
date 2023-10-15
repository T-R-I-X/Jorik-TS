import { Networking } from "@flamework/networking";

interface ServerEvents {    
    UpdateNpcMovement(x:number, z:number):void
}

interface ClientEvents {
    UpdateNpcMovement(x:number, z:number):void
}

interface ServerFunctions {}

interface ClientFunctions {}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();
