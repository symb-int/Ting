import type {
  TingCatalogResponse,
  TingProcedureDto,
  TingProcedureList,
  TingProcedureCreateInput,
  TingProcedureUpdateInput,
} from './ting';
import { apiBaseUrl } from './api-endpoints';
import request from './request';

export interface TingCapabilities {
  manageProcedures: boolean;
}

export interface TingProcedureError {
  message: string;
  errors?: {
    title?: string[];
    description?: string[];
    requestId?: string[];
    expectedEditRevision?: string[];
  };
}

const tingUrl = (path: string) => `${apiBaseUrl()}/api/ting/${path}`;

export function getTingCapabilities(signal?: AbortSignal): Promise<TingCapabilities> {
  return request.get(tingUrl('capabilities'), { signal });
}

export function getTingCatalog(signal?: AbortSignal): Promise<TingCatalogResponse> {
  return request.get(tingUrl('catalog'), { signal });
}

export function listTingProcedures(
  cursor?: string,
  signal?: AbortSignal,
): Promise<TingProcedureList> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return request.get(tingUrl(`procedures${query}`), { signal });
}

export function getTingProcedure(
  procedureId: string,
  signal?: AbortSignal,
): Promise<TingProcedureDto> {
  return request.get(tingUrl(`procedures/${encodeURIComponent(procedureId)}`), { signal });
}

export function createTingProcedure(input: TingProcedureCreateInput): Promise<TingProcedureDto> {
  return request.post(tingUrl('procedures'), input);
}

export function updateTingProcedure(
  procedureId: string,
  input: TingProcedureUpdateInput,
): Promise<TingProcedureDto> {
  return request.put(tingUrl(`procedures/${encodeURIComponent(procedureId)}`), input);
}
