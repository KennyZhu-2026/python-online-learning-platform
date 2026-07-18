import { lesson01 } from "./lesson-01";
import { lesson02 } from "./lesson-02";
import { lesson03 } from "./lesson-03";
import { lesson04 } from "./lesson-04";
import { lesson05 } from "./lesson-05";
import { lesson06 } from "./lesson-06";
import type { Lesson } from "./types";

export type { Lesson } from "./types";

export const lessons: Lesson[] = [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06];
