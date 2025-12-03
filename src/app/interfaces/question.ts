export interface Question {
    id: number;
    type: string;
    pollId: number;
    title: string;
    createdAt: string;
    updatedAt: string;
    options: Option[];
}
export interface Option {
    id: number;
    questionId: number;
    text: string;
    createdAt: string;
    updatedAt: string;
}
