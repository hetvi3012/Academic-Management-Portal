import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const DataTable = ({ columns, data, loading, emptyMessage = 'No data available' }) => {
  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            // CHANGE: Use row.id from DB if available, fallback to index
            <TableRow key={row.id || rowIndex}> 
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {/* Handles custom rendering (e.g. Buttons) or direct data access */}
                  {column.render ? column.render(row) : row[column.accessor]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;