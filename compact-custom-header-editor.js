import { LitElement, html, fireEvent, defaultConfig } from "./compact-custom-header.js";

const clockOptions = ["none", "menu", "notifications", "voice", "options"];

export class CompactCustomHeaderEditor extends LitElement {
  setConfig(config) {
    this._config = config;
  }

  static get properties() {
    return { _config: {} };
  }
  
  firstUpdated() {
      this.parentElement.parentElement.querySelector("hui-card-preview").style.display = "none";
  }

  render() {
    return html`
      ${this.renderStyle()}
      <cch-config-editor
        .defaultConfig="${defaultConfig}"
        .config="${this._config}"
        @cch-config-changed="${this._configChanged}"
      >
      </cch-config-editor>
      <h3>Exceptions:</h3>
      ${this._config.exceptions
        ? this._config.exceptions.map((exception, index) => {
            return html`
              <cch-exception-editor
                .config="${this._config}"
                .exception="${exception}"
                .index="${index}"
                @cch-exception-changed="${this._exceptionChanged}"
                @cch-exception-delete="${this._exceptionDelete}"
              >
              </cch-exception-editor>
            `;
          })
        : ""}
      <br>
      <paper-button raised @click="${this._addException}"
        >Add Exception
      </paper-button>
      <br>
      <h3>Current User Agent:</h3>
      <br>
      <textarea class="user_agent" rows="3" readonly>${navigator.userAgent}
      </textarea>
    `;
  }

  _addException() {
    if (this._config.exceptions) {
      this._config.exceptions.push({ conditions: {}, config: {} });
    } else {
      this._config.exceptions = [{ conditions: {}, config: {} }];
    }
    fireEvent(this, "config-changed", { config: this._config });
    this.requestUpdate();
  }

  _configChanged(ev) {
    if (!this._config) {
      return;
    }
    this._config = { ...this._config, ...ev.detail.config };
    fireEvent(this, "config-changed", { config: this._config });
  }

  _exceptionChanged(ev) {
    if (!this._config) {
      return;
    }
    const target = ev.target;
    this._config.exceptions[target.index] = ev.detail.exception;
    fireEvent(this, "config-changed", { config: this._config });
  }

  _exceptionDelete(ev) {
    if (!this._config) {
      return;
    }
    const target = ev.target;
    this._config.exceptions.splice(target.index, 1);
    fireEvent(this, "config-changed", { config: this._config });
    this.requestUpdate();
  }

