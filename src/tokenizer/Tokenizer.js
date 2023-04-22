import Utils from "../libs/Utils.js";
import logger from "../libs/logger.js";
import View from "./View.js";
import DirectoryPicker from "../libs/DirectoryPicker.js";
import ImageBrowser from "../libs/ImageBrowser.js";
import CONSTANTS from "../constants.js";
import { TokenizerSaveLocations } from "../libs/TokenizerSaveLocations.js";

export default class Tokenizer extends FormApplication {

  getOMFGFrames() {
    if (game.settings.get(CONSTANTS.MODULE_ID, "disable-omfg-frames")) return [];
    if (this.omfgFrames.length > 0) return this.omfgFrames;
    logger.debug(`Checking for OMFG Token Frames files in...`);

    ["normal", "desaturated"].forEach((version) => {
      ["v2", "v3", "v4", "v7", "v12"].forEach((v) => {
        for (let i = 1; i <= 8; i++) {
          const fileName = `modules/vtta-tokenizer/img/omfg/${version}/${v}/OMFG_Tokenizer_${v}_0${i}.png`;
          const label = `OMFG ${game.i18n.localize("vtta-tokenizer.label.Frame")} ${v} 0${i}`;
          const obj = {
            key: fileName,
            label,
            selected: false,
          };
          if (!this.frames.some((frame) => frame.key === fileName)) {
            this.omfgFrames.push(obj);
          }
        }
      });
    });
    return this.omfgFrames;
  }

  async getTheGreatNachoFrames() {
    if (game.settings.get(CONSTANTS.MODULE_ID, "disable-thegreatnacho-frames")) return [];
    if (this.theGreatNachoFrames.length > 0) return this.theGreatNachoFrames;
    logger.debug(`Checking for GreatNacho Token Frames.`);

    for (let i = 1; i <= 20; i++) {
      const fileName = `modules/vtta-tokenizer/img/thegreatnacho/theGreatNacho-${i}.webp`;
      const label = `TheGreatNacho ${game.i18n.localize("vtta-tokenizer.label.Frame")} ${i}`;
      const obj = {
        key: fileName,
        label,
        selected: false,
      };
      if (!this.frames.some((frame) => frame.key === fileName)) {
        this.theGreatNachoFrames.push(obj);
      }
    }

    return this.theGreatNachoFrames;
  }

  async getJColsonFrames() {
    if (!game.modules.get("token-frames")?.active || game.settings.get(CONSTANTS.MODULE_ID, "disable-jcolson-frames")) {
      return [];
    }
    if (this.jColsonFrames.length > 0) return this.jColsonFrames;

    const directoryPath = "[data] modules/token-frames/token_frames";
    logger.debug(`Checking for JColson Token Frames files in ${directoryPath}...`);

    const dir = DirectoryPicker.parse(directoryPath);
    this.jColsonFrames = await this.getDirectoryFrameData(dir.activeSource, { bucket: dir.bucket }, dir.current);

    return this.jColsonFrames;
  }

  static getDefaultFrames() {
    const npcFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-npc");
    const otherNPCFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-neutral");
    const npcDiff = npcFrame !== otherNPCFrame;
    const setPlayerDefaultFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-pc").replace(/^\/|\/$/g, "");
    const setNPCDefaultFrame = npcFrame.replace(/^\/|\/$/g, "");
    const tintFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint");
    const setTintFrame = tintFrame.replace(/^\/|\/$/g, "");

    const defaultFrames = [
      {
        key: setTintFrame,
        label: game.i18n.localize("vtta-tokenizer.default-frame-tint.name"),
        selected: false,
      },
      {
        key: setPlayerDefaultFrame,
        label: game.i18n.localize("vtta-tokenizer.default-frame-pc.name"),
        selected: false,
      },
      {
        key: setNPCDefaultFrame,
        label: npcDiff
          ? game.i18n.localize("vtta-tokenizer.default-frame-npc.hostile")
          : game.i18n.localize("vtta-tokenizer.default-frame-npc.neutral"),
        selected: true,
      }
    ];

    const foundryDefaultPCFrame = game.settings.settings.get("vtta-tokenizer.default-frame-pc").default.replace(/^\/|\/$/g, "");
    const foundryDefaultNPCFrame = game.settings.settings.get("vtta-tokenizer.default-frame-npc").default.replace(/^\/|\/$/g, "");

    if (foundryDefaultPCFrame !== setPlayerDefaultFrame) {
      defaultFrames.push({
        key: foundryDefaultPCFrame,
        label: game.i18n.localize("vtta-tokenizer.default-frame-pc.foundry"),
        selected: false,
      });
    }
    if (foundryDefaultNPCFrame !== setNPCDefaultFrame) {
      defaultFrames.push({
        key: foundryDefaultNPCFrame,
        label: npcDiff
          ? game.i18n.localize("vtta-tokenizer.default-frame-npc.foundry-hostile")
          : game.i18n.localize("vtta-tokenizer.default-frame-npc.foundry-neutral"),
        selected: false,
      });
    }

    if (npcDiff) {
      defaultFrames.push({
        key: otherNPCFrame.replace(/^\/|\/$/g, ""),
        label: game.i18n.localize("vtta-tokenizer.default-frame-npc.other"),
        selected: false,
      });
    }

    return defaultFrames;
  }

