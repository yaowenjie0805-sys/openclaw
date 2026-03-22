import {
  QWEN_DEFAULT_API_KEY_ENV_VAR,
  QWEN_DEFAULT_BASE_URL,
  QWEN_MODEL_PLACEHOLDER,
  QWEN_PROVIDER_LABEL,
} from "../agents/qwen-defaults.js";
import type { OpenClawConfig } from "../config/config.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import {
  applyProviderDefaultModel,
  promptAndConfigureOpenAICompatibleSelfHostedProvider,
} from "./provider-self-hosted-setup.js";

export { QWEN_DEFAULT_BASE_URL } from "../agents/qwen-defaults.js";

export async function promptAndConfigureQwen(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
}): Promise<{ config: OpenClawConfig; modelId: string; modelRef: string }> {
  const result = await promptAndConfigureOpenAICompatibleSelfHostedProvider({
    cfg: params.cfg,
    prompter: params.prompter,
    providerId: "qwen",
    providerLabel: QWEN_PROVIDER_LABEL,
    defaultBaseUrl: QWEN_DEFAULT_BASE_URL,
    defaultApiKeyEnvVar: QWEN_DEFAULT_API_KEY_ENV_VAR,
    modelPlaceholder: QWEN_MODEL_PLACEHOLDER,
    reasoning: true,
    input: ["text", "image"],
  });
  return {
    config: result.config,
    modelId: result.modelId,
    modelRef: result.modelRef,
  };
}

export { applyProviderDefaultModel as applyQwenDefaultModel };
