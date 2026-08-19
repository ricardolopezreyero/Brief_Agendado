// RLR
import type { Env, EventoRecord } from './types';
import { insertLog } from './db';

// Avisa a Rayos X que hay un dossier listo, para que arme el diagnóstico
// pre-llenado con los datos del brief.
//
// Por qué existe: hasta ahora este Worker generaba el brief y ahí se acababa.
// Del otro lado, el asesor abría Rayos X en blanco y volvía a teclear a mano lo
// que ya estaba en el dossier. Rayos X tiene el endpoint listo desde el 17 de
// agosto y nadie le mandaba nada: 0 diagnósticos automáticos de 22.
//
// NO LANZA NUNCA. Que falle este aviso no debe tumbar la generación del brief,
// que es lo que el negocio espera de este Worker. Un aviso perdido se queda en
// la bitácora y se puede reintentar regenerando el brief.
export async function avisarARayosX(
  env: Env,
  evento: EventoRecord,
  metodo: 'POST' | 'PATCH' = 'POST',
): Promise<void> {
  // Sin secretos no hace nada: así este cambio se puede desplegar antes de que
  // existan, sin romper el flujo de briefs.
  if (!env.RAYOSX_INGESTA_URL || !env.RAYOSX_INGESTA_SECRET) return;
  // Sin institución no hay carpeta ni diagnóstico posible del otro lado.
  if (!evento.institucion) return;

  try {
    const r = await fetch(env.RAYOSX_INGESTA_URL, {
      method: metodo,
      headers: {
        'content-type': 'application/json',
        'x-ingesta-secreto': env.RAYOSX_INGESTA_SECRET,
      },
      // Las columnas de eventos_rayosx tal cual: Rayos X no traduce nombres.
      body: JSON.stringify({
        uid: evento.uid,
        institucion: evento.institucion,
        web: evento.web ?? '',
        representante_nombre: evento.representante_nombre ?? '',
        representante_telefono: evento.representante_telefono ?? '',
        representante_correo: evento.representante_correo ?? '',
        representante_whatsapp: evento.representante_whatsapp ?? '',
        asesor_superleads: evento.asesor_superleads ?? '',
        zoom_link: evento.zoom_link ?? '',
        sl_comercial_link: evento.sl_comercial_link ?? '',
        start_utc: evento.start_utc,
        dossier_md: evento.dossier_md ?? '',
      }),
    });

    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);

    await registrar(env, 'INFO', `✓ Rayos X avisado (${metodo})`, evento.uid);
  } catch (e: any) {
    await registrar(
      env,
      'ERROR',
      `✗ No se pudo avisar a Rayos X: ${e?.message ?? e}`,
      evento.uid,
    );
  }
}

// La bitácora es de mejor esfuerzo también: si D1 falla justo aquí, no tiene
// ningún sentido tumbar el brief por no haber podido escribir un log.
async function registrar(
  env: Env,
  nivel: 'INFO' | 'ERROR',
  mensaje: string,
  uid: string,
): Promise<void> {
  try {
    await insertLog(env.DB, nivel, mensaje, uid);
  } catch {
    console.error(mensaje);
  }
}
