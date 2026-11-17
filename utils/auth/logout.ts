export default async function logout(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (res.ok && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vux:auth", { detail: null }));
    }
    return res.ok;
  } catch {
    return false;
  }
}
