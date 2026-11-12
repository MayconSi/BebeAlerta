
var CONFIG = {
 
  whatsappNumber: "71999964523",

  defaultMessage: "Olá! Quero começar a usar o BebêAlerta.",

  professional: {
    name: "Julia Maria Oliveira Da Silva",   // ex.: "Maria Souza"
    role: "Técnica De Enfermagem, COREN-BA nº 002389551",   // ex.: "Enfermeira, COREN-BA nº 000000"
    unit: ""    // ex.: "UBS Centro"
  }
};

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 60) : ms); }); };

  /* ---------- WhatsApp ---------- */
  function cleanNumber(raw) {
    var n = String(raw || "").replace(/\D/g, "");
    if (n && n.length <= 11) n = "55" + n; // sem DDI: assume Brasil
    return n;
  }
  var number = cleanNumber(CONFIG.whatsappNumber);
  var waUrl = number ? "https://wa.me/" + number + "?text=" + encodeURIComponent(CONFIG.defaultMessage) : "";

  $$("[data-wa]").forEach(function (a) {
    if (waUrl) {
      a.href = waUrl;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#contato";
      a.removeAttribute("target");
    }
  });
  $("#previewMsg").textContent = CONFIG.defaultMessage;

  (function setupCta() {
    var qr = $("#qr");
    if (!waUrl) {
      $("#setupNote").hidden = false;
      qr.textContent = "O QR Code aparece aqui quando o número for configurado.";
      if (window.console) console.warn("BebêAlerta: defina CONFIG.whatsappNumber no começo do script.js.");
      return;
    }
    var el = $("#waNumber");
    if (number.length >= 12) {
      el.textContent = "+" + number.slice(0, 2) + " (" + number.slice(2, 4) + ") " +
        number.slice(4, number.length - 4) + "-" + number.slice(-4);
      el.hidden = false;
    }
    function draw() {
      try {
        var q = window.qrcode(0, "M");
        q.addData(waUrl);
        q.make();
        qr.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } catch (e) {
        qr.textContent = "Use o botão ao lado para abrir a conversa.";
      }
    }
    if (window.qrcode) draw(); else window.addEventListener("load", function () {
      if (window.qrcode) draw(); else qr.textContent = "Use o botão ao lado para abrir a conversa.";
    });
  })();

  /* ---------- quem conferiu ---------- */
  (function () {
    var p = CONFIG.professional;
    if (!p || !p.name) return;
    var parts = [p.name];
    if (p.role) parts.push(p.role);
    var txt = "Conteúdo conferido por " + parts.join(", ");
    if (p.unit) txt += ", da " + p.unit;
    $("#validadorTxt").textContent = txt + ".";
  })();

  $("#year").textContent = new Date().getFullYear();

  /* ---------- menu ---------- */
  var nav = $("#nav"), burger = $("#burger");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  $$("#menu a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  var bar = $("#progress"), ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      nav.classList.toggle("scrolled", y > 8);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // destaca o item do menu da seção visível
  if ("IntersectionObserver" in window) {
    var links = {};
    $$("[data-spy]").forEach(function (a) { links[a.getAttribute("data-spy")] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          if (links[en.target.id]) links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });

    // revelar ao rolar
    var rv = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rv.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$("[data-reveal]").forEach(function (el) { rv.observe(el); });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- bolhas seguem o mouse ---------- */
  var hero = $("#inicio");
  if (hero && !reduce && window.matchMedia("(hover:hover)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      $$(".bubble", hero).forEach(function (b, i) {
        var k = (i + 1) * 9;
        b.style.setProperty("--mx", (x * k).toFixed(1) + "px");
        b.style.setProperty("--my", (y * k).toFixed(1) + "px");
      });
    });
  }

  /* ---------- contadores ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce || target === 0 || !("IntersectionObserver" in window)) { el.textContent = target; return; }
    el.textContent = "0";
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now(), dur = 1100;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
    io.observe(el);
  });

  /* ---------- chat (usado no hero e na seção "Pergunte") ---------- */
  function makeChat(box) {
    function add(type, html) {
      var d = document.createElement("div");
      d.className = "m " + type;
      d.innerHTML = html;
      box.appendChild(d);
      box.scrollTop = box.scrollHeight;
      return d;
    }
    function typing() {
      var d = document.createElement("div");
      d.className = "m bot typing";
      d.innerHTML = "<i></i><i></i><i></i>";
      box.appendChild(d);
      box.scrollTop = box.scrollHeight;
      return d;
    }
    return {
      me: function (t) { return add("me", t); },
      bot: async function (html, wait) {
        var t = typing();
        await sleep(wait || 900);
        t.remove();
        return add("bot", html);
      },
      clear: function () { box.innerHTML = ""; }
    };
  }

  /* hero: conversa de apresentação */
  var heroChat = makeChat($("#heroChat"));
  var heroRun = 0;
  async function playHero() {
    var id = ++heroRun;
    heroChat.clear();
    var alive = function () { return id === heroRun; };
    await sleep(500); if (!alive()) return;
    heroChat.me("Oi"); await sleep(500); if (!alive()) return;
    await heroChat.bot("Olá! Eu sou o <b>BebêAlerta</b>, sua agenda de pré-natal. Para guardar seus dados e enviar lembretes, preciso do seu consentimento.<br><br>Digite <b>1</b> para continuar ou <b>2</b> para não continuar.", 1100); if (!alive()) return;
    await sleep(700); if (!alive()) return;
    heroChat.me("1"); await sleep(400); if (!alive()) return;
    await heroChat.bot("Qual é a data provável do seu parto?", 800); if (!alive()) return;
    await sleep(800); if (!alive()) return;
    heroChat.me("15/03"); await sleep(400); if (!alive()) return;
    await heroChat.bot("Pronto, cadastro feito! Vou avisar você das consultas, dos exames e das vacinas.", 900); if (!alive()) return;
    await sleep(1100); if (!alive()) return;
    await heroChat.bot("<b>Lembrete:</b> você chegou à 20ª semana. A vacina dTpa já pode ser tomada. Procure sua unidade de saúde.", 1000);
  }
  $("#heroReplay").addEventListener("click", playHero);
  playHero();

  /* ---------- dados do calendário (Ministério da Saúde / PNI 2026) ---------- */
  var VAC = [
    { id: "hb", nome: "Hepatite B", icone: "i-shield", prot: "Hepatite B e suas complicações", quando: "Desde a 1ª consulta",
      verso: "<strong>3 doses</strong> para quem não tem esquema completo. Atualize a situação vacinal desde a 1ª consulta de pré-natal.<br>Intervalo recomendado: 1 mês entre a 1ª e a 2ª dose e 6 meses entre a 1ª e a 3ª." },
    { id: "dtpa", nome: "dTpa", icone: "i-syringe", prot: "Difteria, tétano e coqueluche", quando: "A partir da 20ª semana",
      verso: "<strong>1 dose a partir da 20ª semana</strong>, a cada gestação. Respeite 60 dias da última dose com componentes de tétano e difteria (mínimo de 30). Se o esquema básico estiver incompleto, a equipe pode usar também a dT." },
    { id: "vsr", nome: "VSR", icone: "i-heart", prot: "Vírus sincicial respiratório do bebê", quando: "A partir da 28ª semana",
      verso: "<strong>1 dose a partir da 28ª semana</strong>, a cada gestação. Protege o bebê de infecções respiratórias graves por VSR até os 6 meses de idade." },
    { id: "inf", nome: "Influenza", icone: "i-bell", prot: "Gripe e suas complicações", quando: "Qualquer fase",
      verso: "<strong>1 dose da vacina da temporada</strong>, em qualquer fase da gestação. Gestantes e puérperas são grupo prioritário." },
    { id: "cov", nome: "Covid-19", icone: "i-shield", prot: "Formas graves e óbitos por covid-19", quando: "Qualquer fase",
      verso: "<strong>1 dose a cada gestação</strong>, em qualquer fase. Se já recebeu doses antes, o intervalo é de 6 meses da última dose." },
    { id: "fa", nome: "Febre amarela", icone: "i-calendar", prot: "Febre amarela", quando: "Só em exceção",
      verso: "Somente quando <strong>não dá para adiar</strong>: gestante moradora ou viajante de área de risco, depois de avaliação do serviço de saúde sobre risco e benefício." }
  ];

  /* cartões que viram */
  var flips = $("#flips");
  VAC.forEach(function (v) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "flip";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("data-reveal", "");
    b.style.setProperty("--d", (VAC.indexOf(v) % 3) * 90 + "ms");
    b.innerHTML =
      '<span class="flip-in">' +
        '<span class="face front">' +
          '<span class="f-ic"><svg class="ic"><use href="#' + v.icone + '"/></svg></span>' +
          '<b>' + v.nome + '</b>' +
          '<em>' + v.prot + '</em>' +
          '<span class="f-when">' + v.quando + '</span>' +
          '<span class="f-hint">Toque para virar</span>' +
        '</span>' +
        '<span class="face back">' +
          '<b>' + v.nome + '</b>' +
          '<span class="t">' + v.verso + '</span>' +
        '</span>' +
      '</span>';
    b.addEventListener("click", function () {
      var on = b.classList.toggle("on");
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    flips.appendChild(b);
  });
  // os cartões criados depois precisam ser observados também
  if ("IntersectionObserver" in window) {
    var rv2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rv2.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".flip", flips).forEach(function (el) { rv2.observe(el); });
  } else {
    $$(".flip", flips).forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- pergunte ao BebêAlerta ---------- */
  var SRC = "<small>Fonte: Calendário Nacional de Vacinação 2026, gestante (Ministério da Saúde/PNI)</small>";
  var QA = [
    { q: "Gestante pode tomar a vacina da gripe?",
      a: "Pode, sim. A vacina influenza da temporada é recomendada em <b>qualquer fase da gestação</b>. Gestantes e puérperas fazem parte do grupo prioritário." },
    { q: "Quando tomar a dTpa?",
      a: "A dTpa é <b>1 dose a partir da 20ª semana</b> de gestação, e deve ser repetida a cada gestação. Respeite o intervalo de 60 dias da última dose com tétano e difteria." },
    { q: "E a vacina do VSR?",
      a: "A vacina contra o vírus sincicial respiratório é <b>1 dose a partir da 28ª semana</b>, a cada gestação. Ela protege o bebê de infecções respiratórias graves até os 6 meses de idade." },
    { q: "Preciso da vacina de hepatite B?",
      a: "Se você não tem o esquema completo, <b>atualize desde a 1ª consulta de pré-natal</b>. São 3 doses: 1 mês entre a 1ª e a 2ª e 6 meses entre a 1ª e a 3ª." },
    { q: "Covid-19 na gravidez?",
      a: "A vacina covid-19 é <b>1 dose a cada gestação</b>, em qualquer fase. Se já tomou doses antes, o intervalo é de 6 meses da última dose." }
  ];
  var askChat = makeChat($("#askChat"));
  var chipsBox = $("#askChips"), chips = [];
  QA.forEach(function (item, i) {
    var c = document.createElement("button");
    c.type = "button";
    c.className = "chip";
    c.textContent = item.q;
    c.addEventListener("click", async function () {
      chips.forEach(function (x) { x.disabled = true; x.classList.remove("picked"); });
      c.classList.add("picked");
      askChat.me(item.q);
      await askChat.bot(item.a + SRC, 1100);
      await sleep(300);
      askChat.bot("Se tiver qualquer dúvida sobre a sua saúde, procure a sua unidade de saúde.", 700).then(function () {
        chips.forEach(function (x) { x.disabled = false; });
      });
    });
    chips.push(c);
    chipsBox.appendChild(c);
  });
  askChat.bot("Oi! Escolha uma pergunta ao lado e veja como eu respondo.", 500);

  /* ---------- simulador: sua semana ---------- */
  var range = $("#weekRange"), out = $("#weekOut"), numEl = $("#weekNum"), ring = $("#ringFg");
  var grid = $("#weekGrid"), dppInput = $("#dpp"), dppMsg = $("#dppMsg");
  var CIRC = 2 * Math.PI * 60; // raio do anel
  var shown = 20, countRaf = 0;

  function plural(n, s, p) { return n + " " + (n === 1 ? s : p); }

  function card(icon, title, tagClass, tagText, strong, text) {
    return '<div class="wcard"><h4><svg class="ic"><use href="#' + icon + '"/></svg>' + title + '</h4>' +
      '<span class="tag ' + tagClass + '">' + tagText + '</span>' +
      '<strong>' + strong + '</strong><p>' + text + '</p></div>';
  }

  function render(w) {
    out.textContent = w;
    ring.style.strokeDashoffset = CIRC * (1 - w / 40);

    // número animado
    cancelAnimationFrame(countRaf);
    var from = shown, to = w, t0 = performance.now();
    if (reduce || from === to) { numEl.textContent = to; }
    else (function step(t) {
      var p = Math.min(1, (t - t0) / 450);
      numEl.textContent = Math.round(from + (to - from) * p);
      if (p < 1) countRaf = requestAnimationFrame(step);
    })(t0);
    shown = w;

    var html = "";

    // início do pré-natal
    if (w <= 12) {
      html += card("i-heart", "Início do pré-natal", "now", "Agora", "Janela ideal para começar",
        "O Ministério da Saúde recomenda começar o pré-natal preferencialmente até a 12ª semana.");
    } else {
      html += card("i-heart", "Início do pré-natal", "any", "Importante", "Ainda não começou?",
        "O ideal é começar até a 12ª semana. Se ainda não começou, procure a sua unidade de saúde o quanto antes.");
    }

    // consultas
    if (w < 28) {
      html += card("i-calendar", "Consultas de pré-natal", "now", "Agora", "1 consulta por mês",
        "Daqui a " + plural(28 - w, "semana", "semanas") + " as consultas passam a ser a cada 15 dias.");
    } else if (w < 37) {
      html += card("i-calendar", "Consultas de pré-natal", "now", "Agora", "1 consulta a cada 15 dias",
        "Daqui a " + plural(37 - w, "semana", "semanas") + " as consultas passam a ser semanais, no termo da gestação.");
    } else {
      html += card("i-calendar", "Consultas de pré-natal", "now", "Agora", "1 consulta por semana",
        "Na reta final, o acompanhamento é semanal até o parto.");
    }

    // dTpa
    if (w >= 20) {
      html += card("i-syringe", "Vacina dTpa", "now", "Já pode tomar", "1 dose agora",
        "Disponível a partir da 20ª semana. Respeite 60 dias da última dose de vacina com tétano e difteria.");
    } else {
      html += card("i-syringe", "Vacina dTpa", "soon", "Em breve", "Faltam " + plural(20 - w, "semana", "semanas"),
        "A dose entra a partir da 20ª semana de gestação.");
    }

    // VSR
    if (w >= 28) {
      html += card("i-heart", "Vacina VSR", "now", "Já pode tomar", "1 dose agora",
        "Disponível a partir da 28ª semana. Protege o bebê nos primeiros meses de vida.");
    } else {
      html += card("i-heart", "Vacina VSR", "soon", "Em breve", "Faltam " + plural(28 - w, "semana", "semanas"),
        "A dose entra a partir da 28ª semana de gestação.");
    }

    // outras
    html += card("i-shield", "Hepatite B, gripe e covid-19", "any", "Qualquer fase", "Confira com a equipe",
      "Hepatite B: atualize desde a 1ª consulta. Gripe: vacina da temporada. Covid-19: 1 dose a cada gestação.");

    grid.innerHTML = html;
  }

  range.addEventListener("input", function () {
    dppMsg.textContent = ""; dppMsg.classList.remove("err");
    render(parseInt(range.value, 10));
  });

  function fromDpp() {
    var v = dppInput.value;
    dppMsg.classList.remove("err");
    if (!v) { dppMsg.textContent = "Escolha a data provável do parto."; dppMsg.classList.add("err"); return; }
    var p = v.split("-").map(Number);
    var dpp = new Date(p[0], p[1] - 1, p[2], 12);
    var today = new Date(); today.setHours(12, 0, 0, 0);
    var daysLeft = Math.round((dpp - today) / 86400000);
    var w = Math.floor((280 - daysLeft) / 7);
    if (isNaN(w) || w < 1 || w > 40) {
      dppMsg.textContent = "Essa data parece estar fora de uma gestação de 40 semanas. Confira a data e tente de novo.";
      dppMsg.classList.add("err");
      return;
    }
    range.value = w;
    render(w);
    dppMsg.textContent = daysLeft > 0
      ? "Faltam " + plural(daysLeft, "dia", "dias") + " para a data provável do parto."
      : "A data provável do parto é hoje.";
  }
  $("#dppBtn").addEventListener("click", fromDpp);
  dppInput.addEventListener("keydown", function (e) { if (e.key === "Enter") fromDpp(); });

  shown = 20;
  render(20);
})();
