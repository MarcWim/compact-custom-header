export const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace")
);
export const html = LitElement.prototype.html;

export const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

export const defaultConfig = {
  header: true,
  menu: true,
  notifications: true,
  voice: true,
  options: true,
  clock: 'none',
  clockFormat: 12,
  clock_am_pm: true,
  disable: false,
  background_image: false,
  main_config: false,
  move_hidden: true
};

if (!customElements.get("compact-custom-header")) {
class CompactCustomHeader extends LitElement {
  static get properties() {
    return {
      config: {},
      hass: {},
      editMode: {},
      showUa: {}
    };
  }

  constructor() {
    super();
    this.firstRun = true;
    this.editMode = false;
  }

  static async getConfigElement() {
    await import("./compact-custom-header-editor.js");
    return document.createElement("compact-custom-header-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this.config = config;
  }

  updated() {
    if (this.config && this.hass && this.firstRun) {
      this.buildConfig();
    }
  }

  render() {
    if (!this.editMode) {
      return html``;
    }
    return html`
      ${this.renderStyle()}
      <ha-card>
          <svg viewBox="0 0 24 24">
            <path
              d="M12,7L17,12H14V16H10V12H7L12,7M19,
                    21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,
                    3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,
                    21M19,19V5H5V19H19Z"
            ></path>
          </svg>
          <h2>Compact Custom Header</h2>
      </ha-card>
    `;
  }

  renderStyle() {
    return html`
      <style>
        [hidden] {
          display: none;
        }
        h2 {
          margin: auto;
          padding: 20px;
          background-color: var(--primary-color);
          color: var(--text-primary-color);
        }
        svg {
          float: left;
          height: 30px;
          padding: 15px 5px 15px 15px;
          fill: var(--text-primary-color);
        }
        .user_agent {
          display: block;
          margin-left: auto;
          margin-right: auto;
          padding: 5px;
          border: 0;
          resize: none;
          width: 100%;
        }
      </style>
    `;
  }

  buildConfig() {
    if (this.firstRun) {
      this.firstRun = false;
      this.userVars = {
        user: this.hass.user.name,
        user_agent: navigator.userAgent
      };
    }

    let exceptionConfig = {};
    let highestMatch = 0;
    if (this.config.exceptions) {
      this.config.exceptions.forEach(exception => {
        const matches = this.countMatches(exception.conditions);
        if (matches > highestMatch) {
          highestMatch = matches;
          exceptionConfig = exception.config;
        }
      });
    }

    this.cchCache = {};
    let retrievedCache = localStorage.getItem("cchCache");
    if (!this.config.main_config && retrievedCache) {
      this.config = JSON.parse(retrievedCache);
    }

    this.cchConfig = {
      ...defaultConfig,
      ...this.config,
      ...exceptionConfig
    };

    if (this.config.main_config) {
      delete this.cchConfig.main_config;
      localStorage.setItem("cchCache", JSON.stringify(this.cchConfig));
    }

    this.run();
  }

  countMatches(conditions) {
    let count = 0;
    for (const condition in conditions) {
      if (
        this.userVars[condition] == conditions[condition] ||
        (condition == "user_agent" &&
          this.userVars[condition].includes(conditions[condition])) ||
        (condition == "media_query" &&
          window.matchMedia(conditions[condition]).matches)
      ) {
        count++;
      } else {
        return 0;
      }
    }
    return count;
  }

  getCardSize() {
    return 0;
  }

  run() {
    const root = this.rootElement;
    this.editMode = root.querySelector("app-toolbar").className ==
      "edit-mode";
    const buttons = this.getButtonElements(root);
    const tabContainer = root.querySelector("paper-tabs");
    const tabs = Array.from(tabContainer.querySelectorAll("paper-tab"));
    if (!this.editMode) this.hideCard();
    if (this.editMode && !this.config.disable) {
      this.removeMargin(tabContainer);
      if (buttons.options) {
        this.insertEditMenu(buttons.options, tabs);
      }
    } else if (!this.config.disable &&
      !window.location.href.includes('disablecch')) {
        const marginRight = this.marginRight;
        this.styleHeader(root, tabContainer, marginRight);
        this.styleButtons(buttons);
        if (this.cchConfig.hide_tabs) {
          this.hideTabs(tabContainer, tabs);
        }
        if (this.cchConfig.clock && this.cchConfig.clock != "none") {
          this.insertClock(buttons, tabContainer, marginRight);
        }
        fireEvent(this, "iron-resize");
    }
  }

  get marginRight() {
    // Add width of all visible elements on right side for tabs margin.
    let marginRight = 0;
    marginRight +=
      this.cchConfig.notifications && this.cchConfig.clock != "notifications"
        ? 45
        : 0;
    marginRight += this.cchConfig.voice && this.cchConfig.clock != "voice"
      ? 45
      : 0;
    marginRight += this.cchConfig.options && this.cchConfig.clock != "options"
      ? 45
      : 0;
    return marginRight;
  }

  get rootElement() {
    try {
      return document
        .querySelector("home-assistant")
        .shadowRoot.querySelector("home-assistant-main")
        .shadowRoot.querySelector("app-drawer-layout partial-panel-resolver")
        .shadowRoot.querySelector("ha-panel-lovelace")
        .shadowRoot.querySelector("hui-root").shadowRoot;
    } catch {
      console.log("Can't find 'hui-root', going to walk the DOM to find it.");
    }
    this.recursiveWalk(document, "HUI-ROOT", node => {
      return node.nodeName == "HUI-ROOT" ? node.shadowRoot : null;
    });
  }

  insertEditMenu(optionsBtn, tabs) {
    if (this.cchConfig.hide_tabs) {
      let show_tabs = document.createElement("paper-item");
      show_tabs.setAttribute("id", "show_tabs");
      show_tabs.addEventListener("click", () => {
        for (let i = 0; i < tabs.length; i++) {
          tabs[i].style.cssText = "";
        }
      });
      show_tabs.innerHTML = "Show all tabs";
      this.insertMenuItem(
        optionsBtn.querySelector("paper-listbox"),
        show_tabs
      );
    }
  }

  getButtonElements(root) {
    const buttons = {};
    buttons.options = root.querySelector("paper-menu-button");

    if (!this.editMode) {
      buttons.menu = root.querySelector("ha-menu-button");
      buttons.voice = root.querySelector("ha-start-voice-button");
      buttons.notifications = root.querySelector("hui-notifications-button");
    }
    return buttons;
  }

  removeMargin(tabContainer) {
    // Remove margin from tabs when in edit mode
    if (tabContainer) {
      tabContainer.style.marginLeft = "";
      tabContainer.style.marginRight = "";
    }
  }

  styleHeader(root, tabContainer, marginRight) {
    // Hide header completely if set to false in config.
    if (!this.cchConfig.header) {
      root.querySelector("app-header").style.display = "none";
      return;
    }

    root
      .querySelector("ha-app-layout")
      .querySelector('[id="view"]').style.paddingBottom = this.cchConfig
      .background_image
      ? "64px"
      : "";

    if (tabContainer) {
      // Add margin to left side of tabs for menu buttom.
      if (this.cchConfig.menu) {
        tabContainer.style.marginLeft = "60px";
      }
      // Add margin to right side of tabs for all buttons on the right.
      tabContainer.style.marginRight = `${marginRight}px`;

      // Shift the header up to hide unused portion.
      root.querySelector("app-toolbar").style.marginTop = "-64px";

      // Hide tab bar scroll arrows to save space since we can still swipe.
      let chevron = tabContainer.shadowRoot.querySelectorAll(
        '[icon^="paper-tabs:chevron"]'
      );
      chevron[0].style.display = "none";
      chevron[1].style.display = "none";
    }
  }

  styleButtons(buttons) {
    for (const button in buttons) {
      if (this.cchConfig[button]) {
        buttons[button].style.cssText = `
            z-index:1;
            margin-top:111px;
            ${button == "options" ? "margin-right:-5px; padding:0;" : ""}
          `;
      } else if (this.cchConfig.options) {
        const paperIconButton = buttons[button].shadowRoot.querySelector(
          "paper-icon-button"
        );
        if (paperIconButton.hasAttribute("hidden")) {
          continue;
        }
        const menu_items = buttons.options.querySelector("paper-listbox");
        const id = `menu_item_${button}`;
        if (!menu_items.querySelector(`[id="${id}"]`)) {
          const wrapper = document.createElement("paper-item");
          wrapper.setAttribute("id", id);
          wrapper.innerText = this.getTranslation(button);
          wrapper.appendChild(buttons[button]);
          wrapper.addEventListener("click", () => {
            paperIconButton.click();
          });
          this.insertMenuItem(menu_items, wrapper);
        }
      } else {
        buttons[button].style.display = "none";
      }
    }
  }

  getTranslation(button) {
    switch(button) {
      case 'notifications':
        return this.hass.localize('ui.notification_drawer.title');
      default:
        return button.charAt(0).toUpperCase() + button.slice(1);
    }
  }

  hideTabs(tabContainer, tabs) {
    // Convert hide_tabs config to array
    const hidden_tabs = JSON.parse("[" + this.cchConfig.hide_tabs + "]");
    for (const tab of hidden_tabs) {
        if (!tabs[tab]) {
            continue;
        }
        tabs[tab].style.display = "none";
    }
    // Check if current tab is a hidden tab.
    const activeTab = tabContainer.querySelector("paper-tab.iron-selected");
    const activeTabIndex = tabs.indexOf(activeTab);
    if (hidden_tabs.includes(activeTabIndex)) {
        let i = 0;
        //find first not hidden view
        while(hidden_tabs.includes(i)) {
            i++;
        }
        tabs[i].click();
    }
  }

  hideCard() {
    // If this card is the only one in a column, hide column outside edit mode.
    if (this.parentNode.children.length == 1) {
      this.parentNode.style.display = "none";
    }
    this.style.display = "none";
  }

  insertMenuItem(menu_items, element) {
    if (this.config.move_hidden) {
      let first_item = menu_items.querySelector("paper-item");
      if (!menu_items.querySelector(`[id="${element.id}"]`)) {
        first_item.parentNode.insertBefore(element, first_item);
      }
    }
  }

  insertClock(buttons, tabContainer, marginRight) {
    // Change non-plural strings for backwards compatability
    if (this.cchConfig.clock == "option") {
      this.cchConfig.clock = "options";
    } else if (this.cchConfig.clock == "notification") {
      this.cchConfig.clock = "notifications";
    }

    const clockIcon = (this.cchConfig.clock == "options"
      ? buttons[this.cchConfig.clock]
      : buttons[this.cchConfig.clock].shadowRoot
    ).querySelector("paper-icon-button");
    const clockIronIcon = clockIcon.shadowRoot.querySelector("iron-icon");

    buttons.notifications.shadowRoot.querySelector(
      '[class="indicator"]'
    ).style.cssText =
      this.cchConfig.clock == "notifications" ? "top:14.5px;left:-7px" : "";

    const clockWidth =
      this.cchConfig.clock_format == 12 && this.cchConfig.clock_am_pm
        ? 110
        : 80;

    let clockElement = clockIronIcon.parentNode.getElementById("cch_clock");
    if (!clockElement) {
        clockIcon.style.cssText = `
            margin-right:-5px;
            width:${clockWidth}px;
            text-align: center;
          `;

        clockElement = document.createElement("p");
        clockElement.setAttribute('id','cch_clock');
        clockElement.style.cssText = `
            width:${clockWidth}px;
            margin-top:2px;
            margin-left:-8px;
          `;
        clockIronIcon.parentNode.insertBefore(clockElement, clockIronIcon);
        clockIronIcon.style.display = "none";
    }

    if (this.cchConfig.menu && this.cchConfig.clock == "menu") {
      tabContainer.style.marginLeft = `${clockWidth + 15}px`;
    } else {
      tabContainer.style.marginRight = `${clockWidth + marginRight}px`;
    }
    const clockFormat = {
      hour12: this.cchConfig.clock_format != 24,
      hour: "2-digit",
      minute: "2-digit"
    };
    this.updateClock(clockElement, clockFormat);
  }

  updateClock(clock, clockFormat) {
    let date = new Date();
    date = date.toLocaleTimeString([], clockFormat);
    if (!this.cchConfig.clock_am_pm && this.cchConfig.clock_format == 12) {
      clock.innerHTML = date.slice(0, -3);
    } else {
      clock.innerHTML = date;
    }
    window.setTimeout(() => this.updateClock(clock, clockFormat), 60000);
  }

  // Walk the DOM to find element.
  recursiveWalk(node, element, func) {
    let done = func(node) || node.nodeName == element;
    if (done) return true;
    if ("shadowRoot" in node && node.shadowRoot) {
      done = this.recursiveWalk(node.shadowRoot, element, func);
      if (done) return true;
    }
    node = node.firstChild;
    while (node) {
      done = this.recursiveWalk(node, element, func);
      if (done) return true;
      node = node.nextSibling;
    }
  }

  // Toggle user agent portion of card for button on element.card.
  toggleUserAgent() {
    this.showUa = !this.showUa;
  }

  clearCache() {
    localStorage.removeItem("cchCache");
  }

}

customElements.define("compact-custom-header", CompactCustomHeader);
}
