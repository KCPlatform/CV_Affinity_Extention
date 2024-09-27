## Development build

`npm install`

Copy env.json.example to env.json and fill in the values.
```
{
    "KAPOR_AI_BASE_URL": "https://beta.kapor.ai",
    "CLIENT_ID": "your-client-id",
    "KEY_FILE": "path/to/key.txt",
}
```
To build the extension, run `node build.js`.

To run the extension, go to chrome://extensions, click "Load unpacked."

## Production build

To build for production, run `node build.js --production`.

When running in production mode, the key is not embedded in the manifest.json file.

A zip file will be created in root directory called "extension.zip" that can be uploaded to the chrome web store.