/// Handles player functions on server side

import { OnStart, Service } from "@flamework/core";
import { GamePlayer, playerLoaded, playerUnloaded } from "./Player"
import { Players } from "@rbxts/services";


@Service()
class GameCharacter implements OnStart {
    constructor(private gamePlayer: GamePlayer) {}

    onStart() {
        playerLoaded.Connect(() => this.loaded)
        playerUnloaded.Connect(() => this.unloaded)

        Players.PlayerAdded.Connect((player:Player) => {
            
        })
    }

    private loaded(player: Player) {
        print(player.UserId)
    }

    private unloaded(player:Player) {

    }
}

export default GameCharacter
export { GameCharacter };