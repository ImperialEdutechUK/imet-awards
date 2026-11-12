/** Shapes shared by the survey pages. The survey itself is created by HR on the staff dashboard. */
export type QuestionType = 'rating' | 'yesno' | 'text';
export type Question = { text: string; type: QuestionType };
export type Survey = { title: string; message: string; questions: Question[] };

export type QuestionResult = {
  text: string; type: QuestionType; count: number;
  average?: number | null; spread?: number[]; // rating
  yes?: number; no?: number;                  // yes or no
  comments?: string[];                        // written answer
};

export type SurveyOverview = {
  survey: Survey | null;
  locked: boolean; // true once the survey has been emailed; questions can no longer change
  sentAt: string;
  stats: { attended: number; sent: number; responses: number };
  results: QuestionResult[];
  sent?: number; failed?: number; remaining?: number; quotaLeft?: number; // returned after a send
};

export const MAX_QUESTIONS = 12;
export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'rating', label: 'Rating, 1 to 5' },
  { value: 'yesno', label: 'Yes or no' },
  { value: 'text', label: 'Written answer' },
];

/** A starting point HR can edit. */
export const starterSurvey = (eventName: string): Survey => ({
  title: `${eventName}: your feedback`,
  message: 'Thank you for joining us. We would be grateful for a few minutes of your time to tell us how the evening went.',
  questions: [
    { text: 'How would you rate the evening overall?', type: 'rating' },
    { text: 'How would you rate the venue and dinner?', type: 'rating' },
    { text: 'Was the event well organised?', type: 'yesno' },
    { text: 'What did you enjoy most?', type: 'text' },
    { text: 'What could we improve next time?', type: 'text' },
  ],
});
