const express = require('express');
const ip = require('ip');
const app = express();

const MAX_REQUESTS = 5;
const MAX_TIME_WINDOW = 10000; // 1 minute in milliseconds

let ip_mapping = {};
setInterval(()=>{
    ip_mapping = {};
    console.log("Resetting IP mapping");
}, MAX_TIME_WINDOW);

app.use((req, res, next)=>{
    console.log("Middleware triggered");
    const my_ip = ip.address();
    ip_mapping[my_ip] = ip_mapping[my_ip] || 1;
    if (ip_mapping[my_ip] > MAX_REQUESTS) {
        console.log(`Too many requests from IP: ${my_ip} and the number of requests are: ${ip_mapping[my_ip]}`);
        return res.status(429).send("Too many requests");
    }
    ip_mapping[my_ip]++;
    next();
})

app.get('/', (req, res)=>{
    console.log("Hello World");
    console.log("Server IP Address: ", ip.address());
    res.status(200).send("ok");
})

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})