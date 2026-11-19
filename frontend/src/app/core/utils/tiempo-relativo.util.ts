export function formatearTiempoRelativo(fechaStr?: string | Date | null): string {
  if (!fechaStr) return 'Publicado recientemente';

  const fecha = typeof fechaStr === 'string' ? new Date(fechaStr) : fechaStr;
  if (isNaN(fecha.getTime())) return 'Publicado recientemente';

  const ahora = new Date();
  const diffSegundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);

  if (diffSegundos < 60) {
    return 'Publicado hace un momento';
  }

  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) {
    return `Publicado hace ${diffMinutos} ${diffMinutos === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) {
    return `Publicado hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
  }

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) {
    return 'Publicado ayer';
  }
  if (diffDias < 7) {
    return `Publicado hace ${diffDias} días`;
  }

  const diffSemanas = Math.floor(diffDias / 7);
  if (diffSemanas < 4) {
    return `Publicado hace ${diffSemanas} ${diffSemanas === 1 ? 'semana' : 'semanas'}`;
  }

  return `Publicado el ${fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`;
}
