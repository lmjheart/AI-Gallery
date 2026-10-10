const CF = window.GCONF || {}, ON = !!(CF.url && CF.key);
let HEARTS = {}, NOTES = {};
let dev = (() => { try { let d = localStorage.getItem("gdev"); if (!d) { d = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("gdev", d); } return d; } catch (e) { return "anon" + Math.random().toString(36).slice(2); } })();
async function rpc(name, args) {
  const r = await fetch(`${CF.url}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: CF.key, ...(CF.key.startsWith("eyJ") ? { Authorization: `Bearer ${CF.key}` } : {}), "Content-Type": "application/json" }, body: JSON.stringify(args || {}) });
  if (!r.ok) throw new Error((await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
window.mergeNote = w => { const n = NOTES[w.id] || {}; return { ...w, intent: n.intent || w.intent, prompt: n.prompt || w.prompt, reflection: n.reflection || w.reflection }; };
window.topWorks = () => {
  const t = D.works.filter(w => HEARTS[w.id] > 0).sort((a, b) => HEARTS[b.id] - HEARTS[a.id]).slice(0, 5);
  if (t.length) { window.topTitle = "하트를 많이 받은 작품"; return t; }
  window.topTitle = "대표 작품"; return D.works.filter(w => w.featured).slice(0, 4);
};
const _work = work;
work = function (id) {
  _work(id); const st = document.querySelector(".stage"); if (!ON || !st) return;
  const b = document.createElement("button"); b.className = "btn2 heart";
  const paint = () => { b.textContent = `❤️ ${HEARTS[id] || 0}`; }; paint();
  b.onclick = async () => {
    if (b.disabled) return; b.disabled = true; b.classList.add("pop");
    try { HEARTS[id] = await rpc("clap", { w: id, d: dev }); paint(); }
    catch (e) { if (!String(e.message).includes("slow")) b.textContent = "잠시 후 다시 눌러 주세요"; }
    setTimeout(() => { b.disabled = false; b.classList.remove("pop"); paint(); }, 3000);
  };
  st.after(b);
};
const _student = student;
student = function (id) {
  _student(id); if (!ON || !document.querySelector(".profile")) return;
  const sec = document.createElement("section"); sec.className = "info gb";
  sec.innerHTML = `<h3>다녀갔어요!</h3><p class="note">이름·전화번호 같은 개인정보는 쓰지 말아 주세요.</p>
    <input id="gn" maxlength="20" placeholder="별명"><textarea id="gm" maxlength="200" placeholder="작가에게 한마디 (200자까지)"></textarea>
    <button class="btn2" id="gs">흔적 남기기</button><p id="gmsg" class="note"></p><div id="gl"></div>`;
  app.appendChild(sec);
  const gn = sec.querySelector("#gn"), gm = sec.querySelector("#gm"), msg = sec.querySelector("#gmsg"), gl = sec.querySelector("#gl");
  const load = async () => {
    try { const L = await rpc("get_guestbook", { s: id });
      gl.innerHTML = L.length ? L.map(m => `<div class="bubble"><b>${esc(m.nick)}</b><p>${esc(m.msg)}</p><small>${new Date(m.at).toLocaleString("ko-KR")}</small></div>`).join("") : "<p class='empty'>첫 번째 방문 흔적을 남겨 주세요!</p>";
    } catch (e) { gl.textContent = "방명록을 불러오지 못했어요."; }
  };
  sec.querySelector("#gs").onclick = async () => {
    const n = gn.value.trim(), m = gm.value.trim();
    if (!n || !m) { msg.textContent = "별명과 메시지를 모두 적어 주세요."; return; }
    try { await rpc("add_guestbook", { s: id, n, m, d: dev }); gn.value = gm.value = ""; msg.textContent = ""; load(); }
    catch (e) { msg.textContent = String(e.message).includes("slow") ? "잠시 후에 다시 남겨 주세요." : "등록하지 못했어요. 다시 시도해 주세요."; }
  };
  load();
};
window.writePage = function () {
  if (!ON) { app.innerHTML = '<p class="empty">아직 준비 중이에요.</p>'; return; }
  app.innerHTML = `<h2>내 작품 글쓰기</h2><p>선생님께 받은 작가 코드로 내 작품의 제작 의도, 프롬프트, 소감을 쓸 수 있어요.</p>
    <div class="info"><select id="ws">${D.students.map(s => `<option value="${esc(s.id)}">${esc(s.artistName)}</option>`).join("")}</select>
    <input id="wc" type="password" placeholder="작가 코드"><button class="btn2" id="wok">확인</button><p id="wmsg" class="note"></p></div><div id="wform"></div>`;
  const msg = document.getElementById("wmsg"), form = document.getElementById("wform");
  document.getElementById("wok").onclick = async () => {
    const sid = document.getElementById("ws").value, code = document.getElementById("wc").value.trim();
    try { if (!(await rpc("check_code", { s: sid, c: code }))) throw 0; } catch (e) { msg.textContent = "코드가 맞지 않아요."; return; }
    msg.textContent = ""; const ws = worksOf(sid);
    if (!ws.length) { form.innerHTML = '<p class="empty">아직 등록된 작품이 없어요. 선생님께 문의하세요.</p>'; return; }
    form.innerHTML = `<div class="info"><select id="fw">${ws.map(w => `<option value="${esc(w.id)}">${esc(w.title)}</option>`).join("")}</select>
      <p class="note">이름·전화번호·계정 같은 개인정보는 쓰지 말아 주세요.</p>
      <label>만든 의도</label><textarea id="fi" maxlength="500"></textarea><label>사용한 프롬프트</label><textarea id="fp" maxlength="3000" rows="6"></textarea>
      <label>소감</label><textarea id="fr" maxlength="500"></textarea><button class="btn2" id="fs">저장</button><p id="fmsg" class="note"></p></div>`;
    const fill = () => { const n = NOTES[document.getElementById("fw").value] || {}; fi.value = n.intent || ""; fp.value = n.prompt || ""; fr.value = n.reflection || ""; };
    const fi = form.querySelector("#fi"), fp = form.querySelector("#fp"), fr = form.querySelector("#fr"), fm = form.querySelector("#fmsg");
    form.querySelector("#fw").onchange = fill; fill();
    form.querySelector("#fs").onclick = async () => {
      const w = form.querySelector("#fw").value;
      try { await rpc("save_note", { s: sid, c: code, w, i: fi.value, p: fp.value, r: fr.value }); NOTES[w] = { intent: fi.value, prompt: fp.value, reflection: fr.value }; fm.textContent = "저장했어요!"; }
      catch (e) { fm.textContent = "저장하지 못했어요. 다시 시도해 주세요."; }
    };
  };
};
(async () => {
  if (ON) {
    document.querySelector(".top nav").insertAdjacentHTML("beforeend", '<a href="#/write">내 작품 글쓰기</a>');
    const refresh = async () => { try { const p = await rpc("get_public"); HEARTS = p.hearts || {}; NOTES = p.notes || {}; return true; } catch (e) { return false; } };
    await refresh();
    // 첫 화면으로 돌아올 때 다른 노트북의 하트까지 반영
    addEventListener("hashchange", async () => { if ((location.hash === "" || location.hash === "#/") && await refresh()) route(); });
  }
  route();
})();
