import {
  XINGHUO_DEFAULT_API_KEY_ENV_VAR,
  XINGHUO_DEFAULT_BASE_URL,
} from "../../agents/xinghuo-defaults.js";
import { configureOpenAICompatibleSelfHostedProviderNonInteractive } from "../provider-self-hosted-setup.js";
import type {
  ProviderAuthMethod,
  ProviderPlugin,
  ProviderAuthMethodNonInteractiveContext,
  ProviderAuthResult,
} from "../types.js";
import { promptAndConfigureXinghuo } from "./setup.js";

export default function register(api: {
  registerProvider: (provider: ProviderPlugin) => void;
}): void {
  api.registerProvider({
    id: "xinghuo",
    label: "讯飞星火 (Xinghuo)",
    docsPath: "/providers/xinghuo",
    auth: [
      {
        id: "api-key",
        label: "API Key",
        hint: "使用讯飞开放平台 API Key",
        run: async (ctx) => {
          const result = await promptAndConfigureXinghuo({
            cfg: ctx.config,
            prompter: ctx.prompter,
          });
          return {
            profiles: [
              {
                profileId: "xinghuo:default",
                credential: {
                  type: "api_key",
                  provider: "xinghuo",
                  key: process.env[XINGHUO_DEFAULT_API_KEY_ENV_VAR] || "",
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
            providerId: "xinghuo",
            providerLabel: "讯飞星火 (Xinghuo)",
            defaultBaseUrl: XINGHUO_DEFAULT_BASE_URL,
            defaultApiKeyEnvVar: XINGHUO_DEFAULT_API_KEY_ENV_VAR,
            modelPlaceholder: "spark-4.0",
            reasoning: true,
            input: ["text", "image"],
          });
          if (!config) {
            return null;
          }
          return {
            profiles: [
              {
                profileId: "xinghuo:default",
                credential: {
                  type: "api_key",
                  provider: "xinghuo",
                  key: process.env[XINGHUO_DEFAULT_API_KEY_ENV_VAR] || "",
                },
              },
            ],
            configPatch: config,
            defaultModel: `xinghuo/spark-4.0`,
          };
        },
      },
    ],
  });
}
