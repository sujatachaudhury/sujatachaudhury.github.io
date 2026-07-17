"use client";

import { memo, useSyncExternalStore } from "react";
import type { TranscriptStore } from "@/lib/labs/chat/transcript-store";
import { ChatMessage } from "./ChatMessage";

interface TranscriptViewProps {
  store: TranscriptStore;
  compact: boolean;
  labelUser: string;
  labelAssistant: string;
  emptySeed?: string;
}

/**
 * TranscriptView — subscribes directly to the transcript store via
 * useSyncExternalStore. This is the only component that re-renders on
 * streaming tokens; everything else in the panel stays stable.
 *
 * Turn rows are memoised on (id, content). While the assistant's final turn
 * streams, only that row's ChatMessage reconciles; prior rows skip entirely.
 */
export function TranscriptView({
  store,
  compact,
  labelUser,
  labelAssistant,
  emptySeed,
}: TranscriptViewProps) {
  const turns = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  const visible = compact && turns.length > 2 ? turns.slice(-2) : turns;

  if (visible.length === 0 && emptySeed) {
    return (
      <ChatMessage
        role="assistant"
        content={emptySeed}
        labelUser={labelUser}
        labelAssistant={labelAssistant}
      />
    );
  }

  return (
    <>
      {visible.map((turn) => (
        <MemoTurn
          key={turn.id}
          role={turn.role}
          content={turn.content}
          labelUser={labelUser}
          labelAssistant={labelAssistant}
        />
      ))}
    </>
  );
}

// Memoised so unchanged turns don't re-reconcile when the array reference
// changes for another turn's mutation.
const MemoTurn = memo(function MemoTurn(props: {
  role: "user" | "assistant";
  content: string;
  labelUser: string;
  labelAssistant: string;
}) {
  return <ChatMessage {...props} />;
});