  renderStyle() {
    return html`
      <style>
        h3,
        h4 {
          margin-bottom: 0;
        }
        paper-button {
          background-color: #1aba92;
          margin-left: 0;
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
}

customElements.define(
  "compact-custom-header-editor",
  CompactCustomHeaderEditor
);

export class CchConfigEditor extends LitElement {
  static get properties() {
    return { defaultConfig: {}, config: {}, exception: {} };
  }

  get _hide_tabs() {
    return this.config.hide_tabs || this.defaultConfig.hide_tabs || "";
  }

  get _clock() {
    return this.config.clock || this.defaultConfig.clock;
  }

  get _clock_format() {
    return this.config.clock_format || this.defaultConfig.clock_format;
  }

  get _clock_am_pm() {
    return this.config.clock_am_pm !== undefined ? this.config.clock_am_pm : this.defaultConfig.clock_am_pm;
  }

  get _main_config() {
    return this.config.main_config !== undefined ? this.config.main_config : this.defaultConfig.main_config;
  }

  get _disable() {
    return this.config.disable !== undefined ? this.config.disable : this.defaultConfig.disable;
  }

  get _header() {
    return this.config.header !== undefined ? this.config.header : this.defaultConfig.header;
  }

  get _move_hidden() {
    return this.config.move_hidden !== undefined ? this.config.move_hidden : this.defaultConfig.move_hidden;
  }

  get _background_image() {
    return this.config.background_image !== undefined ? this.config.background_image : this.defaultConfig.background_image;
  }

  get _menu() {
    return this.config.menu !== undefined ? this.config.menu : this.defaultConfig.menu;
  }
  
  get _voice() {
    return this.config.voice !== undefined ? this.config.voice : this.defaultConfig.voice;
  }
  
  get _notifications() {
    return this.config.notifications !== undefined ? this.config.notifications : this.defaultConfig.notifications;
  }
  
  get _options() {
    return this.config.option !== undefined ? this.config.option : this.defaultConfig.options;
  }

  render() {
    this.exception = this.exception !== undefined && this.exception !== false;
    return html`
      ${!this.exception
        ? html`
            <div class="warning">
              <iron-icon icon="hass:alert"></iron-icon
              >
                Warning: Hiding the header or options button
                will remove your ability to edit from the UI.</div>
          `
        : ""}
      ${!this.exception && localStorage.getItem("cchCache") && !this.config.main_config
        ? html`
            <div class="alert">
              <iron-icon icon="hass:alert"></iron-icon
              >
                Alert: This card is not the main configuration card.
                Edits made here will not have an effect.</div>
          `
        : ""}
      ${this.renderStyle()}
      <paper-toggle-button
        class="${this.exception && this.config.disable === undefined ? "inherited": ""}"
        ?checked="${this._disable !== false}"
        .configValue="${"disable"}"
        @change="${this._valueChanged}"
      >
        Disable Custom Compact Header
      </paper-toggle-button>
      <paper-toggle-button
        class="${this.exception && this.config.header === undefined ? "inherited": ""}"
        ?checked="${this._header !== false}"
        .configValue="${"header"}"
        @change="${this._valueChanged}"
      >
        Display Header
      </paper-toggle-button>
      <paper-toggle-button
        class="${this.exception && this.config.move_hidden === undefined ? "inherited": ""}"
        ?checked="${this._move_hidden !== false}"
        .configValue="${"move_hidden"}"
        @change="${this._valueChanged}"
      >
        Move Hidden Buttons to Options Menu
      </paper-toggle-button>
      ${!this.exception
        ? html`
            <paper-toggle-button
              ?checked="${this._main_config !== false}"
              .configValue="${"main_config"}"
              @change="${this._valueChanged}"
            >
              Main Config
            </paper-toggle-button>
            <paper-toggle-button
              ?checked="${this._background_image !== false}"
              .configValue="${"background_image"}"
              @change="${this._valueChanged}"
            >
              Background Image Fix
            </paper-toggle-button><br>
            <paper-button raised class="pink">Clear CCH Cache</paper-button>
          `
        : ""}
      <h4>Button Visability:</h4>
      <div class="side-by-side">
        <paper-toggle-button
          class="${this.exception && this.config.menu === undefined ? "inherited": ""}"
          ?checked="${this._menu !== false}"
          .configValue="${"menu"}"
          @change="${this._valueChanged}"
        >
          <iron-icon icon="hass:menu"></iron-icon> Menu
        </paper-toggle-button>
        <paper-toggle-button
          class="${this.exception && this.config.notifications === undefined ? "inherited": ""}"
          ?checked="${this._notifications !== false}"
          .configValue="${"notifications"}"
          @change="${this._valueChanged}"
        >
          <iron-icon icon="hass:bell"></iron-icon> Notifications
        </paper-toggle-button>
      </div>
      <div class="side-by-side">
        <paper-toggle-button
          class="${this.exception && this.config.voice === undefined ? "inherited": ""}"
          ?checked="${this._voice !== false}"
          .configValue="${"voice"}"
          @change="${this._valueChanged}"
        >
          <iron-icon icon="hass:microphone"></iron-icon> Voice
        </paper-toggle-button>
        <paper-toggle-button
          class="${this.exception && this.config.options === undefined ? "inherited": ""}"
          ?checked="${this._options !== false}"
          .configValue="${"options"}"
          @change="${this._valueChanged}"
        >
          <iron-icon icon="hass:dots-vertical"></iron-icon> Options
        </paper-toggle-button>
      </div>
      <h4>Hide Tabs:</h4>
      <paper-input
        class="${this.exception && this.config.hide_tabs === undefined ? "inherited": ""}"
        label="Comma-separated list of tab numbers to hide:"
        .value="${this._hide_tabs}"
        .configValue="${"hide_tabs"}"
        @value-changed="${this._valueChanged}"
      >
      </paper-input>
      <h4>Clock Options:</h4>
      <div class="side-by-side">
        <paper-dropdown-menu
          class="${this.exception && this.config.clock === undefined ? "inherited": ""}"
          label="Clock"
          @value-changed="${this._valueChanged}"
          .configValue="${"clock"}"
        >
          <paper-listbox
            slot="dropdown-content"
            .selected="${clockOptions.indexOf(this._clock)}"
          >
            ${clockOptions.map(option => {
              return html`
                <paper-item>${option}</paper-item>
              `;
            })}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-dropdown-menu
          class="${this.exception && this.config.clock_format === undefined ? "inherited": ""}"
          label="Clock format"
          @value-changed="${this._valueChanged}"
          .configValue="${"clock_format"}"
        >
          <paper-listbox
            slot="dropdown-content"
            .selected="${this._clock_format === "24" ? 1 : 0}"
          >
            <paper-item>12</paper-item>
            <paper-item>24</paper-item>
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-toggle-button
          class="${this.exception && this.config.clock_am_pm === undefined ? "inherited": ""}"
          ?checked="${this._clock_am_pm !== false}"
          .configValue="${"clock_am_pm"}"
          @change="${this._valueChanged}"
        >
          AM / PM</paper-toggle-button
        >
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this.config) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value
        };
      }
    }
    fireEvent(this, "cch-config-changed", { config: this.config });
  }

  renderStyle() {
    return html`
      <style>
        h3,
        h4 {
          margin-bottom: 0;
        }
        paper-toggle-button {
          padding-top: 16px;
        }
        paper-button {
          background-color: #eb5f59;
          margin-left: 0;
        }
        iron-icon {
          padding-right: 5px;
        }
        .inherited {
          opacity: 0.5;
        }
        .side-by-side {
          display: flex;
          max-width: 450px;
        }
        .side-by-side > * {
          flex: 1;
          padding-right: 4px;
          width: 33%;
        }
        .warning {
          background-color:#616161;
          padding:5px;
          color:#f4c343;
        }
        .alert {
          background-color:#eb5f59;
          padding:5px;
          color:#fff;
        }
      </style>
    `;
  }
}

