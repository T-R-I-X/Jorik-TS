/// Handles player functions on server side

import { OnStart, Service } from "@flamework/core";
import Signal from "@rbxts/signal";
import DataStore, { Response, property } from "@rbxts/suphi-datastore";
import { Players } from "@rbxts/services";

const playerLoaded = new Signal<(player:Player) => void>();
const playerUnloaded = new Signal<(player:Player) => void>();

const STORE_NAME = "GameData"
const STORE_MASTER_KEY = "_master_player_"

interface GameData {
    Main: { /// main data outside of a slot
        "Legacy.Name":string, // your game legacy name
        "Legacy.Level":number, // your game legacy level

        "Settings.MusicEnabled":boolean,
        "Settings.SFXEnabled":boolean,
        "Settings.SFXVolume":number, // between 0 - 1
        "Settings.MusicVolume":number, // between 0 - 1
    }
}

interface PlayerData {
    GameStore:property<GameData>
}

const stateChanged = (_state:unknown, gameStore:property<GameData>) => {
    while (gameStore.State === false) {
        const response = gameStore.Open() as unknown

        if (response !== Response.Success) {
            warn(`[WARN] GamePlayer: datastore dropped for player (probable cause being datastore is down) retrying in 5 seconds.`)
            task.wait(5)
        }
    }
} 

@Service()
class GamePlayer implements OnStart {
    Players:Map<number, PlayerData>

    constructor() {
        this.Players = new Map<number, PlayerData>();
    }

    onStart() {
        Players.PlayerAdded.Connect((p) => this.addPlayer(p))
        Players.PlayerRemoving.Connect((p) => this.removePlayer(p))
    }

    addPlayer(player:Player) {
        const newPlayerData:PlayerData = {
            GameStore: new DataStore(STORE_NAME, `${STORE_MASTER_KEY}${player.UserId}`)
        }
        
        newPlayerData.GameStore.StateChanged.Connect((state, gameStore) => stateChanged(state, gameStore))
        stateChanged("false", newPlayerData.GameStore)

        this.Players.set(player.UserId, newPlayerData)

        playerLoaded.Fire(player)
    }
    
    removePlayer(player:Player) {
        const game_store = DataStore.find(STORE_NAME, `${STORE_MASTER_KEY}${player.UserId}`)
        const player_store = this.Players.get(player.UserId)

        if (game_store) {
            game_store.Destroy()
        }

        if (player_store) {
            this.Players.delete(player.UserId)
        }

        playerUnloaded.Fire(player)
    }
}

export default GamePlayer
export { GamePlayer, PlayerData, playerLoaded, playerUnloaded };