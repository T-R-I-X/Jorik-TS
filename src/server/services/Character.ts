/// Handles player functions on server side

import { OnStart, Service } from "@flamework/core";
import { GamePlayer, playerLoaded, playerUnloaded } from "./Player"
import { Players, StarterPlayer } from "@rbxts/services";


@Service()
class GameCharacter implements OnStart {
    constructor(private gamePlayer: GamePlayer) {}

    onStart() {
        playerLoaded.Connect((p) => this.loaded(p))
        playerUnloaded.Connect((p) => this.unloaded(p))

        Players.PlayerAdded.Connect((player:Player) => {
            const hasStarterCharacter = StarterPlayer.FindFirstChild("StarterCharacter")

            if (!hasStarterCharacter) {
                const starterModel = script.Parent?.Parent?.WaitForChild("assets")
                // deal with this later for the asset library loading
            }
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