# [TLSNotary Plugin Demo](https://github.com/tlsnotary/tlsn-plugin-demo#tlsn-plugin-demo)

Welcome to the **TLSNotary Plugin Demo**! This demo showcases how TLSNotary can be used to verify private user data in web applications.

In this demo, you'll prove that you own a Twitter account to the web server. The website will verify your proof and, as a reward, you'll receive a POAP (Proof of Attendance Protocol) token — while stocks last!

---

## Open Source Code and Resources

- **Demo Repository**: [tlsn-plugin-demo](https://github.com/tlsnotary/tlsn-plugin-demo)
- **Twitter Plugin**: [tlsn-plugin-boilerplate](https://github.com/tlsnotary/tlsn-plugin-boilerplate)
- **TLSNotary Protocol, Notary Server, Browser Extension, and More**: [GitHub - TLSNotary](https://github.com/tlsnotary)


For more details, visit the repositories above to explore the code and contribute to the project!

---




This demo works by leveraging the [Provider API]((https://github.com/tlsnotary/tlsn-extension/wiki/TLSN-Provider-API)) functionality of the [TLSNotary Extension](https://github.com/tlsnotary/tlsn-extension)


## Installing and Running

1. Build:
    ```sh
    docker build -t tlsn-demo .
    ```
    * To build with POAPS enabled, add `--build-arg ENABLE_POAP=true` 
    * To set the verifier url, add `--build-arg VERIFIER_URL="http://demo.tlsnotary.org:7047"` 
    E.g. `docker build --build-arg ENABLE_POAP=true -t tlsn-demo .`
2. Run:
    ```sh
    docker run --rm -p 3030:3030 -p 7047:7047  -it tlsn-demo
    ```
3. Visit <http://localhost:3030>