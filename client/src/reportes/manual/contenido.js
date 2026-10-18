// Contenido del manual de uso del equipo técnico (lo maqueta reportes/pdf/ManualPdf.jsx).
// Los nombres de la interfaz van entre «comillas latinas» y salen en seminegrita. Cada capítulo es
// una lista de bloques: { sub } subtítulo · { p } párrafo · { pasos: [] } pasos numerados ·
// { lista: [] } viñetas · { img, pie, ancho? } captura de public/manual/ · { consejo } ·
// { aviso } · { emprendedor } · { tabla: { columnas, filas } }.
// Al cambiar una pantalla: actualizar aquí el texto y, si cambia mucho, su captura.

export const MANUAL = {
  titulo: 'Manual del equipo técnico',
  subtitulo: 'Cómo usar el sistema de seguimiento de HUB TecnológICA, paso a paso.',
  version: '1.0',
  fecha: 'octubre de 2026',
  url: 'hubtecnologica.com',
  presentacion: 'Esta guía explica cómo el equipo técnico del HUB usa la plataforma en su trabajo diario: organizar programas y sesiones, registrar cada reunión, acompañar los compromisos y objetivos de los emprendimientos y preparar los informes para aliados. Al final, un anexo muestra lo que ve cada emprendedor, para que puedas orientarle cuando te pregunte.',
  convenciones: 'Cómo leer esta guía: los nombres de botones, pestañas y campos aparecen en «seminegrita y entre comillas», tal como se ven en pantalla. Las capturas usan datos ficticios del entorno de pruebas.',
  capitulos: [
    {
      id: 'acceso',
      titulo: 'Primeros pasos',
      resumen: 'Entrar, cambiar tu contraseña y elegir el tema claro u oscuro.',
      intro: 'La plataforma funciona en el navegador, en computadora, tableta o celular. No hay que instalar nada.',
      bloques: [
        { sub: 'Iniciar sesión' },
        { pasos: [
          'Abre hubtecnologica.com. Verás la pantalla «Inicia sesión».',
          'Escribe tu «Correo electrónico» y tu «Contraseña». Con el ícono del ojo puedes ver lo que escribes.',
          'Pulsa «Ingresar». El equipo técnico entra a su «Inicio»; cada emprendedor, a «Mi emprendimiento».'
        ] },
        { img: 'login.jpg', pie: 'Pantalla de inicio de sesión.' },
        { lista: [
          'Si aparece «Bloq Mayús está activado.», desactiva las mayúsculas antes de escribir la contraseña.',
          'Si los datos no son correctos, el aviso aparece encima del formulario.',
          'Por seguridad, cuando la sesión caduca aparece «Tu sesión expiró. Vuelve a iniciar sesión.».'
        ] },
        { consejo: 'No hay recuperación de contraseña por correo. Si alguien la olvida, el equipo técnico le genera una «contraseña temporal» desde «Usuarios» o desde la pestaña «Equipo» de su emprendimiento (ver capítulos 6 y 13).' },
        { sub: 'Tu perfil y tu contraseña' },
        { pasos: [
          'Abre el menú de usuario (tus iniciales, arriba a la derecha) y elige «Mi perfil».',
          'En «Cambiar Contraseña», escribe la «Contraseña Actual», la «Nueva Contraseña» (mínimo 6 caracteres) y confírmala.',
          'Pulsa «Cambiar Contraseña». Verás el aviso «Contraseña actualizada».'
        ] },
        { p: 'Tus datos personales (nombre, teléfono, cargo) los edita un miembro del equipo técnico desde «Usuarios».' },
        { sub: 'Tema claro u oscuro' },
        { p: 'En el menú de usuario, el selector «Tema» ofrece «Sistema» (sigue la configuración de tu equipo), «Claro» u «Oscuro». También puedes cambiarlo con el botón del sol o la luna de la barra superior. La elección se recuerda en cada navegador.' }
      ]
    },
    {
      id: 'navegacion',
      titulo: 'Moverse por la plataforma',
      resumen: 'Menú lateral, buscador rápido (Ctrl K), avisos y uso en el celular.',
      intro: 'Todas las pantallas comparten el mismo marco: menú a la izquierda, barra superior con el buscador, la campana de avisos y tu menú de usuario.',
      bloques: [
        { img: 'inicio.jpg', pie: 'Marco de la aplicación: menú lateral, barra superior y contenido (aquí, el Inicio).' },
        { sub: 'El menú lateral' },
        { tabla: {
          columnas: [{ titulo: 'Opción', ancho: 1.1 }, { titulo: 'Para qué sirve', ancho: 3 }],
          filas: [
            ['Inicio', 'Lo que requiere tu atención, la semana y la cartera de emprendimientos.'],
            ['Sesiones', 'Programar sesiones, tomar asistencia y ver evaluaciones.'],
            ['Seguimiento', 'Preparar cada reunión: compromisos, historial y objetivos.'],
            ['Emprendimientos', 'Listado de la cartera y la ficha de cada emprendimiento.'],
            ['Programas', 'Programas de incubación y aceleración con sus fechas.'],
            ['Mentores', 'La red de mentores que ven los emprendedores.'],
            ['Reportes', 'Indicadores de impacto e informes en PDF.'],
            ['Usuarios (Gestión)', 'Cuentas del equipo técnico y de los emprendedores.'],
            ['Materiales (Gestión)', 'Presentaciones, grabaciones y plantillas compartidas.']
          ]
        } },
        { p: 'En escritorio puedes plegar el menú con «Plegar menú» para ganar espacio; queda solo con íconos y el nombre aparece al pasar el ratón. Los números junto a una opción indican asuntos pendientes.' },
        { sub: 'Buscar o ir a… (Ctrl K)' },
        { p: 'Pulsa «Ctrl K» (en Mac, «⌘ K») desde cualquier pantalla, o el botón «Buscar o ir a…». Escribe parte de un nombre y elige con las flechas y «Enter».' },
        { lista: [
          'Encuentra páginas, emprendimientos, programas, sesiones, personas y mentores.',
          'Sin escribir nada ofrece atajos: «Nueva sesión» y «Registrar seguimiento».',
          'También cambia el tema: escribe «tema».'
        ] },
        { img: 'paleta.png', pie: 'Buscador rápido: escribe y pulsa Enter para ir.', ancho: 'medio' },
        { sub: 'La campana de avisos' },
        { p: 'La campana muestra lo que «Requiere tu atención» (los mismos asuntos que la bandeja del Inicio, explicada en el capítulo 4). Se actualiza sola cada 5 minutos.' },
        { sub: 'En el celular' },
        { p: 'En pantallas pequeñas el menú pasa a una barra inferior con «Inicio», «Sesiones», «Emprend.» y «Reportes». El resto de páginas, el tema, «Mi perfil» y «Cerrar sesión» están en «Más».' },
        { img: 'movil.jpg', pie: 'El Inicio en un celular, con la barra inferior.', ancho: 'tercio' },
        { consejo: 'Las pestañas, búsquedas y filtros quedan en la dirección de la página. Puedes guardar el enlace o enviarlo a un colega y abrirá la misma vista.' }
      ]
    },
    {
      id: 'rutina',
      titulo: 'Tu semana en el HUB',
      resumen: 'La rutina recomendada: qué revisar y en qué orden.',
      intro: 'La plataforma está pensada para un ciclo sencillo que se repite en cada sesión del programa.',
      bloques: [
        { pasos: [
          'Al empezar el día, revisa «Requiere tu atención» en el «Inicio»: registros sin completar, asistencias sin tomar, BMC por revisar, evaluaciones negativas y compromisos vencidos.',
          'Antes de cada reunión 1 a 1, abre «Seguimiento» y elige el emprendimiento: repasa sus «Compromisos abiertos», la última reunión y su avance OKR.',
          'Durante o justo después de la ronda, usa «Registrar ronda»: revisa los compromisos anteriores, anota «Lo trabajado», acuerda compromisos nuevos y toma la asistencia.',
          'En los talleres, toma la asistencia en la pestaña «Asistencia» de la sesión y comparte los materiales en «Materiales».',
          'Al día siguiente, mira la pestaña «Evaluación» de la sesión para leer qué opinaron los participantes.',
          'Al cerrar el mes o el programa, descarga desde «Reportes» el informe que necesites.'
        ] },
        { consejo: 'Un compromiso «vence» cuando el emprendimiento ya tuvo otra sesión después de la que se acordó. Por eso conviene revisar los compromisos anteriores en cada ronda: así no se acumulan vencidos.' }
      ]
    },
    {
      id: 'inicio',
      titulo: 'Inicio',
      resumen: 'Lo que requiere atención, la semana y la cartera de un vistazo.',
      intro: 'Es la primera pantalla del equipo técnico. Con el filtro «Programa» puedes ver todo el HUB o un solo programa.',
      bloques: [
        { sub: 'Indicadores' },
        { lista: [
          '«Emprendimientos activos» y las altas del mes.',
          '«Registros pendientes»: sesiones ya realizadas cuyo registro falta completar.',
          '«Compromisos vencidos» y en cuántos emprendimientos.',
          '«Sesiones esta semana»: hoy y los 6 días siguientes.'
        ] },
        { sub: 'Requiere tu atención' },
        { p: 'La bandeja reúne lo que conviene resolver. Cada asunto trae un botón que lleva directamente a donde se resuelve.' },
        { tabla: {
          columnas: [{ titulo: 'Asunto', ancho: 1.6 }, { titulo: 'Cuándo aparece', ancho: 2.6 }, { titulo: 'Botón', ancho: 0.8 }],
          filas: [
            ['Registros sin completar', 'Sesiones de los últimos 30 días (salvo talleres) con emprendimientos sin «lo trabajado».', 'Registrar'],
            ['Asistencia sin tomar', 'Sesiones de los últimos 14 días sin asistencia guardada.', 'Tomar'],
            ['BMC sin feedback', 'La última versión del BMC de un emprendimiento aún no tiene comentarios.', 'Revisar'],
            ['Evaluaciones de detractor', 'Evaluaciones de 6 o menos, con comentario, de los últimos 30 días.', 'Ver'],
            ['Compromisos vencidos', 'Compromisos abiertos que ya pasaron por otra sesión.', 'Ver cartera']
          ]
        } },
        { sub: 'Hoy y próximos 7 días' },
        { p: 'Las sesiones de la semana con su tipo, programas y cuántos registros van. «Ver sesiones» abre la agenda completa. Los botones «Nueva sesión» y, si hay sesión hoy, «Abrir sesión de hoy» están en la cabecera.' },
        { sub: 'La cartera' },
        { p: 'Todos los emprendimientos activos, ordenados para que arriba quede lo que más atención necesita: primero los que tienen más compromisos vencidos, luego los que llevan más días sin reunión y luego los de menor avance OKR.' },
        { tabla: {
          columnas: [{ titulo: 'Columna', ancho: 1.2 }, { titulo: 'Qué indica', ancho: 3 }],
          filas: [
            ['Última reunión', 'Días desde la última sesión con lo trabajado registrado. Punto verde: hasta 10 días; ámbar: de 11 a 21; rojo: más de 21.'],
            ['Compromisos', '«N vencidos · N abiertos».'],
            ['Avance OKR', 'Media del avance de sus actividades, o «Sin OKR».'],
            ['Asistencia', '% de sesiones con asistencia tomada en las que estuvo al menos un integrante.']
          ]
        } },
        { p: 'Haz clic en cualquier fila (o en el nombre) para abrir la ficha del emprendimiento. Con «Ctrl» o el botón central del ratón se abre en otra pestaña.' },
        { sub: 'Pulso de los últimos 30 días' },
        { p: 'Al final del Inicio: el NPS promedio (detractores, pasivos y promotores), la asistencia media de las últimas sesiones y cuántos asistentes evaluaron.' }
      ]
    },
    {
      id: 'programas',
      titulo: 'Programas',
      resumen: 'Crear un programa, seguir su calendario y su cartera.',
      intro: 'Un programa (por ejemplo, «Incubación 2026-I») agrupa emprendimientos y sesiones entre una fecha de inicio y otra de fin.',
      bloques: [
        { img: 'programas.jpg', pie: 'Listado de programas con su avance, próxima sesión y avisos.' },
        { sub: 'Crear un programa' },
        { pasos: [
          'En «Programas», pulsa «Nuevo programa».',
          'Escribe el «Nombre», una «Descripción» opcional, la «Fecha de inicio», la «Fecha de fin» y la «Frecuencia de seguimiento» («Semanal» o «Quincenal»).',
          'Pulsa «Crear programa». Queda en estado «Planificado».'
        ] },
        { p: 'El estado («Planificado», «En curso», «Finalizado») se cambia a mano con «Editar». Si las fechas indican otra cosa, la tarjeta lo sugiere: «Por sus fechas ya está en curso.» con el botón «Marcar en curso».' },
        { aviso: 'Los programas no se borran: se desactivan con el ícono «Desactivar» y se pueden reactivar después. Así no se pierde el historial.' },
        { sub: 'El detalle de un programa' },
        { p: 'Al abrir un programa verás sus indicadores y tres pestañas: «Emprendimientos» (su cartera), «Sesiones» (próximas y realizadas, con los botones «Registrar» y «Tomar asistencia» donde falte) e «Indicadores». Desde la cabecera puedes ir a su «Seguimiento» o crear una «Nueva sesión» con el programa ya elegido.' },
        { img: 'programa-detalle.jpg', pie: 'Detalle de un programa.' }
      ]
    },
    {
      id: 'emprendimientos',
      titulo: 'Emprendimientos y su ficha',
      resumen: 'Dar de alta un emprendimiento, armar su equipo y consultar su ficha.',
      intro: 'Cada emprendimiento pertenece a un programa y tiene un equipo de emprendedores con su propia cuenta.',
      bloques: [
        { img: 'emprendimientos.jpg', pie: 'Listado de emprendimientos con búsqueda y filtros.' },
        { p: 'Busca por «Nombre, sector o líder», filtra por programa y por estado («Activos», «Graduados», «Retirados», «Todos»). La cabecera indica cuántos «requieren atención»: tienen compromisos vencidos o más de 21 días sin reunión.' },
        { sub: 'Crear un emprendimiento' },
        { pasos: [
          'Pulsa «Nuevo emprendimiento».',
          'Completa «Nombre», «Programa», «Sector» y una «Descripción» breve («qué hace y para quién»).',
          'Pulsa «Crear emprendimiento». Se abre su ficha en la pestaña «Equipo», lista para agregar a sus integrantes.'
        ] },
        { sub: 'Agregar integrantes' },
        { pasos: [
          'En la pestaña «Equipo», pulsa «Agregar integrante».',
          'Elige «Usuario existente» (emprendedores registrados que aún no tienen equipo) o «Crear usuario nuevo» y completa sus datos (nombres, apellidos y correo son obligatorios).',
          'Indica su «Rol en el emprendimiento» y marca «Es líder del emprendimiento» si corresponde. El líder puede sumar integrantes por su cuenta.',
          'Pulsa «Agregar integrante». Si se creó una cuenta, verás su «Contraseña temporal»: usa «Copiar» y compártela por un canal seguro. Solo se muestra esa vez.'
        ] },
        { img: 'ficha-equipo.jpg', pie: 'Pestaña «Equipo» de la ficha.' },
        { p: 'En cada integrante, el ícono de la llave genera una «Contraseña temporal nueva» (la anterior deja de funcionar) y el de la papelera lo quita del equipo sin borrar su cuenta.' },
        { sub: 'La ficha del emprendimiento' },
        { p: 'La cabecera muestra el programa, el sector, el líder y la última reunión, con los botones «Editar» y «Preparar seguimiento». Debajo, siete pestañas:' },
        { tabla: {
          columnas: [{ titulo: 'Pestaña', ancho: 1.1 }, { titulo: 'Contenido', ancho: 3 }],
          filas: [
            ['Resumen', 'Avance OKR, asistencia, compromisos cumplidos y abiertos, últimos registros y próxima sesión.'],
            ['Seguimiento', 'Compromisos abiertos (se pueden marcar) y la línea con todas sus sesiones.'],
            ['Objetivos', 'Sus OKR: actualizar el avance, agregar resultados clave, actividades y evidencias.'],
            ['One Pager', 'La presentación del proyecto en una página (la escribe el emprendimiento). Si está completo, «Descargar PDF».'],
            ['BMC', 'Su Business Model Canvas por versiones y el formulario «Feedback para el equipo».'],
            ['Materiales', 'Lo compartido con este emprendimiento. «Agregar enlace» para sumar más.'],
            ['Equipo', 'Integrantes, contraseñas temporales y altas o bajas.']
          ]
        } },
        { img: 'ficha-resumen.jpg', pie: 'Ficha de un emprendimiento, pestaña «Resumen».' },
        { sub: 'Dar feedback a un BMC' },
        { pasos: [
          'Abre la pestaña «BMC» de la ficha. Si hay varias versiones, elige la que quieres revisar.',
          'Escribe en «Feedback para el equipo» qué está bien planteado y qué conviene revisar.',
          'Pulsa «Enviar feedback».'
        ] },
        { emprendedor: 'Una versión con feedback queda «entregada»: el emprendimiento ya no la edita y, para aplicar tus comentarios, crea una versión nueva a partir de ella. Así se conserva lo que revisaste.' },
        { aviso: 'Los emprendimientos no se borran. Para sacarlo de la cartera, usa «Editar» y cambia su «Estado» a «Graduado» o «Retirado». Un emprendimiento retirado deja de aparecer en la cartera y en las sesiones nuevas.' }
      ]
    },
    {
      id: 'sesiones',
      titulo: 'Sesiones',
      resumen: 'Programar sesiones, tomar asistencia, compartir materiales y ver evaluaciones.',
      intro: 'Las sesiones son los encuentros del programa: rondas 1 a 1, talleres y diagnósticos. Al crear una, cada emprendimiento de sus programas queda listo para registrar su seguimiento.',
      bloques: [
        { img: 'sesiones.jpg', pie: 'Agenda de sesiones agrupada: por cerrar, hoy, próximos 7 días, más adelante y realizadas.' },
        { p: 'El grupo «Por cerrar» muestra las sesiones de los últimos 30 días a las que les faltan registros o asistencia. Cada fila indica su estado («Registros X de Y», «Asistencia», «NPS») y ofrece la acción que falta: «Registrar», «Tomar asistencia» o «Unirse».' },
        { sub: 'Programar una sesión' },
        { pasos: [
          'Pulsa «Nueva sesión» (también disponible en el Inicio, en un programa o con Ctrl K).',
          'Marca uno o varios «Programas» y elige el «Tipo»: «1 a 1 Programa», «1 a 1 Taller», «Taller», «Diagnóstica 1», «Diagnóstica 2» o «Diagnóstica Final».',
          'Escribe el «Título» y la «Fecha». Opcionalmente, la «Hora de inicio» y la «Hora de fin».',
          'Elige la «Modalidad». Si es presencial, indica el «Lugar»; si es virtual o híbrida, pega el «Enlace de la reunión» (Meet, Zoom o Teams): los participantes verán el botón «Unirse».',
          'Pulsa «Crear sesión».'
        ] },
        { img: 'sesion-form.png', pie: 'Formulario «Nueva sesión».', ancho: 'medio' },
        { consejo: 'Si eliges una fecha pasada, la sesión queda como realizada y pendiente de registro. Sirve para cargar reuniones que ya ocurrieron.' },
        { sub: 'Dentro de una sesión' },
        { p: 'Al abrir una sesión verás su fecha, horario y programas, y las pestañas «Resumen», «Registro» (excepto en talleres), «Asistencia», «Evaluación» y «Materiales».' },
        { sub: 'Tomar asistencia' },
        { pasos: [
          'Abre la pestaña «Asistencia» (o pulsa «Tomar asistencia» desde la agenda o el Inicio).',
          'Marca «Presente» o «Ausente» en cada persona. «Todos presentes» marca a todos de una vez.',
          'Pulsa «Guardar asistencia» en la barra inferior.'
        ] },
        { img: 'sesion-asistencia.jpg', pie: 'Pestaña «Asistencia» de un taller.' },
        { p: 'La asistencia se puede tomar el mismo día de la sesión o después; no antes. En las rondas 1 a 1 también se toma desde «Registrar ronda».' },
        { sub: 'Evaluación' },
        { p: 'Después de cada sesión, los emprendedores la califican del 1 al 10 y pueden dejar comentarios. La pestaña «Evaluación» muestra el promedio, el reparto entre detractores (6 o menos), pasivos (7 y 8) y promotores (9 y 10), y cada respuesta ordenada de menor a mayor nota.' },
        { img: 'sesion-evaluacion.jpg', pie: 'Pestaña «Evaluación» con las respuestas.' },
        { sub: 'Materiales de la sesión' },
        { p: 'En la pestaña «Materiales», «Agregar enlace» comparte una presentación, grabación o plantilla con toda la sesión o con un emprendimiento concreto.' },
        { aviso: 'Eliminar una sesión borra también sus registros, asistencia y evaluaciones, y no se puede deshacer.' }
      ]
    },
    {
      id: 'ronda',
      titulo: 'Registrar una ronda',
      resumen: 'Anotar lo trabajado, los compromisos y la asistencia de cada emprendimiento.',
      intro: 'El registro de la ronda es la pieza central del seguimiento: lo que se anota aquí alimenta la cartera, los avisos, la ficha y los informes.',
      bloques: [
        { p: 'Ábrelo con «Registrar ronda» dentro de la sesión, o con «Registrar» desde la agenda, el Inicio o Seguimiento. A la izquierda verás la lista de emprendimientos de la ronda y el progreso «X de Y registrados».' },
        { img: 'ronda.jpg', pie: 'Registrar ronda: lista de emprendimientos y formulario.' },
        { sub: 'Paso a paso, por cada emprendimiento' },
        { pasos: [
          '«Compromisos de reuniones anteriores»: marca cómo quedó cada uno: «Cumplido», «En curso» o «No se hizo».',
          '«Lo trabajado»: resume los temas, avances y acuerdos de la reunión. Con este campo completo, el emprendimiento cuenta como registrado. «Observaciones» es opcional.',
          '«Compromisos para la siguiente sesión»: escribe cada compromiso; con «Enter» se añade otro. Se revisarán en la próxima ronda.',
          '«Asistencia del equipo»: marca «Presente» o «Ausente» a cada integrante.',
          '«Grabación» (opcional): pega el enlace si la reunión se grabó.',
          'Pulsa «Guardar y siguiente» para pasar al próximo emprendimiento. Al terminar el último, el botón dice «Terminar».'
        ] },
        { consejo: 'El registro se guarda solo, un segundo después de cada cambio. El estado arriba del formulario lo confirma: «Guardando…» y luego «Guardado a las HH:MM».' },
        { p: 'Si nadie del equipo vino, pulsa «No asistió»: marca a todos ausentes, guarda y pasa al siguiente.' },
        { p: 'En los talleres el registro es opcional: sirve para dejar notas, compromisos o la asistencia de un emprendimiento concreto. En las sesiones «1 a 1 Taller» aparecen además «Comentario del tallerista» y «Comentario del emprendedor».' },
        { emprendedor: 'Lo trabajado y los compromisos se ven en el historial de cada emprendedor. Los compromisos los puede marcar él mismo en «Mi plan» a medida que avanza.' }
      ]
    },
    {
      id: 'seguimiento',
      titulo: 'Seguimiento',
      resumen: 'Preparar cada reunión: compromisos, línea de sesiones y objetivos OKR.',
      intro: '«Seguimiento» reúne en una sola pantalla todo lo que necesitas antes de reunirte con un emprendimiento.',
      bloques: [
        { img: 'seguimiento.jpg', pie: 'Seguimiento: la cartera a la izquierda y el emprendimiento elegido a la derecha.' },
        { p: 'A la izquierda, la cartera activa con sus vencidos, días sin reunión y avance OKR; puedes buscar y filtrar por programa. Al elegir un emprendimiento, a la derecha verás sus indicadores, el botón «Ficha» y, si falta registrar la última reunión, el botón «Registrar» con el nombre de esa sesión.' },
        { tabla: {
          columnas: [{ titulo: 'Pestaña', ancho: 1 }, { titulo: 'Para qué sirve', ancho: 3 }],
          filas: [
            ['Preparar', 'Compromisos abiertos, próxima sesión y lo que se habló en la última reunión.'],
            ['Línea', 'Todas sus sesiones, programadas y realizadas, con lo trabajado y los compromisos de cada una.'],
            ['Objetivos', 'Sus OKR, con el avance de cada resultado clave y actividad.']
          ]
        } },
        { sub: 'Compromisos abiertos' },
        { p: 'Cada compromiso indica de qué sesión viene. El chip «Vencido» señala los que ya pasaron por otra sesión sin cerrarse. Marca «Cumplido», «En curso» o «No se hizo»: se guarda al momento y, mientras no recargues la página, puedes pulsar «Deshacer».' },
        { sub: 'La línea de seguimiento' },
        { p: 'Cada sesión aparece como un punto: lleno si tiene registro, hueco si falta registrarla y discontinuo si aún está programada. Desde cada sesión puedes ir a «Registrar» o «Editar».' },
        { sub: 'Objetivos OKR' },
        { img: 'seguimiento-objetivos.jpg', pie: 'Pestaña «Objetivos»: avance general, resultados clave y actividades.' },
        { lista: [
          'Cada objetivo tiene un área (Ventas, Marketing, Producto / Desarrollo, Financiero, Legal, Talento / RR.HH.) y una fecha límite.',
          'Las actividades con meta numérica se actualizan escribiendo el avance real («de 30», por ejemplo); el resto, con su estado.',
          'Con «Agregar actividad», «Agregar resultado clave» y «Agregar evidencia» completas el plan junto al equipo.'
        ] },
        { p: 'Cómo se calcula el avance: cada actividad con meta cuenta su avance real dividido entre la meta (hasta el 100 %); una sin meta cuenta solo si está «Completado». El avance del objetivo es la media de sus actividades.' },
        { emprendedor: 'Los objetivos los crea el propio emprendimiento desde «Mi plan». El equipo técnico los revisa, ajusta el avance y añade resultados clave o actividades, pero no crea ni borra objetivos.' }
      ]
    },
    {
      id: 'mentores',
      titulo: 'Mentores',
      resumen: 'Mantener la red de mentores que ven los emprendedores.',
      intro: 'La red de mentores es la vitrina donde los emprendedores eligen con quién agendar una mentoría.',
      bloques: [
        { img: 'mentores.jpg', pie: 'La red de mentores con búsqueda por tema, sector u ODS.' },
        { sub: 'Agregar un mentor' },
        { pasos: [
          'Pulsa «Nuevo mentor».',
          'Sube una «Foto» (mejor cuadrada) y completa «Nombre», «Apellido» y «LinkedIn».',
          'Pega su «Enlace de agenda» (Calendly u otro): habilita el botón «Agendar» para los emprendedores.',
          'Escribe una «Biografía» breve y marca sus «Temas que trabaja», «Sectores» y «ODS».',
          'Pulsa «Agregar mentor».'
        ] },
        { p: 'Al hacer clic en una tarjeta se abre la ficha del mentor, con «Editar» y «Desactivar». Un mentor inactivo deja de verse para los emprendedores y se puede reactivar.' },
        { emprendedor: 'Los emprendedores con el One Pager completo pueden usar «Encontrar mi mentor»: responden tres preguntas y la inteligencia artificial les sugiere los tres mentores que mejor encajan. Por eso conviene mantener al día la biografía, los temas y los sectores de cada mentor.' }
      ]
    },
    {
      id: 'materiales',
      titulo: 'Materiales',
      resumen: 'Compartir presentaciones, grabaciones y plantillas.',
      intro: 'En «Materiales» está todo lo compartido con los emprendimientos, agrupado por sesión.',
      bloques: [
        { img: 'materiales.jpg', pie: 'Materiales agrupados por sesión, con filtros por categoría y emprendimiento.' },
        { sub: 'Compartir un enlace' },
        { pasos: [
          'Pulsa «Agregar enlace».',
          'Escribe el «Nombre», pega el «Enlace» (Drive, YouTube, una web…) y, si quieres, una «Descripción».',
          'Elige la «Sesión» a la que pertenece, o «Sin sesión (material del emprendimiento)».',
          'En «Para», marca los emprendimientos que lo verán. En una sesión, sin marcar ninguno lo verá toda la sesión.',
          'Revisa la «Categoría» (Taller, Grabación, Entregable, BMC u Otro) y pulsa «Agregar enlace».'
        ] },
        { consejo: 'Los materiales se comparten como enlaces. Sube el archivo a Drive (con permiso de lectura para quien tenga el enlace) y pega aquí su dirección.' },
        { emprendedor: 'Cada emprendedor ve sus materiales en la pestaña «Materiales» de «Mi emprendimiento» y en la sesión correspondiente.' }
      ]
    },
    {
      id: 'reportes',
      titulo: 'Reportes',
      resumen: 'Indicadores de impacto e informes en PDF para dirección y aliados.',
      intro: '«Reportes» resume el impacto del HUB y genera informes en PDF con el logo y los colores de la marca, listos para enviar o imprimir.',
      bloques: [
        { img: 'reportes.jpg', pie: 'Panorama de impacto con el selector de alcance.' },
        { sub: 'Panorama' },
        { p: 'Con el selector de alcance eliges todos los programas o uno: emprendimientos acompañados, personas en los equipos, mujeres y mujeres líderes, empleos generados y graduados, además de la distribución por género, edad, sector y territorio.' },
        { sub: 'Informes en PDF' },
        { tabla: {
          columnas: [{ titulo: 'Informe', ancho: 1.2 }, { titulo: 'Para quién', ancho: 1.4 }, { titulo: 'Qué incluye', ancho: 2.6 }],
          filas: [
            ['Informe de programa', 'Dirección o el financiador del programa.', 'Avance o cierre: indicadores, puntos de atención, cartera, sesiones y satisfacción.'],
            ['Ficha del emprendimiento', 'El propio equipo, un mentor o un jurado de graduación.', 'One Pager, equipo, OKR, compromisos, últimas sesiones y asistencia.'],
            ['Impacto para aliados', 'Aliados, financiadores y memorias anuales.', 'Emprendimientos, personas por género, edad y territorio, mujeres líderes, empleos y sectores.'],
            ['Satisfacción y asistencia', 'El equipo técnico.', 'NPS por sesión, comentarios anónimos y asistencia por emprendimiento y por persona.']
          ]
        } },
        { pasos: [
          'Elige en la tarjeta el programa, emprendimiento o alcance.',
          'Pulsa «Descargar PDF». En unos segundos se descarga el archivo.'
        ] },
        { img: 'reportes-pdf.jpg', pie: 'Los cuatro informes en PDF, cada uno con su selector y el botón «Descargar PDF».' },
        { consejo: 'El One Pager de cada emprendimiento también se descarga en PDF desde su ficha, en la pestaña «One Pager», cuando está completo.' }
      ]
    },
    {
      id: 'usuarios',
      titulo: 'Usuarios',
      resumen: 'Crear cuentas, asignarlas a un emprendimiento y restablecer contraseñas.',
      intro: 'El directorio reúne las cuentas del equipo técnico y de los emprendedores.',
      bloques: [
        { img: 'usuarios.jpg', pie: 'Directorio de usuarios con búsqueda y filtros.' },
        { p: 'Busca por «Nombre, correo, DNI o emprendimiento» y filtra por estado y rol. Si hay emprendedores sin emprendimiento, un aviso lo indica con el botón «Ver cuáles»: no ven sesiones ni seguimiento hasta que los asignes.' },
        { sub: 'Crear un usuario' },
        { pasos: [
          'Pulsa «Nuevo usuario» y elige el «Rol»: «Emprendedor» o «Equipo técnico».',
          'Completa sus datos. Nombres, apellidos y correo son obligatorios.',
          'Pulsa «Crear usuario». Copia la «Contraseña temporal» que aparece y compártela por un canal seguro.',
          'Si es emprendedor, asígnalo ahí mismo a su emprendimiento en «Su emprendimiento», o más tarde desde su ficha.'
        ] },
        { sub: 'La ficha de una persona' },
        { p: 'Al hacer clic en una persona se abre su ficha: contacto, emprendimiento, datos personales y acceso. Desde ahí puedes «Editar datos», asignarla o quitarla de un equipo, «Restablecer contraseña» y «Desactivar cuenta».' },
        { aviso: 'Las cuentas no se borran: se desactivan. Una cuenta desactivada no puede iniciar sesión, pero conserva sus datos y se puede reactivar.' }
      ]
    },
    {
      id: 'preguntas',
      titulo: 'Preguntas frecuentes',
      resumen: 'Respuestas rápidas a las dudas más comunes.',
      bloques: [
        { tabla: {
          columnas: [{ titulo: 'Pregunta', ancho: 1.6 }, { titulo: 'Respuesta', ancho: 3 }],
          filas: [
            ['Un emprendedor olvidó su contraseña.', 'En «Usuarios», abre su ficha y pulsa «Restablecer contraseña», o usa la llave en la pestaña «Equipo» de su emprendimiento. Comparte la contraseña temporal; podrá cambiarla en «Mi perfil».'],
            ['Un emprendedor no ve sus sesiones.', 'Revisa que esté asignado a un emprendimiento (en «Usuarios», filtro de emprendedores sin emprendimiento) y que su emprendimiento esté en el programa de la sesión.'],
            ['¿Por qué un compromiso aparece «Vencido»?', 'Porque el emprendimiento ya tuvo otra sesión después de la que se acordó. Márcalo en la siguiente ronda o en «Seguimiento».'],
            ['La cartera dice que lleva muchos días sin reunión.', 'Se cuenta desde la última sesión con «Lo trabajado» registrado. Completa el registro de la ronda.'],
            ['No puedo tomar asistencia.', 'La asistencia se habilita el día de la sesión. Si la sesión ya pasó, revisa que su emprendimiento tenga integrantes.'],
            ['¿Puedo borrar un programa, emprendimiento o usuario?', 'No: se desactivan o se marcan como retirados, para conservar el historial.'],
            ['El emprendedor no puede usar el match con mentores.', 'Necesita el One Pager completo: los 6 campos obligatorios (etapa, descripción, correo, problema, solución y modelo de negocio).'],
            ['¿Puedo subir un archivo como material?', 'Se comparten enlaces: sube el archivo a Drive y pega su dirección en «Agregar enlace».']
          ]
        } }
      ]
    },
    {
      id: 'emprendedor',
      anexo: true,
      titulo: 'Lo que ve el emprendedor',
      resumen: 'Su espacio: Mi emprendimiento, Mi plan, sesiones y mentores.',
      intro: 'Cada integrante de un emprendimiento entra con su correo y ve un menú más simple: «Mi emprendimiento», «Sesiones», «Mi plan» y «Mentores». Conocerlo te ayuda a orientarle.',
      bloques: [
        { sub: 'Mi emprendimiento' },
        { p: 'Es su página de inicio. En «Resumen» ve un bloque «Por hacer» con sus evaluaciones pendientes, el One Pager incompleto y sus compromisos abiertos; además, sus indicadores, sus últimos registros y la próxima sesión con el botón «Unirse».' },
        { img: 'emp-resumen.jpg', pie: 'Mi emprendimiento, pestaña «Resumen», vista por la líder del equipo.' },
        { lista: [
          '«One Pager»: lo edita con «Editar One Pager», por secciones y con una lista de los 6 campos obligatorios. Completo, desbloquea el PDF y el match con mentores.',
          '«Modelo de negocio»: su BMC por versiones. Ve tu feedback y crea una versión nueva a partir de la revisada.',
          '«Materiales» y «Equipo»: lo compartido con su equipo y sus integrantes. El líder puede sumar integrantes y darles una contraseña temporal nueva.'
        ] },
        { img: 'emp-onepager.jpg', pie: 'Editor del One Pager con el panel «Para completar».' },
        { img: 'emp-bmc.jpg', pie: 'Editor del Modelo de negocio (BMC) con el feedback del equipo técnico.' },
        { sub: 'Mi plan' },
        { p: 'Reúne lo que tiene que hacer y lo que pasó en cada sesión:' },
        { lista: [
          '«Compromisos»: los marca como «Cumplido», «En curso» o «No se hizo» a medida que avanza. Tú lo verás al preparar su próxima reunión.',
          '«Objetivos»: crea sus OKR con «Nuevo objetivo» y actualiza el avance de sus actividades.',
          '«Historial»: todas sus sesiones con lo trabajado y los compromisos de cada una.'
        ] },
        { img: 'emp-plan.jpg', pie: 'Mi plan, pestaña «Compromisos».' },
        { sub: 'Sesiones y evaluación' },
        { p: 'En «Sesiones» ve su agenda y, en cada sesión ya realizada, el botón «Evaluar»: una calificación del 1 al 10 y dos preguntas opcionales. Tarda menos de un minuto y solo la ve el equipo técnico.' },
        { sub: 'Mentores' },
        { p: 'Ve la red de mentores activos y agenda directamente con quien tenga enlace de agenda. Con el One Pager completo puede usar «Encontrar mi mentor» para recibir sugerencias de la inteligencia artificial.' }
      ]
    }
  ]
};
