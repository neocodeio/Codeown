
import { notify } from "./src/services/notification.service.js";

async function test() {
    console.log("Testing notification system...");
    // Replace with valid IDs from your local DB if needed
    // This is just to see if it executes without crashing and logs properly
    try {
        await notify({
            userId: "user_2eL7W1O9h6B6K5...", // Need a real ID here or it logs error
            actorId: "actor_id_here",
            type: "like",
            postId: 1
        });
        console.log("Test finished.");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

// test();
