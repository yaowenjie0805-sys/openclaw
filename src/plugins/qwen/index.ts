import { QWEN_DEFAULT_API_KEY_ENV_VAR, QWEN_DEFAULT_BASE_URL } from "../../agents/qwen-defaults.js";
import { configureOpenAICompatibleSelfHostedProviderNonInteractive } from "../provider-self-hosted-setup.js";
import type {
  ProviderAuthMethod,
  ProviderPlugin,
  ProviderAuthMethodNonInteractiveContext,
  ProviderAuthResult,
} from "../types.js";
import { promptAndConfigureQwen } from "./setup.js";

export default function register(api: {
  registerProvider: (provider: ProviderPlugin) => void;
}): void {
  api.registerProvider({
    id: "qwen",
    label: "通义千问 (Qwen)",
    docsPath: "/providers/qwen",
    auth: [
      {
        id: "api-key",
        label: "API Key",
        hint: "使用阿里云 DashScope API Key",
        run: async (ctx) => {
          const result = await promptAndConfigureQwen({
            cfg: ctx.config,
            prompter: ctx.prompter,
          });
          return {
            profiles: [
              {
                profileId: "qwen:default",
                credential: {
                  type: "api_key",
                  provider: "qwen",
                  key: process.env[QWEN_DEFAULT_API_KEY_ENV_VAR] || "",
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
            providerId: "qwen",
            providerLabel: "通义千问 (Qwen)",
            defaultBaseUrl: QWEN_DEFAULT_BASE_URL,
            defaultApiKeyEnvVar: QWEN_DEFAULT_API_KEY_ENV_VAR,
            modelPlaceholder: "qwen2.5-72b-instruct",
            reasoning: true,
            input: ["text", "image"],
          });
          if (!config) {
            return null;
          }
          return {
            profiles: [
              {
                profileId: "qwen:default",
                credential: {
                  type: "api_key",
                  provider: "qwen",
                  key: process.env[QWEN_DEFAULT_API_KEY_ENV_VAR] || "",
                },
              },
            ],
            configPatch: config,
            defaultModel: `qwen/qwen2.5-72b-instruct`,
          };
        },
      },
    ],
  });
}
