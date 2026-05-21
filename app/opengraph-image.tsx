import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#0a0f1e",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 100px",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "-100px",
          width: "700px",
          height: "700px",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-200px",
          right: "-100px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "48px",
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 46 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.9 0.400009L17.9 4.2C19.4 5.6 20.2 7.50001 20.2 9.60001C20.2 11.6 21 13.5 22.4 14.9L22.9 15.4L27.5 0.5"
            fill="white"
          />
          <path
            d="M0.300003 13.7L5.8 13.5C7.8 13.4 9.8 14.2 11.2 15.6C12.6 17 14.5 17.7 16.5 17.7H17.2L9.8 4"
            fill="white"
          />
          <path
            d="M0.300003 32.7L4 28.7C5.4 27.2 7.3 26.3 9.3 26.3C11.3 26.3 13.1 25.4 14.5 24L15 23.5L0 19.2"
            fill="white"
          />
          <path
            d="M13.9 45.9L13.6 40.4C13.5 38.4 14.2 36.4 15.6 34.9C16.9 33.5 17.7 31.5 17.6 29.6V28.9L4 36.6"
            fill="white"
          />
          <path
            d="M32.9 45.5L28.8 41.9C27.3 40.6 26.4 38.7 26.3 36.6C26.2 34.6 25.3 32.8 23.9 31.4L23.4 30.9L19.4 46"
            fill="white"
          />
          <path
            d="M45.9 31.6L40.4 32C38.4 32.2 36.4 31.5 34.9 30.1C33.4 28.8 31.5 28.1 29.5 28.2H28.8L36.8 41.6"
            fill="white"
          />
          <path
            d="M45 12.7L41.5 16.9C40.2 18.4 38.3 19.4 36.3 19.5C34.3 19.6 32.5 20.5 31.2 22L30.8 22.5L46 26.1"
            fill="white"
          />
          <path
            d="M30.9 0L31.4 5.5C31.6 7.5 31 9.50001 29.6 11.1C28.3 12.6 27.7 14.5 27.8 16.5L27.9 17.2L41.1 8.90001"
            fill="white"
          />
        </svg>

        <span
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-1px",
          }}
        >
          Cábala
        </span>
      </div>

      <div
        style={{
          fontSize: "72px",
          fontWeight: 800,
          color: "#ffffff",
          lineHeight: 1.05,
          letterSpacing: "-2.5px",
          marginBottom: "24px",
          maxWidth: "900px",
        }}
      >
        Predicciones de{" "}
        <span style={{ color: "#3b82f6" }}>fútbol argentino</span>
      </div>

      <div
        style={{
          fontSize: "28px",
          color: "#64748b",
          fontWeight: 400,
          lineHeight: 1.5,
          maxWidth: "680px",
          marginBottom: "56px",
        }}
      >
        Predecí los resultados, acumulá puntos y competí con todos.
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        {["Liga Profesional", "Gratis", "Argentina 🇦🇷"].map((label) => (
          <div
            key={label}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "99px",
              padding: "10px 24px",
              color: "#94a3b8",
              fontSize: "20px",
              fontWeight: 500,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "48px",
          right: "80px",
          color: "#334155",
          fontSize: "20px",
          fontWeight: 500,
          letterSpacing: "0.5px",
        }}
      >
        cabala.app
      </div>
    </div>,
    { ...size },
  );
}
