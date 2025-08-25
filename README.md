# [TLSNotary Plugin Demo](https://github.com/tlsnotary/tlsn-plugin-demo#tlsn-plugin-demo)

Welcome to the **TLSNotary Plugin Demo**! This demo showcases how TLSNotary can be used to verify private user data in web applications.

In this demo, you'll prove that you own a Twitter account to the web server. The website will verify your attestation and, as a reward, you'll receive a POAP (Proof of Attendance Protocol) token — while stocks last!

---

## Open Source Code and Resources

- **Demo Repository**: [tlsn-plugin-demo](https://github.com/tlsnotary/tlsn-plugin-demo)
- **Twitter Plugin**: [tlsn-plugin-boilerplate](https://github.com/tlsnotary/tlsn-plugin-boilerplate)
- **TLSNotary Protocol, Notary Server, Browser Extension, and More**: [GitHub - TLSNotary](https://github.com/tlsnotary)

For more details, visit the repositories above to explore the code and contribute to the project!

---

This demo works by leveraging the [Provider API](<(https://github.com/tlsnotary/tlsn-extension/wiki/TLSN-Provider-API)>) functionality of the [TLSNotary Extension](https://github.com/tlsnotary/tlsn-extension)

## Installing and Running

1. Clone this repository
2. Run `npm install`
3. Insert a `poaps.txt` of POAP mint links in `server/util`
4. Run `npm run dev`
5. Enjoy the demo

This demo is hosted locally on port 3030. Visit the demo at: `http://localhost:3030` to explore interacting with the plugin.
