// Contenido del manual del emprendedor (mismo formato que contenido.js; lo maqueta ManualPdf.jsx).
// Las capturas están en public/manual/ (las del emprendedor empiezan por «emp-»).

export const MANUAL_EMPRENDEDOR = {
  titulo: 'Manual del emprendedor',
  subtitulo: 'Cómo usar la plataforma de HUB TecnológICA durante tu programa, paso a paso.',
  version: '1.0',
  fecha: 'noviembre de 2026',
  url: 'hubtecnologica.com',
  presentacion: 'Esta guía es para los integrantes de cada emprendimiento del HUB. Explica cómo entrar, cómo mantener al día el One Pager y el modelo de negocio de tu proyecto, cómo seguir tus compromisos y objetivos, cómo evaluar las sesiones y cómo encontrar a tu mentor. El equipo técnico ve lo que registras y lo usa para preparar cada reunión contigo.',
  convenciones: 'Cómo leer esta guía: los nombres de botones, pestañas y campos aparecen en «seminegrita y entre comillas», tal como se ven en pantalla. Las capturas usan datos ficticios del entorno de pruebas.',
  capitulos: [
    {
      id: 'acceso',
      titulo: 'Primeros pasos',
      resumen: 'Entrar, cambiar tu contraseña temporal y elegir el tema.',
      intro: 'La plataforma funciona en el navegador de tu computadora o de tu celular. No hay que instalar nada.',
      bloques: [
        { sub: 'Iniciar sesión' },
        { pasos: [
          'Abre hubtecnologica.com. Verás la pantalla «Inicia sesión».',
          'Escribe tu «Correo electrónico» y la «Contraseña» que te dio el equipo técnico (o el líder de tu equipo). Con el ícono del ojo puedes ver lo que escribes.',
          'Pulsa «Ingresar». Entrarás a «Mi emprendimiento».'
        ] },
        { img: 'login.jpg', pie: 'Pantalla de inicio de sesión.' },
        { sub: 'Cambia tu contraseña temporal' },
        { p: 'La primera contraseña es temporal. Cámbiala por una tuya en cuanto entres:' },
        { pasos: [
          'En el menú de usuario (tus iniciales, arriba a la derecha; en el celular, en «Más») elige «Mi perfil».',
          'En «Cambiar Contraseña», escribe la «Contraseña Actual», la «Nueva Contraseña» (mínimo 6 caracteres) y confírmala.',
          'Pulsa «Cambiar Contraseña». Verás el aviso «Contraseña actualizada».'
        ] },
        { consejo: '¿Olvidaste tu contraseña? Pide una temporal al equipo técnico del HUB o al líder de tu equipo. No hay recuperación por correo.' },
        { sub: 'Tema claro u oscuro' },
        { p: 'En el menú de usuario, el selector «Tema» ofrece «Sistema» (sigue la configuración de tu equipo), «Claro» u «Oscuro». La elección se recuerda en cada navegador.' }
      ]
    },
    {
      id: 'navegacion',
      titulo: 'Moverse por la plataforma',
      resumen: 'El menú, los avisos, el buscador y el uso en el celular.',
      intro: 'Tu menú tiene cuatro destinos: a la izquierda en la computadora y en la barra inferior en el celular. Los números o el «!» junto a una opción indican algo pendiente.',
      bloques: [
        { sub: 'En el celular' },
        { p: 'En pantallas pequeñas el menú pasa a una barra inferior con «Inicio», «Sesiones», «Mi plan» y «Mentores». En «Más» están el tema, «Mi perfil» y «Cerrar sesión».' },
        { img: 'emp-movil.jpg', pie: 'Mi emprendimiento en un celular, con la barra inferior.', ancho: 'tercio' },
        { sub: 'Los cuatro destinos' },
        { tabla: {
          columnas: [{ titulo: 'Opción', ancho: 1.2 }, { titulo: 'Para qué sirve', ancho: 3 }],
          filas: [
            ['Mi emprendimiento', 'Tu página de inicio: lo que te toca hacer, el One Pager, el modelo de negocio, los materiales y tu equipo. Muestra «!» si el One Pager está incompleto.'],
            ['Sesiones', 'Tu agenda: próximas sesiones, el botón «Unirse» y las evaluaciones. Muestra cuántas sesiones tienes por evaluar.'],
            ['Mi plan', 'Tus compromisos, tus objetivos (OKR) y el historial de tus sesiones.'],
            ['Mentores', 'La red de mentores y el match con inteligencia artificial.']
          ]
        } },
        { sub: 'La campana de avisos' },
        { p: 'La campana te recuerda las «sesiones por evaluar» y si «Tu One Pager está incompleto». Cada aviso trae un botón que lleva a donde se resuelve.' },
        { sub: 'Buscar o ir a… (Ctrl K)' },
        { p: 'Pulsa «Ctrl K» (en Mac, «Cmd K») o el botón «Buscar o ir a…» y escribe parte del nombre de una página, una sesión o un mentor. Elige con las flechas y «Enter».' }
      ]
    },
    {
      id: 'rutina',
      titulo: 'Tu semana en el programa',
      resumen: 'Qué revisar antes y después de cada sesión.',
      intro: 'El programa avanza sesión a sesión. Esta rutina te ayuda a llegar preparado y a sacarle provecho a cada reunión con el equipo técnico.',
      bloques: [
        { pasos: [
          'Revisa «Por hacer» en «Mi emprendimiento»: evaluaciones pendientes, compromisos abiertos y el One Pager si está incompleto.',
          'Antes de tu sesión 1 a 1, entra a «Mi plan» y marca cómo va cada compromiso: el equipo técnico lo verá al preparar la reunión.',
          'El día de la sesión, si es virtual, pulsa «Unirse» desde «Sesiones» o desde «Próxima sesión».',
          'Después de la sesión, evalúala: es un minuto y ayuda a mejorar los talleres y el acompañamiento.',
          'Durante la semana, actualiza el avance de tus objetivos en «Mi plan» y mantén al día tu One Pager y tu modelo de negocio.'
        ] },
        { consejo: 'Un compromiso «vence» si llega otra sesión sin haberlo cerrado. Márcalo en cuanto avances, aunque sea «En curso».' }
      ]
    },
    {
      id: 'emprendimiento',
      titulo: 'Mi emprendimiento',
      resumen: 'Tu página de inicio: por hacer, indicadores, próxima sesión y pestañas.',
      intro: 'Es lo primero que ves al entrar. Reúne el estado de tu proyecto y te lleva a cada herramienta.',
      bloques: [
        { img: 'emp-resumen.jpg', pie: 'Mi emprendimiento, pestaña «Resumen».' },
        { sub: 'Pestaña «Resumen»' },
        { lista: [
          '«Por hacer»: tus evaluaciones pendientes, el One Pager si está incompleto y tus compromisos abiertos, cada uno con su botón. Si no hay nada: «Todo al día».',
          'Indicadores: «Avance OKR», «Asistencia», «Compromisos cumplidos» y «Compromisos abiertos».',
          '«Últimos registros»: lo trabajado en tus últimas sesiones y los compromisos acordados. «Ver el historial» abre todo en «Mi plan».',
          '«Próxima sesión»: fecha, hora y lugar o modalidad; si es virtual, el botón «Unirse».',
          '«Mis objetivos»: acceso directo a tus OKR en «Mi plan».'
        ] },
        { sub: 'Las demás pestañas' },
        { tabla: {
          columnas: [{ titulo: 'Pestaña', ancho: 1.2 }, { titulo: 'Contenido', ancho: 3 }],
          filas: [
            ['One Pager', 'La presentación de tu proyecto en una página (capítulo 5).'],
            ['Modelo de negocio', 'Tu Business Model Canvas por versiones (capítulo 6).'],
            ['Materiales', 'Presentaciones, plantillas y grabaciones que el equipo técnico compartió con tu equipo. Ábrelos o descárgalos desde aquí.'],
            ['Equipo', 'Los integrantes de tu emprendimiento (capítulo 9).']
          ]
        } }
      ]
    },
    {
      id: 'onepager',
      titulo: 'Tu One Pager',
      resumen: 'Presenta tu proyecto en una página y desbloquea el PDF y el match con mentores.',
      intro: 'El One Pager resume tu proyecto: qué problema resuelves, cómo y para quién. Lo leen el equipo técnico, los mentores y la inteligencia artificial del match. Con los 6 campos obligatorios completos se desbloquean el PDF y el match con mentores.',
      bloques: [
        { sub: 'Completarlo o editarlo' },
        { pasos: [
          'En «Mi emprendimiento», abre la pestaña «One Pager» y pulsa «Editar One Pager».',
          'Completa «Lo esencial»: la «Etapa del proyecto» (Idea, Prototipo, MVP, Operando o Escalando), la «Descripción» y el «Correo del proyecto».',
          'Sigue con «Problema y solución», «Negocio y mercado», «Avance y necesidades» y «Presencia en línea» (los enlaces se pueden pegar sin https://).',
          'Pulsa «Guardar» en la barra inferior. Puedes guardarlo a medias y volver cuando quieras.'
        ] },
        { img: 'emp-onepager.jpg', pie: 'Editor del One Pager con el panel «Para completar».' },
        { p: 'El panel «Para completar» muestra los 6 campos obligatorios: «Etapa del proyecto», «Descripción», «Correo del proyecto», «Problema u oportunidad», «Solución» y «Modelo de negocio». Al hacer clic en uno te lleva al campo. Cada texto tiene un contador de caracteres sugeridos: es una guía, no un límite.' },
        { consejo: 'Escribe para alguien que no conoce tu proyecto: frases cortas, datos concretos (clientes, ventas, cifras de Ica o de Perú) y sin siglas.' },
        { sub: 'Descargarlo en PDF' },
        { p: 'Cuando está completo, «Descargar PDF» genera tu One Pager con el diseño del HUB, listo para enviar a un mentor, un jurado o un aliado.' },
        { aviso: 'Si sales del editor o cambias de pestaña con cambios sin guardar, la plataforma te pregunta antes de descartarlos.' }
      ]
    },
    {
      id: 'bmc',
      titulo: 'Tu modelo de negocio',
      resumen: 'El Business Model Canvas por versiones y el feedback del equipo técnico.',
      intro: 'El Business Model Canvas (BMC) resume en 9 bloques a quién le das valor, cómo y cómo ganas dinero. Cada bloque trae una pregunta que te guía.',
      bloques: [
        { sub: 'Empezar y guardar' },
        { pasos: [
          'En «Mi emprendimiento», abre «Modelo de negocio». La primera vez, pulsa «Empezar mi BMC».',
          'Completa los bloques. Empieza por «Segmento de clientes» y «Propuesta de valor»: el resto se ordena solo.',
          'Pulsa «Guardar» en la barra inferior. Arriba verás cuántos de los 9 bloques llevas completos.'
        ] },
        { img: 'emp-bmc.jpg', pie: 'Modelo de negocio: una versión con el feedback del equipo técnico.' },
        { sub: 'Versiones y feedback' },
        { lista: [
          'El equipo técnico revisa tu BMC y deja su comentario en «Feedback del equipo técnico».',
          'Una versión con feedback queda entregada: ya no se edita, para no perder el contexto de lo comentado.',
          'Para aplicar los cambios, pulsa «Nueva versión a partir de esta»: copia lo que ya tenías y la puedes editar.',
          'Con el selector de versión puedes volver a ver las anteriores. Ponle un nombre a cada una en «Nombre de esta versión».'
        ] }
      ]
    },
    {
      id: 'plan',
      titulo: 'Mi plan',
      resumen: 'Tus compromisos, tus objetivos (OKR) y el historial de tus sesiones.',
      intro: '«Mi plan» reúne lo que tienes que hacer y lo que pasó en cada sesión. Tiene tres pestañas.',
      bloques: [
        { sub: 'Compromisos' },
        { p: 'En cada sesión acuerdas compromisos con el equipo técnico. Márcalos aquí a medida que avanzas: «Cumplido», «En curso» o «No se hizo». Se guarda al momento y el equipo lo verá al preparar tu próxima sesión.' },
        { img: 'emp-plan.jpg', pie: 'Mi plan, pestaña «Compromisos».' },
        { lista: [
          'Cada compromiso indica de qué sesión viene. El chip «Vencido» marca los que ya pasaron por otra sesión sin cerrarse.',
          'Si marcas uno por error, pulsa «Deshacer».',
          '«Compromisos cerrados» (plegado) guarda los que ya cumpliste o descartaste.'
        ] },
        { sub: 'Objetivos (OKR)' },
        { p: 'Tus objetivos del programa, medidos con resultados clave (cómo sabrás que lo lograste) y actividades (lo que harás).' },
        { pasos: [
          'Pulsa «Nuevo objetivo» (o «Crear mi primer objetivo»). Escribe «¿Qué quieres lograr?», elige el «Área» y la «Fecha límite», y pulsa «Crear objetivo».',
          'Con «Agregar resultado clave» define cómo medirás el logro; con «Agregar actividad», lo que harás, con una «Meta» numérica si se puede contar.',
          'Actualiza el avance escribiendo cuánto llevas («12 de 30») o cambiando el estado de la actividad.',
          'Con «Agregar evidencia» pega el enlace a una prueba de tu avance (fotos, una carpeta de Drive, un video).'
        ] },
        { img: 'emp-plan-objetivos.jpg', pie: 'Mi plan, pestaña «Objetivos».' },
        { consejo: 'Define de 1 a 3 objetivos para el programa. Mejor pocos y medibles: «Vender 10 kits antes de diciembre» en lugar de «Crecer en ventas».' },
        { sub: 'Historial' },
        { p: 'Todas tus sesiones, programadas y realizadas, con lo trabajado y los compromisos de cada una. Filtra por «Diagnósticas», «Talleres» o «1 a 1».' }
      ]
    },
    {
      id: 'sesiones',
      titulo: 'Sesiones y evaluación',
      resumen: 'Tu agenda, unirte a una sesión virtual y evaluar cada sesión.',
      intro: 'En «Sesiones» ves las sesiones de tu programa: rondas 1 a 1, talleres y diagnósticos.',
      bloques: [
        { img: 'emp-sesiones.jpg', pie: 'Sesiones: por evaluar, próximas y realizadas.' },
        { lista: [
          'Grupos: «Por evaluar», «Hoy», «Próximos 7 días», «Más adelante» y «Realizadas».',
          'Cada sesión muestra fecha, horario, modalidad y lugar. Si es virtual o híbrida, el botón «Unirse» abre la reunión.',
          'Al abrir una sesión verás su «Resumen» (con «Mi seguimiento»: lo trabajado y tus compromisos de esa sesión) y sus «Materiales».'
        ] },
        { sub: 'Evaluar una sesión' },
        { pasos: [
          'Pulsa «Evaluar» en la sesión (o «Evaluar ahora» dentro de ella).',
          'Elige una nota del 1 («Muy mala») al 10 («Excelente») en «¿Cómo calificarías esta sesión?».',
          'Si quieres, cuenta «¿Qué aprendiste o qué te pareció más útil?» y «¿Qué podemos mejorar?».',
          'Pulsa «Enviar evaluación». Verás «¡Gracias! Evaluación enviada».'
        ] },
        { img: 'emp-evaluar.png', pie: 'Formulario «Evalúa la sesión».', ancho: 'medio' },
        { p: 'Tarda menos de un minuto y solo la ve el equipo técnico. Puedes evaluar una sesión desde el día en que se realiza.' }
      ]
    },
    {
      id: 'equipo',
      titulo: 'Tu equipo',
      resumen: 'Los integrantes y lo que puede hacer el líder.',
      intro: 'En la pestaña «Equipo» de «Mi emprendimiento» están los integrantes con su rol, correo y teléfono.',
      bloques: [
        { img: 'emp-equipo.jpg', pie: 'Pestaña «Equipo», vista por la líder.' },
        { sub: 'Si eres líder' },
        { p: 'El líder (chip «Eres líder» en la cabecera) puede sumar integrantes y darles una contraseña nueva si la olvidan:' },
        { pasos: [
          'Pulsa «Agregar integrante», completa sus datos (nombres, apellidos y correo son obligatorios) y su rol, y guarda.',
          'Copia la «Contraseña temporal» que aparece y compártela por un canal seguro: solo se muestra esa vez.',
          'Si alguien olvidó su contraseña, pulsa el ícono de la llave en su tarjeta para darle una temporal nueva.'
        ] },
        { aviso: 'Si la persona ya tiene cuenta en la plataforma, pide al equipo técnico que la asigne a tu emprendimiento. Nadie puede quitarse ni cambiarse la contraseña a sí mismo desde aquí: eso se hace en «Mi perfil».' }
      ]
    },
    {
      id: 'mentores',
      titulo: 'Mentores',
      resumen: 'La red de mentores, agendar una mentoría y el match con IA.',
      intro: 'La red de mentores del HUB está para ayudarte con tus retos. Puedes buscar por nombre, tema, sector u ODS.',
      bloques: [
        { img: 'emp-mentores.jpg', pie: 'La red de mentores con el aviso del match con IA.' },
        { lista: [
          'Haz clic en un mentor para ver su ficha: biografía, temas, sectores y ODS.',
          '«Agendar» (o «Agendar sesión») abre su agenda en línea para reservar una mentoría 1 a 1.',
          'Si no tiene agenda en línea, escríbele por «LinkedIn».'
        ] },
        { sub: 'Encontrar mi mentor (match con IA)' },
        { p: 'Si tu One Pager está completo, la inteligencia artificial te sugiere los tres mentores que mejor encajan con tu proyecto:' },
        { pasos: [
          'Pulsa «Encontrar mi mentor».',
          'Elige las «áreas» en las que quieres mentoría, cuenta tu principal reto y qué esperas del mentor, y di si prefieres a alguien de tu sector o con visión general de negocios.',
          'Pulsa «Buscar mentores». En unos segundos verás tres sugerencias con su porcentaje de compatibilidad y el motivo.',
          'Agenda con el que prefieras. Con «Hacer otro match» puedes probar otras respuestas.'
        ] },
        { img: 'emp-match.png', pie: 'Primer paso del match con IA: las áreas de mentoría.', ancho: 'medio' },
        { consejo: 'Cuanto más concreto sea tu reto («No sé cómo fijar el precio para hoteles»), mejor será la sugerencia.' }
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
            ['Olvidé mi contraseña.', 'Pide una temporal al equipo técnico o al líder de tu equipo, y cámbiala después en «Mi perfil».'],
            ['No veo mis sesiones ni mi plan.', 'Tu cuenta aún no está asignada a un emprendimiento. Escribe al equipo técnico para que te sumen a tu equipo.'],
            ['¿Por qué un compromiso dice «Vencido»?', 'Porque ya pasó otra sesión desde que se acordó. Márcalo como «Cumplido», «En curso» o «No se hizo» en «Mi plan».'],
            ['No puedo usar «Encontrar mi mentor».', 'Necesitas el One Pager completo: los 6 campos obligatorios.'],
            ['No puedo editar mi modelo de negocio.', 'Esa versión ya tiene feedback. Pulsa «Nueva versión a partir de esta» para seguir editando.'],
            ['No me deja evaluar una sesión.', 'Las sesiones se evalúan desde el día en que se realizan. Si ya la evaluaste, verás «Ya evaluaste esta sesión».'],
            ['¿Quién ve lo que escribo?', 'Tu equipo y el equipo técnico del HUB. Las evaluaciones de las sesiones solo las ve el equipo técnico.'],
            ['¿Dónde están los materiales de un taller?', 'En la pestaña «Materiales» de «Mi emprendimiento» y en la de cada sesión.']
          ]
        } }
      ]
    }
  ]
};
