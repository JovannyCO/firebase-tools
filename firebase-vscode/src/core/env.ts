import { Disposable } from "vscode";
import { ExtensionBrokerImpl } from "../extension-broker";
import { pluginLogger } from "../logger-wrapper";
import { signal } from "@preact/signals-react";

interface Environment {
  isMonospace: boolean;
}

export const env = signal<Environment>({
  isMonospace: Boolean(process.env.MONOSPACE_ENV),
});

export function registerEnv(broker: ExtensionBrokerImpl): Disposable {
  broker.on("getInitialData", async () => {
    pluginLogger.debug(
      `Value of process.env.MONOSPACE_ENV: ` + `${process.env.MONOSPACE_ENV}`
    );

    broker.send("notifyEnv", {
      env: env.peek(),
    });
  });

  return {
    dispose() {},
  };
}
