import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useDatabaseStore } from '../../stores/databaseStore';
import { TableView } from './TableView';

export function DatabaseView() {
  const { id } = useParams<{ id: string }>();
  const { fetchDatabase, clearCurrentDatabase } = useDatabaseStore();

  useEffect(() => {
    if (id) {
      fetchDatabase(id);
    }
    return () => clearCurrentDatabase();
  }, [id, fetchDatabase, clearCurrentDatabase]);

  return <TableView />;
}
