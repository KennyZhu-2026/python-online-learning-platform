import { lesson01 } from "./lesson-01";
import { lesson02 } from "./lesson-02";
import { plannedLessons } from "./course-outline";
import type { Lesson } from "./types";

export type { Lesson } from "./types";

export const lessons: Lesson[] = [lesson01, lesson02, ...plannedLessons];