  static generateFrameData(file, selected = false) {
    const labelSplit = file.split("/").pop().trim();
    const label = labelSplit.replace(/^frame-/, "").replace(/[-_]/g, " ");
    return {
      key: file,
      label: Utils.titleString(label).split(".")[0],
      selected,
    };
  }

  async getDirectoryFrameData(activeSource, options, path) {
    const fileList = await DirectoryPicker.browse(activeSource, path, options);
    const folderFrames = fileList.files
      .filter((file) => Utils.endsWithAny(["png", "jpg", "jpeg", "gif", "webp", "webm", "bmp"], file))
      .map((file) => {
        return Tokenizer.generateFrameData(file);
      });

    let dirFrames = [];
    if (fileList.dirs.length > 0) {
      for (let i = 0; i < fileList.dirs.length; i++) {
        const dir = fileList.dirs[i];
        // eslint-disable-next-line no-await-in-loop
        const subDirFrames = await this.getDirectoryFrameData(activeSource, options, dir);
        dirFrames.push(...subDirFrames);
      }
    }
    const result = folderFrames.concat(dirFrames);
    return result;
  }

  async getFrames() {
    const directoryPath = game.settings.get(CONSTANTS.MODULE_ID, "frame-directory");
    logger.debug(`Checking for files in ${directoryPath}...`);
    const dir = DirectoryPicker.parse(directoryPath);
    const folderFrames = (directoryPath && directoryPath.trim() !== "" && directoryPath.trim() !== "[data]")
      ? await this.getDirectoryFrameData(dir.activeSource, { bucket: dir.bucket }, dir.current)
      : [];

    this.getOMFGFrames();
    this.getTheGreatNachoFrames();
    await this.getJColsonFrames();

    const frames = this.defaultFrames.concat(folderFrames, this.omfgFrames, this.theGreatNachoFrames, this.jColsonFrames, this.customFrames);

    this.frames = frames;
    return this.frames;
  }

  async handleFrameSelection(framePath) {
    const frameInList = this.frames.some((frame) => frame.key === framePath);
    if (!frameInList) {
      const frame = Tokenizer.generateFrameData(framePath);
      this.frames.push(frame);
      this.customFrames.push(frame);
      game.settings.set("vtta-tokenizer", "custom-frames", this.customFrames);
    }
    this._setTokenFrame(framePath, true);
  }

  getBaseUploadDirectory() {
    if (this.tokenType === "character") {
      return game.settings.get("vtta-tokenizer", "image-upload-directory");
    } else if (this.tokenType === "npc") {
      return game.settings.get("vtta-tokenizer", "npc-image-upload-directory");
    } else {
      return game.settings.get("vtta-tokenizer", "image-upload-directory");
    }
  }

