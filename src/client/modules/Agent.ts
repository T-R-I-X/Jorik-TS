// Handles pathfinding agent

import { PathfindingService } from "@rbxts/services";

enum Status {
    "Idle",
    "Talking",
    "Ignoring",
    "Watching",
    "Walking",
    "Jumping",
    "Waiting",
    "Emoting",
    "Blocked"
}

class Agent {
    public agent: Model;
    public status: Status;
    public performance: { start: number; end: number };

    private animationModule: ModuleScript;
    private folder: Folder;
    private radius: number;
    private canJump: boolean;

    private Animations: Map<string, AnimationTrack>;
    private path: Path;
    private max_retries: number;
    private lastGoal: Vector3;

    constructor(agent: Model, mainFolder: Folder, radius?: number, canJump?: boolean) {
        radius ??= 5;
        canJump ??= true;

        const animationPath = script.Parent?.Parent?.WaitForChild("assets").WaitForChild("Animations").WaitForChild("NPCs") as Folder

        this.agent = agent;
        this.folder = mainFolder;
        this.animationModule = animationPath.WaitForChild(agent.Name) as ModuleScript

        this.status = Status.Idle;
        this.lastGoal = Vector3.zero;

        this.max_retries = 10; // max times a path can recalculate before failing
        this.radius = radius; // PathfindingService.Agent.AgentRadius
        this.canJump = canJump; // PathfindingService.Agent.AgentHeight

        this.performance = { start: 0, end: 0 };

        // load all animations
        const animationModule = require(this.animationModule) as { [key:string]:number }
        
        this.Animations = new Map<string, AnimationTrack>()

        //
        const humanoid = this.agent.WaitForChild("Humanoid") as Humanoid;

        this.path = PathfindingService.CreatePath({
            AgentRadius: this.radius,
            AgentHeight: humanoid.HipHeight,
            AgentCanJump: this.canJump
        });
        this.path.Blocked.Connect((waypointIndex) => this.Blocked(waypointIndex));
    }

    public MoveTo(target: Vector3, canYield?: boolean) {
        canYield ??= true;

        this.lastGoal = target;

        const startTime = os.time();

        let success = false;
        let current_retries = 0;

        const humanoid = this.agent.FindFirstChild("Humanoid") as Humanoid;
        const humanoidRootPart = this.agent.PrimaryPart as BasePart;

        do {
            current_retries += 1;
            try {
                this.path.ComputeAsync(humanoidRootPart.Position, target);
                success = true;
            } catch (err) {
                success = false;
            }
        } while (current_retries < this.max_retries && success !== true && !(canYield === true));

        if (success) {
            const waypoints = this.path.GetWaypoints();

            //start at 2nd index
            for (let i = 1; i < waypoints.size(); i++) {
                const waypoint = waypoints[i];

                if (waypoint) {
                    humanoid.MoveTo(waypoint.Position);
                    if (waypoint.Action === Enum.PathWaypointAction.Jump) {
                        humanoid.Jump = true;
                    }
                    humanoid.MoveToFinished.Wait();
                }
            }
        } else {
            warn(`[ERROR] Agent: (${this.agent.Name}) failed to compute path.`);
        }

        const endTime = os.time();
        this.performance = { start: startTime, end: endTime };
    }

    private Blocked(waypointIndex: number) {
        this.MoveTo(this.lastGoal);
    }

    public PlayAnimation() {
        if (this.status === Status.Idle) {

        }
    }

    public GetStatus() {
        return this.status;
    }
}

export { Agent, Status };
