export interface Poll {
  id: number;
  title: string;
  description: string;
  status: string;
  creatorId: number;
  createdAt: string;   // o Date si lo conviertes
  updatedAt: string;   // o Date si lo conviertes

  // Relaciones (opcional si tu API las devuelve)
  creator?: any;        // Puedes tiparlo luego con la interfaz User
  questions?: any[];    // Luego puedes reemplazar con interface Question
  responses?: any[];    // Igual, luego puedes tiparlo bien
  notifications?: any[];
}
