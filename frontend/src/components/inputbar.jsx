import { useState } from "react";

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
                ? "Process documents to start asking questions..."
                : "Ask something about your documents..."
            }
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled}
          />

          <button className="input-action" type="button" disabled>
            KB
          </button>

          <button className="send-btn" type="submit" disabled={disabled || isSending}>
            {isSending ? "..." : "Go"}
          </button>
        </form>

        <div className="input-hint">
          AI responses are grounded in your uploaded documents
        </div>
      </div>
    </div>
  );
}

export default InputBar;
