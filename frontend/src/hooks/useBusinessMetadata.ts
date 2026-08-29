'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface BusinessMetadata {
  id: string; // PDA
  owner: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  website_url: string;
}

export function useAllBusinessMetadata() {
  const [metadata, setMetadata] = useState<Record<string, BusinessMetadata>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('businesses').select('*');
      if (error) throw error;
      
      const map: Record<string, BusinessMetadata> = {};
      if (data) {
        data.forEach(item => {
          map[item.id] = item as BusinessMetadata;
        });
      }
      setMetadata(map);
    } catch (err: unknown) {
      console.error('Error fetching metadata:', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { metadata, loading, refresh: fetchAll };
}

export function useBusinessMetadata(id: string | null) {
  const [data, setData] = useState<BusinessMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOne = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is not found
        console.error('Error fetching business:', error?.message || JSON.stringify(error) || error);
      }
      setData(data as BusinessMetadata || null);
    } catch (err: unknown) {
      console.error('Exception fetching business:', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  return { data, loading, refresh: fetchOne };
}
