import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export interface Drawing {
  filename: string;
  displayName: string;
  uploadedAt: string;
  size: number;
}

export function useDrawings() {
  const { data: drawings = [], isLoading, refetch } = useQuery<Drawing[]>({
    queryKey: ['/api/drawings/list'],
    staleTime: 30 * 1000,
  });

  function findDrawingForPartNumber(partNumber: string): Drawing | null {
    if (!partNumber || !drawings.length) return null;
    const needle = partNumber.toLowerCase().replace(/\s+/g, '');
    return (
      drawings.find(d =>
        d.displayName.toLowerCase().replace(/\s+/g, '').includes(needle)
      ) ?? null
    );
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['/api/drawings/list'] });
  }

  return { drawings, isLoading, refetch, findDrawingForPartNumber, invalidate };
}
