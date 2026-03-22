import {
  XINGHUO_DEFAULT_API_KEY_ENV_VAR,
  XINGHUO_DEFAULT_BASE_URL,
  XINGHUO_MODEL_PLACEHOLDER,
  XINGHUO_PROVIDER_LABEL,
} from "../../agents/xinghuo-defaults.js";
import type { OpenClawConfig } from "../../config/config.js";
import type { WizardPrompter } from "../../wizard/prompts.js";
import {
  applyProviderDefaultModel,
  promptAndConfigureOpenAICompatibleSelfHostedProvider,
} from "../provider-self-hosted-setup.js";

export async function promptAndConfigureXinghuo(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
}): Promise<{ config: OpenClawConfig; modelId: string; modelRef: string }> {
  const result = await promptAndConfigureOpenAICompatibleSelfHostedProvider({
    cfg: params.cfg,
    prompter: params.prompter,
    providerId: "xinghuo",
    providerLabel: XINGHUO_PROVIDER_LABEL,
    defaultBaseUrl: XINGHUO_DEFAULT_BASE_URL,
    defaultApiKeyEnvVar: XINGHUO_DEFAULT_API_KEY_ENV_VAR,
    modelPlaceholder: XINGHUO_MODEL_PLACEHOLDER,
    reasoning: true,
    input: ["text", "image"],
  });
  return {
    config: result.config,
    modelId: result.modelId,
    modelRef: result.modelRef,
  };
}

export { applyProviderDefaultModel as applyXinghuoDefaultModel };
