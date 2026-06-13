import { Component } from "react";

const THEME = {
  bg: "#0d1117",
  accent: "#58a6ff",
  loss: "#f85149",
  text: "#c9d1d9",
  textMid: "#8b949e",
  textDim: "#4a5568",
  cardBorder: "rgba(139,148,158,0.15)",
  font: "'DM Sans',sans-serif",
  headingFont: "'Playfair Display',serif",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Chess Analyzer render error:", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { error } = this.state;
    const message = error?.message || "Something went wrong while rendering this view.";

    return (
      <div
        style={{
          minHeight: "100vh",
          background: THEME.bg,
          color: THEME.text,
          fontFamily: THEME.font,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            padding: "28px 24px",
            borderRadius: 12,
            border: `1px solid ${THEME.loss}40`,
            background: `${THEME.loss}10`,
            boxShadow: "0 8px 32px rgba(0,0,0,.35)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠</div>
          <h1
            style={{
              fontFamily: THEME.headingFont,
              fontSize: 28,
              fontWeight: 700,
              color: THEME.accent,
              marginBottom: 10,
            }}
          >
            Something broke
          </h1>
          <p style={{ fontSize: 15, color: THEME.textMid, marginBottom: 16, lineHeight: 1.5 }}>
            A tab hit unexpected data and crashed the view. Your session is still here — try again or reload the page.
          </p>
          <pre
            style={{
              fontSize: 12,
              color: THEME.loss,
              background: "rgba(0,0,0,.25)",
              border: `1px solid ${THEME.cardBorder}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 20,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {message}
          </pre>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.reset}
              style={{
                background: `linear-gradient(135deg,#1f6feb,${THEME.accent})`,
                color: THEME.bg,
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: "transparent",
                color: THEME.textMid,
                border: `1px solid ${THEME.cardBorder}`,
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