  //  Options include
  //  name: name to use as part of filename identifier
  //  type: pc, npc
  //  disposition: token disposition = -1, 0, 1
  //  avatarFilename: current avatar image - defaults to null/mystery man
  //  tokenFilename: current tokenImage - defaults to null/mystery man
  //  targetFolder: folder to target, otherwise uses defaults, wildcard use folder derived from wildcard path
  //  isWildCard: is wildcard token?
  //  tokenOffset: { position: {x:0, y:0} }
  //  any other items needed in callback function, options will be passed to callback, with filenames updated to new references
  //
  constructor(options, callback) {
    super({});
    this.tokenOptions = options;
    const defaultOffset = game.settings.get(CONSTANTS.MODULE_ID, "default-token-offset");
    this.tokenOffset = options.tokenOffset
      ? options.tokenOffset
      : { position: { x: defaultOffset, y: defaultOffset } };
    this.callback = callback;
    this.modifyAvatar = !game.settings.get(CONSTANTS.MODULE_ID, "token-only-toggle");
    this.modifyToken = true;
    this.defaultFrames = Tokenizer.getDefaultFrames();
    this.frames = [];
    this.omfgFrames = [];
    this.theGreatNachoFrames = [];
    this.jColsonFrames = [];
    this.customFrames = game.settings.get(CONSTANTS.MODULE_ID, "custom-frames");
    this.addFrame = game.settings.get(CONSTANTS.MODULE_ID, "add-frame-default") || this.tokenOptions.auto;
    this.defaultColor = game.settings.get(CONSTANTS.MODULE_ID, "default-color");
    this.tokenType = this.tokenOptions.type === "pc" ? "pc" : "npc";
    this.nameSuffix = this.tokenOptions.nameSuffix ? this.tokenOptions.nameSuffix : "";
    this.imageFormat = game.settings.get(CONSTANTS.MODULE_ID, "image-save-type");
    // add some default file names, these will likely be changed
    this.wildCardPath = undefined;
    this.avatarUploadDirectory = this.getOverRidePath(false) || this.getBaseUploadDirectory();
    this.tokenUploadDirectory = this.getOverRidePath(true) || this.getBaseUploadDirectory();
    this.avatarFileName = `${this.tokenOptions.name}.Avatar${this.nameSuffix}.${this.imageFormat}`;
    this.tokenFileName = `${this.tokenOptions.name}.Token${this.nameSuffix}.${this.imageFormat}`;
  }

