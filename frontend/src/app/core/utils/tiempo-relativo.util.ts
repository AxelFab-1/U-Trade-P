export function formatearTiempoRelativo(fechaStr?: string | Date | null): string {
  if (!fechaStr) return 'Reciente';

  const fecha = typeof fechaStr === 'string' ? new Date(fechaStr) : fechaStr;
  if (isNaN(fecha.getTime())) return 'Reciente';

  const ahora = new Date();
  const diffSegundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);

  // Si la diferencia es menor a 1 minuto o ligeramente negativa por desajuste de segundos
  if (diffSegundos < 60) {
    return 'Hace un momento';
  }

  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) {
    return `Hace ${diffMinutos} min`;
  }

  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) {
    return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
  }

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) {
    return 'Hace 1 día';
  }
  if (diffDias < 7) {
    return `Hace ${diffDias} días`;
  }

  const diffSemanas = Math.floor(diffDias / 7);
  if (diffSemanas < 4) {
    return `Hace ${diffSemanas} ${diffSemanas === 1 ? 'semana' : 'semanas'}`;
  }

  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}
