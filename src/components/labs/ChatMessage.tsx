import styles from "./ChatMessage.module.css";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  labelUser: string;
  labelAssistant: string;
}

/**
 * ChatMessage — role-styled paragraph. User turns render in muted mono to
 * feel like a query; assistant turns render in body serif-adjacent sans.
 * Streaming works by mutating `content` from the parent — the component is
 * intentionally uncontrolled.
 */
export function ChatMessage({ role, content, labelUser, labelAssistant }: ChatMessageProps) {
  const label = role === "user" ? labelUser : labelAssistant;
  return (
    <div className={`${styles.message} ${role === "user" ? styles.user : styles.assistant}`}>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
      <p className={styles.body}>{content}</p>
    </div>
  );
}
