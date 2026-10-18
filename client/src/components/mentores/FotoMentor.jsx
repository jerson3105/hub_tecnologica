import { resolveMentorPhotoUrl } from '../../services/media';

const TAMANIOS = { sm: 'size-12 text-base', md: 'size-14 text-lg', lg: 'size-20 text-2xl' };

// Foto del mentor o sus iniciales. Decorativa: el nombre siempre va al lado.
const FotoMentor = ({ mentor, tamanio = 'md' }) => (
  mentor.foto ? (
    <img src={resolveMentorPhotoUrl(mentor.foto)} alt="" className={`${TAMANIOS[tamanio]} shrink-0 rounded-card object-cover`} loading="lazy" />
  ) : (
    <span className={`${TAMANIOS[tamanio]} grid shrink-0 place-items-center rounded-card bg-programa-soft font-semibold text-programa-soft-foreground`} aria-hidden="true">
      {`${mentor.nombre?.[0] || ''}${mentor.apellido?.[0] || ''}`.toUpperCase()}
    </span>
  )
);

export default FotoMentor;
