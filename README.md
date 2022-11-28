# benchmark

## How to run
```bash
k6 run client-sdk.js -e UNLEASH_URL=https://sandbox.getunleash.io/edge -e UNLEASH_API_TOKEN="{token}" -e sdks=200
```

Or:
```bash
k6 run client-sdk.js -e UNLEASH_URL=localhost:4242 -e UNLEASH_API_TOKEN="{token}" -e sdks=200
```
