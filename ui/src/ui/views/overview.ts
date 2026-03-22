import { html, nothing } from "lit";
import { t, i18n, SUPPORTED_LOCALES, type Locale, isSupportedLocale } from "../../i18n/index.ts";
import type { EventLogEntry } from "../app-events.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../external-link.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { GatewayHelloOk } from "../gateway.ts";
import { icons } from "../icons.ts";
import type { UiSettings } from "../storage.ts";
import type {
  AttentionItem,
  CronJob,
  CronStatus,
  SessionsListResult,
  SessionsUsageResult,
  SkillStatusReport,
} from "../types.ts";
import { renderOverviewAttention } from "./overview-attention.ts";
import { renderOverviewCards } from "./overview-cards.ts";
import { renderOverviewEventLog } from "./overview-event-log.ts";
import {
  resolveAuthHintKind,
  shouldShowInsecureContextHint,
  shouldShowPairingHint,
} from "./overview-hints.ts";
import { renderOverviewLogTail } from "./overview-log-tail.ts";

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  password: string;
  lastError: string | null;
  lastErrorCode: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  // New dashboard data
  usageResult: SessionsUsageResult | null;
  sessionsResult: SessionsListResult | null;
  skillsReport: SkillStatusReport | null;
  cronJobs: CronJob[];
  cronStatus: CronStatus | null;
  attentionItems: AttentionItem[];
  eventLog: EventLogEntry[];
  overviewLogLines: string[];
  showGatewayToken: boolean;
  showGatewayPassword: boolean;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onToggleGatewayTokenVisibility: () => void;
  onToggleGatewayPasswordVisibility: () => void;
  onConnect: () => void;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  onRefreshLogs: () => void;
};

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | {
        uptimeMs?: number;
        authMode?: "none" | "token" | "password" | "trusted-proxy";
      }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : t("common.na");
  const tickIntervalMs = props.hello?.policy?.tickIntervalMs;
  const tick = tickIntervalMs
    ? `${(tickIntervalMs / 1000).toFixed(tickIntervalMs % 1000 === 0 ? 0 : 1)}s`
    : t("common.na");
  const authMode = snapshot?.authMode;
  const isTrustedProxy = authMode === "trusted-proxy";

  const pairingHint = (() => {
    if (!shouldShowPairingHint(props.connected, props.lastError, props.lastErrorCode)) {
      return null;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t("overview.pairing.hint")}
        <div style="margin-top: 6px">
          <span class="mono">openclaw devices list</span><br />
          <span class="mono">openclaw devices approve &lt;requestId&gt;</span>
        </div>
        <div style="margin-top: 6px; font-size: 12px;">
          ${t("overview.pairing.mobileHint")}
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#device-pairing-first-connection"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Device pairing docs (opens in new tab)"
            >Docs: Device pairing</a
          >
        </div>
      </div>
    `;
  })();

  const authHint = (() => {
    const authHintKind = resolveAuthHintKind({
      connected: props.connected,
      lastError: props.lastError,
      lastErrorCode: props.lastErrorCode,
      hasToken: Boolean(props.settings.token.trim()),
      hasPassword: Boolean(props.password.trim()),
    });
    if (authHintKind == null) {
      return null;
    }
    if (authHintKind === "required") {
      return html`
        <div class="muted" style="margin-top: 8px">
          ${t("overview.auth.required")}
          <div style="margin-top: 6px">
            <span class="mono">openclaw dashboard --no-open</span> → tokenized URL<br />
            <span class="mono">openclaw doctor --generate-gateway-token</span> → set token
          </div>
          <div style="margin-top: 6px">
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target=${EXTERNAL_LINK_TARGET}
              rel=${buildExternalLinkRel()}
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth</a
            >
          </div>
        </div>
      `;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t("overview.auth.failed", { command: "openclaw dashboard --no-open" })}
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/dashboard"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth</a
          >
        </div>
      </div>
    `;
  })();

  const insecureContextHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
    if (isSecureContext) {
      return null;
    }
    if (!shouldShowInsecureContextHint(props.connected, props.lastError, props.lastErrorCode)) {
      return null;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t("overview.insecure.hint", { url: "http://127.0.0.1:18789" })}
        <div style="margin-top: 6px">
          ${t("overview.insecure.stayHttp", { config: "gateway.controlUi.allowInsecureAuth: true" })}
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/gateway/tailscale"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#insecure-http"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `;
  })();

  const currentLocale = isSupportedLocale(props.settings.locale)
    ? props.settings.locale
    : i18n.getLocale();

  return html`
    <!-- Dashboard Stats Grid -->
    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <div class="admin-stat-value ${props.connected ? "ok" : "warn"}">
          ${props.connected ? t("common.ok") : t("common.offline")}
        </div>
        <div class="admin-stat-label">${t("overview.snapshot.status")}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-value">${uptime}</div>
        <div class="admin-stat-label">${t("overview.snapshot.uptime")}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-value">${tick}</div>
        <div class="admin-stat-label">${t("overview.snapshot.tickInterval")}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-value">
          ${props.presenceCount}
        </div>
        <div class="admin-stat-label">${t("overview.snapshot.instances")}</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-value">
          ${props.sessionsCount || 0}
        </div>
        <div class="admin-stat-label">${t("overview.snapshot.sessions")}</div>
      </div>
    </div>

    <!-- Access Configuration -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title">${t("overview.access.title")}</div>
        <div class="admin-card-actions">
          <button class="admin-btn admin-btn-primary" @click=${() => props.onConnect()}>${t("common.connect")}</button>
          <button class="admin-btn admin-btn-secondary" @click=${() => props.onRefresh()}>${t("common.refresh")}</button>
        </div>
      </div>
      <div class="admin-form">
        <div class="admin-form-group">
          <label class="admin-form-label">${t("overview.access.wsUrl")}</label>
          <input
            class="admin-form-input"
            .value=${props.settings.gatewayUrl}
            @input=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              props.onSettingsChange({
                ...props.settings,
                gatewayUrl: v,
                token: v.trim() === props.settings.gatewayUrl.trim() ? props.settings.token : "",
              });
            }}
            placeholder="ws://100.x.y.z:18789"
          />
        </div>
        ${
          isTrustedProxy
            ? ""
            : html`
                <div class="admin-form-group">
                  <label class="admin-form-label">${t("overview.access.token")}</label>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input
                      class="admin-form-input"
                      type=${props.showGatewayToken ? "text" : "password"}
                      autocomplete="off"
                      style="flex: 1;"
                      .value=${props.settings.token}
                      @input=${(e: Event) => {
                        const v = (e.target as HTMLInputElement).value;
                        props.onSettingsChange({ ...props.settings, token: v });
                      }}
                      placeholder="OPENCLAW_GATEWAY_TOKEN"
                    />
                    <button
                      type="button"
                      class="admin-btn admin-btn-secondary"
                      style="width: 40px; height: 40px; padding: 0;"
                      title=${props.showGatewayToken ? "Hide token" : "Show token"}
                      aria-label="Toggle token visibility"
                      aria-pressed=${props.showGatewayToken}
                      @click=${props.onToggleGatewayTokenVisibility}
                    >
                      ${props.showGatewayToken ? icons.eye : icons.eyeOff}
                    </button>
                  </div>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">${t("overview.access.password")}</label>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input
                      class="admin-form-input"
                      type=${props.showGatewayPassword ? "text" : "password"}
                      autocomplete="off"
                      style="flex: 1;"
                      .value=${props.password}
                      @input=${(e: Event) => {
                        const v = (e.target as HTMLInputElement).value;
                        props.onPasswordChange(v);
                      }}
                      placeholder="system or shared password"
                    />
                    <button
                      type="button"
                      class="admin-btn admin-btn-secondary"
                      style="width: 40px; height: 40px; padding: 0;"
                      title=${props.showGatewayPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                      aria-pressed=${props.showGatewayPassword}
                      @click=${props.onToggleGatewayPasswordVisibility}
                    >
                      ${props.showGatewayPassword ? icons.eye : icons.eyeOff}
                    </button>
                  </div>
                </div>
              `
        }
        <div class="admin-form-group">
          <label class="admin-form-label">${t("overview.access.sessionKey")}</label>
          <input
            class="admin-form-input"
            .value=${props.settings.sessionKey}
            @input=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              props.onSessionKeyChange(v);
            }}
          />
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">${t("overview.access.language")}</label>
          <select
            class="admin-form-select"
            .value=${currentLocale}
            @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value as Locale;
              void i18n.setLocale(v);
              props.onSettingsChange({ ...props.settings, locale: v });
            }}
          >
            ${SUPPORTED_LOCALES.map((loc) => {
              const key = loc.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
              return html`<option value=${loc} ?selected=${currentLocale === loc}>
                ${t(`languages.${key}`)}
              </option>`;
            })}
          </select>
        </div>
        <div style="margin-top: 16px; font-size: 14px; color: var(--admin-text-secondary);">
          ${isTrustedProxy ? t("overview.access.trustedProxy") : t("overview.access.connectHint")}
        </div>
        ${
          !props.connected
            ? html`
                <div style="margin-top: 20px; padding: 16px; background: var(--admin-bg-color); border-radius: 8px; border: 1px solid var(--admin-border-color);">
                  <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; font-weight: 600; color: var(--admin-text-primary);">${t("overview.connection.title")}</h4>
                  <ol style="margin-bottom: 12px; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">${t("overview.connection.step1")}<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: var(--mono); font-size: 12px;">openclaw gateway run</code></li>
                    <li style="margin-bottom: 8px;">${t("overview.connection.step2")}<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: var(--mono); font-size: 12px;">openclaw dashboard --no-open</code></li>
                    <li style="margin-bottom: 8px;">${t("overview.connection.step3")}</li>
                    <li style="margin-bottom: 8px;">${t("overview.connection.step4")}<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: var(--mono); font-size: 12px;">openclaw doctor --generate-gateway-token</code></li>
                  </ol>
                  <div style="font-size: 14px; color: var(--admin-text-secondary);">
                    ${t("overview.connection.docsHint")}
                    <a
                      style="color: var(--admin-accent-color); text-decoration: none; font-weight: 500;"
                      href="https://docs.openclaw.ai/web/dashboard"
                      target="_blank"
                      rel="noreferrer"
                    >${t("overview.connection.docsLink")}</a>
                  </div>
                </div>
              `
            : nothing
        }
      </div>
    </div>

    <!-- System Overview Cards -->
    ${renderOverviewCards({
      usageResult: props.usageResult,
      sessionsResult: props.sessionsResult,
      skillsReport: props.skillsReport,
      cronJobs: props.cronJobs,
      cronStatus: props.cronStatus,
      presenceCount: props.presenceCount,
      onNavigate: props.onNavigate,
    })}

    <!-- Attention Items -->
    ${renderOverviewAttention({ items: props.attentionItems })}

    <!-- Event Log and System Logs -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">${t("overview.eventLog.title")}</div>
        </div>
        ${renderOverviewEventLog({
          events: props.eventLog,
        })}
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">${t("overview.logTail.title")}</div>
          <div class="admin-card-actions">
            <button class="admin-btn admin-btn-secondary" @click=${props.onRefreshLogs}>${t("common.refresh")}</button>
          </div>
        </div>
        ${renderOverviewLogTail({
          lines: props.overviewLogLines,
          onRefreshLogs: props.onRefreshLogs,
        })}
      </div>
    </div>

  `;
}
