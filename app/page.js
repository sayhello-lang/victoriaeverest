export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        background: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 600, margin: 0 }}>Victoria Everest</h1>
      <p style={{ opacity: 0.6 }}>Coming soon.</p>
    </main>
  );
}
