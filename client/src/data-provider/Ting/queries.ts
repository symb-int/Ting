import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  QueryKeys,
  MutationKeys,
  getTingCatalog,
  getTingProcedure,
  getTingCapabilities,
  listTingProcedures,
  createTingProcedure,
  updateTingProcedure,
} from 'librechat-data-provider';
import type {
  TingProcedureDto,
  TingProcedureError,
  TingProcedureList,
  TingProcedureCreateInput,
  TingProcedureUpdateInput,
} from 'librechat-data-provider';
import type { AxiosError } from 'axios';
import { useAuthContext } from '~/hooks/AuthContext';

export const useGetTingCapabilitiesQuery = () => {
  const { user, isAuthenticated } = useAuthContext();
  return useQuery(
    [QueryKeys.tingCapabilities, user?.id],
    ({ signal }) => getTingCapabilities(signal),
    { enabled: isAuthenticated, retry: false },
  );
};

export const useGetTingCatalogQuery = ({ enabled = true } = {}) => {
  const { user, isAuthenticated } = useAuthContext();
  return useQuery([QueryKeys.tingCatalog, user?.id], ({ signal }) => getTingCatalog(signal), {
    enabled: isAuthenticated && enabled,
    retry: false,
  });
};

export const useTingProceduresQuery = () => {
  const { user, isAuthenticated } = useAuthContext();
  return useInfiniteQuery<TingProcedureList, AxiosError<TingProcedureError>>(
    [QueryKeys.tingProcedures, user?.id],
    ({ pageParam, signal }) =>
      listTingProcedures(typeof pageParam === 'string' ? pageParam : undefined, signal),
    {
      enabled: isAuthenticated,
      getNextPageParam: (page) => page.nextCursor ?? undefined,
      retry: false,
    },
  );
};

export const useTingProcedureQuery = (procedureId: string) => {
  const { user, isAuthenticated } = useAuthContext();
  return useQuery<TingProcedureDto, AxiosError<TingProcedureError>>(
    [QueryKeys.tingProcedure, user?.id, procedureId],
    ({ signal }) => getTingProcedure(procedureId, signal),
    {
      enabled: isAuthenticated && procedureId.length > 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  );
};

export const useTingProcedureMutations = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const onSuccess = (procedure: TingProcedureDto) => {
    queryClient.setQueryData([QueryKeys.tingProcedure, user?.id, procedure.procedureId], procedure);
    void queryClient.invalidateQueries([QueryKeys.tingProcedures, user?.id]);
    void queryClient.invalidateQueries([QueryKeys.tingCatalog, user?.id]);
  };
  const create = useMutation<
    TingProcedureDto,
    AxiosError<TingProcedureError>,
    TingProcedureCreateInput
  >({
    mutationKey: [MutationKeys.createTingProcedure, user?.id],
    mutationFn: createTingProcedure,
    retry: false,
    onSuccess,
  });
  const update = useMutation<
    TingProcedureDto,
    AxiosError<TingProcedureError>,
    { procedureId: string; input: TingProcedureUpdateInput }
  >({
    mutationKey: [MutationKeys.updateTingProcedure, user?.id],
    mutationFn: ({ procedureId, input }) => updateTingProcedure(procedureId, input),
    retry: false,
    onSuccess,
  });
  return { create, update };
};
