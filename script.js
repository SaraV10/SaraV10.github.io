// Ključ storitve Web3Forms. Dokler je prazen, se namesto obrazca pokažeta telefon in e-pošta.
var WEB3FORMS_KLJUC = '';

// Mobilni meni
(function () {
  var gumb = document.querySelector('.meni-gumb');
  var meni = document.getElementById('meni');
  if (!gumb || !meni) return;
  function zapri() {
    meni.classList.remove('odprt');
    gumb.setAttribute('aria-expanded', 'false');
  }
  gumb.addEventListener('click', function () {
    var odprt = meni.classList.toggle('odprt');
    gumb.setAttribute('aria-expanded', odprt ? 'true' : 'false');
  });
  meni.addEventListener('click', function (e) { if (e.target.closest('a')) zapri(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && meni.classList.contains('odprt')) { zapri(); gumb.focus(); }
  });
})();

// Pojavljanje vsebine ob pomikanju in črta pod glavo
(function () {
  var elementi = document.querySelectorAll('.pojav');
  if (!('IntersectionObserver' in window)) {
    elementi.forEach(function (el) { el.classList.add('viden'); });
  } else {
    var opazovalec = new IntersectionObserver(function (vnosi) {
      vnosi.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add('viden'); opazovalec.unobserve(v.target); }
      });
    }, { threshold: 0.05 });
    elementi.forEach(function (el) { opazovalec.observe(el); });
  }
  var glava = document.querySelector('.glava');
  function crta() { glava.classList.toggle('drsi', window.scrollY > 10); }
  window.addEventListener('scroll', crta, { passive: true });
  crta();
})();

// Leto v nogi
(function () {
  var el = document.getElementById('leto');
  if (el) el.textContent = new Date().getFullYear();
})();

// Obrazec za povpraševanje
(function () {
  var obrazec = document.getElementById('obrazec');
  var nadomestek = document.getElementById('obrazec-ni-aktiven');
  if (!obrazec || !nadomestek || !WEB3FORMS_KLJUC) return;
  obrazec.hidden = false;
  nadomestek.hidden = true;

  var izpis = obrazec.querySelector('.obrazec__sporocilo');
  var gumb = obrazec.querySelector('button[type="submit"]');
  function pokazi(besedilo, razred) {
    izpis.className = 'obrazec__sporocilo ' + razred;
    izpis.textContent = besedilo;
  }
  function vrednost(ime) { return obrazec.elements[ime].value.trim(); }

  obrazec.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = vrednost('email');
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var telefon = vrednost('telefon');
    var napacna = {
      ime: !vrednost('ime'),
      telefon: !telefon && !email,
      email: email !== '' && !emailOk,
      sporocilo: !vrednost('sporocilo')
    };
    var prvo = null;
    Object.keys(napacna).forEach(function (ime) {
      var polje = obrazec.elements[ime];
      polje.setAttribute('aria-invalid', napacna[ime] ? 'true' : 'false');
      if (napacna[ime] && !prvo) prvo = polje;
    });
    if (prvo) {
      pokazi('Prosimo, vpišite ime, sporočilo ter telefon ali veljavno e-pošto.', 'napaka');
      prvo.focus();
      return;
    }
    var podatki = {
      access_key: WEB3FORMS_KLJUC,
      subject: 'Povpraševanje s spletne strani: ' + vrednost('ime'),
      from_name: 'Spletna stran gozdarstvo-bober.si',
      'Ime in priimek': vrednost('ime'),
      'Telefon': telefon || '/',
      'E-pošta': email || '/',
      'Lokacija': vrednost('lokacija') || '/',
      'Sporočilo': vrednost('sporocilo'),
      botcheck: obrazec.elements.botcheck.checked
    };
    if (email) podatki.replyto = email;

    gumb.disabled = true;
    pokazi('Pošiljam …', '');
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(podatki)
    }).then(function (odgovor) {
      return odgovor.json().then(function (j) { if (!odgovor.ok || !j.success) throw new Error(); });
    }).then(function () {
      obrazec.reset();
      pokazi('Hvala, sporočilo je poslano. Javimo se vam.', 'uspeh');
    }).catch(function () {
      pokazi('Sporočila ni bilo mogoče poslati. Pokličite nas na 041 685 867.', 'napaka');
    }).then(function () { gumb.disabled = false; });
  });
})();