customElements.define("cch-config-editor", CchConfigEditor);

export class CchExceptionEditor extends LitElement {
  static get properties() {
    return { config: {}, exception: {}, _closed: {} };
  }

  constructor() {
    super();
    this._closed = true;
  }

  render() {
    if (!this.exception) {
      return html``;
    }
    return html`
      ${this.renderStyle()}
      <custom-style>
        <style is="custom-style">
          .card-header {
            margin-top: -5px;
            @apply --paper-font-headline;
          }
          .card-header paper-icon-button {
            margin-top: -5px;
            float: right;
          }
        </style>
      </custom-style>
      <paper-card ?closed=${this._closed}>
        <div class="card-content">
          <div class="card-header">
            ${Object.values(this.exception.conditions).join(", ") ||
              "New Exception"}
            <paper-icon-button
              icon="${this._closed ? "mdi:chevron-down" : "mdi:chevron-up"}"
              @click="${this._toggleCard}"
            >
            </paper-icon-button>
            <paper-icon-button
              ?hidden=${this._closed}
              icon="mdi:delete"
              @click="${this._deleteException}"
            >
            </paper-icon-button>
          </div>
          <h4>Conditions</h4>
          <cch-conditions-editor
            .conditions="${this.exception.conditions}"
            @cch-conditions-changed="${this._conditionsChanged}"
          >
          </cch-conditions-editor>
          <h4>Config</h4>
          <cch-config-editor
            exception
            .defaultConfig="${{...defaultConfig, ...this.config}}"
            .config="${this.exception.config}"
            @cch-config-changed="${this._configChanged}"
          >
          </cch-config-editor>
        </div>
      </paper-card>
    `;
  }

  renderStyle() {
    return html`
      <style>
        [closed] {
          overflow: hidden;
          height: 52px;
        }
        paper-card {
          margin-top: 10px;
          width: 100%;
          transition: all 0.5s ease;
        }
      </style>
    `;
  }

  _toggleCard() {
    this._closed = !this._closed;
    fireEvent(this, "iron-resize");
  }

  _deleteException() {
    fireEvent(this, "cch-exception-delete");
  }

  _conditionsChanged(ev) {
    if (!this.exception) {
      return;
    }
    this.exception.conditions = ev.detail.conditions;
    fireEvent(this, "cch-exception-changed", {
      exception: this.exception
    });
  }

  _configChanged(ev) {
    ev.stopPropagation();
    if (!this.exception) {
      return;
    }
    this.exception.config = ev.detail.config;
    fireEvent(this, "cch-exception-changed", {
      exception: this.exception
    });
  }
}

customElements.define("cch-exception-editor", CchExceptionEditor);

export class CchConditionsEditor extends LitElement {
  static get properties() {
    return { conditions: {} };
  }

  get _user() {
    return this.conditions.user || "";
  }

  get _user_agent() {
    return this.conditions.user_agent || "";
  }

  get _media_query() {
    return this.conditions.media_query || "";
  }

  render() {
    if (!this.conditions) {
      return html``;
    }
    return html`
      <paper-input
        label="User"
        .value="${this._user}"
        .configValue="${"user"}"
        @value-changed="${this._valueChanged}"
      >
      </paper-input>
      <paper-input
        label="User agent"
        .value="${this._user_agent}"
        .configValue="${"user_agent"}"
        @value-changed="${this._valueChanged}"
      >
      </paper-input>
      <paper-input
        label="Media query"
        .value="${this._media_query}"
        .configValue="${"media_query"}"
        @value-changed="${this._valueChanged}"
      >
      </paper-input>
    `;
  }

  _valueChanged(ev) {
    if (!this.conditions) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        delete this.conditions[target.configValue];
      } else {
        this.conditions = {
          ...this.conditions,
          [target.configValue]: target.value
        };
      }
    }
    fireEvent(this, "cch-conditions-changed", { conditions: this.conditions });
  }
}

customElements.define("cch-conditions-editor", CchConditionsEditor);
