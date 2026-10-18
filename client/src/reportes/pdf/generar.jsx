import { pdf } from '@react-pdf/renderer';
import { registrarFuentes, cargarLogo } from './marca';
import InformePrograma from './InformePrograma';
import FichaEmprendimiento from './FichaEmprendimiento';
import InformeImpacto from './InformeImpacto';
import InformeSatisfaccion from './InformeSatisfaccion';

// Módulo que se carga solo al pedir un PDF (react-pdf y las fuentes pesan): arma el documento
// del tipo pedido y devuelve el Blob.
const DOCUMENTOS = {
  programa: InformePrograma,
  emprendimiento: FichaEmprendimiento,
  impacto: InformeImpacto,
  satisfaccion: InformeSatisfaccion
};

export const generarPdf = async (tipo, datos) => {
  registrarFuentes();
  // Sin logo (no cargó) el informe sale igual, con el nombre de la marca en texto
  const logo = await cargarLogo().catch(() => null);
  const Documento = DOCUMENTOS[tipo];
  return pdf(<Documento datos={datos} logo={logo} />).toBlob();
};
