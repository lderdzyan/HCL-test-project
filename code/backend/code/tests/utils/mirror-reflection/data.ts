import { MirrorReflection } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { mockJwtAud } from '..';

export const mrId = 'mr-1';

// Answers

export const validMRAnswer = {
  pid: mockJwtAud,
  name: 'My Mirror reflection',
  answers: JSON.stringify({
    'mr-1': {
      name: 'mr-1',
      type: 'long-text',
      answer: 'hello',
    },
    'mr-2': {
      name: 'mr-2',
      type: 'dynamic-choice',
      answer: ['Relieved', 'Nervous'],
    },
    'mr-3': {
      name: 'mr-3',
      type: 'multiple-long-text',
      answer: [
        {
          title: 'Relieved',
          answer: 'My answer',
        },
        {
          title: 'Nervous',
          answer: 'My answer',
        },
      ],
    },
    'mr-4': {
      name: 'mr-4',
      type: 'long-text',
      answer: 'My answer',
    },
    'mr-5': {
      name: 'mr-5',
      type: 'long-text',
      answer: 'My answer',
    },
    'mr-6': {
      name: 'mr-6',
      type: 'short-text',
      answer: 'My answer',
    },
    'mr-7': {
      name: 'mr-7',
      type: 'dynamic-simple-choice',
      answer: ['My personal development'],
    },
    'mr-8': {
      name: 'mr-8',
      type: 'simple-choice',
      answer: 'Subtracted',
    },
  }) as any,
} as MirrorReflection;

export const badMRAnswer = {
  ...validMRAnswer,
  answers: {
    'mr-1': { name: 'mr-1', type: 'long-text', answer: '' },
    'mr-2': { name: 'mr-2', type: 'dynamic-choice', answer: [] },
    'mr-3': {
      name: 'mr-3',
      type: 'multiple-long-text',
      answer: [
        { title: 'Relieved', answer: null },
        { title: 'Nervous', answer: '' },
      ],
    },
    'mr-4': { name: 'mr-4', type: 'long-text', answer: null },
    'mr-6': { name: 'mr-6', type: 'short-text', answer: undefined },
    'mr-7': { name: 'mr-7', type: 'dynamic-simple-choice', answer: [''] },
    // mr-8 is missing
  },
};

//Item

export const validMRItem = {
  id: mrId,
  ...validMRAnswer,
} as MirrorReflection;

export const mirrorReflectionItems = [
  {
    id: 'id-1',
    ...validMRAnswer,
  },
  {
    id: 'id-2',
    ...validMRAnswer,
  },
];