  /**
   * Define default options for the PartySummary application
   */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = "modules/vtta-tokenizer/templates/tokenizer.hbs";
    options.id = "tokenizer-control";
    options.width = "auto";
    options.height = "auto";
    options.classes = ["tokenizer"];
    return options;
  }

  /* -------------------------------------------- */

  async getData() {
    const frames = await this.getFrames();
    const pasteTarget = game.settings.get(CONSTANTS.MODULE_ID, "paste-target");
    const pasteTargetName = Utils.titleString(pasteTarget);

    return {
      options: this.tokenOptions,
      canUpload: game.user && game.user.can("FILES_UPLOAD"), // game.user.isTrusted || game.user.isGM,
      canBrowse: game.user && game.user.can("FILES_BROWSE"),
      tokenVariantsEnabled: game.user && game.user.can("FILES_BROWSE") && game.modules.get("token-variants")?.active,
      frames: frames,
      pasteTarget: pasteTarget,
      pasteTargetName: pasteTargetName,
    };
  }

  getWildCardPath() {
    if (!this.tokenOptions.isWildCard) return undefined;
    let wildCardPath = `${this.tokenUploadDirectory}`;
    if (this.tokenOptions.tokenFilename) {
      let wildCardTokenPathArray = this.tokenOptions.tokenFilename.split("/");
      wildCardTokenPathArray.pop();
      wildCardPath = wildCardTokenPathArray.join("/");
    }
    this.wildCardPath = wildCardPath;
    return wildCardPath;
  }

  getOverRidePath(isToken) {
    let path;
    if (isToken && this.tokenOptions.isWildCard) {
      path = this.getWildCardPath();
    }
    if (!path) {
      path = this.tokenOptions.targetFolder
        ? this.tokenOptions.targetFolder
        : undefined;
    }
    return path;
  }

  async _getFilename(suffix = "Avatar", postfix = "") {
    const actorName = await Utils.makeSlug(this.tokenOptions.name);

    if (suffix === "Token" && this.tokenOptions.isWildCard) {
      // for wildcards we respect the current path of the existing/provided tokenpath
      const dirOptions = DirectoryPicker.parse(this.wildCardPath);
      const tokenWildcard = this.tokenOptions.tokenFilename.indexOf("*") === -1
        // set it to a wildcard we can actually use
        ? `${dirOptions.current}/${actorName}.Token-*.${this.imageFormat}`
        : this.tokenOptions.tokenFilename;

      const browser = await FilePicker.browse(dirOptions.activeSource, tokenWildcard, {
        wildcard: true,
      });

      const newCount = browser.files.length + 1;
      const num = newCount.toString().padStart(3, "0");
      const targetFilename = tokenWildcard.replace(/\*/g, num).split("/").pop();

      return targetFilename;
    }
    return `${actorName}.${suffix}${postfix}.${this.imageFormat}`;
  }

  async updateToken(dataBlob) {
    if (this.modifyToken) {
      this.tokenOptions.tokenUploadDirectory = this.tokenUploadDirectory;
      const filePath = await Utils.uploadToFoundry(dataBlob, this.tokenUploadDirectory, this.tokenFileName);
      logger.debug(`Created token at ${filePath}`);
      this.tokenOptions.tokenFilename = filePath;
    }
  }

  async updateAvatar(dataBlob) {
    if (this.modifyAvatar) {
      this.tokenOptions.avatarUploadDirectory = this.avatarUploadDirectory;
      const filePath = await Utils.uploadToFoundry(dataBlob, this.avatarUploadDirectory, this.avatarFileName);
      logger.debug(`Created avatar at ${filePath}`);
      this.tokenOptions.avatarFilename = filePath;
    }
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(event, formData) {
    // upload token and avatar
    // get the data
    Promise.all([this.Avatar.get("blob"), this.Token.get("blob")]).then(async (dataResults) => {
      await this.updateAvatar(dataResults[0]);
      await this.updateToken(dataResults[1]);

      this.callback(this.tokenOptions);
    });
  }

  /* -------------------------------------------- */

  async _initAvatar(inputUrl) {
    const url = inputUrl ?? CONST.DEFAULT_TOKEN ?? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const avatarView = document.querySelector(".avatar > .view");
    if (this.Avatar) {
      this.Avatar.canvas.remove();
      this.Avatar.stage.remove();
      this.Avatar.controlsArea.remove();
      this.Avatar.menu.remove();
    }
    this.Avatar = null;
    try {
      const img = await Utils.download(url);
      const MAX_DIMENSION = Math.max(img.naturalHeight, img.naturalWidth, game.settings.get(CONSTANTS.MODULE_ID, "portrait-size"));
      logger.debug("Setting Avatar dimensions to " + MAX_DIMENSION + "x" + MAX_DIMENSION);
      this.Avatar = new View(MAX_DIMENSION, avatarView);
      this.Avatar.addImageLayer(img);

      // Setting the height of the form to the desired auto height
      $("#tokenizer-control").css("height", "auto");
    } catch (error) {
      if (inputUrl) {
        const error = game.i18n.format("vtta-tokenizer.notification.failedInput", { url });
        ui.notifications.error(error);
        await this._initAvatar();
      } else {
        ui.notifications.error(game.i18n.localize("vtta-tokenizer.notification.failedFallback"));
      }
    }

    $("#avatar-options :input").attr("disabled", !this.modifyAvatar);
    $("#tokenizer-avatar :input").attr("disabled", !this.modifyAvatar);
    $("#token-options :input").attr("disabled", !this.modifyToken);
    $("#tokenizer-token :input").attr("disabled", !this.modifyToken);
  }

  activateListeners(html) {
    this.loadImages();

    $("#tokenizer .file-picker-thumbs").click((event) => {
        event.preventDefault();
        const picker = new ImageBrowser(this.frames, { type: "image", callback: this.handleFrameSelection.bind(this) });
        picker.render(true);
    });

    $("#tokenizer .filePickerTarget").on("change", (event) => {
      const eventTarget = event.target == event.currentTarget ? event.target : event.currentTarget;
      const view = eventTarget.dataset.target === "avatar" ? this.Avatar : this.Token;

      Utils.download(eventTarget.value)
        .then((img) => view.addImageLayer(img))
        .catch((error) => ui.notifications.error(error));
    });

    $("#tokenizer button.invisible-button").click(async (event) => {
      event.preventDefault();
    });

    $("#tokenizer button.box-button").click(async (event) => {
      event.preventDefault();
      const eventTarget = event.target == event.currentTarget ? event.target : event.currentTarget;

      switch (eventTarget.dataset.type) {
        case "modify-toggle": {
          const button = document.getElementById(`modify-${eventTarget.dataset.target}`);
          const fas = document.getElementById(`modify-${eventTarget.dataset.target}-fas`);
          const newState = eventTarget.dataset.target === "avatar"
            ? !this.modifyAvatar
            : !this.modifyToken; 
          
          fas.classList.toggle("fa-regular");
          fas.classList.toggle("fas");
          fas.classList.toggle("fa-square");
          fas.classList.toggle("fa-square-check");

          $(`#${eventTarget.dataset.target}-options :input`).attr("disabled", !newState);
          $(`#tokenizer-${eventTarget.dataset.target} :input`).attr("disabled", !newState);

          if (eventTarget.dataset.target === "avatar") {
            this.modifyAvatar = newState;
          } else {
            this.modifyToken = newState;
          }

          button.classList.toggle('deselected');
          fas.classList.toggle('deselected');
          break;
        }
        case "paste-toggle": {
          const target = eventTarget.dataset.target;
          const avatarButton = document.getElementById(`paste-avatar`);
          const avatarFas = document.getElementById(`paste-avatar-fas`);
          const tokenButton = document.getElementById(`paste-token`);
          const tokenFas = document.getElementById(`paste-token-fas`);
          game.settings.set("vtta-tokenizer", "paste-target", target);

          avatarButton.classList.toggle('deselected');
          avatarFas.classList.toggle("fa-circle");
          avatarFas.classList.toggle("fa-circle-dot");
          tokenButton.classList.toggle('deselected');
          tokenFas.classList.toggle("fa-circle");
          tokenFas.classList.toggle("fa-circle-dot");

        }
        // no default
      }
    });

    $("#tokenizer button.menu-button").click(async (event) => {
      event.preventDefault();
      const eventTarget = event.target == event.currentTarget ? event.target : event.currentTarget;
      const view = eventTarget.dataset.target === "avatar" ? this.Avatar : this.Token;

      switch (eventTarget.dataset.type) {
        case "upload": {
          const img = await Utils.upload();
          view.addImageLayer(img);
          break;
        }
        case "download-token": {
          const filename = this.tokenFileName;
          const blob = await this.Token.get("blob");
          const file = new File([blob], filename, { type: blob.type });
          let a = document.createElement("a");
          a.href = URL.createObjectURL(file);
          a.download = filename;
          a.click();
          break;
        }
        case "download": {
          // show dialog, then download
          let urlPrompt = new Dialog({
            title: "Download from the internet",
            content: `
                      <p>${game.i18n.localize("vtta-tokenizer.download.url")}.</p>
                      <form>
                      <div class="form-group">
                         <label>URL</label>
                         <input id="url" type="text" name="url" placeholder="https://" data-dtype="String">
                      </div>
                      </form>`,
            buttons: {
              cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("vtta-tokenizer.label.Cancel"),
                callback: () => logger.debug("Cancelled"),
              },
              ok: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("vtta-tokenizer.label.OK"),
                callback: () => {
                  Utils.download($("#url").val())
                    .then((img) => view.addImageLayer(img))
                    .catch((error) => {
                      logger.error("Error fetching image", error);
                      ui.notification.error(error);
                    });
                },
              },
            },
          });

          urlPrompt.render(true);

          break;
        }
        case "token": {
          this.Token.get("img").then((img) => view.addImageLayer(img));
          break;
        }
        case "avatar": {
          this.Avatar.get("img").then((img) => view.addImageLayer(img, { activate: true }));
          break;
        }
        case "color": {
          const defaultColor = game.settings.get(CONSTANTS.MODULE_ID, "default-color");
          view.addColorLayer({ color: defaultColor });
          break;
        }
        case "tokenVariants": {
          game.modules.get('token-variants').api.showArtSelect(this.tokenOptions.name, {
            callback: (imgSrc) => Utils.download(imgSrc).then((img) => view.addImageLayer(img)),
            searchType: eventTarget.dataset.target === "avatar" ? "Portrait" : "Token"
          });
          break;
        }
        case "locations": {
          const locations = new TokenizerSaveLocations(this);
          locations.render(true);
          break;
        }
        // no default
      }
    });

    super.activateListeners(html);
  }

  async _initToken(src) {
    let imgSrc = src ?? CONST.DEFAULT_TOKEN;
    try {
      logger.debug("Initializing Token, trying to download", imgSrc);
      const img = await Utils.download(imgSrc);
      logger.debug("Got image", img);

      if (game.settings.get(CONSTANTS.MODULE_ID, "default-color-layer")) {
        this.Token.addColorLayer({ color: this.defaultColor });
      }
      // if we add a frame by default offset the token image
      const options = this.addFrame
        ? this.tokenOffset
        : {};
      this.Token.addImageLayer(img, options);
      if (this.addFrame) {
        logger.debug("Loading default token frame");
        await this._setTokenFrame();
      } 
    } catch (error) {
      if (!src || src === CONST.DEFAULT_TOKEN) {
        logger.error(`Failed to load fallback token: "${imgSrc}"`);
      } else {
        const errorMessage = game.i18n.format("vtta-tokenizer.notification.failedLoad", { imgSrc, default: CONST.DEFAULT_TOKEN });
        ui.notifications.error(errorMessage);
        logger.error("Failed to init image", errorMessage);
        await this._initToken();
      }
    }
  }

  #getNPCFrame() {
    const tintFrame = game.settings.get(CONSTANTS.MODULE_ID, "frame-tint");
    let npcFrame;
    if (tintFrame) {
      npcFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint");
    } else {
      switch (parseInt(this.tokenOptions.disposition)) {
        case 0: 
        case 1: {
          npcFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-neutral");
          break;
        }
        
        case -1:
        default: {
          npcFrame = game.settings.get(CONSTANTS.MODULE_ID, "default-frame-npc");
          break;
        }
      }
    }
    return npcFrame;
  }

  #getTintColor() {
    if (this.tokenType === "pc") {
      return game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint-pc");
    }
    switch (parseInt(this.tokenOptions.disposition)) {
      case 0: {
        return game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint-neutral");
      }
      case 1: {
        return game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint-friendly");
      }
      case -1:
      default: {
        return game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint-hostile");
      }
    }
  }

  async _setTokenFrame(fileName, fullPath = false) {
    // load the default frame, if there is one set
    const tintFrame = game.settings.get(CONSTANTS.MODULE_ID, "frame-tint");
    const npcFrame = this.#getNPCFrame();

    const frameTypePath = this.tokenType === "pc"
      ? tintFrame
        ? game.settings.get(CONSTANTS.MODULE_ID, "default-frame-tint")
        : game.settings.get(CONSTANTS.MODULE_ID, "default-frame-pc")
      : npcFrame;
    const isDefault = fileName != npcFrame.replace(/^\/|\/$/g, "");

    const framePath = fileName && !isDefault
      ? `${game.settings.get(CONSTANTS.MODULE_ID, "frame-directory")}/${fileName}`
      : fileName && isDefault
        ? fileName.replace(/^\/|\/$/g, "")
        : frameTypePath.replace(/^\/|\/$/g, "");

    const tintColor = this.#getTintColor();

    if (framePath && framePath.trim() !== "") {
      const options = DirectoryPicker.parse(fullPath ? fileName : framePath);
      try {
        const img = await Utils.download(options.current);
        this.Token.addImageLayer(img, { masked: true, onTop: true, tintColor, tintLayer: tintFrame && !fileName });
      } catch (error) {
        const errorMessage = game.i18n.format("vtta-tokenizer.notification.failedLoadFrame", { frame: options.current });
        ui.notifications.error(errorMessage);
      }
    }
  }

  pasteImage(event) {
    const pasteTarget = game.settings.get(CONSTANTS.MODULE_ID, "paste-target");
    const view = pasteTarget === "token" ? this.Token : this.Avatar;
    Utils.extractImage(event, view);
  }

  loadImages() {
    let tokenView = document.querySelector(".token > .view");

    // get the target filename for the avatar
    this._getFilename("Avatar", this.nameSuffix).then((targetFilename) => {
      $('input[name="targetAvatarFilename"]').val(targetFilename);
      this.avatarFileName = targetFilename;
    });
    // get the target filename for the token
    this._getFilename("Token", this.nameSuffix).then((targetFilename) => {
      // $('span[name="targetPath"]').text(targetFilename);
      $('span[name="targetFilename"]').text(targetFilename);
      $('input[name="targetTokenFilename"]').val(targetFilename);
      this.tokenFileName = targetFilename;
    });

    if (this.tokenOptions.isWildCard) {
      $("#tokenizer div.token > h1").text("Token (Wildcard)");
      this.Token = new View(game.settings.get(CONSTANTS.MODULE_ID, "token-size"), tokenView);
      // load the default frame, if there is one set
      this._setTokenFrame();
    } else {
      this.Token = new View(game.settings.get(CONSTANTS.MODULE_ID, "token-size"), tokenView);

      // Add the actor image to the token view
      this._initToken(this.tokenOptions.tokenFilename);
    }

    this._initAvatar(this.tokenOptions.avatarFilename);
  }

}

Hooks.on("renderTokenizer", (app) => {
  window.addEventListener("paste", async (e) => {
    // e.preventDefault();
    game.canvas.layers.forEach((layer) => {
      layer._copy = [];
    });
    e.stopPropagation();
    app.pasteImage(e);
  });
  window.addEventListener("drop", async (e) => {
    // e.preventDefault();
    e.stopPropagation();
    app.pasteImage(e);
  });
});
