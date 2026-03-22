import {
  ERNIE_DEFAULT_API_KEY_ENV_VAR,
  ERNIE_DEFAULT_BASE_URL,
  ERNIE_MODEL_PLACEHOLDER,
  ERNIE_PROVIDER_LABEL,
} from "../agents/ernie-defaults.js";
import type { OpenClawConfig } from "../config/config.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import {
  applyProviderDefaultModel,
  promptAndConfigureOpenAICompatibleSelfHostedProvider,
} from "./provider-self-hosted-setup.js";

export { ERNIE_DEFAULT_BASE_URL } from "../agents/ernie-defaults.js";

export async function promptAndConfigureErnie(params: {
  cfg: OpenClawConfig;
  prompter: WizardPrompter;
}): Promise<{ config: OpenClawConfig; modelId: string; modelRef: string }> {
  const result = await promptAndConfigureOpenAICompatibleSelfHostedProvider({
    cfg: params.cfg,
    prompter: params.prompter,
    providerId: "ernie",
    providerLabel: ERNIE_PROVIDER_LABEL,
    defaultBaseUrl: ERNIE_DEFAULT_BASE_URL,
    defaultApiKeyEnvVar: ERNIE_DEFAULT_API_KEY_ENV_VAR,
    modelPlaceholder: ERNIE_MODEL_PLACEHOLDER,
    reasoning: true,
    input: ["text", "image"],
  });
  return {
    config: result.config,
    modelId: result.modelId,
    modelRef: result.modelRef,
  };
}

export { applyProviderDefaultModel as applyErnieDefaultModel };
