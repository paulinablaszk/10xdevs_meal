import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface NutritionTableProps {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  isManualOverride: boolean;
}

export function NutritionTable({
  kcal,
  proteinG,
  fatG,
  carbsG,
  isManualOverride,
}: NutritionTableProps) {
  // Walidacja wartości >= 0
  const values = {
    kcal: Math.max(0, kcal),
    proteinG: Math.max(0, proteinG),
    fatG: Math.max(0, fatG),
    carbsG: Math.max(0, carbsG),
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Wartości odżywcze</CardTitle>
        {isManualOverride && <Badge variant="secondary">Ręczna korekta</Badge>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Kalorie</TableCell>
              <TableCell className="text-right">{values.kcal} kcal</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Białko</TableCell>
              <TableCell className="text-right">{values.proteinG} g</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tłuszcze</TableCell>
              <TableCell className="text-right">{values.fatG} g</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Węglowodany</TableCell>
              <TableCell className="text-right">{values.carbsG} g</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
