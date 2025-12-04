export interface Response {
  id: number;
  pollId: number;
  questionId: number;
  userId: number;
  optionId: number | null;
  response: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones opcionales
  poll?: {
    id: number;
    title: string;
    status: string;
  };

  question?: {
    id: number;
    title: string;
    type: string;
  };

  option?: {
    id: number;
    text: string;
  };

  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}
