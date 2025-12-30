import express from 'express';
import { createClient } from 'redis';
import ip from 'ip';

const app = express();

// --- Redis Setup ---
const client = createClient({
    username: 'default',
    password: 'nwpV4PIXYuql9IhFo9Cx84n7yPjChVwP', // Change this in production!
    socket: {
        host: 'redis-17745.c270.us-east-1-3.ec2.cloud.redislabs.com',
        port: 17745
    }
});

client.on('error', err => console.log('Redis Client Error', err));

// Connect to Redis
await client.connect();
console.log("Connected to Redis Cloud...");

// --- Configuration ---
const MAX_REQUESTS = 5;
const MAX_TIME_WINDOW_MS = 10000; // 10 seconds

// --- Commented code preserved as requested ---
/*
let ip_mapping = {};
setInterval(()=>{
    ip_mapping = {};
    console.log("Resetting IP mapping");
}, MAX_TIME_WINDOW);
*/

// --- Rate Limiter Middleware ---
app.use(async (req, res, next) => {
    console.log("Middleware triggered");
    
    // Using req.ip to identify unique users (more accurate than ip.address())
    const my_ip = req.ip || ip.address(); 
    const key = `rate_limit:${my_ip}`;

    try {
        // 1. Atomically increment the request count in Redis
        const currentRequests = await client.incr(key);

        // 2. If this is the first request of the window, set the expiry
        if (currentRequests === 1) {
            // Redis EXPIRE uses seconds
            await client.expire(key, MAX_TIME_WINDOW_MS / 1000);
        }

        // 3. Check if the user exceeded the limit
        if (currentRequests > MAX_REQUESTS) {
            console.log(`Blocked IP: ${my_ip} | Requests: ${currentRequests}`);
            return res.status(429).send("Too many requests. Please wait 10 seconds.");
        }

        // 4. Continue to the route
        next();
    } catch (err) {
        console.error("Redis Rate Limiter Error:", err);
        // Fail-open: If Redis is down, we let the request through so the app doesn't break
        next();
    }
});

// --- Routes ---
app.get('/', (req, res) => {
    console.log("Hello World route hit");
    res.status(200).send("ok");
});

// --- Server Start ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});