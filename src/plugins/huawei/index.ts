import {
  HUAWEI_DEFAULT_API_KEY_ENV_VAR,
  HUAWEI_DEFAULT_BASE_URL,
} from "../../agents/huawei-defaults.js";
import { configureOpenAICompatibleSelfHostedProviderNonInteractive } from "../provider-self-hosted-setup.js";
import type {
  ProviderAuthMethod,
  ProviderPlugin,
  ProviderAuthMethodNonInteractiveContext,
  ProviderAuthResult,
} from "../types.js";
import { promptAndConfigureHuawei } from "./setup.js";

export default function register(api: {
  registerProvider: (provider: ProviderPlugin) => void;
}): void {
  api.registerProvider({
    id: "huawei",
    label: "华为MaaS (Huawei)",
    docsPath: "/providers/huawei",
    auth: [
      {
        id: "api-key",
        label: "API Key",
        hint: "使用华为云ModelArts API Key",
        run: async (ctx) => {
          const result = await promptAndConfigureHuawei({
            cfg: ctx.config,
            prompter: ctx.prompter,
          });
          return {
            profiles: [
              {
                profileId: "huawei:default",
                credential: {
                  type: "api_key",
                  provider: "huawei",
                  key: process.env[HUAWEI_DEFAULT_API_KEY_ENV_VAR] || "",
                },
              },
            ],
            configPatch: result.config,
            defaultModel: result.modelRef,
          };
        },
        runNonInteractive: async (
          ctx: ProviderAuthMethodNonInteractiveContext,
        ): Promise<ProviderAuthResult | null> => {
          const config = await configureOpenAICompatibleSelfHostedProviderNonInteractive({
            ctx,
            providerId: "huawei",
            providerLabel: "华为MaaS (Huawei)",
            defaultBaseUrl: HUAWEI_DEFAULT_BASE_URL,
            defaultApiKeyEnvVar: HUAWEI_DEFAULT_API_KEY_ENV_VAR,
            modelPlaceholder: "gpt-4",
            reasoning: true,
            input: ["text", "image"],
          });
          if (!config) {
            return null;
          }
          return {
            profiles: [
              {
                profileId: "huawei:default",
                credential: {
                  type: "api_key",
                  provider: "huawei",
                  key: process.env[HUAWEI_DEFAULT_API_KEY_ENV_VAR] || "",
                },
              },
            ],
            configPatch: config,
            defaultModel: `huawei/gpt-4`,
          };
        },
      },
    ],
  });
}
