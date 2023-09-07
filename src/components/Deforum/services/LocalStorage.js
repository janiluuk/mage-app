import UserConfig from "@/components/Deforum/types/UserConfig";

export class LocalStorage {
  static namespace = "input-deforum";
  static userNamespace = "input-deforum-user";

  static saveConfig(name, config, namespace=false) {
    let configs = this.getConfigsFromStorage();
    var ns = namespace !== false ? namespace : this.namespace;

    if (configs === null) {
      configs = {};
    }

    configs[name] = config;
    localStorage.setItem(ns, JSON.stringify(configs));
  }

  static getConfig(name, namespace=false) {
    var ns = namespace ? namespace : this.namespace;
    const configs = this.getConfigsFromStorage(ns);

    if (configs === null) {
      return null;
    }

    return configs[name];
  }

  static getConfigsFromStorage(namespace=false) {

    var ns = namespace !== false ? namespace : this.namespace;

    const configs = JSON.parse(localStorage.getItem(ns) || "{}");
    return configs;
  }

  static getConfigNames() {
    const names = [];
    const configs = this.getConfigsFromStorage();

    for (const key in configs) {
      if (Object.prototype.hasOwnProperty.call(configs, key)) {
        names.push(key);
      }
    }
    return names.sort();
  }

  // save user config
  static saveUserConfig(userConfig, namespace=false) {
    var ns = namespace !== false ? namespace : this.userNamespace;
    localStorage.setItem(ns, JSON.stringify(userConfig));
  }

  static getUserConfig(namespace=false) {
    var ns = namespace !== false ? namespace : this.userNamespace;

    const userConfig = JSON.parse(
      localStorage.getItem(ns) || "{}"
    );
    return userConfig;
  }

  static deleteConfig(name) {
    const configs = this.getConfigsFromStorage();

    if (configs === null) {
      return;
    }

    if (configs[name] === undefined) {
      return;
    }

    delete configs[name];
    localStorage.setItem(this.namespace, JSON.stringify(configs));
  }

  static getBackup() {
    return localStorage.getItem(this.namespace) || "";
  }
}
