module.exports = {
    apps: [
        {
            name: "verifier",
            cwd: "/verifier",
            script: "./verifier"
        },
        {
            name: "demo",
            cwd: "/app",
            script: "node",
            args: "build/server/index.bundle.js"
        }
    ]
};