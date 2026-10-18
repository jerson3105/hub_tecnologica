// Aplica el tema guardado antes del primer pintado (sin parpadeo blanco en modo oscuro).
// Misma lógica que src/tema.js; mantener RUTAS_SOLO_CLARO sincronizada con esa lista.
(function () {
  var RUTAS_SOLO_CLARO = ['/login', '/perfil'];
  try {
    var tema = localStorage.getItem('tema') || 'sistema';
    var oscuro = tema === 'oscuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var ruta = window.location.pathname;
    var soloClaro = RUTAS_SOLO_CLARO.some(function (r) { return ruta === r || ruta.indexOf(r + '/') === 0; });
    document.documentElement.setAttribute('data-theme', oscuro && !soloClaro ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
