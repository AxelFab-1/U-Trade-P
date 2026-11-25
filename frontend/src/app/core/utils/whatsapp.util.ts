/**
 * Normaliza un número telefónico al formato internacional de Perú (+51XXXXXXXXX)
 */
export function normalizarCelularPeru(telefono?: string | null): string | null {
  if (!telefono) return null;
  const soloDigitos = telefono.replace(/\D/g, '');
  if (!soloDigitos) return null;
  return soloDigitos.startsWith('51') ? soloDigitos : `51${soloDigitos}`;
}

/**
 * Extrae el primer nombre de un nombre completo
 */
export function extraerPrimerNombre(nombreCompleto?: string | null): string {
  if (!nombreCompleto) return '';
  return nombreCompleto.trim().split(/\s+/)[0] || '';
}

/**
 * Abre un chat de WhatsApp con número y mensaje pre-llenado en nueva pestaña
 */
export function abrirWhatsApp(celular: string, mensaje: string): void {
  const celNormalizado = normalizarCelularPeru(celular);
  if (!celNormalizado) return;
  const url = `https://wa.me/${celNormalizado}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

/**
 * Parámetros para coordinar entrega post-pago
 */
export interface ParametrosCoordinarEntrega {
  vendedorTelefono?: string | null;
  vendedorNombre?: string | null;
  monto: number | string;
  numeroOperacion: string;
  nombreProducto: string;
}

/**
 * Mensaje predeterminado para coordinar la entrega tras pagar por Yape:
 * "¡Hola [PrimerNombreVendedor]! Acabo de pagar S/ [Monto] por Yape (N° Op. [NumeroOperacion]) por "[NombreProducto]" en U-Market. ¿En qué pabellón y hora coordinamos la entrega?"
 */
export function coordinarEntregaWhatsApp(params: ParametrosCoordinarEntrega): boolean {
  if (!params.vendedorTelefono) return false;
  const celNormalizado = normalizarCelularPeru(params.vendedorTelefono);
  if (!celNormalizado) return false;

  const primerNombre = extraerPrimerNombre(params.vendedorNombre);
  const saludo = primerNombre ? `¡Hola ${primerNombre}!` : '¡Hola!';
  const montoFormateado = Number(params.monto).toFixed(2);

  const mensaje = `${saludo} Acabo de pagar S/ ${montoFormateado} por Yape (N° Op. ${params.numeroOperacion}) por "${params.nombreProducto}" en U-Market. ¿En qué pabellón y hora coordinamos la entrega?`;

  abrirWhatsApp(celNormalizado, mensaje);
  return true;
}
