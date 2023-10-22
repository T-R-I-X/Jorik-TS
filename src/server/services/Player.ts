/// Handles player functions on server side

import { OnStart, Service } from "@flamework/core";
import Signal from "@rbxts/signal";
import DataStore, { Response, property } from "@rbxts/suphi-datastore";
import { Players } from "@rbxts/services";

const playerLoaded = new Signal<(player: Player) => void>();
const playerUnloaded = new Signal<(player: Player) => void>();

const STORE_NAME = "GameData";
const STORE_MASTER_KEY = "_master_player_";

interface SlotData {
    CharacterNickname: string;
    Level: number;
    Quests: Map<string, number>; // questId, step
    Inventory: Map<number, number>; // item ID, quantity
    Mounts: Map<string, number>; // unique mount name, mount ID
    Skills: Map<number, number>; // skill ID, skill level

    "Slot.EquippedWeapon": number;
    "Slot.EquippedMagic": number;
    "Slot.HotKeys": Map<string, string>; // keycode, "type.ID" ex. Enum.KeyCode.Q, "Inventory.0"

    "Character.HairStyle": number;
    "Character.EyeStyle": number;
    "Character.MouthStyle": number;
    "Character.BodyColor": number;
    "Character.ShirtStyle": number;
    "Character.PantStyle": number;
}

interface GameData {
    Main: {
        /// main data outside of a slot
        "Legacy.Name": string; // your game legacy name
        "Legacy.Level": number; // your game legacy level
        "Legacy.Unlocks": Map<string, boolean>;

        "Settings.MusicEnabled": boolean;
        "Settings.SFXEnabled": boolean;
        "Settings.SFXVolume": number; // between 0 - 1
        "Settings.MusicVolume": number; // between 0 - 1
    };
    Slots: Map<string, SlotData>;
}

interface PlayerData {
    GameStore: property<GameData>;
}

const defaultGameData: GameData = {
    Main: {
        "Legacy.Name": "Enter name...",
        "Legacy.Level": 1,
        "Legacy.Unlocks": new Map<string, boolean>(),

        "Settings.MusicEnabled": true,
        "Settings.SFXEnabled": true,
        "Settings.SFXVolume": 0.5,
        "Settings.MusicVolume": 0.5
    },
    Slots: new Map<string, SlotData>()
};

const stateChanged = (_state: unknown, gameStore: property<GameData>) => {
    while (gameStore.State === false) {
        const response = gameStore.Open() as unknown;

        if (response !== Response.Success) {
            warn(
                `[WARN] GamePlayer: datastore dropped for player (probable cause being datastore is down) retrying in 5 seconds.`
            );
            task.wait(5);
        }
    }
};

@Service()
class GamePlayer implements OnStart {
    Players: Map<number, PlayerData>;

    constructor() {
        this.Players = new Map<number, PlayerData>();
    }

    onStart() {
        Players.PlayerAdded.Connect((p) => this.addPlayer(p));
        Players.PlayerRemoving.Connect((p) => this.removePlayer(p));
    }

    addPlayer(player: Player) {
        const gameStore = new DataStore(STORE_NAME, `${STORE_MASTER_KEY}${player.UserId}`) as property<GameData>;

        const newPlayerData: PlayerData = {
            GameStore: gameStore
        };

        gameStore.StateChanged.Connect((state, gameStore) => stateChanged(state, gameStore));
        stateChanged("false", newPlayerData.GameStore);

        gameStore.Reconcile(defaultGameData);

        let loginAmount = gameStore.Metadata.get("LoginAmount") as number; // this will never be 0 if it is then something is wrong

        // eslint-disable-next-line roblox-ts/lua-truthiness
        if (!loginAmount) loginAmount = 0;
        gameStore.Metadata.set("LoginAmount", loginAmount + 1);

        this.Players.set(player.UserId, newPlayerData);
        playerLoaded.Fire(player);

        const [charCount, usage] = gameStore.Usage();
        print(`[INFO] Player: loaded (${player.UserId}) | usage ${usage * 100}% | characters ${charCount}`);
    }

    removePlayer(player: Player) {
        const game_store = DataStore.find(STORE_NAME, `${STORE_MASTER_KEY}${player.UserId}`);
        const player_store = this.Players.get(player.UserId);

        if (game_store) {
            game_store.Destroy();
        }

        if (player_store) {
            this.Players.delete(player.UserId);
        }

        playerUnloaded.Fire(player);
    }

    getDataFromCache(userId:number): unknown {
        const playerData = this.Players.get(userId)
        if (playerData) {
            return playerData
        } else {
            error(`[ERROR] Player: (${userId}) has no data loaded to get yet.`)
        }
    }

    createSlot(player: Player): LuaTuple<[boolean, unknown]> {
        const playerData = this.getDataFromCache(player.UserId) as PlayerData
        if (playerData) {
            const slot_number = playerData.GameStore.Value.Slots.size() + 1;
            const slot_new_ind = `Slot_${slot_number}`

            playerData.GameStore.Value.Slots.set(slot_new_ind, {
                CharacterNickname: "Enter Name...",
                Level: 1,
                Quests: new Map<string, number>(), // questId, step
                Inventory: new Map<number, number>(), // item ID, quantity
                Mounts: new Map<string, number>(), // unique mount name, mount ID
                Skills: new Map<number, number>(), // skill ID, skill level
            
                "Slot.EquippedWeapon": 0,
                "Slot.EquippedMagic": 0,
                "Slot.HotKeys": new Map<string, string>(), // keycode, "type.ID" ex. Enum.KeyCode.Q, "Inventory.0"
            
                "Character.HairStyle": 1,
                "Character.EyeStyle": 1,
                "Character.MouthStyle": 1,
                "Character.BodyColor": 1,
                "Character.ShirtStyle": 1,
                "Character.PantStyle": 1
            });

            const newSlotValue = playerData.GameStore.Value.Slots.get(slot_new_ind) as SlotData

            return $tuple(true, newSlotValue);
        } else {
            return $tuple(false, "Missing player data.");
        }
    }

    deleteSlot(player: Player, slot:string)  {
    }

    getSlot(player: Player, slot: string): LuaTuple<[boolean, unknown]> {
        const playerData = this.getDataFromCache(player.UserId) as PlayerData
        if (playerData) {
            const slotData = playerData.GameStore.Value.Slots.get(slot);
            return $tuple(true, slotData);
        } else {
            return $tuple(false, "Missing player data.");
        }
    }
}

export default GamePlayer;
export { GamePlayer, PlayerData, GameData, SlotData, playerLoaded, playerUnloaded };
