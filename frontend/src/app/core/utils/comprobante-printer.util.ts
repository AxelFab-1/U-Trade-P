export interface DatosComprobante {
  numeroTransaccion: string;
  productoNombre: string;
  cantidad: number;
  montoTotal: number;
  vendedorNombre: string;
  compradorNombre?: string;
  celularComprador?: string;
  fecha?: string | Date;
  metodoPago?: string;
}

export function imprimirComprobante(datos: DatosComprobante): void {
  if (typeof window === 'undefined') return;

  const fechaFormateada = datos.fecha 
    ? new Date(datos.fecha).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

  const printWindow = window.open('', '_blank', 'width=520,height=680');
  if (!printWindow) {
    window.print();
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante U-Market - ${datos.numeroTransaccion}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; }
        .voucher-card { max-width: 420px; margin: 0 auto; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; }
        .header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .brand { font-size: 22px; font-weight: 800; color: #0056D2; letter-spacing: -0.5px; }
        .tag { display: inline-block; background: #742284; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; margin-top: 6px; }
        .status { font-size: 16px; font-weight: 700; color: #059669; margin: 12px 0 4px; }
        .tx-code { font-family: monospace; font-size: 14px; color: #64748b; margin: 0; }
        .details { margin: 16px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .row .label { color: #64748b; }
        .row .value { font-weight: 600; text-align: right; }
        .total-row { display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid #0056D2; font-size: 15px; font-weight: 800; }
        .total-row .total-amount { color: #0056D2; font-size: 19px; }
        .footer-notice { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
        .stamp { display: inline-block; border: 1.5px solid #059669; color: #059669; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; margin-top: 12px; letter-spacing: 1px; }
        @media print {
          body { padding: 0; }
          .voucher-card { border: 1px solid #ccc; }
        }
      </style>
    </head>
    <body>
      <div class="voucher-card">
        <div class="header">
          <div class="brand">U-Market • UTP</div>
          <span class="tag">YAPE VOUCHER OFICIAL</span>
          <div class="status">✓ OPERACIÓN EXITOSA</div>
          <p class="tx-code">N° Op: ${datos.numeroTransaccion}</p>
        </div>

        <div class="details">
          <div class="row">
            <span class="label">Publicación:</span>
            <span class="value">${datos.productoNombre}</span>
          </div>
          <div class="row">
            <span class="label">Cantidad:</span>
            <span class="value">${datos.cantidad} unidad(es)</span>
          </div>
          <div class="row">
            <span class="label">Vendedor:</span>
            <span class="value">${datos.vendedorNombre}</span>
          </div>
          ${datos.compradorNombre ? `
          <div class="row">
            <span class="label">Comprador:</span>
            <span class="value">${datos.compradorNombre}</span>
          </div>` : ''}
          ${datos.celularComprador ? `
          <div class="row">
            <span class="label">Celular Comprador:</span>
            <span class="value">+51 ${datos.celularComprador}</span>
          </div>` : ''}
          <div class="row">
            <span class="label">Fecha y Hora:</span>
            <span class="value">${fechaFormateada}</span>
          </div>
          <div class="row">
            <span class="label">Método de Pago:</span>
            <span class="value">${datos.metodoPago || 'Yape'}</span>
          </div>
        </div>

        <div class="total-row">
          <span>MONTO TOTAL PAGADO</span>
          <span class="total-amount">S/ ${Number(datos.montoTotal).toFixed(2)}</span>
        </div>

        <div class="footer-notice">
          <div>Presenta este comprobante físico o digital en campus al momento de la entrega.</div>
          <div class="stamp">TRANSACCIÓN VERIFICADA</div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
