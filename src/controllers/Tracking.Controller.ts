import moment, { Moment } from 'moment';
import { getTrackingMovements } from '@/services/jetcargo';
import { PackageStatus } from '@/prisma/generated/enums';
import { prismaRead } from '@/libs/prisma';

const trackingStatusMap: { [key: string]: string } = {
  'RECIBIDO ORIGEN': 'RECEIVED_ORIGIN',
  'PROCESO ORIGEN': 'IN_PROCESS_ORIGIN',
  ENVIADO: 'SENT',
  ADUANAS: 'CUSTOMS',
  'TRANSITO INTERNO': 'INTERNAL_TRANSIT',
  'RECIBIDO DESTINO': 'RECEIVED_DESTINATION',
  'PROCESO DESTINO': 'IN_PROCESS_DESTINATION',
  FACTURADO: 'INVOICED',
  'EN RUTA': 'ON_ROUTE',
  ENTREGADO: 'DELIVERED',
  'DEVUELTO ORIGEN': 'RETURNED_ORIGIN',
  RECLAMADO: 'CLAIMED',
  'REVISAR TRACKING': 'REVIEW_TRACKING'
};

const clientTrackingStatusMap: { [key: string]: string } = {
  RECEIVED_ORIGIN: 'RECEIVED_ORIGIN',
  IN_PROCESS_ORIGIN: 'IN_PROCESS_ORIGIN',
  SENT: 'IN_TRANSIT_DESTINATION',
  CUSTOMS: 'CUSTOMS',
  INTERNAL_TRANSIT: 'CUSTOMS',
  RECEIVED_DESTINATION: 'CUSTOMS',
  IN_PROCESS_DESTINATION: 'CUSTOMS',
  INVOICED: 'INTERNAL_TRANSIT',
  ON_ROUTE: 'INTERNAL_TRANSIT',
  DELIVERED: 'INTERNAL_TRANSIT',
  RETURNED_ORIGIN: 'INTERNAL_TRANSIT',
  CLAIMED: 'CLAIMED',
  REVIEW_TRACKING: 'REVIEW_TRACKING'
};

const clientTrackingStatusOrder = [
  PackageStatus.PRE_ALERTED,
  'RECEIVED_ORIGIN',
  'IN_PROCESS_ORIGIN',
  'IN_TRANSIT_DESTINATION',
  'CUSTOMS',
  'INTERNAL_TRANSIT',
  'CLAIMED',
  'REVIEW_TRACKING',
  PackageStatus.READY,
  PackageStatus.DELIVERED
];

export const getTrackingHistory = async (tracking: string) => {
  const movements = await getTrackingMovements(tracking);
  if (!movements || movements.length <= 0) {
    return [];
  }

  return formatResponseStatus(movements);
};

export const getClientTrackingHistory = async (tracking: string, clientId?: number) => {
  const formattedMovements = await getTrackingHistory(tracking);

  let localMovements: { date: Moment; status: string }[] = [];
  if (clientId) {
    // get local movements from database if clientId is provided
    const pkg = await prismaRead.cusPackage.findFirst({
      where: { tracking, client_id: clientId },
      select: { id: true, status: true, status_logs: true }
    });
    if (pkg && pkg.status_logs && pkg.status_logs.length > 0) {
      localMovements = pkg.status_logs.map((log) => ({
        date: moment(log.created_at),
        status: log.status
      }));
    }
  }

  // merge and format movements
  const mergedMovements = [...formattedMovements, ...localMovements]
    .map((m) => ({
      date: m.date,
      status: clientTrackingStatusMap[m.status] || m.status
    }))
    .filter((m) => clientTrackingStatusOrder.includes(m.status as any));

  // remove duplicates by status, keeping the earliest date
  const uniqueByStatus = Array.from(
    mergedMovements
      .sort((a, b) => a.date.valueOf() - b.date.valueOf())
      .reduce((acc, m) => acc.set(m.status, m), new Map<string, { date: any; status: string }>())
      .values()
  );

  // sort by predefined order
  const orderIndex = new Map<string, number>(clientTrackingStatusOrder.map((s, i) => [String(s), i]));

  // final sorted unique movements
  return uniqueByStatus.sort((a, b) => (orderIndex.get(a.status) ?? 0) - (orderIndex.get(b.status) ?? 0));
};

const formatResponseStatus = (movements: any[]) => {
  return movements
    .map((movement) => {
      return {
        date: moment(movement.FECHA, 'DD/MM/YYYY HH:mm:ss'),
        status: trackingStatusMap[movement.ESTADO as keyof typeof trackingStatusMap] || 'UNKNOWN'
      };
    })
    .filter((m) => m.status !== 'UNKNOWN');
};
