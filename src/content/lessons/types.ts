export type Lesson = {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly emoji: string;
  readonly stage: string;
  readonly knowledgePoints: string;
  readonly contentReady: boolean;
  readonly videoSrc?: string;
  readonly goal: string;
  readonly taskTitle: string;
  readonly task: string;
  readonly taskSteps: readonly string[];
  readonly homework: string;
  readonly hints: readonly string[];
  readonly starterCode: string;
  readonly inputs?: string;
};
