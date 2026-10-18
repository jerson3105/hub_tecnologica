import { pdf } from '@react-pdf/renderer';
import { registrarFuentes, cargarLogo, cargarImagenExterna } from './marca';
import InformePrograma from './InformePrograma';
import FichaEmprendimiento from './FichaEmprendimiento';
import InformeImpacto from './InformeImpacto';
import InformeSatisfaccion from './InformeSatisfaccion';
import OnePagerPdf from './OnePagerPdf';

// Módulo que se carga solo al pedir un PDF (react-pdf y las fuentes pesan): arma el documento
// del tipo pedido y devuelve el Blob.
const DOCUMENTOS = {
  programa: InformePrograma,
  emprendimiento: FichaEmprendimiento,
  impacto: InformeImpacto,
  satisfaccion: InformeSatisfaccion,
  onepager: OnePagerPdf
};

// Logo del propio proyecto: react-pdf necesita la imagen ya cargada
const LOGOS_PROYECTO = {
  onepager: (datos) => cargarImagenExterna(datos.onePager?.logo_url)
};

export const generarPdf = async (tipo, datos) => {
  registrarFuentes();
  // Sin logo (no cargó) el informe sale igual, con el nombre de la marca en texto
  const logoProyectoDe = LOGOS_PROYECTO[tipo];
  const [logo, logoProyecto] = await Promise.all([
    cargarLogo().catch(() => null),
    logoProyectoDe ? logoProyectoDe(datos).catch(() => null) : null
  ]);
  const Documento = DOCUMENTOS[tipo];
  return pdf(<Documento datos={datos} logo={logo} logoProyecto={logoProyecto} />).toBlob();
};
