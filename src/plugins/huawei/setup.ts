import {
  HUAWEI_DEFAULT_API_KEY_ENV_VAR,
  HUAWEI_DEFAULT_BASE_URL,
  HUAWEI_MODEL_PLACEHOLDER,
  HUAWEI_PROVIDER_LABEL,
} from "../../agents/huawei-defaults.js";
import type { OpenClawConfig } from "../../config/config.js";
import type { WizardPrompter } from "../../wizard/prompts.js";
import {
  applyProviderDefaultModel,
  promptAndConfigureOpenAICompatibleSelfHostedProvider,
} from "../provider-self-hosted-setup.js";

export async function promptAndConfigureHuawei(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
}): Promise<{ config: OpenClawConfig; modelId: string; modelRef: string }> {
  const result = await promptAndConfigureOpenAICompatibleSelfHostedProvider({
    cfg: params.cfg,
    prompter: params.prompter,
    providerId: "huawei",
    providerLabel: HUAWEI_PROVIDER_LABEL,
    defaultBaseUrl: HUAWEI_DEFAULT_BASE_URL,
    defaultApiKeyEnvVar: HUAWEI_DEFAULT_API_KEY_ENV_VAR,
    modelPlaceholder: HUAWEI_MODEL_PLACEHOLDER,
    reasoning: true,
    input: ["text", "image"],
  });
  return {
    config: result.config,
    modelId: result.modelId,
    modelRef: result.modelRef,
  };
}

export { applyProviderDefaultModel as applyHuaweiDefaultModel };
