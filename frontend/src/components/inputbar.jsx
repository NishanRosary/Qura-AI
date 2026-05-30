import { useState } from "react";

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <svg width="20" height="6" viewBox="0 0 20 6" fill="currentColor">
      <circle cx="3" cy="3" r="2" opacity="0.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0s" />
      </circle>
      <circle cx="10" cy="3" r="2" opacity="0.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.2s" />
      </circle>
      <circle cx="17" cy="3" r="2" opacity="0.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.4s" />
      </circle>
    </svg>
  );
}

function InputBar({ disabled, isSending, onSend }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const question = value.trim();
    if (!question || disabled) {
      return;
    }

    onSend(question);
    setValue("");
  }

  return (
    <div className="input-bar-wrap">
      <div className="input-inner">
        <form className="input-pill" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={
              disabled
                ? "Process documents to start asking..."
                : "Ask something about your documents..."
            }
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled}
          />

          <button className="send-btn" type="submit" disabled={disabled || isSending}>
            {isSending ? <LoadingDots /> : <SendIcon />}
          </button>
        </form>

        <div className="input-hint">
          Responses are grounded in your uploaded documents
        </div>
      </div>
    </div>
  );
}

export default InputBar;
