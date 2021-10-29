import * as express from "express";
import { RemoteConfigEmulator } from "./index";
import * as cors from "cors";

const PROD_TEMPLATE: any = {
  "conditions": [
    {
      "name": "web_users",
      "expression": "device.os == 'web'",
      "tagColor": "GREEN"
    },
    {
      "name": "android_users",
      "expression": "device.os == 'android'",
      "tagColor": "BLUE"
    }
  ],
  "parameters": {
    "welcome_message": {
      "defaultValue": {
        "value": "Hi Welcome!"
      },
      "valueType": "STRING"
    },
    "discount_percentage": {
      "defaultValue": {
        "value": "10"
      },
      "conditionalValues": {
        "web_users": {
          "value": "15"
        },
        "android_users": {
          "value": "5"
        }
      },
      "valueType": "NUMBER"
    }
  }
};

let EMULATOR_TEMPLATE: any = {};

/**
 * @param defaultProjectId
 * @param emulator
 */
export function createApp(
    defaultProjectId: string,
    emulator: RemoteConfigEmulator
): Promise<express.Express> {
  EMULATOR_TEMPLATE = prodToEmulatorTemplate(PROD_TEMPLATE);
  console.log(JSON.stringify(EMULATOR_TEMPLATE, null, 2))
  const app = express();
  app.use(cors("*" as any));
  app.get("/", (req, res) => {
    res.send("Oh yes, it's me, remote config 🥸");
  });

  // Please note you should set the Remote Config minimal fetch interval to 0 so it refreshes every time
  // Otherwise caching will cause you headaches
  app.post("/v1/projects/:projectId/namespaces/firebase:fetch", (req, res) => {
    res.header("etag", `etag-${req.params["projectId"]}-firebase-fetch--${new Date().getTime()}`);
    res.header(
        "Access-Control-expose-Headers",
        "etag,vary,vary,vary,content-encoding,date,server,content-length"
    );

    res.json(generateClientResponse(EMULATOR_TEMPLATE));
  });

  return Promise.resolve(app);
}

function prodToEmulatorTemplate(prodTemplate: any): any {
  const prodParameters = prodTemplate['parameters'];
  const emulatorParameters: any = {};
  for (const parameterName of Object.keys(prodParameters)) {
    const emulatorParameter = Object.assign({}, prodParameters[parameterName]);
    if (emulatorParameter.hasOwnProperty('conditionalValues')) {
      // add is_emulator
      const conditionalValues = emulatorParameter['conditionalValues'];
      conditionalValues['isEmulator'] = Object.assign({}, emulatorParameter['defaultValue']);
    } else {
      // add conditional value object
      emulatorParameter['conditionalValues'] = {
        // add is_emulator
        isEmulator: Object.assign({}, emulatorParameter['defaultValue'])
      };
    }
    emulatorParameters[parameterName] = emulatorParameter;
  }
  return {
    parameters: emulatorParameters
  };
}

function generateClientResponse(template: any): any {
  const parameters = template['parameters'];
  const entriesObj: any = {};
  for (const parameterName of Object.keys(parameters)) {
    entriesObj[parameterName] = parameters[parameterName].conditionalValues.isEmulator.value;
  }
  console.log(entriesObj);
  return {
    entries: entriesObj,
    state: 'UPDATE'
  };
}