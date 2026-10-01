// aha-web.js — вэб хувилбарын нэвтрэлт + QPay төлбөр.
// Мобайл аппын iap.js (RevenueCat)-ийн оронд ижил интерфейстэй (window.AHA_IAP) ажиллана,
// ингэснээр bundle.js-ийн PLUS логик өөрчлөгдөхгүй.
(function () {
  const api = async (url, opts) => {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || "Алдаа гарлаа (" + res.status + ")");
    return data;
  };
  const post = (url, body) => api(url, { method: "POST", body: JSON.stringify(body || {}) });

  // ---------- жижиг DOM туслах ----------
  function el(tag, props, children) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === "style") Object.assign(n.style, v);
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    });
    (children || []).forEach((c) => n.append(c));
    return n;
  }

  const S = {
    overlay: { position: "fixed", inset: 0, background: "rgba(21,16,31,.72)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Nunito',system-ui,sans-serif" },
    card: { background: "#fff", borderRadius: "22px", width: "100%", maxWidth: "380px", maxHeight: "92vh", overflow: "auto", padding: "22px 20px", boxShadow: "0 24px 60px rgba(0,0,0,.4)", color: "#241B3D", position: "relative", userSelect: "text", WebkitUserSelect: "text" },
    h: { fontSize: "22px", fontWeight: 900, textAlign: "center", marginBottom: "4px" },
    sub: { fontSize: "13.5px", color: "#7C6BA0", fontWeight: 600, textAlign: "center", marginBottom: "14px", lineHeight: 1.4 },
    input: { width: "100%", boxSizing: "border-box", border: "2px solid #E4DEF2", borderRadius: "12px", padding: "13px 14px", fontSize: "15px", fontWeight: 700, marginTop: "10px", outline: "none", fontFamily: "inherit", userSelect: "text", WebkitUserSelect: "text" },
    btn: { width: "100%", marginTop: "14px", background: "linear-gradient(135deg,#8B5CF6,#7C3AED)", color: "#fff", border: "none", borderRadius: "14px", padding: "15px", cursor: "pointer", fontSize: "16px", fontWeight: 900, fontFamily: "inherit" },
    link: { background: "none", border: "none", color: "#7C3AED", fontWeight: 800, fontSize: "13.5px", cursor: "pointer", marginTop: "12px", width: "100%", fontFamily: "inherit" },
    err: { color: "#DC2626", fontSize: "13px", fontWeight: 700, textAlign: "center", marginTop: "10px", minHeight: "16px" },
    x: { position: "absolute", top: "10px", right: "14px", background: "none", border: "none", fontSize: "26px", cursor: "pointer", color: "#9690A6", lineHeight: 1 },
  };

  function modal(build, opts) {
    const overlay = el("div", { style: S.overlay });
    if (opts && opts.required) overlay.style.background = "linear-gradient(160deg,#3B1F7A 0%,#15101F 70%)";
    const card = el("div", { style: S.card });
    overlay.append(card);
    document.body.append(overlay);
    let onClose = null;
    const close = () => { overlay.remove(); if (onClose) onClose(); };
    const closeBtn = el("button", { style: S.x, text: "×", "aria-label": "Хаах", onclick: close });
    if (!(opts && opts.required)) card.append(closeBtn);
    build(card, close, (fn) => { onClose = fn; });
    return close;
  }

  // ---------- нэвтрэх / бүртгүүлэх ----------
  function showAuth(opts) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
      modal((card, close, setOnClose) => {
        setOnClose(() => finish(false));
        let mode = opts && opts.required ? "register" : "login";
        const wrap = el("div");
        card.append(wrap);
        const render = () => {
          wrap.replaceChildren();
          const name = el("input", { style: S.input, placeholder: "Нэр", autocomplete: "name" });
          const email = el("input", { style: S.input, placeholder: "Имэйл", type: "email", autocomplete: "email" });
          const pass = el("input", { style: S.input, placeholder: "Нууц үг (6+ тэмдэгт)", type: "password", autocomplete: mode === "login" ? "current-password" : "new-password" });
          const err = el("div", { style: S.err });
          const submit = el("button", { style: S.btn, text: mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх" });
          const go = async () => {
            err.textContent = "";
            submit.disabled = true;
            try {
              await post(mode === "login" ? "/api/auth/login" : "/api/auth/register", { name: name.value, email: email.value, password: pass.value });
              finish(true);
              close();
            } catch (e) {
              err.textContent = e.message;
              submit.disabled = false;
            }
          };
          submit.addEventListener("click", go);
          pass.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
          if (opts && opts.required) wrap.append(el("div", { style: { textAlign: "center", fontSize: "34px", fontWeight: 900, color: "#7C3AED", letterSpacing: "1px" }, text: "АХА" }), el("div", { style: { ...S.sub, marginBottom: "6px" }, text: "Мэдлэгийн сорил" }));
          wrap.append(
            el("div", { style: S.h, text: mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх" }),
            el("div", { style: S.sub, text: opts && opts.required ? "АХА-г ашиглахын тулд эхлээд нэвтэрнэ үү." : "PLUS эрхээ бүртгэлдээ хадгалахын тулд нэвтэрнэ үү." }),
            ...(mode === "register" ? [name] : []),
            email, pass, err, submit,
            el("button", { style: S.link, text: mode === "login" ? "Бүртгэлгүй юу? Бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх", onclick: () => { mode = mode === "login" ? "register" : "login"; render(); } }),
          );
        };
        render();
      }, opts);
    });
  }

  // ---------- QPay төлбөр ----------
  function showPayment(inv) {
    return new Promise((resolve) => {
      let done = false;
      let timer = null;
      const finish = (ok) => { if (!done) { done = true; clearInterval(timer); resolve(ok); } };
      modal((card, close, setOnClose) => {
        setOnClose(() => finish(false));
        const status = el("div", { style: { ...S.sub, marginTop: "12px", marginBottom: 0 }, text: "Төлбөр хүлээж байна…" });
        card.append(
          el("div", { style: S.h, text: "QPay-ээр төлөх" }),
          el("div", { style: S.sub, text: "₮" + Number(inv.amount).toLocaleString("en-US") + " · PLUS эрх" }),
        );
        if (inv.qrImage) {
          card.append(el("img", { src: "data:image/png;base64," + inv.qrImage, alt: "QPay QR", style: { display: "block", width: "220px", height: "220px", margin: "0 auto", borderRadius: "12px", border: "2px solid #E4DEF2" } }));
          card.append(el("div", { style: { ...S.sub, marginTop: "8px" }, text: "Банкны апп-аараа QR кодыг уншуулна уу" }));
        }
        if (inv.qrUrl) {
          card.append(el("img", { src: inv.qrUrl, alt: "QPay QR", style: { display: "block", width: "230px", maxWidth: "100%", margin: "0 auto", borderRadius: "12px", border: "2px solid #E4DEF2" } }));
          card.append(el("div", { style: { ...S.sub, marginTop: "8px" }, text: "Банкны апп-аараа QR кодыг уншуулж ₮" + Number(inv.amount).toLocaleString("en-US") + " төлнө үү." }));
          card.append(el("div", { style: { background: "#F5F1FF", borderRadius: "12px", padding: "10px 12px", fontSize: "13px", fontWeight: 700, textAlign: "center", lineHeight: 1.5 } }, [
            document.createTextNode("Гүйлгээний утга дээр бичнэ үү: "),
            el("b", { style: { color: "#7C3AED", fontSize: "15px" }, text: inv.code }),
          ]));
          const note = el("input", { style: S.input, placeholder: "Төлсөн хүний нэр эсвэл утасны сүүлийн 4 орон" });
          card.append(note);
          card.append(el("button", { style: S.btn, text: "Төлсөн", onclick: async (e) => {
            e.target.disabled = true;
            try {
              const r = await post("/api/pay/claim", { paymentId: inv.paymentId, note: note.value });
              if (r.trialUntil) { finish(true); close(); return; } // түр PLUS нээгдлээ
              note.remove(); e.target.remove();
              status.textContent = "Хүсэлт илгээгдлээ. Төлбөрийг шалгаад PLUS-ийг идэвхжүүлнэ. Энэ цонхыг нээлттэй орхиж болно.";
            } catch (err) { status.textContent = err.message; e.target.disabled = false; }
          } }));
        }
        if (inv.urls && inv.urls.length) {
          const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginTop: "10px" } });
          inv.urls.forEach((u) => {
            grid.append(el("a", { href: u.link, style: { display: "flex", alignItems: "center", gap: "8px", border: "2px solid #E4DEF2", borderRadius: "12px", padding: "8px 10px", textDecoration: "none", color: "#241B3D", fontWeight: 800, fontSize: "12.5px" } }, [
              el("img", { src: u.logo, alt: "", style: { width: "26px", height: "26px", borderRadius: "6px" } }),
              el("span", { text: u.description || u.name }),
            ]));
          });
          card.append(grid);
        }
        if (inv.mock) {
          card.append(el("div", { style: { ...S.sub, marginTop: "6px", color: "#B45309" }, text: "MOCK горим: QPay түлхүүр тохируулаагүй тул жинхэнэ төлбөр хийгдэхгүй." }));
          card.append(el("button", { style: S.btn, text: "Туршилтаар төлсөн болгох", onclick: async () => {
            try { await post("/api/pay/mock-confirm", { paymentId: inv.paymentId }); } catch (e) { status.textContent = e.message; }
          } }));
        }
        card.append(status);

        const poll = async () => {
          try {
            const r = await api("/api/pay/status?id=" + inv.paymentId);
            if (r.status === "paid") { finish(true); close(); }
          } catch (e) { /* дараагийн poll дээр дахин оролдоно */ }
        };
        timer = setInterval(poll, 3000);
      });
    });
  }

  // ---------- window.AHA_IAP (bundle.js энийг дууддаг) ----------
  async function checkStatus() {
    try {
      const me = await api("/api/me");
      window.AHA_DEV_TOGGLE = !!me.mock;
      window.AHA_USER = me.user || null;
      window.AHA_PLUS_INFO = { until: me.plusUntil || null, admin: !!me.isAdmin };
      return !!me.isPlus;
    } catch (e) { return false; }
  }

  let busy = false;
  async function purchase() {
    if (busy) return { success: false, cancelled: true };
    busy = true;
    try {
      let me = await api("/api/me");
      if (!me.user) {
        const ok = await showAuth();
        if (!ok) return { success: false, cancelled: true };
        me = await api("/api/me");
      }
      if (me.isPlus) return { success: true };
      const inv = await post("/api/pay/create");
      const paid = await showPayment(inv);
      if (paid) await checkStatus();
      return paid ? { success: true } : { success: false, cancelled: true };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      busy = false;
    }
  }

  window.AHA_IAP = {
    hasIAP: () => true,
    init: async () => true,
    checkStatus,
    getPrice: async () => null,
    purchase,
    // "Эрхээ шалгах": нэвтэрсэн хэрэглэгчийн PLUS-ийг сервэрээс дахин уншина
    restore: async () => {
      const me = await api("/api/me").catch(() => null);
      if (me && !me.user) {
        const ok = await showAuth();
        if (!ok) return { success: false };
      }
      return { success: await checkStatus() };
    },
  };

  // ---------- Асуултууд: албан ёсны (сервер) + зөвхөн өөрийн нэмсэн ----------
  let topicQueue = Promise.resolve();
  window.AHA_Q = {
    load: async () => {
      try {
        let j = await api("/api/questions");
        // Хуучин (зөвхөн хөтөч дотор хадгалагдсан) асуултыг нэг удаа энэ бүртгэлд шилжүүлнэ
        try {
          const raw = localStorage.getItem("aha_questions_v1");
          if (raw) {
            const old = JSON.parse(raw);
            if (Array.isArray(old) && old.length) {
              const r = await post("/api/questions", { items: old.map((x) => ({ topic: x.topic, q: x.q, a: x.a, c: x.c })) });
              localStorage.removeItem("aha_questions_v1");
              if (r.created) j = await api("/api/questions");
            } else localStorage.removeItem("aha_questions_v1");
          }
        } catch (e) { /* PLUS биш бол шилжүүлэхгүй, дараа дахин оролдоно */ }
        return j;
      } catch (e) { return null; }
    },
    add: async (data) => {
      await topicQueue;
      try { const r = await post("/api/questions", data); return { question: r.question }; }
      catch (e) { return { error: e.message }; }
    },
    remove: async (id) => {
      try { await api("/api/questions/" + encodeURIComponent(id), { method: "DELETE" }); return {}; }
      catch (e) { return { error: e.message }; }
    },
    addTopic: (t) => { topicQueue = topicQueue.then(() => post("/api/topics", t)).catch(() => {}); },
  };

  // Нэвтрээгүй бол аппыг ашиглуулахгүй: эхлээд заавал нэвтрэх/бүртгүүлэх
  (async function gate() {
    let me = null;
    try { me = await api("/api/me"); } catch (e) { return; }
    if (me && !me.user) {
      await showAuth({ required: true });
      location.reload();
      return;
    }
    if (me && me.isAdmin) {
      const a = el("a", { href: "/admin", text: "⚙ Админ", style: { position: "fixed", right: "12px", bottom: "92px", zIndex: 20, background: "#7C3AED", color: "#fff", padding: "9px 14px", borderRadius: "20px", fontWeight: 900, fontSize: "13px", textDecoration: "none", fontFamily: "'Nunito',system-ui,sans-serif", boxShadow: "0 6px 16px rgba(0,0,0,.35)" } });
      document.body.append(a);
    }
  })();
})();
