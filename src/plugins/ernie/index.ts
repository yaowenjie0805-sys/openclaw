import {
  ERNIE_DEFAULT_API_KEY_ENV_VAR,
  ERNIE_DEFAULT_BASE_URL,
} from "../../agents/ernie-defaults.js";
import { configureOpenAICompatibleSelfHostedProviderNonInteractive } from "../provider-self-hosted-setup.js";
import type {
  ProviderAuthMethod,
  ProviderPlugin,
  ProviderAuthMethodNonInteractiveContext,
  ProviderAuthResult,
} from "../types.js";
import { promptAndConfigureErnie } from "./setup.js";

export default function register(api: {
  registerProvider: (provider: ProviderPlugin) => void;
}): void {
  api.registerProvider({
    id: "ernie",
    label: "文心一言 (ERNIE)",
    docsPath: "/providers/ernie",
    auth: [
      {
        id: "api-key",
        label: "API Key",
        hint: "使用百度智能云 API Key",
        run: async (ctx) => {
          const result = await promptAndConfigureErnie({
            cfg: ctx.config,
            prompter: ctx.prompter,
          });
          return {
            profiles: [
              {
                profileId: "ernie:default",
                credential: {
                  type: "api_key",
                  provider: "ernie",
                  key: process.env[ERNIE_DEFAULT_API_KEY_ENV_VAR] || "",
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
            providerId: "ernie",
            providerLabel: "文心一言 (ERNIE)",
            defaultBaseUrl: ERNIE_DEFAULT_BASE_URL,
            defaultApiKeyEnvVar: ERNIE_DEFAULT_API_KEY_ENV_VAR,
            modelPlaceholder: "ernie-4.0",
            reasoning: true,
            input: ["text", "image"],
          });
          if (!config) {
            return null;
          }
          return {
            profiles: [
              {
                profileId: "ernie:default",
                credential: {
                  type: "api_key",
                  provider: "ernie",
                  key: process.env[ERNIE_DEFAULT_API_KEY_ENV_VAR] || "",
                },
              },
            ],
            configPatch: config,
            defaultModel: `ernie/ernie-4.0`,
          };
        },
      },
    ],
  });
}
