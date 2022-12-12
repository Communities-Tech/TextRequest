module.exports = {
    apps : [{
        name: "text-request",
        script: "server.js",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}