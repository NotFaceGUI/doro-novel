import { TextureAtlas } from '@pixi-spine/base';
import { LoaderParserPriority, checkExtension } from '@pixi/assets';
import { ExtensionType, settings, utils, extensions } from '@pixi/core';

const spineTextureAtlasLoader = {
  extension: ExtensionType.Asset,
  // cache: {
  //     test: (asset: RawAtlas | TextureAtlas) => asset instanceof TextureAtlas,
  //     getCacheableAssets: (keys: string[], asset: RawAtlas | TextureAtlas) => getCacheableAssets(keys, asset),
  // },
  loader: {
    extension: {
      type: ExtensionType.LoadParser,
      priority: LoaderParserPriority.Normal
    },
    test(url) {
      return checkExtension(url, ".atlas");
    },
    async load(url) {
      const response = await settings.ADAPTER.fetch(url);
      const txt = await response.text();
      return txt;
    },
    testParse(asset, options) {
      const isExtensionRight = checkExtension(options.src, ".atlas");
      const isString = typeof asset === "string";
      return Promise.resolve(isExtensionRight && isString);
    },
    async parse(asset, options, loader) {
      const metadata = options.data;
      let basePath = utils.path.dirname(options.src);
      console.error("Parsed basePath:", basePath, options.src);
      if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) {
        basePath += "/";
      }
      let resolve = null;
      let reject = null;
      const retPromise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      let retval;
      const resolveCallback = (newAtlas) => {
        if (!newAtlas) {
          reject("Something went terribly wrong loading a spine .atlas file\nMost likely your texture failed to load.");
        }
        resolve(retval);
      };
      if (metadata.image || metadata.images) {
        const pages = Object.assign(metadata.image ? { default: metadata.image } : {}, metadata.images);
        retval = new TextureAtlas(
          asset,
          (line, callback) => {
            const page = pages[line] || pages.default;
            if (page && page.baseTexture)
              callback(page.baseTexture);
            else
              callback(page);
          },
          resolveCallback
        );
      } else {
        retval = new TextureAtlas(asset, makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject(loader, options.src, metadata.imageMetadata), resolveCallback);
      }
      return await retPromise;
    },
    unload(atlas) {
      atlas.dispose();
    }
  }
};
const makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject = (loader, atlasBasePath, imageMetadata) => {
  return async (pageName, textureLoadedCallback) => {
    console.error("loader:", atlasBasePath, imageMetadata);
    const decodedUrl = decodeURIComponent(atlasBasePath);
    const decode = decodedUrl.slice(0, decodedUrl.lastIndexOf("\\"));
    const url = `${decode}/${pageName}`;
    console.log("\u62FC\u63A5\uFF1A", url);
    const texture = await loader.load({ src: url, data: imageMetadata });
    textureLoadedCallback(texture.baseTexture);
  };
};
extensions.add(spineTextureAtlasLoader);

export { makeSpineTextureAtlasLoaderFunctionFromPixiLoaderObject };
//# sourceMappingURL=atlasLoader.mjs.map
