# Figma Prismic Plugin

A Figma plugin that fetches content from Prismic CMS.
The plugin references  layout instances in Figma that are automatically populated with text and image slices retrieved from Prismic via a custom proxy.

## Features
- **Prismic proxy:** API proxy for figma access.
- **Content Syncing:** Automatically fetch content from Prismic.

## Prerequisites
- [Node.js](https://nodejs.org) (version 14 or later recommended)
- npm

## Installation
1. **Clone the Repository:**

   ```
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Install Dependencies (Root and Proxy):**

   In the repository root:

   ```
   npm install
   ```

   Then navigate to the proxy folder and install its dependencies:

   ```
   cd prismic-proxy
   npm install
   ```

## Building the Plugin

Build the plugin code (located in the `src/` folder) by running:

```
npx webpack
```

This uses webpack to compile your TypeScript source files and outputs the bundled code to the `dist/` directory.

## Running the Plugin in Figma

1. Open the Figma desktop app.
2. Go to **Plugins** > **Development** > **Import plugin from manifest…**
3. Select the `manifest.json` file from the root of this repository.
4. Your plugin will load, and you can run it from the **Plugins** menu.

## Prismic Proxy

The plugin uses a proxy (located in the `prismic-proxy/` folder) to securely and reliably fetch data from Prismic. You can deploy this proxy using [Vercel](https://vercel.com) or any other hosting service.

- Make sure your proxy is properly configured (see `prismic-proxy/api/proxy.js`).
- If you deploy your own proxy, update the proxy URL in `src/code.ts` accordingly.

## Technologies Used

- [Figma Plugin API](https://www.figma.com/plugin-docs/intro/)
- [Prismic CMS](https://prismic.io)
- [Webpack](https://webpack.js.org)
- [TypeScript](https://www.typescriptlang.org/)

## License

This project is licensed under the MIT License – see the [LICENCE](LICENCE) file for details.



