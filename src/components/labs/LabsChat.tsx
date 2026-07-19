"use client";

import { useEffect, useRef, useState } from "react";
import { readLabsFromLocation } from "@/lib/labs/flags";
import { useChatController } from "@/lib/labs/chat/useChatController";
import { ChatDot } from "./ChatDot";
import { ChatPanel } from "./ChatPanel";
import { ChatInput } from "./ChatInput";
import { ProgressBar } from "./ProgressBar";
import { VoiceOrb } from "./VoiceOrb";
import { TranscriptView } from "./TranscriptView";

interface Strings {
  dotPrimary: string;
  dotMeta: string;
  dotAria: string;

  panelTitle: string;
  panelMeta: string;

  disclosureIntro: string;
  disclosureLines: string[];
  disclosureStart: string;
  disclosureDismiss: string;

  seed: string;
  refusal: string;

  labelUser: string;
  labelAssistant: string;
  inputPlaceholder: string;

  sendLabel: string;
  expandLabel: string;
  collapseLabel: string;
  closeLabel: string;
  overflowHint: string;

  voiceLabelOn: string;
  voiceLabelOff: string;

  voiceIdle: string;
  voiceListening: string;
  voiceThinking: string;
  voiceSpeaking: string;
  voiceError: string;
  voiceOrbLabel: string;
  voiceBackToChat: string;

  progressReady: string;
  webgpuMissing: string;
  errorNetwork: string;
}

export function LabsChat({ strings }: { strings: Strings }) {
  const [enabled, setEnabled] = useState(false);
  const ctrl = useChatController();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const labs = readLabsFromLocation();
    if (labs.has("chat")) setEnabled(true);
  }, []);

  // Overflow detection: re-measure whenever a new turn appears or the panel
  // resizes. Subscribing to the transcript here (instead of reading it as a
  // prop) means the effect fires precisely on transcript mutations without
  // pulling the full transcript into this component's render.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 4);
    measure();
    return ctrl.transcript.subscribe(measure);
  }, [ctrl.transcript, ctrl.uiMode]);

  if (!enabled) return null;

  // Dormant → show dot only. Click opens the disclosure panel.
  if (!ctrl.isOpen) {
    return (
      <ChatDot
        onClick={() => ctrl.open("compact")}
        primaryLabel={strings.dotPrimary}
        metaLabel={strings.dotMeta}
        a11yLabel={strings.dotAria}
      />
    );
  }

  // Voice mode → orb only. Both compact + expanded panels are suppressed.
  if (ctrl.mode === "voice") {
    const captionMap: Record<typeof ctrl.voiceState, string> = {
      idle: strings.voiceIdle,
      listening: strings.voiceListening,
      thinking: strings.voiceThinking,
      speaking: strings.voiceSpeaking,
      error: strings.voiceError,
    };
    return (
      <VoiceOrb
        state={ctrl.voiceState}
        amplitudeSource={ctrl.amplitudeSource}
        caption={captionMap[ctrl.voiceState]}
        orbLabel={strings.voiceOrbLabel}
        backToChatLabel={strings.voiceBackToChat}
        onBackToChat={() => ctrl.disableVoice()}
      />
    );
  }

  // Chat panel (compact or expanded).
  const showingDisclosure =
    ctrl.phase === "dormant" || (ctrl.phase === "error" && ctrl.transcript.length() === 0);
  const loading = ctrl.phase === "loading";
  const isReady = ctrl.phase === "ready" || ctrl.phase === "sending" || ctrl.phase === "streaming";
  const compact = ctrl.uiMode === "compact";

  return (
    <ChatPanel
      mode={ctrl.uiMode}
      titlePrimary={strings.panelTitle}
      titleMeta={strings.panelMeta}
      expandLabel={strings.expandLabel}
      collapseLabel={strings.collapseLabel}
      closeLabel={strings.closeLabel}
      onToggleMode={ctrl.toggleMode}
      onClose={ctrl.close}
      onExpandFromOverflow={() => {
        if (compact && overflowing && ctrl.uiMode === "compact") ctrl.toggleMode();
      }}
      overflowHint={compact && overflowing ? strings.overflowHint : undefined}
      footer={
        isReady ? (
          <ChatInput
            onSend={ctrl.send}
            onToggleVoice={ctrl.enableVoice}
            disabled={ctrl.phase !== "ready"}
            voiceActive={ctrl.voiceEnabled}
            placeholder={strings.inputPlaceholder}
            sendLabel={strings.sendLabel}
            voiceLabelOn={strings.voiceLabelOn}
            voiceLabelOff={strings.voiceLabelOff}
          />
        ) : null
      }
    >
      <div ref={bodyRef} style={{ display: "contents" }}>
        {showingDisclosure && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p>{strings.disclosureIntro}</p>
            <ul>
              {strings.disclosureLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {ctrl.webgpuAvailable === false && <p style={{ color: "var(--color-error)" }}>{strings.webgpuMissing}</p>}
            {ctrl.error && (
              <p style={{ color: "var(--color-error)" }}>
                {ctrl.errorKind === "network" ? strings.errorNetwork : ctrl.error}
              </p>
            )}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => ctrl.start()}
                disabled={ctrl.webgpuAvailable === false}
                style={{
                  padding: "8px 16px",
                  background: "var(--color-text)",
                  color: "var(--color-bg)",
                  border: 0,
                  borderRadius: "var(--radius-control)",
                  cursor: ctrl.webgpuAvailable === false ? "not-allowed" : "pointer",
                  opacity: ctrl.webgpuAvailable === false ? 0.5 : 1,
                }}
              >
                {strings.disclosureStart}
              </button>
              <button
                type="button"
                onClick={ctrl.close}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                {strings.disclosureDismiss}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <ProgressBar progress={ctrl.progress} caption={ctrl.progressCaption || strings.progressReady} />
        )}

        {isReady && (
          <TranscriptView
            store={ctrl.transcript}
            compact={compact}
            labelUser={strings.labelUser}
            labelAssistant={strings.labelAssistant}
            emptySeed={strings.seed}
          />
        )}
      </div>
    </ChatPanel>
  );
}
