import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useEffect } from 'react';

export type Wallet = Tables<'wallets'>;
// Masked wallet type returned from the view (address is masked)
export type WalletMasked = Omit<Wallet, 'address'> & { address_masked: string };

export function useWallets() {
  const query = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets_masked' as any)
        .select('*')
        .order('usd_value', { ascending: false });
      
      if (error) throw error;
      // Map address_masked back to address field for UI compatibility
      return (data || []).map((w: any) => ({
        ...w,
        address: w.address_masked,
      })) as Wallet[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('wallets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return query;
}

export function useTotalTreasuryValue() {
  return useQuery({
    queryKey: ['wallets', 'total-value'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets_masked' as any)
        .select('usd_value');
      
      if (error) throw error;
      return (data as any[])?.reduce((sum: number, w: any) => sum + Number(w.usd_value), 0) || 0;
    },
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (wallet: TablesInsert<'wallets'>) => {
      const { data, error } = await supabase
        .from('wallets')
        .insert(wallet)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add wallet: ${error.message}`);
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'wallets'> & { id: string }) => {
      const { error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet updated');
    },
    onError: (error) => {
      toast.error(`Failed to update wallet: ${error.message}`);
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet removed');
    },
    onError: (error) => {
      toast.error(`Failed to remove wallet: ${error.message}`);
    },
  });
}
